/**
 * Família "Lista da Morte" (4:5): inspirada no formato viral de ranking de apps —
 * capa com gradiente marrom→laranja e linha script, tabela dark com chips de veredito,
 * níveis numerados, prompt em monospace e CTA com brilho de fogo.
 */
import type { ColorRef, LeafElement, SlideElement, Template } from '../types'
import {
  INNER,
  M,
  W,
  card,
  counter,
  cta,
  gradient,
  header,
  rect,
  slide,
  stack,
  text,
} from './builders'

const SCRIPT = 'Caveat'
const SANS = 'Inter Tight'

/** Marrom escuro base dos slides de gradiente. */
const BROWN = '#1C0E05'
/** Beige pontilhado dos slides de tabela. */
const BEIGE = '#EFE7D8'
const INK = '#1A120C'
const PAPER = '#F5EFE6'
const MUTED_DARK = 'rgba(245,239,230,0.62)'
const MUTED_LIGHT = 'rgba(26,18,12,0.6)'
const ORANGE = '#FF6B2C'
const AMBER = '#FFC24B'

const HEAD = {
  font: SANS,
  weight: 800,
  lineHeight: 1.0,
  letterSpacing: -0.02,
} as const

/** Textura de pontinhos por cima do slide inteiro. */
const dots = (color: string, size = 28): LeafElement[] => [
  {
    id: `dots_${Math.random().toString(36).slice(2, 8)}`,
    type: 'shape',
    x: 0,
    y: 0,
    w: W,
    h: 1350,
    radius: 0,
    fullBleed: true,
    pattern: { kind: 'pontos', color, size },
  } as LeafElement,
]

/** Cabeçalho @ + contador de página no topo. */
const top = (color: ColorRef) => [
  header(color, 46),
  counter({ x: W - M - 140, y: 46, w: 140, h: 30 }, { color }),
]

const drag = (color: string, y = 1262) =>
  text(
    undefined,
    'arrasta pro lado →',
    { x: M, y, w: INNER, h: 32 },
    { size: 22, weight: 700, uppercase: true, letterSpacing: 0.06, color },
    { opacity: 0.75 },
  )

/** Página da capa: gradiente marrom→laranja com brilho e título em 3 linhas (script no meio). */
const capa = () =>
  slide('Capa', BROWN, [
    ...dots('rgba(255,255,255,0.05)'),
    gradient({ color: ORANGE, from: 0.32, to: 1, opacity: 0.9, direction: 'down' }),
    gradient({
      color: AMBER,
      direction: 'radial',
      cx: 50,
      cy: 102,
      from: 0,
      to: 0.5,
      opacity: 0.55,
    }),
    ...top('hook'),
    stack(
      { x: M, y: 480, w: INNER, h: 720 },
      'bottom',
      [
        text('hook', 'saiu a lista', { h: 130 }, { ...HEAD, size: 118, color: 'hook' }),
        text(
          undefined,
          'da morte',
          { h: 150 },
          { font: SCRIPT, size: 132, weight: 500, lineHeight: 1, color: 'hook' },
        ),
        text('titulo', 'dos apps', { h: 130 }, { ...HEAD, size: 118, color: 'hook' }),
        text(
          'subhook',
          'E o primeiro do ranking você\nprovavelmente paga todo mês.',
          { h: 110 },
          { size: 32, lineHeight: 1.35, color: '#F3E3D3' },
          { opacity: 0.92 },
        ),
        text(
          undefined,
          'arrasta pro lado →',
          { h: 32 },
          { size: 22, weight: 700, uppercase: true, letterSpacing: 0.06, color: '#F3E3D3' },
          { opacity: 0.75 },
        ),
      ],
      14,
    ),
  ])

