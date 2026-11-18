/* Página de vendas da Skill Arquitetura de Carrossel: público (sem login),
   estrutura e efeitos do prado-demo (entradas por scroll, título por linha,
   botões com onda e seta dupla, links sublinhados) com o visual do Carrossel Studio.
   O .zip é montado no navegador (JSZip) a partir dos textos em /public/skill/. */
import JSZip from 'jszip'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { cx, toast } from '../components/ui'
import { initMotion } from '../lib/motion'

const ZIP_FOLDER = 'Skill-Arquitetura-de-Carrossel-v2.1'
const ZIP_NAME = 'Skill-Arquitetura-de-Carrossel-v2.1.zip'

// [url em /public/skill, nome do arquivo dentro do zip]
const SKILL_FILES: [string, string][] = [
  ['/skill/00-leia-me.txt', '00 - LEIA-ME.txt'],
  ['/skill/01-skill-principal.txt', '01 - SKILL PRINCIPAL - Arquitetura de Carrossel.txt'],
  ['/skill/02-filha-n1-em.txt', '02 - SKILL FILHA - N1-EM (Enfase no Metodo).txt'],
  ['/skill/03-filha-picture.txt', '03 - SKILL FILHA - Picture da Transformacao.txt'],
  ['/skill/04-filha-contra-solucoes.txt', '04 - SKILL FILHA - Contra Solucoes Comuns.txt'],
  ['/skill/05-filha-storynomics.txt', '05 - SKILL FILHA - Storynomics.txt'],
  ['/skill/06-filha-aida.txt', '06 - SKILL FILHA - AIDA.txt'],
  ['/skill/07-filha-6-pontos.txt', '07 - SKILL FILHA - 6 Pontos.txt'],
  ['/skill/08-referencias.txt', '08 - REFERENCIAS - Anatomia dos 15 carrosseis.txt'],
]
// O arquivo 09 (skill completa) vem em 3 partes e é unido aqui.
const SKILL_PARTS = [
  '/skill/09-completa-p1.txt',
  '/skill/09-completa-p2.txt',
  '/skill/09-completa-p3.txt',
]
const SKILL_COMPLETA = '09 - SKILL COMPLETA (tudo em um arquivo).txt'

const PROMPT_INSTALAR = 'Instale essa skill de criação de carrossel dentro do meu Maestro'

async function abrirMaestro() {
  try {
    await navigator.clipboard.writeText(PROMPT_INSTALAR)
    toast('Prompt copiado! Cole no chat do Maestro e suba o zip.')
  } catch {
    toast('Abra o Maestro e cole: ' + PROMPT_INSTALAR)
  }
  window.open('https://maestro.adapta.one/', '_blank')
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function baixarSkill() {
  const zip = new JSZip()
  const folder = zip.folder(ZIP_FOLDER)!
  await Promise.all(
    SKILL_FILES.map(async ([url, nome]) => {
      folder.file(nome, await (await fetch(url)).text())
    }),
  )
  const partes = await Promise.all(SKILL_PARTS.map((url) => fetch(url).then((r) => r.text())))
  folder.file(SKILL_COMPLETA, partes.join(''))
  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = ZIP_NAME
  a.click()
  URL.revokeObjectURL(a.href)
}

function BotaoBaixar({ className, size }: { className?: string; size?: 'sm' | 'md' }) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      className={cx(
        'btn-onda inline-flex items-center justify-center gap-2 rounded-full bg-accent text-paper font-medium hover:bg-white hover:text-paper',
        size === 'sm' ? 'h-9 px-5 text-[13px]' : 'h-12 px-7 text-[14px]',
        className,
      )}
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await baixarSkill()
        } finally {
          setBusy(false)
        }
      }}
    >
      {busy ? 'Montando o .zip…' : 'Baixar a skill (.zip)'}
    </button>
  )
}

function BotaoPrimario({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <a
      href={href}
      className={cx(
        'btn-onda inline-flex items-center justify-center gap-2 rounded-full bg-accent text-paper font-medium hover:bg-white hover:text-paper h-12 px-7 text-[14px]',
        className,
      )}
    >
      {children}
      <span className="seta" aria-hidden="true">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </span>
    </a>
  )
}

function BotaoMaestro({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => void abrirMaestro()}
      className={cx(
        'btn-onda inline-flex items-center justify-center gap-2 rounded-full bg-accent text-paper font-medium hover:bg-white hover:text-paper h-12 px-7 text-[14px]',
        className,
      )}
    >
      Instalar a skill
      <span className="seta" aria-hidden="true">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </span>
    </button>
  )
}

