import { Check, Copy, KeyRound, Plus, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, ConfirmDialog, Field, Modal, inputClass, toast } from '../components/ui'
import pb from '../lib/pocketbase/client'
import { getErrorMessage } from '../lib/pocketbase/errors'

const MCP_URL = import.meta.env.VITE_POCKETBASE_URL + '/backend/v1/mcp'

type TokenRow = {
  id: string
  name: string
  token_prefix: string
  created: string
  last_used_at: string
}

const TOOLS: { name: string; desc: string }[] = [
  { name: 'carousels_list', desc: 'Lista os seus carrosséis (busca por título, paginação).' },
  { name: 'carousels_get', desc: 'Devolve um carrossel completo por id (estrutura dos slides).' },
  {
    name: 'carousels_create',
    desc: 'Cria um carrossel novo no seu nome, a partir de um objeto de dados.',
  },
  { name: 'carousels_update', desc: 'Substitui o conteúdo (data) de um dos seus carrosséis.' },
  { name: 'projects_list', desc: 'Lista os seus projetos.' },
  { name: 'projects_get', desc: 'Devolve um projeto completo por id.' },
  { name: 'brand_kits_list', desc: 'Lista os seus brand kits (cores, fontes, logo).' },
  { name: 'brand_kits_get', desc: 'Devolve um brand kit completo por id.' },
  { name: 'versions_list', desc: 'Lista as versões salvas de um dos seus carrosséis.' },
  { name: 'user_settings_get', desc: 'Lê as suas configurações.' },
  { name: 'user_settings_update', desc: 'Atualiza o conteúdo das suas configurações.' },
]

const CLIENTS: {
  key: string
  label: string
  file?: string
  steps?: string[]
  code?: (url: string) => string
}[] = [
  {
    key: 'maestro',
    label: 'Maestro',
    steps: [
      'Abra "Adicionar via URL" (adicionar conector externo).',
      'Nome: "Carrossel Studio" (qualquer nome serve para identificar).',
      'Tipo: http.',
      'URL: cole o endereço do servidor MCP (o mesmo da seção acima).',
      'Headers (opcional): um por linha, no formato "Chave: valor" — este servidor não exige nenhum.',
      'Token (opcional): cole o token gerado nesta tela. Ele é enviado automaticamente como header "Authorization: Bearer <TOKEN>".',
    ],
  },
  {
    key: 'claude-code',
    label: 'Claude Code',
    code: (url) =>
      `claude mcp add --transport http carrossel-studio ${url} \\\n  --header "Authorization: Bearer <TOKEN>"`,
  },
  {
    key: 'cursor',
    label: 'Cursor',
    file: '~/.cursor/mcp.json',
    code: (url) =>
      JSON.stringify(
        {
          mcpServers: { 'carrossel-studio': { url, headers: { Authorization: 'Bearer <TOKEN>' } } },
        },
        null,
        2,
      ),
  },
  {
    key: 'vscode',
    label: 'VS Code',
    file: '.vscode/mcp.json',
    code: (url) =>
      JSON.stringify(
        {
          servers: {
            'carrossel-studio': { type: 'http', url, headers: { Authorization: 'Bearer <TOKEN>' } },
          },
        },
        null,
        2,
      ),
  },
  {
    key: 'claude-desktop',
    label: 'Claude Desktop',
    file: 'claude_desktop_config.json (precisa Node.js)',
    code: (url) =>
      JSON.stringify(
        {
          mcpServers: {
            'carrossel-studio': {
              command: 'npx',
              args: ['-y', 'mcp-remote', url, '--header', 'Authorization: Bearer <TOKEN>'],
            },
          },
        },
        null,
        2,
      ),
  },
]

const CURL = `curl -X POST "${MCP_URL}" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "MCP-Protocol-Version: 2026-07-28" \\
  -H "Mcp-Method: tools/list" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"curl","version":"1"},"io.modelcontextprotocol/clientCapabilities":{}}}}'`

