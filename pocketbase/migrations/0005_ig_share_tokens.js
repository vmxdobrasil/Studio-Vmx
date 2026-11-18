/// ig_share_tokens — tokens de download por imagem da coleção `media`.
/// Usados pelo pb_hook de publicação para gerar links públicos de baixar
/// (Instagram Graph API) sem liberar a coleção: regras nulas tornam a coleção
/// inacessível pela API; só os hooks (server-side) criam e consultam.
migrate(
  (app) => {
    try {
      app.findCollectionByNameOrId('ig_share_tokens')
      return // já existe
    } catch (_) {}
    const col = new Collection({
      name: 'ig_share_tokens',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'token', type: 'text', required: true, min: 50, max: 50 },
        {
          name: 'media',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('media').id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_ig_share_tokens_token ON ig_share_tokens (token)',
        'CREATE INDEX idx_ig_share_tokens_media ON ig_share_tokens (media)',
      ],
    })
    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('ig_share_tokens')
      app.delete(col)
    } catch (_) {}
  },
)
