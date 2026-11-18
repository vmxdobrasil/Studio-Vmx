// Gera o texto do carrossel: uma linha por campo do template, mais legenda e hashtags.
// Todo o código fica dentro do callback (regra dos hooks do Skip Cloud).
routerAdd('POST', '/backend/v1/ai/carousel', (e) => {
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

Você escreve o texto de um carrossel que já tem layout definido. O layout tem uma lista ordenada de campos de texto (slots). Cada slot tem um papel e um limite de caracteres. Você devolve exatamente uma linha por slot, na mesma ordem.

Papéis:
- hook: o título da capa. Precisa parar o scroll. Use tensão, contraste, número concreto, pergunta incômoda ou afirmação contraintuitiva. Nada de "Você sabia", "Descubra", "Neste post", "Confira".
- subhook: a linha de apoio da capa. Completa a promessa e dá um motivo para deslizar.
- rotulo: chamada curta acima de um título (ex.: "01. O que aconteceu?", "O problema"). Poucas palavras.
- titulo: a ideia principal do slide. Específica, afirmativa, com tensão.
- subtitulo / corpo: desenvolve o título com explicação, exemplo, consequência ou dado. Frases curtas.
- cta: fechamento com chamada para ação coerente com a etapa do funil.

Regras:
- Cada slide carrega uma ideia só. O carrossel precisa ter progressão: contexto → tensão → virada → aplicação → fechamento.
- Respeite o limite de caracteres de cada slot. Prefira ficar abaixo dele.
- Marque de 1 a 3 palavras-chave por hook/título com ==assim== para destaque visual, sempre palavras que já fazem parte da frase (ex.: "O erro que ==trava== o seu ==crescimento=="). Não destaque frases inteiras e não use destaque nos subtítulos.
- Se um campo tiver espaço para mais de um parágrafo, separe os parágrafos com uma quebra de linha dentro do mesmo item de "lines".
- Português do Brasil, natural, direto, sem jargão vazio. Sem hashtags e sem emojis nas linhas (a menos que o tom peça).
- Não invente estatísticas, estudos ou citações como fato. Só use números que vierem do briefing, ou apresente como exemplo/estimativa.
- O último slot de cada carrossel normalmente é o fechamento: use o CTA adequado ao funil.
- Na legenda: 3 a 6 parágrafos curtos, abrindo com uma frase forte, terminando com CTA. Hashtags separadas (5 a 10, relevantes, sem #genéricas como #love).`

  const body = e.requestInfo().body || {}
  const briefing = String(body.briefing || '').trim()
  const slots = Array.isArray(body.slots) ? body.slots.slice(0, 80) : []
  if (!briefing) return e.json(400, { error: 'Escreva sobre o que é o carrossel.' })
  if (slots.length === 0)
    return e.json(400, { error: 'Este template não tem campos de texto para preencher.' })

  const brand = body.brand || {}
  const slotList = slots
    .map(
      (s, i) =>
        i + 1 + '. [slide ' + s.slide + '] ' + s.role + ' — até ' + s.maxChars + ' caracteres',
    )
    .join('\n')
  const prompt = `${FUNNEL[body.funnel] || FUNNEL.topo}

Marca: ${brand.name || '(não informada)'} ${brand.handle ? '(' + brand.handle + ')' : ''}
Público: ${String(body.audience || '').trim() || '(deduza pelo briefing)'}
Tom de voz: ${String(body.tone || '').trim() || 'direto, inteligente e conversado'}

Briefing:
"""
${briefing.slice(0, 8000)}
"""

Slots do layout (${slots.length} no total), em ordem:
${slotList}

Devolva "lines" com exatamente ${slots.length} itens, um por slot, na ordem acima. Também devolva "caption" e "hashtags".

Responda somente com um objeto JSON válido, sem texto antes ou depois e sem bloco de código, no formato {"lines": ["..."], "caption": "...", "hashtags": ["#..."]}. Dentro dos textos, use \\n para quebrar linha.`

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
        .error('ai_carousel: falha da IA', 'status', status, 'error', String(err.message || err))
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
  if (!data || !Array.isArray(data.lines)) {
    $app.logger().warn('ai_carousel: resposta fora do formato', 'text', text.slice(0, 500))
    return e.json(502, { error: 'A IA devolveu um formato inesperado. Tente de novo.' })
  }

  const lines = slots.map((_, i) => String(data.lines[i] == null ? '' : data.lines[i]).trim())
  const hashtags = (Array.isArray(data.hashtags) ? data.hashtags : [])
    .map((t) =>
      String(t || '')
        .trim()
        .replace(/^#+/, '')
        .replace(/\s+/g, ''),
    )
    .filter((t) => t)
    .map((t) => '#' + t)
  return e.json(200, {
    lines: lines,
    caption: String(data.caption || '').trim(),
    hashtags: hashtags,
  })
})