function Code({ text }: { text: string }) {
  return (
    <div className="relative group">
      <pre className="text-[11px] leading-relaxed font-mono bg-ink/[.04] border border-line rounded-lg p-3 pr-10 overflow-x-auto whitespace-pre-wrap break-all">
        {text}
      </pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(text)
          toast('Copiado')
        }}
        title="Copiar"
        className="absolute top-2 right-2 size-7 grid place-items-center rounded-md text-ink/50 hover:bg-ink/[.08] hover:text-ink"
      >
        <Copy size={14} />
      </button>
    </div>
  )
}

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

/** Autorizações (MCP): tokens pessoais que dão a assistentes de IA acesso de leitura
    e ação aos dados do usuário, com o escopo exato do próprio usuário. */
export function McpPage() {
  const [tokens, setTokens] = useState<TokenRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [revealed, setRevealed] = useState<null | { name: string; token: string }>(null)
  const [confirm, setConfirm] = useState<null | {
    title: string
    message: string
    label: string
    action: () => void
  }>(null)
  const [client, setClient] = useState('maestro')

  const load = () =>
    pb
      .collection('mcp_tokens')
      .getFullList<TokenRow>({ sort: '-created' })
      .then((rows) => setTokens(rows))
      .catch(() => toast('Não foi possível carregar os tokens', 'erro'))
      .finally(() => setLoading(false))

  useEffect(() => {
    void load()
  }, [])

  const createToken = async () => {
    if (!newName.trim()) return toast('Dê um nome ao token', 'erro')
    try {
      const res = await pb.send<{ id: string; name: string; token: string }>(
        '/backend/v1/mcp-tokens',
        {
          method: 'POST',
          body: { name: newName.trim() },
        },
      )
      setRevealed({ name: res.name, token: res.token })
      setCreating(false)
      setNewName('')
      void load()
    } catch (err) {
      toast(getErrorMessage(err) || 'Falha ao criar o token', 'erro')
    }
  }

  const revoke = async (t: TokenRow) => {
    try {
      await pb.collection('mcp_tokens').delete(t.id)
      toast('Token revogado')
      void load()
    } catch {
      toast('Falha ao revogar o token', 'erro')
    }
  }

  const regenerate = (t: TokenRow) =>
    setConfirm({
      title: 'Regenerar token?',
      message: `Um token novo com o mesmo nome "${t.name}" será criado e o atual deixará de funcionar imediatamente. Atualize o token nos clientes que o usam.`,
      label: 'Regenerar',
      action: async () => {
        try {
          const res = await pb.send<{ id: string; name: string; token: string }>(
            '/backend/v1/mcp-tokens',
            {
              method: 'POST',
              body: { name: t.name },
            },
          )
          await pb.collection('mcp_tokens').delete(t.id)
          setRevealed({ name: res.name, token: res.token })
          void load()
        } catch {
          toast('Falha ao regenerar o token', 'erro')
        }
      },
    })

  const cli = CLIENTS.find((c) => c.key === client)!

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-4xl display">Autorizações</h1>
          <p className="text-sm text-mute mt-2">
            Conecte assistentes de IA (Claude, Cursor, VS Code…) aos seus dados do Carrossel Studio.
            Um token age como você: lê e edita apenas o que é seu.
          </p>
        </div>

        {/* 1. URL do servidor */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold mb-1">Servidor MCP</h2>
          <p className="text-[12px] text-mute mb-3">
            Endereço que os clientes de IA usam. Copie-o junto com um token abaixo.
          </p>
          <Code text={MCP_URL} />
        </section>

        {/* 2. Tokens */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold">Tokens</h2>
            <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
              <Plus size={14} /> Novo token
            </Button>
          </div>
          <p className="text-[12px] text-mute mb-3">
            O token completo aparece uma única vez, na criação. Guarde como uma senha: quem o tiver
            age como você. Se vazar, revogue aqui.
          </p>

          {revealed && (
            <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/[.07] p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-amber-600 mb-2">
                <ShieldAlert size={15} /> Copie agora — "{revealed.name}" não será exibido novamente
              </div>
              <Code text={revealed.token} />
            </div>
          )}

          {loading ? (
            <p className="text-sm text-mute">Carregando…</p>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-mute">
              Nenhum token ainda. Crie o primeiro para conectar um assistente.
            </p>
          ) : (
            <div className="divide-y divide-line border border-line rounded-xl overflow-hidden">
              {tokens.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3">
                  <span className="size-8 rounded-full bg-ink/[.06] grid place-items-center text-ink/60 shrink-0">
                    <KeyRound size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{t.name}</div>
                    <div className="text-[11px] text-mute font-mono">
                      {t.token_prefix}… · criado {fmtDate(t.created)} · último uso{' '}
                      {fmtDate(t.last_used_at)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Criar um token novo no lugar deste"
                    onClick={() => regenerate(t)}
                  >
                    <RefreshCw size={14} /> Regenerar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      setConfirm({
                        title: 'Revogar token?',
                        message: `"${t.name}" deixa de funcionar imediatamente em todos os clientes conectados.`,
                        label: 'Revogar',
                        action: () => void revoke(t),
                      })
                    }
                  >
                    <Trash2 size={14} /> Revogar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Catálogo de tools */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold mb-1">O que um assistente pode fazer</h2>
          <p className="text-[12px] text-mute mb-3">
            Ferramentas expostas pelo servidor MCP — sempre limitadas aos seus dados.
          </p>
          <ul className="space-y-1.5">
            {TOOLS.map((t) => (
              <li key={t.name} className="flex gap-3 text-[13px]">
                <code className="font-mono text-[11px] text-accent shrink-0 pt-0.5">{t.name}</code>
                <span className="text-ink/70">{t.desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 4. Instruções por cliente */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold mb-3">Como conectar</h2>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CLIENTS.map((c) => (
              <button
                key={c.key}
                onClick={() => setClient(c.key)}
                className={
                  'h-8 px-3 rounded-full text-[13px] border transition-colors ' +
                  (client === c.key
                    ? 'bg-ink text-paper border-ink'
                    : 'text-ink/70 border-line hover:bg-ink/[.05]')
                }
              >
                {c.label}
              </button>
            ))}
          </div>
          {cli.file && <p className="text-[12px] text-mute mb-2">Arquivo: {cli.file}</p>}
          {cli.steps && (
            <ol className="text-[13px] text-ink/80 space-y-1.5 mb-3 list-decimal list-inside">
              {cli.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
          {cli.code && (
            <>
              <p className="text-[12px] text-mute mb-2">
                Substitua <code className="font-mono">&lt;TOKEN&gt;</code> pelo token criado acima.
              </p>
              <Code text={cli.code(MCP_URL)} />
            </>
          )}
          <div className="mt-4 space-y-2 text-[12px] text-mute">
            <p>
              Assistentes web cujo conector só aceita login OAuth (ex.: conectores de navegador) não
              conseguem usar um token colado — use Maestro, Claude Code, Cursor, VS Code ou Claude
              Desktop.
            </p>
            <p>
              <strong className="text-ink/70">Segurança:</strong> o token age como o seu usuário.
              Guarde como uma senha e revogue aqui em cima se vazar.
            </p>
          </div>
        </section>

        {/* 5. Teste com cURL */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold mb-1">Testar com cURL</h2>
          <p className="text-[12px] text-mute mb-3">
            Deve devolver a lista de ferramentas em JSON. Sem token, responde 401.
          </p>
          <Code text={CURL} />
        </section>
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Novo token"
        subtitle="Um nome só para você identificar o token depois (ex.: “Claude no notebook”)."
        width={440}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => void createToken()}>
              <Check size={15} /> Criar token
            </Button>
          </>
        }
      >
        <Field label="Nome do token">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void createToken()}
            placeholder="Claude no notebook"
            className={inputClass}
            maxLength={100}
          />
        </Field>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.label}
        danger
        onConfirm={() => void confirm?.action()}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}