/** Slide de contexto escuro: manchete + pergunta central em cartão. */
const contexto = () =>
  slide('Contexto', BROWN, [
    ...dots('rgba(255,255,255,0.05)'),
    gradient({ color: ORANGE, from: 0.72, to: 1, opacity: 0.55, direction: 'down' }),
    ...top('hook'),
    stack(
      { x: M, y: 220, w: INNER, h: 880 },
      'top',
      [
        text(
          'rotulo',
          'O QUE É',
          { h: 30 },
          { size: 22, weight: 700, uppercase: true, letterSpacing: 0.14, color: AMBER },
        ),
        text('titulo', 'um site está listando', { h: 100 }, { ...HEAD, size: 88, color: 'texto' }),
        text(
          undefined,
          'quais apps podem "morrer"',
          { h: 130 },
          { font: SCRIPT, size: 108, weight: 500, lineHeight: 1, color: 'texto' },
        ),
        card(
          'corpo',
          'ele responde uma pergunta: "dá pra recriar o app com IA em um fim de semana?"',
          { y: 700, h: 190 },
          {
            fill: 'rgba(255,255,255,0.07)',
            stroke: { color: 'rgba(255,255,255,0.14)', width: 2 },
            textColor: 'texto',
            fontSize: 30,
            lineHeight: 1.45,
            padding: 30,
            radius: 20,
          },
        ),
      ],
      22,
    ),
    drag('#F3E3D3'),
  ])

interface Row {
  n: string
  app: string
  cat: string
  price: string
  verdict: string
  fill: string
  votes: string
}

const ROWS: Row[] = [
  {
    n: '01',
    app: '???',
    cat: 'MEETING NOTES',
    price: '$14/mo',
    verdict: 'YES',
    fill: '#2FA36B',
    votes: '298',
  },
  {
    n: '02',
    app: 'Wispr Flow',
    cat: 'DICTATION',
    price: '$15/mo',
    verdict: 'YES',
    fill: '#2FA36B',
    votes: '188',
  },
  {
    n: '03',
    app: 'SuperX',
    cat: 'SOCIAL MEDIA',
    price: '$49/mo',
    verdict: 'KINDA',
    fill: '#FF8A3C',
    votes: '128',
  },
  {
    n: '04',
    app: 'Linktree Pro',
    cat: 'LINK IN BIO',
    price: '$15/mo',
    verdict: 'YES',
    fill: '#2FA36B',
    votes: '88',
  },
]

const CELL = { size: 24, weight: 600, color: PAPER } as const
const CELL_MUTED = { size: 20, weight: 500, color: MUTED_DARK } as const

/** Chip de veredit (pílula colorida com texto). */
const chip = (x: number, y: number, label: string, fill: string): LeafElement[] => [
  rect({ x, y, w: 150, h: 44 }, fill, 22),
  text(
    undefined,
    label,
    { x, y: y + 8, w: 150, h: 30 },
    {
      size: 20,
      weight: 800,
      uppercase: true,
      letterSpacing: 0.04,
      align: 'center',
      color: '#FFFFFF',
    },
  ),
]

