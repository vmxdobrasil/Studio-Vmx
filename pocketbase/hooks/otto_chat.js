// Chat com o agente nativo "otto-carrossel" (skill Arquitetura de Carrossel),
// em SSE. Todo o código fica dentro do callback (regra dos hooks do Skip Cloud).
routerAdd(
  'POST',
  '/backend/v1/otto/chat',
  (e) => {
    const userId = e.auth && e.auth.id
    if (!userId) return e.json(401, { error: 'Entre na sua conta para usar a IA.' })

    const body = e.requestInfo().body || {}
    const message = String(body.message || '').trim()
    if (!message) return e.json(400, { error: 'Escreva uma mensagem para o Otto.' })

    try {
      const agent = $ai.agent('otto-carrossel')
      const conv = agent.getOrCreateConversation({
        user_id: userId,
        id: body.conversation_id || null,
      })
      const iter = agent.chat({
        user_id: userId,
        conversation_id: conv.id,
        message: message,
        stream: true,
      })
      e.response.header().set('Content-Type', 'text/event-stream')
      e.response.header().set('Cache-Control', 'no-cache')
      e.response.header().set('X-Conversation-Id', conv.id)
      $response.stream(e, iter)
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'A IA está indisponível no momento. Tente mais tarde.' })
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        if (status === 402 || status === 403)
          return e.json(402, {
            error: 'Os créditos de IA do Skip acabaram. Recarregue para continuar.',
          })
        if (status === 429)
          return e.json(429, { error: 'Muitos pedidos seguidos. Espere um pouco e tente de novo.' })
        $app
          .logger()
          .error(
            'otto_chat: falha do agente',
            'status',
            status,
            'error',
            String(err.message || err),
          )
        return e.json(status >= 500 ? 502 : status, {
          error:
            status >= 500
              ? 'O Otto não respondeu. Tente de novo em instantes.'
              : String(err.message),
        })
      }
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
          .error('otto_chat: falha da IA', 'status', status, 'error', String(err.message || err))
        return e.json(502, { error: 'A IA não respondeu. Tente de novo em instantes.' })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)
