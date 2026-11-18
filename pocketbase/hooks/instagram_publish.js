// Publica um carrossel de imagens no Instagram com a conta do PRÓPRIO usuário
// (conector Skip). Requisições anônimas não chegam aqui: a rota exige login
// ($apis.requireAuth) e a chamada ao conector é sempre como e.auth.
//
// Contrato com o app: o frontend envia image_refs — a referência de cada slide
// que ELE ACABOU de enviar para a coleção `media` (a URL que o upload devolve:
// /api/files/media/{id do registro}/{arquivo}; a URL completa também serve).
// Este hook então:
//   1. confere que cada referência aponta para um registro EXISTENTE da
//      coleção `media` e que ele pertence ao usuário logado — posse validada
//      pelo ID do registro, nunca por nome de arquivo (nome parecido não é
//      prova de posse);
//   2. gera um token aleatório de 50 caracteres por imagem na coleção
//      `ig_share_tokens` e manda ao Instagram os links públicos assinados
//      /backend/v1/media/shared/{token} (servidos por media_shared.js).
// A coleção `media` segue PRIVADA: sem o link assinado, ninguém baixa nada.
//
// Por que isto vive no backend: o log do conector já mostrou o fluxo inteiro
// morrer na 2ª chamada (criar o container) sem nenhum erro registrado — a
// mensagem devolvida ao app era vazia e o usuário só via o erro genérico.
// Aqui cada passo é logado ($app.logger()) e o erro da Graph API (status,
// código, subcode, mensagem) volta mapeado em português para o app.
//
// Tudo vive DENTRO do callback: a JSVM do PocketBase roda callbacks em pools
// separados e funções de topo de arquivo não são visíveis lá.
routerAdd(
  'POST',
  '/backend/v1/instagram/publish',
  (e) => {
    const log = $app.logger()
    const body = e.requestInfo().body || {}
    // Fallback só para erros inesperados (o comum é mensagem específica).
    const IG_FALLBACK =
      'Não foi possível publicar no Instagram agora. Tente de novo em alguns instantes.'
    const TOKEN_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

    const str = (v) => (typeof v === 'string' ? v : '')
    const caption = str(body.caption)
    const carouselLabel = str(body.carousel) || 'carrossel'

    // Referência de imagem → id do registro na coleção `media`. Aceita o id
    // puro (contrato novo do app) ou a URL de arquivo que o upload devolve.
    // O segmento da coleção na URL pode ser o nome (`media`) ou o id interno do
    // PocketBase (`pbc_...`) — o SDK do app monta a URL com o id, então o
    // formato aceito é qualquer segmento + id de registro de 15 caracteres.
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

    if (refs.length < 2 || refs.length > 10) {
      // Veio imagem suficiente, mas nenhuma virou referência válida: não é
      // quantidade, é formato/posse — manda reenviar (o app reenvia as imagens).
      if (rawCount >= 2) {
        return e.json(400, {
          error:
            'Não conseguimos identificar as imagens deste carrossel na sua conta. Clique em "Publicar carrossel" mais uma vez para o app reenviar as imagens; se o aviso voltar, saia e entre na sua conta.',
          code: 'MEDIA_OWN',
        })
      }
      return e.json(400, {
        error:
          'O Instagram aceita carrosséis de 2 a 10 imagens. Ajuste a quantidade de slides e tente de novo.',
        code: 'SLIDES',
      })
    }
    if (caption.length > 2200) {
      return e.json(400, {
        error: 'A legenda passou do limite de 2.200 caracteres do Instagram. Encurte um pouco.',
        code: 'CAPTION',
      })
    }

    log.info(
      'instagram.publish: inicio',
      'user',
      e.auth ? e.auth.id : '',
      'carrossel',
      carouselLabel,
      'imagens',
      refs.length,
    )

    // 1) Posse: cada referência precisa apontar para um registro da coleção
    //    `media` do PRÓPRIO usuário logado. Falhou = nada é gerado nem publicado.
    for (let i = 0; i < refs.length; i++) {
      let rec = null
      try {
        rec = $app.findRecordById('media', refs[i])
      } catch (_) {
        rec = null
      }
      if (!rec || str(rec.getString('user')) !== str(e.auth ? e.auth.id : '')) {
        log.warn(
          'instagram.publish: media fora da conta',
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

    // 2) Origem pública para montar os links assinados. O segredo
    //    APP_PUBLIC_URL ($secrets chega aos hooks; env de build não), quando
    //    definido, prevalece sobre a origem que o app manda — o link precisa
    //    apontar para o BACKEND, porque o domínio do app não roteia /backend/*
    //    (devolveria o HTML do app em vez da imagem, como acontecia).
    let base = String($secrets.get('APP_PUBLIC_URL') || $os.getenv('APP_PUBLIC_URL') || '')
    if (!/^https:\/\//.test(base)) {
      base = str(body.origin)
    }
    base = base.trim().replace(/\/+$/, '')
    if (!/^https:\/\//.test(base)) {
      log.error('instagram.publish: sem origem publica para os links assinados')
      return e.json(500, {
        error:
          'Não conseguimos preparar os links públicos das imagens para o Instagram. Tente de novo em alguns instantes.',
        code: 'NO_BASE_URL',
      })
    }

    // 3) Link assinado por imagem: token aleatório de 50 caracteres na coleção
    //    `ig_share_tokens` (só este hook cria/consulta) apontando para o registro.
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
    log.info('instagram.publish: links assinados criados', 'quantidade', signedUrls.length)

    // Autoteste (cabeçalho X-Selftest, mesmo padrão dos hooks de IA): o fluxo
    // roda até criar os containers do Instagram e PARA antes de publicar —
    // serve para validar a etapa do Instagram sem publicar nada.
    const testKey = $secrets.get('SELFTEST_KEY')
    const isTest = !!testKey && e.request.header.get('X-Selftest') === testKey
    if (isTest) {
      log.info('instagram.publish: autoteste', 'links', signedUrls.length)
    }

    // 4) Quem é a conta do usuário. "me" é a conta que ele conectou; aqui pegamos
    //    o id numérico, o @username e o tipo da conta para diagnosticar contas
    //    pessoais (a API de publicação só aceita conta Profissional).
    const info = $connectors.execute(e.auth, 'INSTAGRAM_GET_USER_INFO', {
      ig_user_id: 'me',
      fields: 'id,username,account_type',
    })
    if (!info.successful) {
      log.error('instagram.publish: conta nao consultada', 'erro', String(info.error || ''))
      return e.json(502, {
        error:
          'Não conseguimos falar com a sua conta do Instagram. Provavelmente sua conexão expirou — desconecte e conecte sua conta de novo.',
        code: 'CONNECT_EXPIRED',
      })
    }
    const d = info.data || {}
    const igUserId = str(d.id)
    const igUsername = str(d.username)
    const accountType = str(d.account_type)
    if (!igUserId) {
      log.error('instagram.publish: resposta sem id', 'resposta', JSON.stringify(d).slice(0, 500))
      return e.json(502, {
        error: 'A conta conectada não informou o identificador do Instagram.',
        code: 'NO_ID',
      })
    }
    log.info(
      'instagram.publish: conta ok',
      'ig_user',
      igUsername,
      'ig_user_id',
      igUserId,
      'account_type',
      accountType,
    )

    // Conta pessoal: a Graph API publica só em conta Profissional (Empresa/Criadora).
    if (accountType && /personal/i.test(accountType)) {
      log.warn('instagram.publish: conta pessoal', 'account_type', accountType)
      return e.json(400, {
        error:
          'Sua conta do Instagram é pessoal. Para publicar, ela precisa ser Profissional (Empresa ou Criadora) — dá para mudar de graça nas configurações do Instagram, em "Tipo de conta e ferramentas".',
        code: 'PERSONAL',
      })
    }

    // 5) Um container de IMAGEM por slide. A API do Instagram não aceita URLs
    //    direto em `children` do carrossel: `children` são IDS de containers
    //    (docs da Meta: "a list of up to 20 container IDs"), e cada item nasce
    //    de um POST /media com image_url + is_carousel_item=true.
    const childIds = []
    for (let i = 0; i < signedUrls.length; i++) {
      const ci = $connectors.execute(e.auth, 'INSTAGRAM_POST_IG_USER_MEDIA', {
        ig_user_id: igUserId,
        image_url: signedUrls[i],
        is_carousel_item: 'true',
      })
      const cdi = (ci && ci.data) || {}
      const cid = str(cdi.id) || str(cdi.creation_id) || str(cdi.container_id)
      if (!ci.successful || !cid) {
        log.error(
          'instagram.publish: container de imagem',
          'slide',
          i + 1,
          'erro',
          String((ci && ci.error) || '(vazio)'),
          'resposta',
          JSON.stringify(cdi).slice(0, 300),
        )
        if (isTest) {
          return e.json(200, {
            selftest: true,
            failed: 'image_container',
            slide: i + 1,
            raw_error: String((ci && ci.error) || ''),
            raw_data: JSON.stringify(cdi).slice(0, 600),
          })
        }
        return e.json(502, {
          error: friendly(String((ci && ci.error) || ''), 'image_container') || IG_FALLBACK,
          code: codeFor(String((ci && ci.error) || '')),
          stage: 'image_container',
          slide: i + 1,
        })
      }
      childIds.push(cid)
    }
    log.info('instagram.publish: containers de imagem criados', 'quantidade', childIds.length)

    // 5b) Container do CARROSSEL apontando para os ids dos filhos.
    //     `children` precisa ser a LISTA de ids: o conector valida o formato
    //     ("Input should be a valid list on parameter `children`").
    const cr = $connectors.execute(e.auth, 'INSTAGRAM_POST_IG_USER_MEDIA', {
      ig_user_id: igUserId,
      media_type: 'CAROUSEL',
      caption: caption,
      children: childIds,
    })
    if (!cr.successful) {
      if (isTest) {
        return e.json(200, {
          selftest: true,
          failed: 'carousel_container',
          child_ids: childIds,
          raw_error: String(cr.error || ''),
          raw_data: JSON.stringify(cr.data || {}).slice(0, 600),
        })
      }
      // O erro completo vai para os logs do backend (stream "hooks")…
      log.error(
        'instagram.publish: container',
        'erro',
        String(cr.error || '(vazio)'),
        'etapa',
        'container',
        'imagens',
        signedUrls.length,
      )
      // …e o app recebe o motivo em português.
      return e.json(502, {
        error: friendly(String(cr.error || ''), 'container') || IG_FALLBACK,
        code: codeFor(String(cr.error || '')),
        stage: 'container',
      })
    }
    const cd = cr.data || {}
    const creationId = str(cd.id) || str(cd.creation_id) || str(cd.container_id)
    if (!creationId) {
      log.error('instagram.publish: container sem id', 'resposta', JSON.stringify(cd).slice(0, 500))
      return e.json(502, {
        error: 'O Instagram não confirmou a criação do carrossel. Tente de novo.',
        code: 'NO_CONTAINER',
      })
    }
    log.info('instagram.publish: container criado', 'creation_id', creationId)

    // Autoteste: para aqui — containers criados, nada publicado.
    if (isTest) {
      const statuses = []
      for (let i = 0; i < childIds.length; i++) {
        let st = ''
        try {
          const sr = $connectors.execute(e.auth, 'INSTAGRAM_GET_IG_MEDIA', {
            ig_media_id: childIds[i],
            fields: 'status_code',
          })
          if (sr.successful) st = str((sr.data || {}).status_code)
          else st = 'erro: ' + String(sr.error || '')
        } catch (errS) {
          st = 'erro: ' + String(errS)
        }
        statuses.push(st)
      }
      return e.json(200, {
        selftest: true,
        child_ids: childIds,
        creation_id: creationId,
        statuses: statuses,
      })
    }

    // 6) Publica o container (a ação espera o processamento terminar).
    const pr = $connectors.execute(e.auth, 'INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH', {
      ig_user_id: igUserId,
      creation_id: creationId,
    })
    if (!pr.successful) {
      log.error(
        'instagram.publish: publish',
        'erro',
        String(pr.error || '(vazio)'),
        'etapa',
        'publish',
        'creation_id',
        creationId,
      )
      return e.json(502, {
        error: friendly(String(pr.error || ''), 'publish') || IG_FALLBACK,
        code: codeFor(String(pr.error || '')),
        stage: 'publish',
      })
    }
    const pd = pr.data || {}
    const mediaId = str(pd.id) || str(pd.media_id) || str(pd.post_id)
    if (!mediaId) {
      log.error('instagram.publish: publish sem id', 'resposta', JSON.stringify(pd).slice(0, 500))
      return e.json(502, {
        error:
          'O Instagram não confirmou a publicação. Confira o perfil antes de publicar de novo.',
        code: 'NO_MEDIA',
      })
    }

    // 7) Link do post (bônus: falhar aqui não derruba a publicação).
    let permalink = ''
    try {
      const lr = $connectors.execute(e.auth, 'INSTAGRAM_GET_IG_MEDIA', {
        ig_media_id: mediaId,
        fields: 'permalink',
      })
      if (lr.successful) {
        const ld = lr.data || {}
        const p = str(ld.permalink)
        if (p.indexOf('http') === 0) permalink = p
      }
    } catch (_) {
      // O post foi publicado; o link é um bônus.
    }

    log.info('instagram.publish: publicado', 'media_id', mediaId, 'carrossel', carouselLabel)
    return e.json(200, { media_id: mediaId, permalink: permalink })

    // Traduz o erro técnico do provedor para o que o usuário precisa fazer.
    // O que não é reconhecido devolve '' e a rota usa o fallback.
    function friendly(raw, stage) {
      const m = String(raw || '').toLowerCase()
      const has = function () {
        for (var i = 0; i < arguments.length; i++) if (m.indexOf(arguments[i]) !== -1) return true
        return false
      }
      if (has('oauth', 'token', 'expired', 'session', '401', '190')) {
        return 'Sua conexão com o Instagram expirou. Desconecte e conecte sua conta de novo.'
      }
      if (
        has(
          'permission',
          'scope',
          'authorize',
          'not authorized',
          '403',
          'instagram_content_publish',
          '200',
        )
      ) {
        return 'Falta permissão de publicação na sua conexão. Desconecte e conecte sua conta de novo, aceitando a permissão de publicar no Instagram.'
      }
      if (
        has('business', 'creator', 'professional', 'personal', '36001', '2207056', 'account_type')
      ) {
        return 'Sua conta do Instagram precisa ser Profissional (Empresa ou Criadora) para publicar. Dá para mudar de graça nas configurações do Instagram, em "Tipo de conta e ferramentas".'
      }
      if (
        (stage === 'container' || stage === 'image_container') &&
        has('download', 'fetch', 'url', 'image', 'invalid', '400')
      ) {
        return 'O Instagram não conseguiu baixar as imagens do carrossel. Verifique sua conexão e tente de novo em alguns instantes.'
      }
      if (has('rate', 'limit', '429', 'tries', 'tentativas', 'spam')) {
        return 'O Instagram está limitando as publicações da sua conta agora. Espere um pouco (pode levar 24 h) e tente de novo.'
      }
      if (has('duplicate', 'media_id was posted', 'already')) {
        return 'O Instagram recusou porque este carrossel já foi publicado há pouco. Espere alguns minutos antes de publicar de novo.'
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
      if (has('oauth', 'token', 'expired', 'session', '401', '190')) return 'CONNECT_EXPIRED'
      if (
        has(
          'permission',
          'scope',
          'authorize',
          'not authorized',
          '403',
          'instagram_content_publish',
          '200',
        )
      )
        return 'PERMISSION'
      if (
        has('business', 'creator', 'professional', 'personal', '36001', '2207056', 'account_type')
      )
        return 'PERSONAL'
      if (has('rate', 'limit', '429', 'tries', 'tentativas', 'spam')) return 'RATE'
      if (has('duplicate', 'media_id was posted', 'already')) return 'DUPLICATE'
      return 'IG'
    }
  },
  $apis.requireAuth(),
)