/** Slide claro com a tabela dark (estilo screenshot de produto). */
const tabela = () => {
  const cy = 560
  const els: SlideElement[] = [
    ...dots('rgba(26,18,12,0.09)', 24),
    ...top('meta'),
    stack(
      { x: M, y: 150, w: INNER, h: 340 },
      'top',
      [
        text('titulo', 'os primeiros', { h: 100 }, { ...HEAD, size: 88, color: INK }),
        text(
          undefined,
          'do ranking...',
          { h: 130 },
          { font: SCRIPT, size: 108, weight: 500, lineHeight: 1, color: INK },
        ),
        text(
          'subtitulo',
          'Veredito de cada app: dá pra recriar com IA em um fim de semana?',
          { h: 90 },
          { size: 30, lineHeight: 1.4, color: MUTED_LIGHT },
        ),
      ],
      16,
    ),
    rect({ x: M, y: cy, w: INNER, h: 620 }, '#161210', 24),
    text(
      undefined,
      'THE DEATH LIST',
      { x: M + 32, y: cy + 26, w: 400, h: 34 },
      { font: SANS, size: 24, weight: 800, uppercase: true, letterSpacing: 0.02, color: PAPER },
    ),
    text(
      undefined,
      'sort: votes',
      { x: M + INNER - 260, y: cy + 28, w: 228, h: 30 },
      { size: 20, weight: 500, align: 'right', color: MUTED_DARK },
    ),
    text(
      'rotulo',
      'APP',
      { x: M + 32, y: cy + 84, w: 260, h: 26 },
      { ...CELL_MUTED, size: 18, weight: 700, uppercase: true, letterSpacing: 0.08 },
    ),
    text(
      'rotulo',
      'CATEGORY',
      { x: M + 330, y: cy + 84, w: 220, h: 26 },
      { ...CELL_MUTED, size: 18, weight: 700, uppercase: true, letterSpacing: 0.08 },
    ),
    text(
      'rotulo',
      'PRICE',
      { x: M + 570, y: cy + 84, w: 130, h: 26 },
      { ...CELL_MUTED, size: 18, weight: 700, uppercase: true, letterSpacing: 0.08 },
    ),
    text(
      'rotulo',
      'VERDICT',
      { x: M + 710, y: cy + 84, w: 150, h: 26 },
      { ...CELL_MUTED, size: 18, weight: 700, uppercase: true, letterSpacing: 0.08 },
    ),
  ]
  ROWS.forEach((r, i) => {
    const y = cy + 140 + i * 112
    els.push(
      text(
        undefined,
        r.n,
        { x: M + 32, y: y + 6, w: 60, h: 40 },
        { ...CELL, weight: 700, color: MUTED_DARK },
      ),
      text(
        'corpo',
        r.app,
        { x: M + 100, y: y + 4, w: 220, h: 44 },
        { ...CELL, size: 26, weight: 700 },
      ),
      text(undefined, r.cat, { x: M + 330, y: y + 10, w: 230, h: 32 }, CELL_MUTED),
      text(undefined, r.price, { x: M + 570, y: y + 10, w: 130, h: 32 }, CELL_MUTED),
      ...chip(M + 710, y, r.verdict, r.fill),
      text(
        undefined,
        r.votes,
        { x: M + INNER - 110, y: y + 10, w: 80, h: 32 },
        { ...CELL, size: 22, align: 'right' },
      ),
    )
    if (i < ROWS.length - 1)
      els.push(rect({ x: M + 32, y: y + 92, w: INNER - 64, h: 2 }, 'rgba(245,239,230,0.12)', 0))
  })
  return slide('Tabela', BEIGE, els)
}

/** Slide escuro: o veredito em três níveis numerados. */
const veredito = () =>
  slide('Veredito', BROWN, [
    ...dots('rgba(255,255,255,0.05)'),
    gradient({ color: ORANGE, from: 0.78, to: 1, opacity: 0.5, direction: 'down' }),
    ...top('hook'),
    stack(
      { x: M, y: 170, w: INNER, h: 300 },
      'top',
      [
        text('titulo', 'o veredito vem', { h: 100 }, { ...HEAD, size: 88, color: 'texto' }),
        text(
          undefined,
          'em três níveis',
          { h: 130 },
          { font: SCRIPT, size: 108, weight: 500, lineHeight: 1, color: 'texto' },
        ),
      ],
      14,
    ),
    ...(
      [
        { n: '1', t: 'sim', d: 'dá pra recriar com IA' },
        { n: '2', t: 'quase', d: 'um fim de semana, mas com dificuldades' },
        { n: '3', t: 'não dá', d: 'o app tem uma infra difícil de copiar' },
      ] as const
    ).flatMap((it, i) => {
      const y = 560 + i * 190
      return [
        text(undefined, it.n, { x: M, y, w: 70, h: 80 }, { ...HEAD, size: 64, color: ORANGE }),
        text('corpo', it.t, { x: M + 90, y, w: 300, h: 70 }, { ...HEAD, size: 56, color: 'texto' }),
        text(
          undefined,
          it.d,
          { x: M + 90, y: y + 78, w: INNER - 90, h: 70 },
          { size: 30, lineHeight: 1.3, color: MUTED_DARK },
        ),
      ]
    }),
    text(
      'subtitulo',
      'São mais de mil apps na lista. Até o Claude tá lá, como "não dá".',
      { x: M, y: 1160, w: INNER, h: 80 },
      { size: 28, lineHeight: 1.4, color: MUTED_DARK },
    ),
    drag('#F3E3D3'),
  ])

