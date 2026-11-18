// LinkedIn foi retirado do produto. A rota antiga responde 410
// para qualquer cliente que ainda chame o endpoint.
routerAdd(
  'POST',
  '/backend/v1/linkedin/publish',
  (e) => {
    return e.json(410, {
      error: 'A publicação no LinkedIn foi removida. Use o Instagram.',
      code: 'REMOVED',
    })
  },
  $apis.requireAuth(),
)
