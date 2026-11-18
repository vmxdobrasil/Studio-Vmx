// pocketbase/hooks/magic_link_consume.js
// POST /backend/v1/magic_link_consume — body: { token }
// Valida o link (uso único, 15 min), marca como usado e devolve token de sessão.
// Tudo inline no callback (o JSVM não compartilha escopo top-level).
routerAdd('POST', '/backend/v1/magic_link_consume', (e) => {
  const body = e.requestInfo().body || {}
  const token = String(body.token || '').trim()
  if (!token) return e.badRequestError('Link inválido ou expirado')
  const safe = token.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!safe) return e.badRequestError('Link inválido ou expirado')
  let rec = null
  try {
    rec = $app.findFirstRecordByData('magic_links', 'token', safe)
  } catch (errF) {
    rec = null
  }
  if (!rec) return e.badRequestError('Link inválido ou expirado')
  if (rec.getBool('usado')) return e.badRequestError('Link inválido ou expirado')
  let expired = true
  try {
    const raw = rec.getString('expires')
    const norm = raw.indexOf('T') >= 0 ? raw : raw.replace(' ', 'T')
    expired = !(new Date(norm).getTime() > Date.now())
  } catch (errD) {
    expired = true
  }
  if (expired) return e.badRequestError('Link inválido ou expirado')
  rec.set('usado', true)
  $app.save(rec)
  const email = rec.getString('email')
  if (!email.endsWith('@adapta.org')) {
    return e.json(403, { ok: false, error: 'Acesso restrito a contas @adapta.org' })
  }
  let user = null
  try {
    user = $app.findAuthRecordByEmail('users', email)
  } catch (errU) {
    user = null
  }
  if (!user) return e.badRequestError('Link inválido ou expirado')
  let role = ''
  try {
    role = user.getString('role')
  } catch (errR) {
    role = ''
  }
  return e.json(200, {
    token: user.newAuthToken(),
    record: { id: user.id, email: email, name: user.getString('name'), role: role },
  })
})
