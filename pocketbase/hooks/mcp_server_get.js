// pocketbase/hooks/mcp_server_get.js
// GET /backend/v1/mcp — o MCP fala apenas Streamable HTTP por POST.
// GET devolve 405 com o header Allow apontando o método correto.
routerAdd('GET', '/backend/v1/mcp', (e) => {
  e.response.header().set('Allow', 'POST')
  return e.json(405, {
    jsonrpc: '2.0',
    id: null,
    error: { code: -32600, message: 'Method Not Allowed: this MCP endpoint accepts POST only' },
  })
})
