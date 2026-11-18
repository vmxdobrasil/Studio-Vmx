// Sugere 10 headlines para a capa, cada uma com um ângulo diferente.
// Todo o código fica dentro do callback (regra dos hooks do Skip Cloud).
routerAdd('POST', '/backend/v1/ai/headlines', (e) => {
  const testKey = $secrets.get('SELFTEST_KEY')
  const isTest = !!testKey && e.request.header.get('X-Selftest') === testKey
  if (!e.auth && !isTest) return e.json(401, { error: 'Entre na sua conta para usar a IA.' })

  const FUNNEL = {
    topo: 'TOPO DE FUNIL: para quem ainda não conhece o perfil. Gancho forte, tensão, contraste, curiosidade ou opinião polêmica fundamentada. Objetivo: alcance, compartilhamento e novos seguidores.',
    meio: 'MEIO DE FUNIL: para quem já segue. Listas, passo a passo, comparações, erros comuns, bastidores. Objetivo: aprofundar, gerar confiança e salvamentos.',
    fundo:
      'FUNDO DE FUNIL: para quem já confia e pode comprar. Problema → custo de não resolver → solução/método → prova → oferta clara. Objetivo: conversa no direct, clique no link, venda.',
  }
  const SYSTEM = `Você é especialista em ganchos (hooks) para capas de carrossel de Instagram no Brasil.
Gere opções variadas de headline, cada uma com um ângulo diferente: contraste, número concreto, pergunta incômoda, erro comum, contraintuitivo, bastidor, previsão, comparação.
Regras: até o limite de caracteres pedido; português do Brasil natural; nada de "Você sabia", "Descubra", "Confira"; marque 1 a 3 palavras que já estão na própria frase com ==assim== (ex.: "O erro que ==trava== o seu ==crescimento==") e nunca acrescente palavras soltas no fim; não invente dados como fato.`

  const body = e.requestInfo().body || {}
  const max = Math.max(40, Math.min(Number(body.maxChars) || 110, 200))
  const prompt = `${FUNNEL[body.funnel] || FUNNEL.topo}

Headline atual: ${String(body.current || '').trim() || '(vazia)'}
Conteúdo do carrossel (para entender o assunto):
"""
${String(body.context || '').slice(0, 6000)}
"""

Gere 10 headlines de até ${max} caracteres. Para cada uma, diga o ângulo em 2 a 4 palavras.

Responda somente com um objeto JSON válido, sem texto antes ou depois e sem bloco de código, no formato {"headlines": [{"text": "...", "angle": "..."}]}.`

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
        .error('ai_headlines: falha da IA', 'status', status, 'error', String(err.message || err))
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
  if (!data || !Array.isArray(data.headlines)) {
    $app.logger().warn('ai_headlines: resposta fora do formato', 'text', text.slice(0, 500))
    return e.json(502, { error: 'A IA devolveu um formato inesperado. Tente de novo.' })
  }

  const headlines = data.headlines
    .filter((h) => h && h.text)
    .slice(0, 10)
    .map((h) => ({ text: String(h.text).trim(), angle: String(h.angle || '').trim() }))
  return e.json(200, { headlines: headlines })
})
