// pocketbase/hooks/mcp_server.js
// POST /backend/v1/mcp — servidor MCP (Model Context Protocol) do Carrossel Studio.
// Dual-era em Streamable HTTP, apenas POST:
//  - 2026-07-28 (moderno, stateless): _meta por request, headers MCP-Protocol-Version /
//    Mcp-Method / Mcp-Name obrigatórios, server/discover obrigatório, sem initialize.
//  - 2025-11-25 / 2025-06-18 / 2025-03-26 (legado): initialize + ping, resultados sem _meta.
// O token (Authorization: Bearer) age como o dono: as regras das coleções impõem o escopo.
routerAdd(
  'POST',
  '/backend/v1/mcp',
  (e) => {
    const MODERN = '2026-07-28'
    const LEGACY = ['2025-11-25', '2025-06-18', '2025-03-26']

    const reply = (status, id, payload) =>
      e.json(status, Object.assign({ jsonrpc: '2.0', id: id === undefined ? null : id }, payload))
    const fail = (status, id, code, message, data) =>
      reply(status, id, {
        error: data
          ? { code: code, message: message, data: data }
          : { code: code, message: message },
      })

    // 1. Origin: clientes de servidor não enviam Origin; navegador fora da allowlist não entra.
    const origin = e.request.header.get('Origin')
    const allowedOrigins = []
    if (origin && allowedOrigins.indexOf(origin) === -1) {
      return fail(403, null, -32600, 'Origin not allowed')
    }

    // 2. Autenticação: só Authorization: Bearer (nunca ?token=). Falha → 401 antes de ler o corpo.
    const authz = e.request.header.get('Authorization') || ''
    const raw = authz.slice(0, 7).toLowerCase() === 'bearer ' ? authz.slice(7).trim() : ''
    let tokenRecord = null
    let user = null
    try {
      tokenRecord = $app.findFirstRecordByData('mcp_tokens', 'token_hash', $security.sha256(raw))
      user = $app.findRecordById('users', tokenRecord.getString('user'))
    } catch (_) {}
    if (!raw || !user) {
      e.response.header().set('WWW-Authenticate', 'Bearer realm="mcp"')
      return fail(401, null, -32000, 'Unauthorized: missing, invalid or revoked token')
    }
    e.auth = user // as regras das coleções agora avaliam como este usuário

    // 3. last_used_at no máximo 1x por minuto por token (barato e útil na tela).
    const last = tokenRecord.getString('last_used_at')
    if (!last || Date.now() - new Date(last.replace(' ', 'T')).getTime() > 60000) {
      try {
        tokenRecord.set('last_used_at', new Date().toISOString())
        $app.save(tokenRecord)
      } catch (err) {
        $app.logger().warn('mcp last_used_at: ' + String(err))
      }
    }

    // 4. Envelope JSON-RPC: uma mensagem por POST; sem id = notificação → 202 vazio.
    const info = e.requestInfo()
    const body = info.body || {}
    if (body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
      return fail(400, null, -32600, 'Invalid Request: send one JSON-RPC message per POST')
    }
    if (body.id === undefined || body.id === null) return e.noContent(202)
    const id = body.id
    const params = body.params || {}

    // 5. Era do protocolo.
    const metaVersion = (params._meta || {})['io.modelcontextprotocol/protocolVersion']
    const headerVersion = e.request.header.get('MCP-Protocol-Version')
    const modern = Boolean(metaVersion) || headerVersion === MODERN

    if (modern) {
      if (headerVersion !== metaVersion) {
        return fail(400, id, -32020, 'Header mismatch: MCP-Protocol-Version')
      }
      if (metaVersion !== MODERN) {
        return fail(400, id, -32022, 'Unsupported protocol version', {
          supported: [MODERN].concat(LEGACY),
          requested: metaVersion,
        })
      }
      if (e.request.header.get('Mcp-Method') !== body.method) {
        return fail(400, id, -32020, 'Header mismatch: Mcp-Method')
      }
      if (body.method === 'tools/call') {
        let name = e.request.header.get('Mcp-Name') || ''
        if (name.indexOf('=?base64?') === 0 && name.slice(-2) === '?=') {
          name = atob(name.slice(9, -2))
        }
        if (name !== params.name) return fail(400, id, -32020, 'Header mismatch: Mcp-Name')
      }
    } else if (headerVersion && LEGACY.indexOf(headerVersion) === -1) {
      return fail(400, id, -32022, 'Unsupported protocol version', {
        supported: [MODERN].concat(LEGACY),
        requested: headerVersion,
      })
    }

    // 6. Catálogo.
    const serverInfo = { name: 'carrossel-studio-mcp', version: '1.0.0' }
    const ok = (result) =>
      reply(
        200,
        id,
        modern
          ? {
              result: Object.assign({ resultType: 'complete' }, result, {
                _meta: { 'io.modelcontextprotocol/serverInfo': serverInfo },
              }),
            }
          : { result: result },
      )
    const cached = (result) =>
      modern ? Object.assign(result, { ttlMs: 300000, cacheScope: 'public' }) : result

    const instructions =
      'Dados e ações do Carrossel Studio, limitados ao dono do token. Carrosséis são criados como objetos {"name": "...", "slides": [...]}; o formato exato dos slides vem de um carrossel lido via carousels_get — prefira clonar um existente e editar os textos do que montar do zero.'

    const objSchema = { type: 'object', additionalProperties: true }
    const tools = [
      {
        name: 'carousels_list',
        title: 'Listar carrosséis',
        description:
          'Lista os carrosséis do dono do token, mais recentes primeiro. Busca opcional por título (query) e paginação (limit 1-50, offset).',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            query: {
              type: 'string',
              description: 'Texto contido no título do carrossel (opcional)',
            },
            limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Padrão 20' },
            offset: { type: 'integer', minimum: 0, description: 'Padrão 0' },
          },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'carousels_get',
        title: 'Obter carrossel',
        description:
          'Devolve um carrossel completo por id (inclui slides, textos e imagens em data). Use para clonar a estrutura antes de criar um novo.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'carousels_create',
        title: 'Criar carrossel',
        description:
          'Cria um carrossel para o dono do token. Passe em data o objeto completo do carrossel (name + slides). O dono é sempre o dono do token.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['data'],
          properties: { data: objSchema },
        },
      },
      {
        name: 'carousels_update',
        title: 'Atualizar carrossel',
        description:
          'Substitui o conteúdo (data) de um carrossel do dono do token. O dono não muda. Envie o objeto completo em data.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'data'],
          properties: { id: { type: 'string' }, data: objSchema },
        },
      },
      {
        name: 'projects_list',
        title: 'Listar projetos',
        description: 'Lista os projetos do dono do token, mais recentes primeiro.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Padrão 20' },
            offset: { type: 'integer', minimum: 0, description: 'Padrão 0' },
          },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'projects_get',
        title: 'Obter projeto',
        description: 'Devolve um projeto completo por id.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'brand_kits_list',
        title: 'Listar brand kits',
        description: 'Lista os brand kits do dono do token (cores, fontes e logo da marca).',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Padrão 20' },
            offset: { type: 'integer', minimum: 0, description: 'Padrão 0' },
          },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'brand_kits_get',
        title: 'Obter brand kit',
        description: 'Devolve um brand kit completo por id (paleta, fontes, logo).',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'versions_list',
        title: 'Listar versões',
        description:
          'Lista as versões salvas de um carrossel do dono do token (carousel = id do carrossel), mais recentes primeiro.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['carousel'],
          properties: { carousel: { type: 'string' } },
        },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'user_settings_get',
        title: 'Obter configurações',
        description: 'Devolve o documento único de configurações do dono do token.',
        inputSchema: { type: 'object', additionalProperties: false, properties: {} },
        annotations: { readOnlyHint: true },
      },
      {
        name: 'user_settings_update',
        title: 'Atualizar configurações',
        description: 'Substitui o conteúdo (data) das configurações do dono do token.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['data'],
          properties: { data: objSchema },
        },
      },
    ]

    // 7. Execução das tools — sempre com placeholders {:param}, nunca concatenação.
    const clamp = (v, def) => {
      const n = Math.floor(Number(v))
      if (!Number.isFinite(n)) return def
      return Math.min(50, Math.max(1, n))
    }
    const coll = (name) => $app.findCollectionByNameOrId(name)

    const listFor = (colName, filter, sort, limit, offset, binds) => {
      const col = coll(colName)
      const rows = $app.findRecordsByFilter(colName, filter, sort, limit, offset, binds)
      const kept = rows.filter((r) => $app.canAccessRecord(r, info, col.listRule))
      return $apis.enrichRecords(e, kept)
    }
    const getFor = (colName, rid) => {
      const col = coll(colName)
      let r = null
      try {
        r = $app.findRecordById(colName, rid)
      } catch (_) {}
      if (!r || !$app.canAccessRecord(r, info, col.viewRule)) return null
      return $apis.enrichRecords(e, [r])
    }
    const asData = (v) => {
      if (v === undefined || v === null || typeof v !== 'object' || Array.isArray(v) === false)
        return null
      return v
    }
    const createIn = (colName, dataObj) => {
      const col = coll(colName)
      const r = new Record(col)
      r.set('user', user.id) // dono = dono do token, nunca dos args
      r.set('data', dataObj)
      info.body = { user: user.id, data: dataObj }
      $app.runInTransaction((tx) => {
        tx.save(r)
        if (!tx.canAccessRecord(r, info, col.createRule)) throw new ForbiddenError('Not allowed')
      })
      return $apis.enrichRecords(e, [r])
    }
    const updateIn = (colName, rid, dataObj) => {
      const col = coll(colName)
      let r = null
      try {
        r = $app.findRecordById(colName, rid)
      } catch (_) {}
      if (!r) throw new BadRequestError('Registro não encontrado para este id.')
      info.body = { data: dataObj }
      if (!$app.canAccessRecord(r, info, col.updateRule)) throw new ForbiddenError('Not allowed')
      r.set('data', dataObj)
      $app.save(r)
      return $apis.enrichRecords(e, [r])
    }
    const settingsRecord = () => {
      try {
        return $app.findFirstRecordByData('user_settings', 'user', user.id)
      } catch (_) {
        return null
      }
    }

    const runTool = (name, args) => {
      if (name === 'carousels_list') {
        const q = String(args.query || '').trim()
        const limit = clamp(args.limit, 20)
        const offset = Math.max(0, Math.floor(Number(args.offset) || 0))
        let filter = 'user = {:uid}'
        const binds = { uid: user.id }
        if (q) {
          // data é json: a busca por título usa o texto bruto armazenado.
          filter += ' && data ~ {:q}'
          binds.q = '"' + q + '"'
        }
        return { items: listFor('carousels', filter, '-created', limit, offset, binds) }
      }
      if (name === 'carousels_get' || name === 'projects_get' || name === 'brand_kits_get') {
        const colName =
          name === 'carousels_get'
            ? 'carousels'
            : name === 'projects_get'
              ? 'projects'
              : 'brand_kits'
        const rid = String(args.id || '').trim()
        if (!rid) throw new BadRequestError('Informe o id do registro.')
        const got = getFor(colName, rid)
        if (!got) throw new BadRequestError('Registro não encontrado para este id.')
        return { item: got[0] }
      }
      if (name === 'carousels_create') {
        const dataObj = asData(args.data)
        if (!dataObj)
          throw new BadRequestError('Passe data como um objeto do carrossel (name + slides).')
        return { item: createIn('carousels', dataObj)[0] }
      }
      if (name === 'carousels_update') {
        const rid = String(args.id || '').trim()
        if (!rid) throw new BadRequestError('Informe o id do carrossel a atualizar.')
        const dataObj = asData(args.data)
        if (!dataObj)
          throw new BadRequestError('Passe data como um objeto do carrossel (name + slides).')
        return { item: updateIn('carousels', rid, dataObj)[0] }
      }
      if (name === 'projects_list') {
        const limit = clamp(args.limit, 20)
        const offset = Math.max(0, Math.floor(Number(args.offset) || 0))
        return {
          items: listFor('projects', 'user = {:uid}', '-created', limit, offset, { uid: user.id }),
        }
      }
      if (name === 'brand_kits_list') {
        const limit = clamp(args.limit, 20)
        const offset = Math.max(0, Math.floor(Number(args.offset) || 0))
        return {
          items: listFor('brand_kits', 'user = {:uid}', '-created', limit, offset, {
            uid: user.id,
          }),
        }
      }
      if (name === 'versions_list') {
        const cid = String(args.carousel || '').trim()
        if (!cid) throw new BadRequestError('Informe o id do carrossel (carousel).')
        return {
          items: listFor('versions', 'user = {:uid} && carousel = {:cid}', '-created', 50, 0, {
            uid: user.id,
            cid: cid,
          }),
        }
      }
      if (name === 'user_settings_get') {
        const r = settingsRecord()
        if (!r) return { item: null }
        const got = getFor('user_settings', r.id)
        return { item: got ? got[0] : null }
      }
      if (name === 'user_settings_update') {
        const dataObj = asData(args.data)
        if (!dataObj) throw new BadRequestError('Passe data como um objeto de configurações.')
        const r = settingsRecord()
        if (!r)
          throw new BadRequestError(
            'Nenhuma configuração salva ainda; abra o app uma vez para criá-la.',
          )
        return { item: updateIn('user_settings', r.id, dataObj)[0] }
      }
      throw new BadRequestError('Tool desconhecida: ' + name)
    }

    // 8. Roteamento de métodos.
    if (body.method === 'initialize' && !modern) {
      const v = LEGACY.indexOf(params.protocolVersion) >= 0 ? params.protocolVersion : LEGACY[0]
      return ok({
        protocolVersion: v,
        capabilities: { tools: { listChanged: false } },
        serverInfo: serverInfo,
        instructions: instructions,
      })
    }
    if (body.method === 'server/discover') {
      return ok(
        cached({
          supportedVersions: [MODERN].concat(LEGACY),
          capabilities: { tools: {} },
          instructions: instructions,
        }),
      )
    }
    if (body.method === 'ping' && !modern) return ok({})
    if (body.method === 'tools/list') return ok(cached({ tools: tools }))
    if (body.method === 'tools/call') {
      if (!tools.some((t) => t.name === params.name)) {
        return fail(200, id, -32602, 'Unknown tool: ' + params.name)
      }
      try {
        const data = runTool(String(params.name), params.arguments || {})
        const text = JSON.stringify(data)
        return ok({
          content: [
            {
              type: 'text',
              text: text.length > 50000 ? text.slice(0, 50000) + '…(truncated)' : text,
            },
          ],
          isError: false,
        })
      } catch (err) {
        const known = err instanceof ForbiddenError || err instanceof BadRequestError
        if (!known) {
          $app.logger().error('mcp tool failed', 'tool', String(params.name), 'error', String(err))
        }
        return ok({
          content: [
            {
              type: 'text',
              text: known ? String(err.message) : 'The tool failed; try again later.',
            },
          ],
          isError: true,
        })
      }
    }
    return fail(modern ? 404 : 200, id, -32601, 'Method not found: ' + body.method)
  },
  $apis.bodyLimit(262144),
)
