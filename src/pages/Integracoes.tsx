import {
  Check,
  Copy,
  ExternalLink,
  Instagram,
  KeyRound,
  Linkedin,
  Link2,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from '../components/ui'
import { TOOLKIT as IG_TOOLKIT } from '../lib/instagram'
import { TOOLKIT as LI_TOOLKIT } from '../lib/linkedin'
import { listConnectors } from '../lib/skipConnectors'

/**
 * Integrações — canais de publicação, ecossistema VMX (MCP) e agentes.
 *
 * Seções:
 *   1. Canais de publicação (Instagram, LinkedIn) — status da conexão e como
 *      publicar (pelo Studio, botões "Postar").
 *   2. Os 5 projetos do ecossistema, cada um com o passo a passo para o agente
 *      nativo daquele projeto consumir o servidor MCP deste app.
 *   3. Otto — agente redator de carrosséis, por API (rota e payload reais do
 *      backend, conferidos em otto_chat.js e na migration 0007).
 */

const MCP_ENDPOINT =
  'https://carrossel-studio-copy-clone-clone-71f95.shrd01.internal.goskip.dev/backend/v1/mcp'

const MCP_TOOLS = ['carousels_list', 'carousels_get', 'carousels_create', 'carousels_update']

interface Projeto {
  nome: string
  papel: string
  cor: string
}

// EXATAMENTE os 5 projetos do ecossistema VMX.
const PROJETOS: Projeto[] = [
  {
    nome: 'Revista Moda Atual',
    papel: 'Comunicação e autoridade. Capta a audiência no topo do funil.',
    cor: '#EC7318',
  },
  {
    nome: 'V Moda Brasil',
    papel: 'Marketplace B2B. Converte a audiência da Revista em pedido de atacado.',
    cor: '#1F6FEB',
  },
  {
    nome: 'V Med Brasil',
    papel: 'Saúde e benefícios. Credenciamento, agenda e telemedicina.',
    cor: '#16A34A',
  },
  {
    nome: 'V Super Tigre',
    papel: 'Programa de recompensas. Cashback, missões e ingressos.',
    cor: '#DC2626',
  },
  {
    nome: 'V Club Card',
    papel: 'Cartão private label e co-branded. Benefícios e fidelidade.',
    cor: '#7C3AED',
  },
]

// Rota e payload conferidos no backend: otto_chat.js registra
// POST /backend/v1/otto/chat e a migration 0007 define o agente nativo
// slug "otto-carrossel" (tier reasoning), que responde em stream SSE.
const CURL_AGENTE = `curl -N -X POST "https://carrossel-studio-copy-clone-clone-71f95.shrd01.internal.goskip.dev/backend/v1/otto/chat" \\
  -H "Authorization: Bearer <TOKEN_DO_USUARIO>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "role": "user", "content": "Carrossel sobre os 5 erros que travam o perfil de uma lojista de moda. Objetivo: vender consultoria. Template: Lista Condensada." }
    ],
    "context": { "template": "listaCondensada", "objetivo": "vender" }
  }'`

const PAYLOAD_CAMPOS = [
  {
    campo: 'messages',
    tipo: 'array',
    desc: 'Histórico da conversa. O último item é a pergunta atual. Formato OpenAI: {role, content}.',
  },
  {
    campo: 'context.template',
    tipo: 'string',
    desc: 'Id do template que define a estrutura (listaCondensada, editorialFoto, ofertaDireta…).',
  },
  {
    campo: 'context.objetivo',
    tipo: 'string',
    desc: 'Objetivo micro: vender, autoridade, alcance, salvar, comentar.',
  },
  { campo: 'context.marca', tipo: 'string', desc: 'Nome da marca, para o agente citar no texto.' },
]

function Bloco({ texto, rotulo }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <div className="relative group">
      {rotulo && <div className="text-[11px] text-mute mb-1">{rotulo}</div>}
      <pre className="text-[11px] leading-relaxed font-mono bg-ink/[.04] border border-line rounded-lg p-3 pr-10 overflow-x-auto whitespace-pre-wrap break-all">
        {texto}
      </pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(texto)
          setCopiado(true)
          toast('Copiado')
          window.setTimeout(() => setCopiado(false), 1500)
        }}
        title="Copiar"
        className="absolute top-2 right-2 size-7 grid place-items-center rounded-md text-ink/50 hover:bg-ink/[.08] hover:text-ink"
        style={rotulo ? { top: '1.7rem' } : undefined}
      >
        {copiado ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  )
}

