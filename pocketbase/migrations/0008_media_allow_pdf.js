// LinkedIn carrossel: o app envia um PDF (uma página por slide) para a coleção
// `media`. Antes só imagens eram aceitas — PDF era rejeitado no create.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('media')
    const file = col.fields.getByName('file')
    if (!file) throw new Error('media.file field missing')
    file.mimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('media')
    const file = col.fields.getByName('file')
    if (!file) return
    file.mimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    app.save(col)
  },
)