/** Slide escuro com cartão de prompt em monospace. */
const prompt = () =>
  slide('Prompt', BROWN, [
    ...dots('rgba(255,255,255,0.05)'),
    ...top('hook'),
    stack(
      { x: M, y: 180, w: INNER, h: 340 },
      'top',
      [
        text('titulo', 'o mais bizarro:', { h: 100 }, { ...HEAD, size: 88, color: 'texto' }),
        text(
          undefined,
          'o prompt já vem pronto',
          { h: 130 },
          { font: SCRIPT, size: 104, weight: 500, lineHeight: 1, color: AMBER },
        ),
        text(
          'corpo',
          'Cada app da lista vem com o prompt pra construir a sua versão. É copiar, colar no Claude Code e deixar a IA montar.',
          { h: 120 },
          { size: 30, lineHeight: 1.4, color: MUTED_DARK },
        ),
      ],
      18,
    ),
    card(
      undefined,
      `Build me a system-wide AI dictation tool like Wispr Flow for macOS.\n\n- Background app with a global hotkey (hold-to-talk)\n- On release: transcribe and paste at the cursor\n- Transcribe locally with whisper.cpp, or Groq/OpenAI API\n- LLM cleanup pass: filler words, punctuation, casing\n- Tiny floating pill while recording + menu bar toggle`,
      { y: 620, h: 560 },
      {
        fill: '#141110',
        stroke: { color: 'rgba(255,255,255,0.1)', width: 2 },
        textColor: '#C9C2B8',
        fontSize: 22,
        lineHeight: 1.55,
        padding: 30,
        radius: 16,
      },
    ),
    drag('#F3E3D3'),
  ])

/** CTA com brilho de fogo na base. */
const ctaSlide = () =>
  slide('CTA', '#120803', [
    ...dots('rgba(255,255,255,0.04)'),
    gradient({
      color: '#FF7A1F',
      direction: 'radial',
      cx: 50,
      cy: 104,
      from: 0,
      to: 0.62,
      opacity: 0.9,
    }),
    gradient({
      color: AMBER,
      direction: 'radial',
      cx: 50,
      cy: 100,
      from: 0,
      to: 0.3,
      opacity: 0.6,
    }),
    ...top('hook'),
    stack(
      { x: M, y: 320, w: INNER, h: 700 },
      'center',
      [
        text(
          'titulo',
          'é 100%',
          { h: 170 },
          { ...HEAD, size: 150, align: 'center', color: 'hook' },
        ),
        text(
          undefined,
          'de graça',
          { h: 150 },
          { font: SCRIPT, size: 128, weight: 500, lineHeight: 1, align: 'center', color: 'hook' },
        ),
        text(
          'subtitulo',
          'pra você ver a lista dos apps\ne copiar os prompts.',
          { h: 110 },
          { size: 34, lineHeight: 1.4, align: 'center', color: '#F3E3D3' },
        ),
        cta('Comentar "01"', { align: 'center', textColor: '#1A0E05' }),
      ],
      22,
    ),
  ])

export const listaDaMorte: Template = {
  id: 'lista-da-morte',
  name: 'Lista da Morte',
  description:
    'Ranking estilo "lista da morte": capa com gradiente quente e linha script, tabela dark com chips de veredito, níveis numerados e CTA com brilho de fogo.',
  funnel: 'meio',
  mode: 'escuro',
  fonts: { titulo: SANS, corpo: 'Inter' },
  colors: { fundo: BROWN, texto: PAPER, destaque: ORANGE, apoio: AMBER },
  highlight: { mode: 'cor', color: 'destaque' },
  slides: [capa(), contexto(), tabela(), veredito(), prompt(), ctaSlide()],
}
