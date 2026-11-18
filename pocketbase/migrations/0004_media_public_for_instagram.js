/// O conector do Instagram baixa as imagens direto da URL pública: o media.file
/// do app volta a ser PÚBLICO (a publicação não funciona com file token, que
/// expira em ~2 min e não pode ser embutido na URL passada ao Instagram).
/// As regras das coleções continuam limitando quem VÊ/LISTA os registros; só o
/// binário do arquivo fica acessível por URL direta.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('media')
    const field = col.fields.getByName('file')
    if (field) {
      field.protected = false
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('media')
    const field = col.fields.getByName('file')
    if (field) {
      field.protected = true
      app.save(col)
    }
  },
)
