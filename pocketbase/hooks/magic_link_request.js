// pocketbase/hooks/magic_link_request.js
// POST /backend/v1/magic_link_request — body: { email }
// Envia link mágico de login (uso único, 15 min) para usuários @adapta.org.
// Anti-enumeração: responde ok:true exista a conta ou não (só o remetente
// restrito a @adapta.org devolve erro). Tudo inline no callback.
routerAdd('POST', '/backend/v1/magic_link_request', (e) => {
  const body = e.requestInfo().body || {}
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  if (!email) return e.badRequestError('Informe o e-mail')
  if (!email.endsWith('@adapta.org')) {
    return e.json(400, { ok: false, error: 'Acesso restrito a contas @adapta.org' })
  }
  let user = null
  try {
    user = $app.findAuthRecordByEmail('users', email)
  } catch (errU) {
    user = null
  }
  if (user) {
    try {
      const token = $security.randomString(43)
      const col = $app.findCollectionByNameOrId('magic_links')
      const rec = new Record(col)
      rec.set('token', token)
      rec.set('email', email)
      rec.set('expires', new Date(Date.now() + 15 * 60 * 1000).toISOString())
      rec.set('usado', false)
      $app.save(rec)
      // Domínio público do app (SITE_URL). Nunca o host interno do backend: a
      // SPA não roteia /magic-login lá e o link morreria numa página do API.
      const site = ($os.getenv('SITE_URL') || 'https://carrossel-studio-cc9d1.goskip.app').replace(
        /\/+$/,
        '',
      )
      const url = site + '/magic-login?token=' + token
      const message = new MailerMessage({
        from: { address: 'noreply@mail.goskip.dev', name: 'Carrossel Studio' },
        to: [{ address: email }],
        subject: 'Seu link de acesso — Carrossel Studio',
        html:
          '<div style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:480px;margin:0 auto">' +
          '<h1 style="font-size:20px;margin:0 0 16px">Carrossel Studio</h1>' +
          '<p style="font-size:14px;line-height:1.5">Recebemos um pedido de login por link. Clique no botão abaixo para entrar. O link vale por <b>15 minutos</b> e pode ser usado uma única vez.</p>' +
          '<p><a href="' +
          url +
          '" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#ffffff;border-radius:6px;text-decoration:none">Entrar no Carrossel Studio</a></p>' +
          '<p style="font-size:12px;line-height:1.5;color:#666666">Se você não pediu este link, pode ignorar este e-mail — ninguém entra sem acesso ao seu e-mail.</p>' +
          '</div>',
      })
      $app.newMailClient().send(message)
      // Visível no stream "hooks": pedido atendido, e-mail despachado.
      console.log('magic_link_request: link enviado para ' + email)
    } catch (errM) {
      // A falha do envio é silenciosa para o usuário (anti-enumeração), mas
      // fica registrada aqui para diagnóstico.
      console.error('magic_link_request: falha ao enviar e-mail para ' + email + ': ' + errM)
    }
  } else {
    console.log('magic_link_request: e-mail sem conta cadastrada: ' + email)
  }
  return e.json(200, { ok: true })
})
