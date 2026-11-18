/// A publicação pelo conector passa a usar links assinados (ig_share_tokens +
/// rota /backend/v1/media/shared/{token} em pb_hook): o media.file do app volta
/// a ser PROTEGIDO — só responde com file token do dono (?token=, ~2 min).
/// A coleção `media` segue privada (regras de view/lista só para o dono); o
/// que fica exposto é só o link gerado na publicação, por imagem.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('media')
    const field = col.fields.getByName('file')
    if (field) {
      field.protected = true
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('media')
    const field = col.fields.getByName('file')
    if (field) {
      field.protected = false
      app.save(col)
    }
  },
)
