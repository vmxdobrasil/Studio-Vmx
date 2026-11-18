// Coleções do Carrossel Studio. Todo registro pertence a um usuário (campo `user`)
// e só o dono pode ler, criar, alterar ou apagar.
migrate(
  (app) => {
    const OWNER = "@request.auth.id != '' && user = @request.auth.id"

    function create(name, extraFields, indexes) {
      const fields = [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
      ]
        .concat(extraFields)
        .concat([
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ])
      app.save(
        new Collection({
          name: name,
          type: 'base',
          listRule: OWNER,
          viewRule: OWNER,
          createRule: "@request.auth.id != '' && @request.body.user = @request.auth.id",
          updateRule: OWNER + ' && @request.body.user:changed = false',
          deleteRule: OWNER,
          fields: fields,
          indexes: indexes,
        }),
      )
    }

    // Projetos (pastas), carrosséis e brand kits: o objeto do app inteiro fica em `data`.
    create(
      'projects',
      [{ name: 'data', type: 'json', required: true, maxSize: 200000 }],
      ['CREATE INDEX idx_projects_user ON projects (user)'],
    )
    create(
      'carousels',
      [{ name: 'data', type: 'json', required: true, maxSize: 5242880 }],
      ['CREATE INDEX idx_carousels_user ON carousels (user)'],
    )
    create(
      'brand_kits',
      [{ name: 'data', type: 'json', required: true, maxSize: 1048576 }],
      ['CREATE INDEX idx_brand_kits_user ON brand_kits (user)'],
    )

    // Configurações do usuário (um registro por conta, com o mesmo id do usuário).
    create(
      'user_settings',
      [{ name: 'data', type: 'json', required: true, maxSize: 200000 }],
      ['CREATE UNIQUE INDEX idx_user_settings_user ON user_settings (user)'],
    )

    // Histórico de versões de cada carrossel (o app guarda as 25 mais recentes).
    create(
      'versions',
      [
        { name: 'carousel', type: 'text', required: true, max: 64 },
        { name: 'data', type: 'json', required: true, maxSize: 5242880 },
      ],
      ['CREATE INDEX idx_versions_user_carousel ON versions (user, carousel, created)'],
    )

    // Fontes enviadas pelo usuário.
    create(
      'fonts',
      [
        { name: 'family', type: 'text', required: true, max: 120 },
        { name: 'file', type: 'file', required: true, maxSelect: 1, maxSize: 10485760 },
      ],
      ['CREATE INDEX idx_fonts_user ON fonts (user)'],
    )

    // Imagens usadas nos slides, logos e avatares.
    create(
      'media',
      [
        {
          name: 'file',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 20971520,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        },
      ],
      ['CREATE INDEX idx_media_user ON media (user)'],
    )
  },
  (app) => {
    const names = [
      'media',
      'fonts',
      'versions',
      'user_settings',
      'brand_kits',
      'carousels',
      'projects',
    ]
    for (let i = 0; i < names.length; i++) {
      try {
        app.delete(app.findCollectionByNameOrId(names[i]))
      } catch (_) {
        // a coleção já não existe
      }
    }
  },
)