function StatusPill({ status }: { status: 'loading' | 'connected' | 'not_connected' }) {
  if (status === 'loading')
    return (
      <span className="text-[11px] text-mute border border-line rounded-full px-2 py-0.5">
        Verificando…
      </span>
    )
  if (status === 'connected')
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 border border-emerald-500/40 bg-emerald-500/10 rounded-full px-2 py-0.5">
        <Check size={11} /> Conectado
      </span>
    )
  return (
    <span className="text-[11px] font-medium text-amber-600 border border-amber-500/40 bg-amber-500/10 rounded-full px-2 py-0.5">
      Não conectado
    </span>
  )
}

function Canal({
  icon: Icon,
  nome,
  toolkit,
  descricao,
}: {
  icon: typeof Instagram
  nome: string
  toolkit: string
  descricao: string
}) {
  const [status, setStatus] = useState<'loading' | 'connected' | 'not_connected'>('loading')
  useEffect(() => {
    let alive = true
    listConnectors()
      .then((all) => {
        const s = all.find((c) => c.toolkit === toolkit)?.status
        if (alive) setStatus(s === 'connected' ? 'connected' : 'not_connected')
      })
      .catch(() => alive && setStatus('not_connected'))
    return () => {
      alive = false
    }
  }, [toolkit])

  return (
    <div className="rounded-xl border border-line p-4 flex gap-3">
      <div className="size-9 rounded-lg bg-ink/[.06] grid place-items-center shrink-0">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{nome}</span>
          <StatusPill status={status} />
        </div>
        <p className="text-[12px] text-mute mt-1">{descricao}</p>
      </div>
    </div>
  )
}

function PassosMcp() {
  const passos = [
    <>
      Cada projeto tem um <strong>agente nativo no backend Skip Cloud</strong>. É ele quem consome
      este Studio — a interface de cada projeto não precisa saber nada de carrossel.
    </>,
    <>
      No projeto de origem, configure o agente com o <strong>servidor MCP deste app</strong>:
      endpoint <code className="font-mono text-[11px]">{MCP_ENDPOINT}</code>, método{' '}
      <code className="font-mono text-[11px]">POST</code>.
    </>,
    <>
      Gere um <strong>token Bearer</strong> na página <strong>Autorizações</strong> (menu ao lado) e
      use no header{' '}
      <code className="font-mono text-[11px]">Authorization: Bearer &lt;token&gt;</code> — o token
      limita o agente ao escopo da SUA conta.
    </>,
    <>
      Ferramentas disponíveis para o agente:{' '}
      {MCP_TOOLS.map((t, i) => (
        <span key={t}>
          <code className="font-mono text-[11px]">{t}</code>
          {i < MCP_TOOLS.length - 1 ? ', ' : '.'}
        </span>
      ))}
    </>,
  ]
  return (
    <ol className="space-y-2">
      {passos.map((p, i) => (
        <li key={i} className="flex gap-2.5 text-[12px] text-ink/80">
          <span className="size-5 rounded-full bg-ink/[.07] grid place-items-center text-[11px] font-semibold shrink-0 mt-0.5">
            {i + 1}
          </span>
          <span className="min-w-0">{p}</span>
        </li>
      ))}
    </ol>
  )
}

