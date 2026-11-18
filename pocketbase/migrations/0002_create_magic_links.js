/// magic_links — tokens de login por link mágico (uso único, 15 min).
/// Regras nulas: inacessível pela API; só os hooks (server-side) escrevem/leem.
migrate(
  (app) => {
    try {
      app.findCollectionByNameOrId('magic_links')
      return
    } catch (_) {}
    const col = new Collection({
      name: 'magic_links',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'token', type: 'text', required: true },
        { name: 'email', type: 'text', required: true },
        { name: 'expires', type: 'date', required: true },
        { name: 'usado', type: 'bool' },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_magic_links_token ON magic_links (token)'],
    })
    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('magic_links')
      app.delete(col)
    } catch (_) {}
  },
)
