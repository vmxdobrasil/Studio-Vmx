// pocketbase/hooks/mcp_tokens_create.js
// POST /backend/v1/mcp-tokens — cria um token MCP pessoal para o usuário logado.
// O token em claro ("mcp_" + 43 chars aleatórios) é gerado AQUI, salvo só como
// sha256 e devolvido UMA única vez nesta resposta. Nada em claro fica salvo.
routerAdd(
  'POST',
  '/backend/v1/mcp-tokens',
  (e) => {
    const body = e.requestInfo().body || {}
    const name = String(body.name || '')
      .trim()
      .slice(0, 100)
    if (!name) return e.badRequestError('Dê um nome ao token para identificá-lo depois.')

    const existing = $app.findRecordsByFilter('mcp_tokens', 'user = {:uid}', '', 50, 0, {
      uid: e.auth.id,
    })
    if (existing.length >= 10) {
      return e.badRequestError('Você já tem 10 tokens. Revogue um antes de criar outro.')
    }

    const token = 'mcp_' + $security.randomString(43)
    const col = $app.findCollectionByNameOrId('mcp_tokens')
    const rec = new Record(col)
    rec.set('user', e.auth.id)
    rec.set('name', name)
    rec.set('token_hash', $security.sha256(token))
    rec.set('token_prefix', token.slice(0, 12))
    $app.save(rec)

    return e.json(201, {
      id: rec.id,
      name: name,
      token_prefix: token.slice(0, 12),
      token: token,
    })
  },
  $apis.requireAuth(),
  $apis.bodyLimit(4096),
)
