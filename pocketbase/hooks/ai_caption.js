// Escreve a legenda do post e as hashtags a partir do texto dos slides.
// Todo o código fica dentro do callback (regra dos hooks do Skip Cloud).
routerAdd('POST', '/backend/v1/ai/caption', (e) => {
  const testKey = $secrets.get('SELFTEST_KEY')
  const isTest = !!testKey && e.request.header.get('X-Selftest') === testKey
  if (!e.auth && !isTest) return e.json(401, { error: 'Entre na sua conta para usar a IA.' })

  const FUNNEL = {
    topo: 'TOPO DE FUNIL: para quem ainda não conhece o perfil. Gancho forte, tensão, contraste, curiosidade ou opinião polêmica fundamentada. Objetivo: alcance, compartilhamento e novos seguidores.',
    meio: 'MEIO DE FUNIL: para quem já segue. Listas, passo a passo, comparações, erros comuns, bastidores. Objetivo: aprofundar, gerar confiança e salvamentos.',
    fundo:
      'FUNDO DE FUNIL: para quem já confia e pode comprar. Problema → custo de não resolver → solução/método → prova → oferta clara. Objetivo: conversa no direct, clique no link, venda.',
  }
  const SYSTEM = `Você é estrategista de conteúdo e copywriter sênior, especialista em carrosséis de Instagram para o mercado brasileiro.
Escreva a legenda do post: 3 a 6 parágrafos curtos, abrindo com uma frase forte e terminando com uma chamada para ação coerente com a etapa do funil.
Português do Brasil, natural, direto, sem jargão vazio. Não invente estatísticas, estudos ou citações como fato.
Hashtags separadas da legenda: 5 a 10, relevantes, sem genéricas como #love.`

  const body = e.requestInfo().body || {}
  const slidesText = String(body.slidesText || '').trim()
  if (!slidesText) return e.json(400, { error: 'O carrossel ainda não tem texto.' })
  const brand = body.brand || {}
  const prompt = `${FUNNEL[body.funnel] || FUNNEL.topo}
Marca: ${brand.name || '(não informada)'} ${brand.handle || ''}

Texto dos slides:
"""
${slidesText.slice(0, 8000)}
"""

Escreva a legenda do post e as hashtags.

Responda somente com um objeto JSON válido, sem texto antes ou depois e sem bloco de código, no formato {"caption": "...", "hashtags": ["#..."]}. Dentro da legenda, use \\n para quebrar linha.`

  let reply
  try {
    reply = $ai.chat({
      model: 'reasoning',
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
    })
  } catch (err) {
    if (err instanceof SkipAiConfigError)
      return e.json(503, { error: 'A IA está indisponível no momento. Tente mais tarde.' })
    if (err instanceof SkipAiError) {
      const status = err.status || 502
      if (status === 402 || status === 403)
        return e.json(402, {
          error: 'Os créditos de IA do Skip acabaram. Recarregue para continuar.',
        })
      if (status === 429)
        return e.json(429, { error: 'Muitos pedidos seguidos. Espere um pouco e tente de novo.' })
      $app
        .logger()
        .error('ai_caption: falha da IA', 'status', status, 'error', String(err.message || err))
      return e.json(502, { error: 'A IA não respondeu. Tente de novo em instantes.' })
    }
    throw err
  }

  // Lê o JSON da resposta (aceita bloco de código e quebras de linha cruas dentro dos textos).
  const msg = (reply && reply.choices && reply.choices[0] && reply.choices[0].message) || {}
  let text =
    typeof msg.content === 'string'
      ? msg.content
      : Array.isArray(msg.content)
        ? msg.content.map((p) => (p && p.text) || '').join('')
        : ''
  text = text.replace(/```(?:json)?/gi, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  let data = null
  if (start >= 0 && end > start) {
    const raw = text.slice(start, end + 1)
    try {
      data = JSON.parse(raw)
    } catch (_) {
      let fixed = ''
      let inStr = false
      let esc = false
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i]
        if (esc) {
          fixed += ch
          esc = false
        } else if (ch === '\\') {
          fixed += ch
          esc = true
        } else if (ch === '"') {
          inStr = !inStr
          fixed += ch
        } else if (inStr && ch === '\n') {
          fixed += '\\n'
        } else if (inStr && ch === '\t') {
          fixed += '\\t'
        } else if (!(inStr && ch === '\r')) {
          fixed += ch
        }
      }
      try {
        data = JSON.parse(fixed)
      } catch (_) {
        data = null
      }
    }
  }
  if (!data || typeof data.caption !== 'string') {
    $app.logger().warn('ai_caption: resposta fora do formato', 'text', text.slice(0, 500))
    return e.json(502, { error: 'A IA devolveu um formato inesperado. Tente de novo.' })
  }

  const hashtags = (Array.isArray(data.hashtags) ? data.hashtags : [])
    .map((t) =>
      String(t || '')
        .trim()
        .replace(/^#+/, '')
        .replace(/\s+/g, ''),
    )
    .filter((t) => t)
    .map((t) => '#' + t)
  return e.json(200, { caption: data.caption.trim(), hashtags: hashtags })
})
