// pocketbase/migrations/0006_create_mcp_tokens.js
// Coleção mcp_tokens: tokens pessoais do servidor MCP, guardados SOMENTE como
// hash (token_hash oculto). O token em claro nunca é salvo — é gerado no hook
// mcp_tokens_create.js, devolvido uma única vez na resposta e esquecido.
// create/update null: apenas o hook cria tokens (nunca o cliente direto).
migrate(
  (app) => {
    const collection = new Collection({
      name: 'mcp_tokens',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: null,
      updateRule: null,
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', max: 100 },
        { name: 'token_hash', type: 'text', required: true, hidden: true },
        { name: 'token_prefix', type: 'text', max: 16 },
        { name: 'last_used_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_mcp_tokens_hash ON mcp_tokens (token_hash)',
        'CREATE INDEX idx_mcp_tokens_user ON mcp_tokens (user)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('mcp_tokens')
    app.delete(collection)
  },
)
