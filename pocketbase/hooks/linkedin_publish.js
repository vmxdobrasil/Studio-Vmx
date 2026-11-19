// Publica um carrossel de imagens no LinkedIn com a conta do PRÓPRIO usuário
// (conector Skip). Espelho de instagram_publish.js, seguindo o mesmo contrato:
// o frontend envia image_refs (a referência de cada slide que ELE ACABOU de
// enviar para a coleção `media`) e o hook:
//   1. confere que cada referência aponta para um registro EXISTENTE da
//      coleção `media` e que ele pertence ao usuário logado — posse validada
//      pelo ID do registro, nunca por nome de arquivo;
//   2. gera um token aleatório de 50 caracteres por imagem na coleção
//      `ig_share_tokens` e manda ao LinkedIn os links públicos assinados
//      /backend/v1/media/shared/{token} (servidos por media_shared.js).
// A coleção `media` segue PRIVADA: sem o link assinado, ninguém baixa nada.
//
// Fluxo do LinkedIn (API de imagens nativa, via Composio):
//   LINKEDIN_GET_MY_INFO            → urn do autor (ex.: urn:li:person:XXXX)
//   LINKEDIN_INITIALIZE_IMAGE_UPLOAD(owner=urn) → uploadUrl + image (urn)
//   PUT do binário no uploadUrl é feito pelo PRÓPRIO Composio: a action
//   LINKEDIN_CREATE_LINKED_IN_POST aceita URLs em `images` e baixa/envia.
//   LINKEDIN_CREATE_LINKED_IN_POST(author, commentary, images=[url assinada])
//   LINKEDIN_GET_POST_CONTENT(post_urn) → permalink
//
// Erros do provedor voltam mapeados em português; cada passo é logado.
//
// Tudo DENTRO do callback: a JSVM roda callbacks em pools separados e funções
// de topo de arquivo não são visíveis lá.
routerAdd(
  'POST',
  '/backend/v1/linkedin/publish',
  (e) => {
    const log = $app.logger()
    const body = e.requestInfo().body || {}
    const FALLBACK =
      'Não foi possível publicar no LinkedIn agora. Tente de novo em alguns instantes.'
    const TOKEN_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

    const str = (v) => (typeof v === 'string' ? v : '')
    const caption = str(body.caption)
    const carouselLabel = str(body.carousel) || 'carrossel'

    // Mesma extração de referência do hook do Instagram: aceita o id puro do
    // registro `media` ou a URL de arquivo que o upload devolveu.
    function mediaIdFromRef(v) {
      const s = str(v).trim()
      if (!s) return ''
      const m = s.match(/\/api\/files\/[^\/]+\/([a-z0-9]{15})(?:\/|$)/i)
      if (m) return m[1].toLowerCase()
      if (/^[a-z0-9]{15}$/.test(s)) return s.toLowerCase()
      return ''
    }

    const rawRefs = Array.isArray(body.image_refs) ? body.image_refs : []
    const rawUrls = Array.isArray(body.image_urls) ? body.image_urls : []
    const rawCount = Math.max(rawRefs.length, rawUrls.length)
    const refs = rawRefs.map(mediaIdFromRef).filter((r) => !!r)
    if (refs.length === 0 && rawUrls.length > 0) {
      refs.push(
        ...rawUrls.map(mediaIdFromRef).filter((r, idx, arr) => !!r && arr.indexOf(r) === idx),
      )
    }

    // O LinkedIn aceita até 20 imagens por post; abaixo de 2 não é carrossel.
    if (refs.length < 2 || refs.length > 20) {
      if (rawCount >= 2) {
        return e.json(400, {
          error:
            'Não conseguimos identificar as imagens deste carrossel na sua conta. Clique em "Publicar carrossel" mais uma vez para o app reenviar as imagens; se o aviso voltar, saia e entre na sua conta.',
          code: 'MEDIA_OWN',
        })
      }
      return e.json(400, {
        error:
          'O LinkedIn aceita carrosséis de 2 a 20 imagens. Ajuste a quantidade de slides e tente de novo.',
        code: 'SLIDES',
      })
    }
    if (caption.length > 3000) {
      return e.json(400, {
        error: 'A legenda passou do limite de 3.000 caracteres do LinkedIn. Encurte um pouco.',
        code: 'CAPTION',
      })
    }

    log.info(
      'linkedin.publish: inicio',
      'user',
      e.auth ? e.auth.id : '',
      'carrossel',
      carouselLabel,
      'imagens',
      refs.length,
    )

    // 1) Posse: cada referência precisa apontar para um registro da coleção
    //    `media` do PRÓPRIO usuário logado.
    for (let i = 0; i < refs.length; i++) {
      let rec = null
      try {
        rec = $app.findRecordById('media', refs[i])
      } catch (_) {
        rec = null
      }
      if (!rec || str(rec.getString('user')) !== str(e.auth ? e.auth.id : '')) {
        log.warn(
          'linkedin.publish: media fora da conta',
          'slide',
          i + 1,
          'media_id',
          refs[i],
          'user',
          e.auth ? e.auth.id : '',
        )
        return e.json(400, {
          error:
            'Não conseguimos confirmar que a imagem ' +
            (i + 1) +
            ' do carrossel está salva na sua conta. Clique em "Publicar carrossel" mais uma vez para o app reenviar as imagens; se o aviso voltar, saia e entre na sua conta e tente de novo.',
          code: 'MEDIA_OWN',
        })
      }
    }

    // 2) Origem pública para montar os links assinados (mesma regra do hook do
    //    Instagram: APP_PUBLIC_URL prevalece; o link precisa apontar para o
    //    BACKEND, porque o domínio do app não roteia /backend/*).
    let base = String($secrets.get('APP_PUBLIC_URL') || $os.getenv('APP_PUBLIC_URL') || '')
    if (!/^https:\/\//.test(base)) {
      base = str(body.origin)
    }
    base = base.trim().replace(/\/+$/, '')
    if (!/^https:\/\//.test(base)) {
      log.error('linkedin.publish: sem origem publica para os links assinados')
      return e.json(500, {
        error:
          'Não conseguimos preparar os links públicos das imagens para o LinkedIn. Tente de novo em alguns instantes.',
        code: 'NO_BASE_URL',
      })
    }

    // 3) Link assinado por imagem: token aleatório de 50 caracteres na coleção
    //    `ig_share_tokens` (mesma coleção do fluxo do Instagram), que só o
    //    backend consulta — os links morrem quando o token é removido.
    const tokensCol = $app.findCollectionByNameOrId('ig_share_tokens')
    // `new Record(col)` (construtor global do JSVM): `$app.newRecord` não
    // existe neste runtime — usar estoura TypeError e mata a publicação.
    function saveToken(token, mediaId) {
      const rec = new Record(tokensCol)
      rec.set('token', token)
      rec.set('media', mediaId)
      $app.save(rec)
    }
    function makeToken(mediaId) {
      let token = $security.randomStringWithAlphabet(50, TOKEN_ALPHABET)
      try {
        saveToken(token, mediaId)
      } catch (err) {
        // Colisão de token (praticamente impossível): tenta mais uma vez.
        token = $security.randomStringWithAlphabet(50, TOKEN_ALPHABET)
        saveToken(token, mediaId)
      }
      return token
    }
    const signedUrls = []
    for (let i = 0; i < refs.length; i++) {
      signedUrls.push(base + '/backend/v1/media/shared/' + makeToken(refs[i]))
    }
    log.info('linkedin.publish: links assinados criados', 'quantidade', signedUrls.length)

    // Autoteste (cabeçalho X-Selftest, mesmo padrão do hook do Instagram): roda
    // até ANTES de falar com o LinkedIn — valida posse, links e conexão sem
    // publicar nada.
    const testKey = $secrets.get('SELFTEST_KEY')
    const isTest = !!testKey && e.request.header.get('X-Selftest') === testKey

    // 4) Quem é o autor: a conta que o usuário conectou (urn:li:person:…).
    const me = $connectors.execute(e.auth, 'LINKEDIN_GET_MY_INFO', {})
    if (!me.successful) {
      log.error('linkedin.publish: conta nao consultada', 'erro', String(me.error || ''))
      return e.json(502, {
        error:
          'Não conseguimos falar com a sua conta do LinkedIn. Provavelmente sua conexão expirou — desconecte e conecte sua conta de novo.',
        code: 'CONNECT_EXPIRED',
      })
    }
    const md = me.data || {}
    // A resposta da API de perfil varia (sub, id ou urn embutido); normalize.
    let authorUrn = str(md.urn) || str(md.sub) || str(md.id)
    if (authorUrn && authorUrn.indexOf('urn:') !== 0) {
      authorUrn = 'urn:li:person:' + authorUrn
    }
    if (!authorUrn) {
      log.error('linkedin.publish: resposta sem id', 'resposta', JSON.stringify(md).slice(0, 500))
      return e.json(502, {
        error: 'A conta conectada não informou o identificador do LinkedIn.',
        code: 'NO_ID',
      })
    }
    log.info('linkedin.publish: conta ok', 'autor', authorUrn)

    // Autoteste: para aqui — conexão e links prontos, nada enviado ao LinkedIn.
    if (isTest) {
      return e.json(200, {
        selftest: true,
        author: authorUrn,
        signed_urls: signedUrls.length,
      })
    }

    // 5) Publica: a action aceita as URLs em `images` e faz o upload nativo
    //    (initialize → PUT presigned → register) por dentro.
    const pr = $connectors.execute(e.auth, 'LINKEDIN_CREATE_LINKED_IN_POST', {
      author: authorUrn,
      commentary: caption,
      images: signedUrls,
      visibility: 'PUBLIC',
    })
    if (!pr.successful) {
      const raw = String((pr && pr.error) || '(vazio)')
      log.error('linkedin.publish: criar post', 'erro', raw, 'autor', authorUrn)
      return e.json(502, {
        error: friendly(raw) || FALLBACK,
        code: codeFor(raw),
        stage: 'post',
      })
    }
    const pd = pr.data || {}
    const postId = str(pd.id) || str(pd.post_id) || str(pd.urn) || str(pd.activity_id)
    if (!postId) {
      log.error('linkedin.publish: post sem id', 'resposta', JSON.stringify(pd).slice(0, 500))
      return e.json(502, {
        error: 'O LinkedIn não confirmou a publicação. Confira o perfil antes de publicar de novo.',
        code: 'NO_POST',
      })
    }
    log.info('linkedin.publish: publicado', 'post_id', postId, 'carrossel', carouselLabel)

    // 6) Link do post (bônus: falhar aqui não derruba a publicação).
    let permalink = ''
    try {
      const lr = $connectors.execute(e.auth, 'LINKEDIN_GET_POST_CONTENT', { post_id: postId })
      if (lr.successful) {
        const ld = lr.data || {}
        const p = str(ld.permalink) || str(ld.public_permalink)
        if (p.indexOf('http') === 0) permalink = p
      }
    } catch (_) {
      // O post foi publicado; o link é um bônus.
    }

    return e.json(200, { post_id: postId, permalink: permalink })

    // Traduz o erro técnico do provedor para o que o usuário precisa fazer.
    // O que não é reconhecido devolve '' e a rota usa o fallback.
    function friendly(raw) {
      const m = String(raw || '').toLowerCase()
      const has = function () {
        for (var i = 0; i < arguments.length; i++) if (m.indexOf(arguments[i]) !== -1) return true
        return false
      }
      if (has('oauth', 'token', 'expired', 'session', '401', 'unauthorized', 'authentication')) {
        return 'Sua conexão com o LinkedIn expirou. Desconecte e conecte sua conta de novo.'
      }
      if (has('permission', 'scope', 'w_member_social', '403', 'forbidden', 'authorize')) {
        return 'Falta permissão de publicação na sua conexão. Desconecte e conecte sua conta de novo, aceitando as permissões de publicar no LinkedIn.'
      }
      if (
        (has('download', 'fetch', 'url', 'image', 'upload', 'asset') &&
          has('400', '422', 'fail')) ||
        has('invalid image', 'image upload')
      ) {
        return 'O LinkedIn não conseguiu processar as imagens do carrossel. Verifique sua conexão e tente de novo em alguns instantes.'
      }
      if (has('rate', 'limit', '429', 'throttl', 'spam')) {
        return 'O LinkedIn está limitando as publicações da sua conta agora. Espere um pouco e tente de novo.'
      }
      if (has('duplicate', 'already', '429')) {
        return 'O LinkedIn recusou porque este conteúdo parece duplicado. Espere alguns minutos antes de publicar de novo.'
      }
      return ''
    }

    // Código estável do tipo de erro, para o app mostrar a ação certa.
    function codeFor(raw) {
      const m = String(raw || '').toLowerCase()
      const has = function () {
        for (var i = 0; i < arguments.length; i++) if (m.indexOf(arguments[i]) !== -1) return true
        return false
      }
      if (has('oauth', 'token', 'expired', 'session', '401', 'unauthorized', 'authentication'))
        return 'CONNECT_EXPIRED'
      if (has('permission', 'scope', 'w_member_social', '403', 'forbidden', 'authorize'))
        return 'PERMISSION'
      if (has('rate', 'limit', '429', 'throttl', 'spam')) return 'RATE'
      if (has('duplicate', 'already')) return 'DUPLICATE'
      return 'LI'
    }
  },
  $apis.requireAuth(),
)