function Eyebrow({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <p className={cx('eyebrow text-mute entra', className)} style={style}>
      {children}
    </p>
  )
}

/** Título que entra linha a linha, como o hero do prado. */
function TituloLinhas({
  children,
  className,
  atraso,
}: {
  children: ReactNode
  className?: string
  atraso?: string
}) {
  return (
    <h2
      className={cx('entra-linhas display', className)}
      style={{ '--atraso': atraso ?? '0s' } as CSSProperties}
    >
      {children}
    </h2>
  )
}

function Linha({ i, children, className }: { i: number; children: ReactNode; className?: string }) {
  return (
    <span className={cx('linha', className)} style={{ '--i': i } as CSSProperties}>
      <span>{children}</span>
    </span>
  )
}

const O_QUE_FAZ: [string, string][] = [
  [
    'Fecha a Ideia Conectiva',
    'O carrossel fala do problema de quem lê, nunca do seu produto ou método.',
  ],
  [
    'Escolhe a estrutura certa',
    'Seis estruturas com ritmo próprio, do gancho ao CTA, sem bloco em branco.',
  ],
  [
    'Escreve no guia de voz',
    'Sem travessão, sem "não é X, é Y", sem adjetivo vazio. Frase de gente pra gente.',
  ],
  [
    'Entrega no padrão Colar texto',
    'Uma linha por campo, na ordem do template: você cola no Studio e clica em Aplicar texto.',
  ],
  [
    'Nunca inventa dado',
    'Sem prova, número ou case, a skill pergunta ou marca [PREENCHER: ...] no lugar.',
  ],
  [
    'Vem com as referências',
    '15 carrosséis estudados slide a slide, com a anatomia de cada modelo do Studio.',
  ],
]

const FLUXO: [string, string][] = [
  [
    '1. Peça',
    '"Quero um carrossel sobre [tema], objetivo salvar, no template Playbook em Princípios."',
  ],
  [
    '2. A skill escreve',
    'Ela pergunta só o que falta, aplica a estrutura e devolve os slides no ritmo certo.',
  ],
  [
    '3. Cole e pronto',
    'O bloco vem uma linha por campo. Você cola em Colar texto e clica em Aplicar texto.',
  ],
]

const ESTRUTURAS: [string, string, string, string][] = [
  [
    'N1-EM',
    'Nair N1',
    'Método com autoridade, pra Vender. Problema invisível, validação e oferta com isca.',
    'Playbook em Princípios · Raio-X de Perfil · Guia Ilustrado',
  ],
  [
    'Picture da Transformação',
    'Paula Retrato',
    'O retrato da vida depois do método, dia a dia concreto. Complementa o N1-EM.',
    'Princípios Anotados · Frases de Marca',
  ],
  [
    'Contra Soluções Comuns',
    'Clara Contraste',
    'O contraste com o que o público já tentou e se frustrou. Provoca e reposiciona.',
    'Opinião Editorial · Manifesto em Fotos · Minimal Didático',
  ],
  [
    'Storynomics',
    'Sofia Storynomics',
    'Narrativa com virada e ferramenta prática. Ideal pra Salvar ou Seguir.',
    'Case Editorial · Análise em Capítulos · História em Citação',
  ],
  [
    'AIDA',
    'Aida Clássica',
    'Atenção, Interesse, Desejo, Ação. Clássica, enxuta e direta ao ponto.',
    'Notícia Explicada · Estudo Explicado · Comparativo',
  ],
  [
    '6 Pontos',
    'Hexa',
    'Atenção, Conexão, Problema, Solução, Transição, Oferta. Ritmo rápido com oferta no fim.',
    'Seleção Comentada',
  ],
]

const PARA_QUEM: [string, string][] = [
  [
    'Social media',
    'Escreve carrossel todo dia e quer sair do improviso sem perder a voz da marca.',
  ],
  [
    'Infoprodutor',
    'Precisa de conteúdo que ensina e vende, com estrutura de quem já estudou o jogo.',
  ],
  ['Agência', 'Entrega roteiro pra cliente com padrão, velocidade e justificativa de cada slide.'],
  ['Criador', 'Quer parar de travar no slide 1 e publicar com constância.'],
  ['Time de conteúdo', 'Quer um método comum pra todo mundo escrever no mesmo nível.'],
]

