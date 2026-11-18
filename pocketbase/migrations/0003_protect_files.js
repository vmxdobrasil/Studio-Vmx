/// media.file e fonts.file passam a ser PROTEGidos: deixam de ser públicos por
/// URL e só respondem a requisições autenticadas — a regra de view da coleção
/// (só o dono) decide quem pode baixar. O app acessa via file token (?token=)
/// em <img>/CSS e via cabeçalho Authorization nos fetches de export.
migrate(
  (app) => {
    for (const name of ['media', 'fonts']) {
      const col = app.findCollectionByNameOrId(name)
      const field = col.fields.getByName('file')
      if (field) {
        field.protected = true
        app.save(col)
      }
    }
  },
  (app) => {
    for (const name of ['media', 'fonts']) {
      const col = app.findCollectionByNameOrId(name)
      const field = col.fields.getByName('file')
      if (field) {
        field.protected = false
        app.save(col)
      }
    }
  },
)
