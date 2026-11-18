// Banco de imagens nativo — Picsum (rápido/estável no Skip Cloud).
// Wikimedia costuma retornar 403/vazio a partir do datacenter; mantemos
// tentativa opcional mas o retorno prioriza Picsum pra o cliente preencher.
// Toda a lógica fica DENTRO dos callbacks (regra do JSVM do Skip Cloud).
routerAdd(
  'POST',
  '/backend/v1/images/search',
  (e) => {
    const userId = e.auth && e.auth.id
    if (!userId) return e.json(401, { error: 'Entre na sua conta para buscar imagens.' })

    const body = e.requestInfo().body || {}
    const query = String(body.query || '')
      .trim()
      .slice(0, 120)
    const count = Math.max(1, Math.min(12, parseInt(body.count, 10) || 6))
    if (!query) return e.json(400, { error: 'Informe um tema pra buscar imagens.' })

    const hashSeed = (text) => {
      let h = 2166136261
      const s = String(text || '')
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = Math.imul(h, 16777619)
      }
      return Math.abs(h >>> 0)
    }

    const images = []
    for (let i = 0; i < count; i++) {
      const seed = hashSeed(query + ':slot:' + i)
      // Extensão .jpg no path → content-type previsível no proxy.
      const src = 'https://picsum.photos/seed/cs' + seed + '/900/1125.jpg'
      images.push({
        id: 'picsum-' + seed,
        url: src,
        thumb: src,
        title: 'Foto ' + (i + 1) + ' · ' + query.slice(0, 40),
        photographer: 'Picsum Photos',
        source: 'picsum',
      })
    }

    $app
      .logger()
      .info(
        'image_bank: search ok',
        'query',
        query.slice(0, 80),
        'count',
        images.length,
        'source',
        'picsum',
      )

    return e.json(200, {
      images: images,
      query: query,
      source: 'picsum',
    })
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/images/fetch',
  (e) => {
    const userId = e.auth && e.auth.id
    if (!userId) return e.json(401, { error: 'Entre na sua conta para baixar imagens.' })

    const body = e.requestInfo().body || {}
    const rawUrl = String(body.url || '').trim()
    if (!rawUrl || !/^https:\/\//i.test(rawUrl)) {
      return e.json(400, { error: 'URL de imagem inválida.' })
    }

    let host = ''
    try {
      host = rawUrl.split('/')[2].toLowerCase()
    } catch (_) {
      return e.json(400, { error: 'URL de imagem inválida.' })
    }
    const allowed =
      host.endsWith('wikimedia.org') ||
      host.endsWith('wikipedia.org') ||
      host.endsWith('upload.wikimedia.org') ||
      host.endsWith('thumb.wikimedia.org') ||
      host.endsWith('picsum.photos') ||
      host.endsWith('fastly.picsum.photos') ||
      host.endsWith('pollinations.ai') ||
      host.endsWith('image.pollinations.ai') ||
      host.endsWith('openverse.org') ||
      host.endsWith('wordpress.com') ||
      host.endsWith('wp.com') ||
      host.endsWith('flickr.com') ||
      host.endsWith('staticflickr.com') ||
      host.endsWith('pexels.com') ||
      host.endsWith('unsplash.com') ||
      host.endsWith('images.unsplash.com')
    if (!allowed) return e.json(400, { error: 'Fonte de imagem não permitida.' })

    try {
      const res = $http.send({
        url: rawUrl,
        method: 'GET',
        headers: {
          Accept: 'image/jpeg,image/png,image/webp,image/*,*/*;q=0.8',
          'User-Agent': 'CarrosselStudio/1.0 (Skip Cloud; image bank)',
        },
        timeout: 12,
      })
      if (res.statusCode < 200 || res.statusCode >= 300 || !res.body || res.body.length === 0) {
        $app
          .logger()
          .warn(
            'image_bank: fetch status',
            'status',
            res.statusCode,
            'bytes',
            res.body ? res.body.length : 0,
            'url',
            rawUrl.slice(0, 160),
          )
        return e.json(502, { error: 'Não foi possível baixar a imagem.' })
      }
      if (res.body.length > 2_500_000) {
        return e.json(502, { error: 'Imagem grande demais pro proxy.' })
      }
      const ctHeader =
        (res.headers && (res.headers['Content-Type'] || res.headers['content-type'])) || []
      let ct = String(ctHeader[0] || '')
        .split(';')[0]
        .trim()
      if (!ct || ct === 'application/octet-stream') {
        if (/\.png(\?|$)/i.test(rawUrl)) ct = 'image/png'
        else if (/\.webp(\?|$)/i.test(rawUrl)) ct = 'image/webp'
        else ct = 'image/jpeg'
      }
      if (!/^image\//i.test(ct)) {
        $app
          .logger()
          .warn('image_bank: content-type inválido', 'ct', ct, 'url', rawUrl.slice(0, 160))
        return e.json(502, { error: 'O arquivo baixado não é uma imagem.' })
      }
      const bytes = res.body
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      let b64 = ''
      const len = bytes.length
      for (let i = 0; i < len; i += 3) {
        const a = bytes[i]
        const b = i + 1 < len ? bytes[i + 1] : 0
        const c = i + 2 < len ? bytes[i + 2] : 0
        const triplet = (a << 16) | (b << 8) | c
        b64 += alphabet[(triplet >> 18) & 63]
        b64 += alphabet[(triplet >> 12) & 63]
        b64 += i + 1 < len ? alphabet[(triplet >> 6) & 63] : '='
        b64 += i + 2 < len ? alphabet[triplet & 63] : '='
      }
      return e.json(200, {
        contentType: ct,
        base64: b64,
      })
    } catch (err) {
      $app.logger().error('image_bank: falha no fetch', 'error', String(err.message || err))
      return e.json(502, { error: 'Falha ao baixar a imagem.' })
    }
  },
  $apis.requireAuth(),
)