function Passo({ n, titulo, children }: { n: string; titulo: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 entra">
      <div className="w-9 h-9 shrink-0 rounded-full border border-line bg-surface grid place-items-center text-[13px] tabular-nums text-sunset">
        {n}
      </div>
      <div>
        <h3 className="text-[17px] font-medium">{titulo}</h3>
        <div className="text-[14px] leading-relaxed text-ink/65 mt-1">{children}</div>
      </div>
    </div>
  )
}

export function SkillPage() {
  // liga o motor de animação (entradas por scroll + is-scrolling)
  useEffect(() => initMotion(), [])

  return (
    <div className="skill-page h-full overflow-y-auto bg-paper text-ink">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent text-paper grid place-items-center text-[13px] font-semibold">
              C
            </div>
            <span className="text-[15px] font-medium">Carrossel Studio</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-ink/65">
            <a
              href="#o-que-faz"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('o-que-faz')
              }}
              className="link-sub hover:text-ink"
            >
              O que a skill faz
            </a>
            <a
              href="#estruturas"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('estruturas')
              }}
              className="link-sub hover:text-ink"
            >
              Estruturas
            </a>
            <a
              href="#instalar"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('instalar')
              }}
              className="link-sub hover:text-ink"
            >
              Como instalar
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="#/" className="link-sub text-[13px] text-ink/65 hover:text-ink px-3 py-2">
              Abrir o Studio
            </a>
            <BotaoMaestro className="h-9 px-4 text-[13px]" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-line" data-hero>
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <Eyebrow style={{ '--atraso': '0.05s' } as CSSProperties}>
              Skill pro Maestro · Otto Carrossel · método O.B.A.A
            </Eyebrow>
            <h1
              className="entra-linhas display text-[44px] sm:text-[58px] mt-5"
              style={{ '--atraso': '0.12s' } as CSSProperties}
            >
              <Linha i={0}>Carrosséis escritos</Linha>
              <Linha i={1}>slide a slide.</Linha>
              <Linha i={2} className="text-sunset">
                Sem bloco em branco.
              </Linha>
            </h1>
            <p
              className="entra text-[17px] leading-relaxed text-ink/70 mt-6 max-w-xl"
              style={{ '--atraso': '0.38s' } as CSSProperties}
            >
              A Skill Arquitetura de Carrossel transforma o seu tema em roteiro pronto: você pede no
              Maestro, a skill escreve com uma estrutura fechada e devolve os textos no padrão do
              Carrossel Studio. É colar em "Colar texto" e aplicar.
            </p>
            <div
              className="entra flex flex-wrap gap-3 mt-8"
              style={{ '--atraso': '0.5s' } as CSSProperties}
            >
              <BotaoMaestro />
              <BotaoBaixar />
            </div>
            <p
              className="entra text-[12px] text-ink/45 mt-4"
              style={{ '--atraso': '0.62s' } as CSSProperties}
            >
              Grátis pra baixar · funciona em qualquer Maestro · atualização v2.1 com entrega no
              padrão Colar texto
            </p>
          </div>

          {/* Mock do fluxo: chat do Maestro → Colar texto */}
          <div className="space-y-4">
            <div
              className="entra rounded-2xl border border-line bg-surface p-5"
              style={{ '--atraso': '0.3s' } as CSSProperties}
            >
              <Eyebrow className="mb-3">Você, no Maestro</Eyebrow>
              <div className="rounded-xl bg-field border border-line p-3 text-[13px] leading-relaxed text-ink/80">
                Quero um carrossel sobre produtividade. Objetivo: salvar. Template: Playbook em
                Princípios.
              </div>
              <div className="rounded-xl bg-paper border border-line p-3 text-[13px] leading-relaxed text-ink/70 mt-2">
                <span className="text-sunset font-medium">Otto Carrossel:</span> fechado. Vou no
                formato de princípios, 8 slides, capa com promessa de resultado. Segue o bloco
                pronto pro Colar texto…
              </div>
            </div>
            <div
              className="entra rounded-2xl border border-line bg-surface p-5"
              style={{ '--atraso': '0.45s' } as CSSProperties}
            >
              <div className="flex items-center justify-between">
                <Eyebrow>Carrossel Studio · Colar texto</Eyebrow>
                <span className="text-[11px] text-ink/40 tabular-nums">8 linhas · 8 campos</span>
              </div>
              <div className="mt-3 rounded-xl bg-paper border border-line p-3 font-mono text-[12px] leading-6 text-ink/75">
                Como render mais ==sem== trabalhar mais
                <br />
                (o playbook de quem fecha o dia no horário)
                <br />
                Princípio 01: uma prioridade por dia
                <br />
                Tratar tudo como urgente é o que mata a sua semana…
                <br />…
              </div>
              <div className="mt-3 flex justify-end">
                <span className="text-[12px] font-medium rounded-full bg-accent text-paper px-4 py-2">
                  Aplicar texto
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* O que a skill faz */}
      <section id="o-que-faz" className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <Eyebrow>O que a skill faz</Eyebrow>
          <TituloLinhas className="text-[34px] sm:text-[44px] mt-4 max-w-2xl">
            <Linha i={0}>Um roteirista dentro</Linha>
            <Linha i={1}>do seu Maestro.</Linha>
          </TituloLinhas>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8 mt-12">
            {O_QUE_FAZ.map(([titulo, texto], i) => (
              <div
                key={titulo}
                className="entra"
                style={{ '--atraso': `${(i % 3) * 0.1}s` } as CSSProperties}
              >
                <h3 className="text-[16px] font-medium">{titulo}</h3>
                <p className="text-[14px] leading-relaxed text-ink/65 mt-2">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fluxo */}
      <section className="border-b border-line bg-surface/40">
        <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <Eyebrow>Do tema ao post</Eyebrow>
            <TituloLinhas className="text-[34px] sm:text-[44px] mt-4">
              <Linha i={0}>Peça às 9h.</Linha>
              <Linha i={1}>Cole às 9h02.</Linha>
            </TituloLinhas>
            <p className="entra text-[16px] leading-relaxed text-ink/70 mt-5 max-w-xl">
              A skill já vem com o método inteiro: as perguntas certas na abertura, a Ideia
              Conectiva, a estrutura escolhida com você e a redação slide a slide. O que chega pra
              você é o texto pronto, no formato que o Studio entende.
            </p>
          </div>
          <div className="space-y-5">
            {FLUXO.map(([titulo, texto], i) => (
              <div
                key={titulo}
                className="entra rounded-2xl border border-line bg-paper p-5"
                style={{ '--atraso': `${i * 0.12}s` } as CSSProperties}
              >
                <h3 className="text-[15px] font-medium text-sunset">{titulo}</h3>
                <p className="text-[14px] leading-relaxed text-ink/70 mt-2">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estruturas */}
      <section id="estruturas" className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <Eyebrow>Seis estruturas</Eyebrow>
          <TituloLinhas className="text-[34px] sm:text-[44px] mt-4 max-w-2xl">
            <Linha i={0}>Cada objetivo tem</Linha>
            <Linha i={1}>o seu ritmo.</Linha>
          </TituloLinhas>
          <p className="entra text-[15px] leading-relaxed text-ink/65 mt-4 max-w-2xl">
            Seguir, compartilhar, salvar, comentar ou vender: a skill indica a estrutura certa e
            escreve dentro dela. Os nomes das modelos são os mesmos dos templates do Carrossel
            Studio.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            {ESTRUTURAS.map(([nome, persona, descricao, modelos], i) => (
              <div
                key={nome}
                className="entra rounded-2xl border border-line bg-surface p-6 flex flex-col hover:border-ink/25 transition-colors duration-500"
                style={{ '--atraso': `${(i % 3) * 0.1}s` } as CSSProperties}
              >
                <Eyebrow>{persona}</Eyebrow>
                <h3 className="display text-[22px] mt-2">{nome}</h3>
                <p className="text-[14px] leading-relaxed text-ink/70 mt-3 flex-1">{descricao}</p>
                <p className="text-[11px] leading-relaxed text-ink/45 mt-4 pt-4 border-t border-line">
                  <span className="text-ink/60">Modelos de referência:</span> {modelos}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <Eyebrow>Pra quem é</Eyebrow>
          <TituloLinhas className="text-[34px] sm:text-[44px] mt-4 max-w-2xl">
            <Linha i={0}>Feito pra quem escreve</Linha>
            <Linha i={1}>carrossel de verdade.</Linha>
          </TituloLinhas>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8 mt-12">
            {PARA_QUEM.map(([titulo, texto], i) => (
              <div
                key={titulo}
                className="entra border-t border-line pt-5"
                style={{ '--atraso': `${(i % 3) * 0.1}s` } as CSSProperties}
              >
                <h3 className="text-[16px] font-medium">{titulo}</h3>
                <p className="text-[14px] leading-relaxed text-ink/65 mt-2">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como instalar */}
      <section id="instalar" className="border-b border-line bg-surface/40">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <Eyebrow>Como instalar</Eyebrow>
          <TituloLinhas className="text-[34px] sm:text-[44px] mt-4 max-w-2xl">
            <Linha i={0}>Quatro passos.</Linha>
            <Linha i={1}>Dois minutos.</Linha>
          </TituloLinhas>
          <div className="grid lg:grid-cols-2 gap-14 mt-12">
            <div className="space-y-8">
              <Passo n="1" titulo="Baixe o arquivo .zip">
                São 10 arquivos: a skill-mãe, as 6 estruturas, as referências dos 15 carrosséis e o
                guia completo em um arquivo só. O botão aqui embaixo monta o zip na hora.
              </Passo>
              <Passo n="2" titulo="Abra o Maestro e suba o zip">
                Arraste o arquivo pra conversa e mande:
                <span className="block mt-2 rounded-lg bg-field border border-line px-3 py-2 font-mono text-[12px] text-ink/80">
                  Instale este arquivo zip como skill.
                </span>
              </Passo>
              <Passo n="3" titulo="Peça o seu carrossel">
                Diga o tema, o objetivo (seguir, compartilhar, salvar, comentar ou vender) e o
                template do Studio. Exemplo:
                <span className="block mt-2 rounded-lg bg-field border border-line px-3 py-2 font-mono text-[12px] text-ink/80">
                  Quero um carrossel sobre [seu tema]. Objetivo: salvar. Template: Playbook em
                  Princípios.
                </span>
              </Passo>
              <Passo n="4" titulo="Cole no Carrossel Studio">
                A skill devolve o bloco uma linha por campo. Você cola em "Colar texto" no criador
                de conteúdo, confere a contagem de linhas e clica em "Aplicar texto". Pronto.
              </Passo>
            </div>

            <div className="entra rounded-2xl border border-line bg-paper p-8 h-fit">
              <Eyebrow>O que você recebe</Eyebrow>
              <ul className="mt-5 space-y-3.5 text-[14px] leading-relaxed text-ink/75">
                <li className="flex gap-3">
                  <span className="text-sunset">✓</span> Bloco pronto no padrão Colar texto, uma
                  linha por campo
                </li>
                <li className="flex gap-3">
                  <span className="text-sunset">✓</span> Legenda do post e hashtags separadas
                </li>
                <li className="flex gap-3">
                  <span className="text-sunset">✓</span> ==destaques== e **negrito** já marcados pro
                  Studio
                </li>
                <li className="flex gap-3">
                  <span className="text-sunset">✓</span> Skill-mãe + 6 estruturas + anatomia dos 15
                  carrosséis de referência
                </li>
                <li className="flex gap-3">
                  <span className="text-sunset">✓</span> Funciona em qualquer Maestro, sem chave de
                  API
                </li>
              </ul>
              <div className="flex gap-2 mt-8">
                <BotaoMaestro className="flex-1 h-11 text-[13px] px-4" />
                <BotaoBaixar size="sm" className="flex-1 h-11" />
              </div>
              <p className="text-[11px] text-ink/45 mt-3 text-center">
                Skill Arquitetura de Carrossel v2.1 · arquivo .zip gerado neste navegador
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-b border-line">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <TituloLinhas className="text-[36px] sm:text-[52px]">
            <Linha i={0}>Seu próximo carrossel começa</Linha>
            <Linha i={1}>com o texto pronto.</Linha>
          </TituloLinhas>
          <p className="entra text-[16px] leading-relaxed text-ink/65 mt-6">
            Baixe, instale no Maestro e nunca mais comece um carrossel pela tela em branco.
          </p>
          <div className="entra flex justify-center mt-8">
            <BotaoBaixar />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-accent text-paper grid place-items-center text-[11px] font-semibold">
              C
            </div>
            <span className="text-[13px] text-ink/70">
              Carrossel Studio · Skill Arquitetura de Carrossel
            </span>
          </div>
          <nav className="flex items-center gap-6 text-[12px] text-ink/50">
            <a
              href="#o-que-faz"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('o-que-faz')
              }}
              className="link-sub hover:text-ink"
            >
              O que a skill faz
            </a>
            <a
              href="#estruturas"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('estruturas')
              }}
              className="link-sub hover:text-ink"
            >
              Estruturas
            </a>
            <a
              href="#instalar"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('instalar')
              }}
              className="link-sub hover:text-ink"
            >
              Como instalar
            </a>
            <a href="#/" className="link-sub hover:text-ink">
              Abrir o Studio
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
