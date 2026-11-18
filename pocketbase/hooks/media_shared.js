// Rota pública que serve a imagem de um registro da coleção `media` a partir de
// um token aleatório e não-identificável, gerado na hora da publicação.
//
// Por que existe: a API do Instagram baixa cada imagem do carrossel de um
// endereço público na internet — sem login, sem cookie, sem header. Liberar a
// coleção `media` inteira não era aceitável; a coleção continua PRIVADA (regra
// de view só para o dono), e quem não tem o link de uma imagem não vê nada.
//
// O token mora na coleção `ig_share_tokens` (regras nulas: inacessível pela
// API; só o hook de publicação cria e consulta). A mesma imagem pode receber
// vários tokens ao longo do tempo (uma publicação nova gera um novo par) — o
// download serve enquanto existir pelo menos um link válido da imagem, e o
// app pode limpar os que já não usa (nada no app depende disso).
//
// Tudo inline no callback: a JSVM do PocketBase roda callbacks em pools
// separados e funções de topo de arquivo não são visíveis lá.
routerAdd('GET', '/backend/v1/media/shared/{token}', (e) => {
  const log = $app.logger()

  // O token é opaco: não contém id de usuário nem de registro.
  const token = String(e.request.pathValue('token') || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  if (token.length !== 50) {
    return e.notFoundError('Link de imagem inválido ou expirado')
  }

  // Consulta com índice único: qualquer erro vira 404 sem detalhes.
  let share = null
  try {
    share = $app.findFirstRecordByData('ig_share_tokens', 'token', token)
  } catch (_) {
    share = null
  }
  if (!share) {
    log.warn('media.shared: link nao encontrado')
    return e.notFoundError('Link de imagem inválido ou expirado')
  }

  const mediaId = share.getString('media')
  const media = $app.findRecordById('media', mediaId) // lança 500 genérico se sumiu
  const filename = String(media.getString('file') || '')
  if (!filename) return e.notFoundError('Imagem não encontrada')

  // Chave do arquivo no storage: {collectionId}/{recordId}/{filename}
  const key = media.baseFilesPath() + '/' + filename

  // Autoteste (cabeçalho X-Selftest): devolve o diagnóstico do arquivo em vez
  // de servir — para depurar o fluxo de download sem baixar nada.
  const testKey = $secrets.get('SELFTEST_KEY')
  if (testKey && e.request.header.get('X-Selftest') === testKey) {
    const out = { token: token, mediaId: mediaId, filename: filename, key: key }
    try {
      const dfs = $app.newFilesystem()
      try {
        out.exists = dfs.exists(key)
        try {
          const rd = dfs.getReader(key)
          try {
            out.readerOk = true
          } finally {
            rd.close()
          }
        } catch (errR) {
          out.readerError = String(errR)
        }
      } finally {
        dfs.close()
      }
    } catch (errD) {
      out.fsysError = String(errD)
    }
    return e.json(200, out)
  }

  // Servir: `fsys.serve` é o método oficial do JSVM para enviar um arquivo
  // armazenado na resposta HTTP. O `name` define o content-type; o caminho no
  // storage é o `key` completo ({collectionId}/{recordId}/{arquivo}).
  const fsys = $app.newFilesystem()
  try {
    e.response.header().set('Cache-Control', 'private, max-age=3600')
    fsys.serve(e.response, e.request, key, filename)
  } catch (err) {
    log.error('media.shared: arquivo nao lido', 'erro', String(err))
    return e.notFoundError('Imagem não encontrada')
  } finally {
    fsys.close()
  }
})