export function IntegracoesPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-4xl display">Integrações</h1>
          <p className="text-sm text-mute mt-2">
            Onde o Studio publica e quem mais consome os carrosséis: os projetos do ecossistema e os
            agentes.
          </p>
        </div>

        {/* 1. Canais de publicação */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold mb-1">Canais de publicação</h2>
          <p className="text-[12px] text-mute mb-4">
            Publicar usa a SUA conta em cada rede, conectada pelos Conectores (botão dentro do
            Studio). Abra um carrossel e use os botões “Postar” no topo, ao lado de Exportar: cada
            um abre um modal que renderiza os slides, pede a conexão se faltar e publica com
            feedback de etapa.
          </p>
          <div className="space-y-3">
            <Canal
              icon={Instagram}
              nome="Instagram"
              toolkit={IG_TOOLKIT}
              descricao="Carrossel de 2 a 10 slides no feed ou 1 slide em Stories. Botão “Postar no Instagram” no Studio."
            />
            <Canal
              icon={Linkedin}
              nome="LinkedIn"
              toolkit={LI_TOOLKIT}
              descricao="Carrossel de 2 a 20 imagens como post no seu perfil. Botão “Postar no LinkedIn” no Studio, ao lado do do Instagram."
            />
          </div>
        </section>

        {/* 2. Projetos conectados via MCP */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2 mb-1">
            <Workflow size={15} className="text-accent" />
            <h2 className="text-sm font-semibold">Seus projetos conectados via MCP</h2>
          </div>
          <p className="text-[12px] text-mute mb-4">
            Os cinco projetos do ecossistema VMX consomem os carrosséis deste Studio pelo servidor
            MCP. O passo a passo abaixo vale para cada um — o que muda é o agente nativo de dentro
            de cada projeto.
          </p>

          <div className="space-y-3">
            {PROJETOS.map((p) => (
              <div key={p.nome} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ background: p.cor }}
                    aria-hidden
                  />
                  <span className="text-sm font-medium">{p.nome}</span>
                </div>
                <p className="text-[12px] text-mute mt-1 mb-3">{p.papel}</p>
                <PassosMcp />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={MCP_ENDPOINT}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] text-accent hover:underline break-all"
            >
              <Link2 size={12} /> {MCP_ENDPOINT}
            </a>
          </div>
          <div className="mt-3">
            <a
              href="#/mcp"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-accent hover:underline"
            >
              <KeyRound size={14} /> Gerar token na página Autorizações
            </a>
          </div>
        </section>

        {/* 3. Otto — agente redator */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={15} className="text-accent" />
            <h2 className="text-sm font-semibold">Otto — agente redator de carrosséis (API)</h2>
          </div>
          <p className="text-[12px] text-mute mb-3">
            Agente nativo do backend Skip Cloud (
            <code className="font-mono text-[11px]">slug: otto-carrossel</code>, tier reasoning).
            Escreve o roteiro slide a slide no método O.B.A.A. e devolve no formato “Colar texto” do
            Studio.
          </p>

          <div className="grid gap-2 sm:grid-cols-2 mb-4">
            <div className="rounded-lg bg-ink/[.04] p-3">
              <div className="text-[11px] text-mute">Rota</div>
              <code className="font-mono text-[12px]">POST /backend/v1/otto/chat</code>
            </div>
            <div className="rounded-lg bg-ink/[.04] p-3">
              <div className="text-[11px] text-mute">Autenticação</div>
              <code className="font-mono text-[12px]">Bearer &lt;token do usuário&gt;</code>
            </div>
            <div className="rounded-lg bg-ink/[.04] p-3">
              <div className="text-[11px] text-mute">Corpo</div>
              <code className="font-mono text-[12px]">JSON: messages[], context{}</code>
            </div>
            <div className="rounded-lg bg-ink/[.04] p-3">
              <div className="text-[11px] text-mute">Resposta</div>
              <code className="font-mono text-[12px]">stream SSE (text/event-stream)</code>
            </div>
          </div>

          <h3 className="text-[12px] font-semibold mb-2">Corpo da requisição</h3>
          <div className="divide-y divide-line border border-line rounded-xl overflow-hidden mb-4">
            {PAYLOAD_CAMPOS.map((c) => (
              <div key={c.campo} className="flex gap-3 p-2.5 text-[12px]">
                <code className="font-mono text-[11px] text-accent shrink-0 w-36">{c.campo}</code>
                <span className="text-mute shrink-0 w-14">{c.tipo}</span>
                <span className="text-ink/70">{c.desc}</span>
              </div>
            ))}
          </div>

          <Bloco texto={CURL_AGENTE} rotulo="Exemplo com cURL" />

          <h3 className="text-[12px] font-semibold mt-4 mb-1">O que o agente devolve</h3>
          <p className="text-[12px] text-mute">
            Um bloco de texto com <strong>uma linha por campo do template</strong>, na ordem em que
            os campos aparecem — pronto para colar no “Colar texto” do Studio. A legenda vem
            separada. As marcações <code className="font-mono text-[11px]">==destaque==</code>,{' '}
            <code className="font-mono text-[11px]">**negrito**</code> e{' '}
            <code className="font-mono text-[11px]">\n</code> valem por padrão.
          </p>
        </section>

        {/* 4. Autorizações */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold mb-1">Tokens e autorizações</h2>
          <p className="text-[12px] text-mute">
            O token para MCP e API fica na página <strong>Autorizações</strong> no menu ao lado — é
            o mesmo Bearer usado pelos agentes dos projetos e por quem chama o Otto por API.
          </p>
          <div className="mt-3">
            <a
              href="#/mcp"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-accent hover:underline"
            >
              <KeyRound size={14} /> Abrir Autorizações
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
