import { Check, Copy, ExternalLink, FileText, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from '../components/ui'

/**
 * Integrações — ecossistema VMX e agentes.
 *
 * Duas seções:
 *   1. Os 5 projetos do ecossistema, com endereço de produção e o que cada um faz.
 *   2. O agente redator (Otto Carrossel) — rota e payload, para qualquer
 *      sistema externo chamar o agente sem passar pela interface.
 *
 * Os dados dos projetos são de produção (conferidos em 19/11/2026). Quando um
 * domínio próprio existir, ele aparece como endereço principal.
 */

interface Projeto {
  nome: string
  papel: string
  url: string
  /** URL própria, quando o projeto tem domínio (aparece como principal). */
  urlPropria?: string
  cor: string
}

const PROJETOS: Projeto[] = [
  {
    nome: 'Revista Moda Atual',
    papel: 'Comunicação e autoridade. Capta a audiência no topo do funil — 343 mil seguidoras.',
    url: 'https://unnamed-b28c5.goskip.app',
    urlPropria: 'https://revistamodaatual.com.br',
    cor: '#EC7318',
  },
  {
    nome: 'V MODA BRASIL',
    papel: 'Marketplace B2B. Converte a audiência da Revista em pedido de atacado.',
    url: 'https://v-moda-brasil-d7c0f.goskip.app',
    cor: '#1F6FEB',
  },
  {
    nome: 'V MED BRASIL',
    papel: 'Saúde e benefícios. Credenciamento, agenda e telemedicina.',
    url: 'https://plataforma-de-saude-omnichannel-2585c.goskip.app',
    cor: '#16A34A',
  },
  {
    nome: 'V Super Tigre',
    papel: 'Programa de recompensas do Vila Nova. Cashback, missões e ingressos.',
    url: 'https://v-super-tigre-4411c.goskip.app',
    urlPropria: 'https://www.vsupertigre.com.br',
    cor: '#DC2626',
  },
  {
    nome: 'V Club Card',
    papel: 'Cartão private label e co-branded. Benefícios e fidelidade.',
    url: 'https://v-club-card-ce878.goskip.app',
    cor: '#7C3AED',
  },
]

const CURL_AGENTE = `curl -X POST "https://carrossel-studio-copy-clone-clone-71f95.shrd01.internal.goskip.dev/backend/v1/otto/chat" \\
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

export function IntegracoesPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-4xl display">Integrações</h1>
          <p className="text-sm text-mute mt-2">
            Os projetos do ecossistema VMX e como conectar o agente redator a qualquer sistema.
          </p>
        </div>

        {/* 1. Projetos */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold mb-1">Ecossistema</h2>
          <p className="text-[12px] text-mute mb-4">
            Cinco frentes, um só núcleo: a Revista cria audiência, o V MODA converte, e os demais
            programas atendem setores específicos.
          </p>

          <div className="space-y-3">
            {PROJETOS.map((p) => (
              <div key={p.nome} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ background: p.cor }}
                    aria-hidden
                  />
                  <span className="text-sm font-medium">{p.nome}</span>
                </div>
                <p className="text-[12px] text-mute mb-2">{p.papel}</p>
                <div className="space-y-1">
                  <a
                    href={p.urlPropria ?? p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] text-accent hover:underline"
                  >
                    {p.urlPropria ?? p.url} <ExternalLink size={11} />
                  </a>
                  {p.urlPropria && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-mute hover:underline"
                    >
                      {p.url} <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Agente redator */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={15} className="text-accent" />
            <h2 className="text-sm font-semibold">Agente redator — Otto Carrossel</h2>
          </div>
          <p className="text-[12px] text-mute mb-3">
            Agente nativo do backend (
            <code className="font-mono text-[11px]">slug: otto-carrossel</code>
            ). Escreve o roteiro slide a slide no método O.B.A.A. e devolve no formato “Colar texto”
            do Studio.
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
              <div className="text-[11px] text-mute">Tier</div>
              <code className="font-mono text-[12px]">reasoning</code>
            </div>
            <div className="rounded-lg bg-ink/[.04] p-3">
              <div className="text-[11px] text-mute">Skills carregadas</div>
              <code className="font-mono text-[12px]">6 estruturas + referências</code>
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

          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/[.07] p-3 text-[12px] text-ink/80">
            <strong>O agente nunca inventa dado.</strong> Prova, número, case, história e citação
            vêm sempre de quem pede. Quando falta informação, ele marca{' '}
            <code className="font-mono text-[11px]">[PREENCHER: …]</code> em vez de supor.
          </div>
        </section>

        {/* 3. Skill pack */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={15} className="text-accent" />
            <h2 className="text-sm font-semibold">Pack de skills (uso externo)</h2>
          </div>
          <p className="text-[12px] text-mute mb-3">
            O mesmo método do Otto, em arquivos públicos, para instalar em qualquer assistente
            (Claude, GPT, Maestro).
          </p>
          <Bloco
            texto={`${window.location.origin}/skill/00-leia-me.txt`}
            rotulo="Comece por este arquivo"
          />
          <p className="text-[12px] text-mute mt-3">
            São 13 arquivos: a skill-mãe, 6 skills-filhas (N1-EM, Picture da Transformação, Contra
            Soluções Comuns, Storynomics, AIDA, 6 Pontos), as referências de 15 carrosséis estudados
            e a versão completa em um arquivo só.
          </p>
        </section>

        {/* 4. Automação */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold mb-1">Conectar um assistente para operar sozinho</h2>
          <p className="text-[12px] text-mute mb-3">
            Além do agente de texto, o Studio expõe um <strong>servidor MCP</strong> — assistentes
            de IA podem listar, criar e editar seus carrosséis com o escopo da sua conta.
          </p>
          <p className="text-[12px] text-mute">
            O passo a passo completo, com tokens, catálogo de ferramentas e configuração para
            Maestro, Claude Code, Cursor, VS Code e Claude Desktop, fica em{' '}
            <strong>Autorizações</strong> no menu ao lado.
          </p>
        </section>
      </div>
    </div>
  )
}
