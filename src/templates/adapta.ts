/**
 * Família "Adapta" (4:5): capa com título condensado sobre foto, logo da marca no topo,
 * slides claros e escuros alternados, cartões com ícone, verde de destaque e rodapé com
 * perfil + "arraste pro lado".
 */
import type { CardElement, ColorRef, LeafElement, Slide, Template, TextStyle } from '../types'
import { card, fullImage, gradient, img, logo, profile, rect, slide, stack, text } from './builders'

const M = 64
const IW = 1080 - M * 2
const COND = 'Barlow Condensed'

type Tone = 'claro' | 'escuro'
const bg = (t: Tone): ColorRef => (t === 'claro' ? 'texto' : 'fundo')
const fg = (t: Tone): ColorRef => (t === 'claro' ? 'fundo' : 'texto')
const muted = (t: Tone) => (t === 'claro' ? '#5B5B5B' : '#A3A3A3')
const softFill = (t: Tone) => (t === 'claro' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)')
const softStroke = (t: Tone) =>
  t === 'claro' ? undefined : { color: 'rgba(255,255,255,0.10)', width: 2 }

const BASE = {
  mode: 'escuro' as const,
  format: '4:5' as const,
  fonts: { titulo: 'Inter Tight', corpo: 'Inter Tight' },
  colors: { fundo: '#EFEFEF', texto: '#111111', destaque: '#2FA36B', apoio: '#FF5A1F' },
  highlight: { mode: 'cor' as const, color: 'destaque' },
}

const T = (p: Partial<TextStyle> = {}): Partial<TextStyle> => ({
  font: 'titulo',
  weight: 700,
  lineHeight: 1.04,
  letterSpacing: -0.03,
  ...p,
})
const kicker = (
  t: string,
  y: number,
  align: TextStyle['align'] = 'left',
  color: ColorRef = 'destaque',
) =>
  text(
    'rotulo',
    t,
    { x: M, y, w: IW, h: 30 },
    { size: 22, weight: 600, uppercase: true, letterSpacing: 0.2, align, color },
  )

/** Pontinhos de textura no fundo escuro. */
const dots = () => ({
  ...rect({ x: 0, y: 0, w: 1080, h: 1350 }, 'transparent'),
  fullBleed: true,
  pattern: { kind: 'pontos' as const, color: 'rgba(255,255,255,0.07)', size: 30 },
})

/** Marca d'água gigante atrás do conteúdo. */
const watermark = (word: string, tone: Tone, y = 140) =>
  text(
    undefined,
    word,
    { x: -60, y, w: 1200, h: 420 },
    { font: COND, size: 400, weight: 800, uppercase: true, lineHeight: 0.9, color: fg(tone) },
    { opacity: 0.045 },
  )

function footer(tone: Tone, right = 'Arraste pro lado →'): LeafElement[] {
  const color = tone === 'claro' ? 'fundo' : 'texto'
  return [
    profile({
      x: M,
      y: 1260,
      w: 480,
      h: 58,
      avatarSize: 46,
      fontSize: 22,
      showName: true,
      showHandle: true,
      color,
    }),
    text(
      undefined,
      right,
      { x: 560, y: 1278, w: 456, h: 28 },
      { size: 18, weight: 600, uppercase: true, letterSpacing: 0.04, align: 'right', color },
      { opacity: 0.55 },
    ),
  ]
}

const darkCard = (
  role: CardElement['role'],
  content: string,
  box: { x?: number; y: number; w?: number; h: number },
  tone: Tone,
  p: Partial<CardElement> = {},
) =>
  card(role, content, box, {
    fill: softFill(tone),
    stroke: softStroke(tone),
    textColor: fg(tone),
    iconColor: 'destaque',
    fontSize: 24,
    padding: 22,
    radius: 18,
    ...p,
  })

const glass = (
  content: string,
  box: { x: number; y: number; w: number; h: number },
  p: Partial<CardElement> = {},
) =>
  card('corpo', content, box, {
    glass: true,
    fill: 'rgba(24,24,24,0.55)',
    stroke: { color: 'rgba(255,255,255,0.18)', width: 1.5 },
    textColor: 'hook',
    iconColor: 'hook',
    fontSize: 23,
    padding: 18,
    radius: 18,
    ...p,
  })

function cover(o: {
  hook: string
  sub?: string
  subStyle: 'condensado' | 'normal'
  align: 'left' | 'center'
  logoAlign?: 'left' | 'center'
}): Slide {
  return slide('Capa', 'fundo', [
    fullImage(1),
    gradient({ from: 0.35, to: 0.88, opacity: 0.95 }),
    ...(o.logoAlign ? [logo(44, { align: o.logoAlign, color: 'hook' })] : []),
    stack(
      { x: M, y: 620, w: IW, h: 600 },
      'bottom',
      [
        text(
          'hook',
          o.hook,
          { h: 320 },
          {
            font: COND,
            size: 124,
            weight: 700,
            lineHeight: 0.92,
            letterSpacing: -0.005,
            uppercase: true,
            align: o.align,
            color: 'hook',
          },
        ),
        ...(o.sub
          ? [
              text(
                'subhook',
                o.sub,
                { h: 100 },
                o.subStyle === 'condensado'
                  ? {
                      font: COND,
                      size: 44,
                      weight: 600,
                      uppercase: true,
                      lineHeight: 1.05,
                      align: o.align,
                      color: '#B9B9B9',
                    }
                  : { size: 32, lineHeight: 1.3, align: o.align, color: 'hook' },
              ),
            ]
          : []),
      ],
      20,
    ),
    ...footer('escuro'),
  ])
}

// ---------------------------------------------------------------------------
// 1. Raio-X de Perfil
// ---------------------------------------------------------------------------

export const adaptaRaioX: Template = {
  id: 'adapta-raio-x',
  name: 'Raio-X de Perfil',
  description:
    'Análise de um perfil ou negócio em hábitos numerados: capa forte, números em destaque, checklists e chamada para comentar.',
  funnel: 'topo',
  ...BASE,
  slides: [
    cover({ hook: 'Esse empresário foi desmascarado?', subStyle: 'normal', align: 'left' }),
    slide('Números', 'texto', [
      img(2, { x: 0, y: 0, w: 1080, h: 640 }),
      { ...gradient({ from: 0.35, to: 1, opacity: 0.55 }), fullBleed: false, h: 640 },
      logo(44, { color: 'hook' }),
      glass(
        'Mais de **15 mil** conteúdos publicados',
        { x: M, y: 180, w: 440, h: 86 },
        { icon: 'imagem' },
      ),
      glass(
        'Um negócio **milionário** atrás do outro',
        { x: M, y: 286, w: 440, h: 86 },
        { icon: 'camera' },
      ),
      glass(
        '**5 bilhões** de visualizações por mês',
        { x: M, y: 392, w: 440, h: 86 },
        { icon: 'olho' },
      ),
      text(
        'titulo',
        'Tudo isso enquanto ainda mantém uma rotina de atleta.',
        { x: M, y: 690, w: IW, h: 240 },
        T({ size: 70, color: 'fundo' }),
      ),
      text(
        'subtitulo',
        'A conta não fecha para quem tem 24 horas no dia. Fomos investigar e descobrimos uma estratégia que ==você também pode replicar==…',
        { x: M, y: 980, w: IW, h: 160 },
        {
          size: 28,
          lineHeight: 1.32,
          color: muted('claro'),
          highlightMode: 'sublinhado',
          highlight: 'fundo',
        },
      ),
      ...footer('claro'),
    ]),
    slide('Hábito 1', 'fundo', [
      dots(),
      logo(44),
      text(
        'corpo',
        'Esse **segredo se chama IA**. E o primeiro uso é o menos óbvio:',
        { x: M, y: 150, w: 500, h: 90 },
        { size: 30, lineHeight: 1.25 },
      ),
      text('titulo', '1. Faça menos', { x: M, y: 250, w: 520, h: 100 }, T({ size: 80 })),
      text(
        'subtitulo',
        'A maioria usa IA para fazer mais coisas. Ele usa para fazer menos.',
        { x: M, y: 360, w: 500, h: 80 },
        { size: 26, lineHeight: 1.3, color: muted('escuro') },
      ),
      darkCard(
        'corpo',
        'Assistente que diz em 2 minutos se vale a pena analisar as propostas que recebe',
        { y: 466, w: 500, h: 108 },
        'escuro',
        { icon: 'check', iconColor: 'texto', fontSize: 22 },
      ),
      darkCard(
        'corpo',
        'Pesquisa de mercado e análise de concorrência feitas em apenas 1 hora',
        { y: 594, w: 500, h: 108 },
        'escuro',
        { icon: 'check', iconColor: 'texto', fontSize: 22 },
      ),
      darkCard(
        'corpo',
        'Apresentações e palestras refinadas em 20 minutos',
        { y: 722, w: 500, h: 108 },
        'escuro',
        { icon: 'check', iconColor: 'texto', fontSize: 22 },
      ),
      text(
        'corpo',
        'Mas esse filtro só funciona porque a IA conhece os critérios dele. E isso leva ao **segundo hábito…**',
        { x: M, y: 870, w: 500, h: 130 },
        { size: 26, lineHeight: 1.3 },
      ),
      img(3, { x: 600, y: 150, w: 416, h: 840 }, { radius: 24 }),
      ...footer('escuro'),
    ]),
    slide('Hábito 2', 'texto', [
      watermark('Segredo', 'claro'),
      logo(44, { color: 'fundo' }),
      text(
        'titulo',
        '2. Time secreto',
        { x: M, y: 140, w: IW, h: 100 },
        T({ size: 84, align: 'center', color: 'fundo' }),
      ),
      text(
        'subtitulo',
        'Uma IA genérica dá uma resposta genérica. Por isso ele não “pergunta para o chat”: tem um time de agentes especialistas, cada um alimentado com o contexto do próprio negócio:',
        { x: 96, y: 260, w: 888, h: 170 },
        { size: 28, lineHeight: 1.3, align: 'center', color: '#4A4A4A' },
      ),
      rect({ x: M, y: 470, w: IW, h: 560 }, 'rgba(0,0,0,0.05)', 28),
      ...[
        'Um **estrategista** que conhece o histórico do perfil e propõe vídeos virais',
        'Um **jurídico** que revisa contratos e aponta cláusulas de risco',
        'Um **pesquisador** que lê artigos antes de qualquer vídeo técnico',
        'O **concorrente** pode usar a mesma ferramenta. Mas não consegue copiar o contexto.',
      ].map((t, i) =>
        card(
          'corpo',
          t,
          { x: 96, y: 500 + i * 125, w: 888, h: 104 },
          {
            badge: String(i + 1),
            fill: 'rgba(255,255,255,0.8)',
            textColor: 'fundo',
            iconColor: 'fundo',
            fontSize: 24,
            padding: 20,
            radius: 16,
          },
        ),
      ),
      text(
        'corpo',
        'E é esse contexto que sustenta o terceiro hábito, o mais difícil de imitar…',
        { x: 96, y: 1080, w: 888, h: 100 },
        { size: 30, weight: 600, lineHeight: 1.25, align: 'center', color: 'fundo' },
      ),
      ...footer('claro'),
    ]),
    slide('Hábito 3', 'fundo', [
      dots(),
      watermark('Economia', 'escuro', 160),
      logo(44),
      text(
        'titulo',
        '3. Onde não economizar',
        { x: M, y: 130, w: IW, h: 100 },
        T({ size: 76, align: 'center' }),
      ),
      text(
        'subtitulo',
        'Ele descobriu que a maior alavanca do negócio não é a fábrica nem os patrocínios. **É ==conteúdo==.**',
        { x: 96, y: 250, w: 888, h: 100 },
        {
          size: 27,
          lineHeight: 1.3,
          align: 'center',
          color: muted('escuro'),
          highlightMode: 'sublinhado',
          highlight: 'texto',
        },
      ),
      text(
        'corpo',
        'Por isso, todo o tempo que a IA libera vai para lá, e ela também faz boa parte do trabalho pesado.',
        { x: 96, y: 360, w: 888, h: 80 },
        { size: 27, lineHeight: 1.3, align: 'center', color: muted('escuro') },
      ),
      img(4, { x: M, y: 470, w: IW, h: 520 }, { radius: 24 }),
      glass(
        'Encontra em minutos os padrões dos vídeos que já funcionaram',
        { x: 90, y: 500, w: 300, h: 110 },
        { align: 'center', fontSize: 21 },
      ),
      glass(
        'Traz tendências antes de elas chegarem ao Brasil',
        { x: 690, y: 500, w: 300, h: 110 },
        { align: 'center', fontSize: 21 },
      ),
      glass(
        'Transforma uma ideia em vários roteiros prontos para gravar',
        { x: 330, y: 860, w: 420, h: 100 },
        { align: 'center', fontSize: 21 },
      ),
      text(
        'corpo',
        'Ou seja, ele não usa IA para substituir o que só ele faz, e sim para multiplicar.',
        { x: 96, y: 1050, w: 888, h: 110 },
        { size: 34, lineHeight: 1.25, align: 'center' },
      ),
      ...footer('escuro'),
    ]),
    slide('Chamada', 'texto', [
      logo(44, { color: 'fundo' }),
      img(5, { x: M, y: 110, w: IW, h: 420 }, { radius: 24 }),
      text(
        'titulo',
        'O dia dele não tem mais horas que o seu. Ele só montou um time que você ainda não tem.',
        { x: M, y: 570, w: IW, h: 250 },
        T({ size: 58, color: 'fundo' }),
      ),
      text(
        'subtitulo',
        'Não à toa, virou referência no uso de IA para negócios.',
        { x: M, y: 840, w: IW, h: 70 },
        { size: 26, lineHeight: 1.3, color: muted('claro') },
      ),
      rect({ x: M, y: 930, w: IW, h: 300 }, 'rgba(0,0,0,0.05)', 24),
      text(
        'corpo',
        'E se você quer acesso às mesmas ferramentas de IA para crescer seu negócio e gerar ainda mais resultado:',
        { x: 96, y: 960, w: 888, h: 110 },
        { size: 28, weight: 600, lineHeight: 1.25, color: 'fundo' },
      ),
      card(
        'cta',
        'Comenta “==QUERO==” que te enviamos uma aula gratuita sobre como implementar na sua empresa.',
        { x: 96, y: 1090, w: 888, h: 110 },
        { fill: '#FFFFFF', textColor: 'fundo', fontSize: 24, padding: 24, radius: 18 },
      ),
      ...footer('claro', 'Salve o post'),
    ]),
  ],
}

// ---------------------------------------------------------------------------
// 2. Comparativo de IAs
// ---------------------------------------------------------------------------

function infoCard(
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  title: string,
  body: string,
  tone: Tone,
): LeafElement[] {
  return [
    { ...rect({ x, y, w, h }, softFill(tone), 20), stroke: softStroke(tone) },
    text(
      'rotulo',
      label,
      { x: x + 24, y: y + 24, w: w - 48, h: 28 },
      { size: 18, weight: 600, uppercase: true, letterSpacing: 0.12, color: muted(tone) },
    ),
    text(
      'subtitulo',
      title,
      { x: x + 24, y: y + 62, w: w - 48, h: 90 },
      T({ size: 30, lineHeight: 1.12, letterSpacing: -0.02, color: fg(tone) }),
    ),
    text(
      'corpo',
      body,
      { x: x + 24, y: y + 160, w: w - 48, h: h - 180 },
      { size: 21, lineHeight: 1.3, color: muted(tone) },
    ),
  ]
}

function statRow(
  x: number,
  y: number,
  w: number,
  slot: number,
  name: string,
  value: string,
  pct: number,
  tone: Tone,
): LeafElement[] {
  return [
    img(slot, { x, y, w: 72, h: 72 }, { radius: 36 }),
    text(
      'rotulo',
      name,
      { x: x + 92, y: y - 2, w: w - 92, h: 28 },
      { size: 22, color: muted(tone) },
    ),
    text(
      'titulo',
      value,
      { x: x + 92, y: y + 26, w: w - 92, h: 60 },
      T({ size: 48, color: fg(tone) }),
    ),
    rect(
      { x: x + 92, y: y + 96, w: w - 92, h: 8 },
      tone === 'claro' ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)',
      4,
    ),
    rect({ x: x + 92, y: y + 96, w: Math.round((w - 92) * pct), h: 8 }, fg(tone), 4),
  ]
}

const chatFill = (t: Tone) => (t === 'claro' ? '#FFFFFF' : '#1C1C1C')
const bubble = (t: Tone) => (t === 'claro' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)')

/** Layout A: conversa à esquerda, análise à direita. */
function compareA(tone: Tone, model: string): Slide {
  return slide(`Comparativo ${model}`, bg(tone), [
    ...(tone === 'escuro' ? [dots()] : []),
    logo(44, { color: fg(tone) }),
    { ...rect({ x: M, y: 120, w: 470, h: 1090 }, chatFill(tone), 28), stroke: softStroke(tone) },
    text(
      undefined,
      `${model} ⌄`,
      { x: 96, y: 150, w: 300, h: 36 },
      { size: 24, weight: 600, color: fg(tone) },
    ),
    card(
      undefined,
      'Quem vai ganhar o campeonato?',
      { x: 260, y: 205, w: 240, h: 90 },
      { fill: bubble(tone), textColor: fg(tone), fontSize: 21, padding: 16, radius: 20 },
    ),
    ...statRow(96, 340, 400, 2, 'Time A', '49% a 53%', 0.62, tone),
    ...statRow(96, 480, 400, 3, 'Time B', '47% a 51%', 0.45, tone),
    text(
      'rotulo',
      'Mais chances de vencer:',
      { x: 96, y: 650, w: 400, h: 28 },
      { size: 19, weight: 600, uppercase: true, letterSpacing: 0.12, color: muted(tone) },
    ),
    text(
      'subtitulo',
      'Time A, com probabilidade estimada de 55%.',
      { x: 96, y: 690, w: 400, h: 200 },
      T({ size: 40, lineHeight: 1.12, color: fg(tone) }),
    ),
    text(
      'corpo',
      'É uma estimativa, não uma probabilidade calculada por um modelo estatístico.',
      { x: 96, y: 920, w: 400, h: 150 },
      { size: 22, lineHeight: 1.3, color: muted(tone) },
    ),
    img(4, { x: 560, y: 128, w: 64, h: 64 }, { radius: 16 }),
    text(
      'titulo',
      `${model}:`,
      { x: 640, y: 122, w: 376, h: 80 },
      T({ size: 60, color: fg(tone) }),
    ),
    ...infoCard(
      560,
      230,
      456,
      290,
      'Estimativa de resultado:',
      'Time A 51% | Time B 49%;',
      'Faixa indicativa entre 49% e 53%, dentro da margem de erro.',
      tone,
    ),
    ...infoCard(
      560,
      540,
      456,
      330,
      'Fator decisivo:',
      'A transferência de votos dos indecisos.',
      'As pesquisas mostram um grupo grande que ainda pode mudar de lado.',
      tone,
    ),
    ...infoCard(
      560,
      890,
      456,
      320,
      'Nível de confiança:',
      '==Baixo.==',
      'Os dados mais recentes indicam empate técnico entre os dois lados.',
      tone,
    ),
    ...footer(tone),
  ])
}

/** Layout B: conversa em cima, análise em grade 2×2 embaixo. */
function compareB(tone: Tone, model: string): Slide {
  const cardW = (IW - 20) / 2
  return slide(`Comparativo ${model}`, bg(tone), [
    ...(tone === 'escuro' ? [dots()] : []),
    logo(44, { color: fg(tone) }),
    { ...rect({ x: M, y: 110, w: IW, h: 420 }, chatFill(tone), 28), stroke: softStroke(tone) },
    text(
      undefined,
      `${model} ⌄`,
      { x: 96, y: 140, w: 400, h: 36 },
      { size: 24, weight: 600, color: fg(tone) },
    ),
    card(
      undefined,
      'Quem vai ganhar o campeonato?',
      { x: 620, y: 130, w: 360, h: 70 },
      {
        fill: bubble(tone),
        textColor: fg(tone),
        fontSize: 21,
        padding: 16,
        radius: 20,
        align: 'center',
      },
    ),
    ...statRow(96, 240, 880, 2, 'Time A', '50,0% – 52,0%', 0.55, tone),
    ...statRow(96, 380, 880, 3, 'Time B', '48,0% – 50,0%', 0.45, tone),
    img(4, { x: M, y: 566, w: 64, h: 64 }, { radius: 16 }),
    text(
      'titulo',
      `${model}:`,
      { x: 144, y: 558, w: 872, h: 80 },
      T({ size: 64, color: fg(tone) }),
    ),
    ...infoCard(
      M,
      670,
      cardW,
      270,
      'Mais chances de vencer:',
      'Empate técnico, com leve vantagem do Time A.',
      'Probabilidade estimada de 54%.',
      tone,
    ),
    ...infoCard(
      M + cardW + 20,
      670,
      cardW,
      270,
      'Estimativa de resultado:',
      'Time A 50–52% | Time B 48–50%',
      'Faixa calculada a partir das últimas pesquisas.',
      tone,
    ),
    ...infoCard(
      M,
      960,
      cardW,
      270,
      'Fator decisivo:',
      'Quem conquistar os indecisos.',
      'Uma fatia relevante ainda não decidiu.',
      tone,
    ),
    ...infoCard(
      M + cardW + 20,
      960,
      cardW,
      270,
      'Nível de confiança:',
      '==Médio.==',
      'A vantagem está dentro da margem de erro.',
      tone,
    ),
    ...footer(tone),
  ])
}

export const adaptaComparativo: Template = {
  id: 'adapta-comparativo',
  name: 'Comparativo de IAs',
  description:
    'Mesma pergunta para várias IAs: um slide por modelo com a conversa e a análise, aviso, conclusão e oferta.',
  funnel: 'topo',
  ...BASE,
  slides: [
    cover({
      hook: 'Quem vai ganhar o campeonato?',
      sub: 'Perguntamos aos 4 maiores modelos de IA e esse foi o resultado…',
      subStyle: 'condensado',
      align: 'center',
      logoAlign: 'center',
    }),
    compareA('claro', 'Modelo A'),
    compareB('escuro', 'Modelo B'),
    compareA('escuro', 'Modelo C'),
    compareB('claro', 'Modelo D'),
    slide('Aviso', 'fundo', [
      dots(),
      logo(44),
      img(5, { x: M, y: 120, w: IW, h: 420 }, { radius: 24 }),
      kicker('Aviso importante:', 590, 'left', '#A3A3A3'),
      text(
        'titulo',
        'A análise é imparcial e o prompt usado está na descrição, para você também testar.',
        { x: M, y: 630, w: IW, h: 240 },
        T({ size: 54, lineHeight: 1.08 }),
      ),
      text(
        'subtitulo',
        'As IAs **estão sujeitas a erro**, e o resultado é uma estimativa dos próprios modelos, feita a partir de dados de fontes verificadas.',
        { x: M, y: 900, w: IW, h: 130 },
        { size: 26, lineHeight: 1.32, color: muted('escuro') },
      ),
      text(
        'corpo',
        '**Mas o mais interessante é que…**',
        { x: M, y: 1060, w: IW, h: 50 },
        { size: 28, lineHeight: 1.3 },
      ),
      ...footer('escuro'),
    ]),
    slide('Conclusão', 'texto', [
      logo(44, { color: 'fundo' }),
      img(6, { x: M, y: 110, w: 466, h: 310 }, { radius: 20 }),
      img(7, { x: 550, y: 110, w: 466, h: 310 }, { radius: 20 }),
      text(
        'titulo',
        'Pagar por uma análise desse nível poucos anos atrás seria completamente inviável.',
        { x: M, y: 460, w: IW, h: 230 },
        T({ size: 60, color: 'fundo' }),
      ),
      text(
        'subtitulo',
        'Hoje, **com um prompt**, você consegue uma curadoria de dados complexos com projeções **atualizadas em segundos**.',
        { x: M, y: 710, w: IW, h: 110 },
        { size: 26, lineHeight: 1.32, color: muted('claro') },
      ),
      text(
        'corpo',
        'E dá para fazer o mesmo **com os números da sua empresa**: fluxo de caixa, projeção de receita, custos desnecessários.',
        { x: M, y: 830, w: IW, h: 110 },
        { size: 26, lineHeight: 1.32, color: muted('claro') },
      ),
      card(
        'cta',
        'Quer aplicar isso com os **melhores especialistas** em **IA para negócios**?',
        { x: M, y: 990, w: IW, h: 150 },
        {
          fill: 'linear-gradient(90deg, #1A0A08 0%, #5A1208 50%, #1A0A08 100%)',
          textColor: '#FFFFFF',
          fontSize: 28,
          lineHeight: 1.3,
          align: 'center',
          radius: 20,
          padding: 28,
        },
      ),
      ...footer('claro'),
    ]),
    slide('Oferta', 'fundo', [
      {
        ...gradient({
          color: 'apoio',
          direction: 'radial',
          cx: 50,
          cy: -5,
          from: 0,
          to: 0.62,
          opacity: 0.85,
        }),
      },
      {
        ...gradient({
          color: 'apoio',
          direction: 'radial',
          cx: 100,
          cy: 105,
          from: 0,
          to: 0.45,
          opacity: 0.6,
        }),
      },
      img(8, { x: 430, y: 150, w: 220, h: 160 }, { fit: 'contain' }),
      text(
        'titulo',
        'Inscreva-se no ==Evento Especial== da sua marca',
        { x: M, y: 350, w: IW, h: 240 },
        T({ size: 70, align: 'center', highlightMode: 'gradiente', highlight: '#FFC46B' }),
      ),
      text(
        'subtitulo',
        'Sem desconto, mais exclusivo e para poucos. Um **produto novo**, feito com quem está na fronteira da IA.',
        { x: 96, y: 610, w: 888, h: 150 },
        { size: 28, lineHeight: 1.3, align: 'center', color: '#CFCFCF' },
      ),
      {
        ...rect({ x: 120, y: 790, w: 840, h: 300 }, 'rgba(255,255,255,0.06)', 24),
        stroke: { color: 'rgba(255,255,255,0.15)', width: 1.5 },
      },
      text(
        'corpo',
        'Para garantir uma das poucas vagas disponíveis',
        { x: 160, y: 830, w: 760, h: 100 },
        { size: 34, weight: 600, lineHeight: 1.2, align: 'center' },
      ),
      card(
        'cta',
        '**Clique no link da bio**',
        { x: 220, y: 960, w: 640, h: 90 },
        {
          fill: 'rgba(0,0,0,0.35)',
          stroke: { color: 'rgba(255,255,255,0.18)', width: 1.5 },
          textColor: '#FFC46B',
          fontSize: 30,
          weight: 600,
          align: 'center',
          radius: 16,
        },
      ),
      ...footer('escuro', 'Salve o post'),
    ]),
  ],
}

// ---------------------------------------------------------------------------
// 3. Notícia Explicada
// ---------------------------------------------------------------------------

const topbar = (tone: Tone): LeafElement[] => [
  text(
    undefined,
    'Created with Sua Marca',
    { x: M, y: 46, w: 520, h: 24 },
    { size: 16, weight: 600, uppercase: true, letterSpacing: 0.05, color: fg(tone) },
    { opacity: 0.7 },
  ),
  logo(40, { align: 'right', color: fg(tone), fontSize: 22 }),
]

function featureSlide(
  name: string,
  k: string,
  title: string,
  intro: string,
  items: [CardElement['icon'], string][],
  outro: string,
  close: string,
): Slide {
  return slide(name, 'texto', [
    ...topbar('claro'),
    kicker(k, 120),
    text('titulo', title, { x: M, y: 160, w: IW, h: 230 }, T({ size: 64, color: 'fundo' })),
    text(
      'subtitulo',
      intro,
      { x: M, y: 410, w: IW, h: 90 },
      { size: 26, lineHeight: 1.32, color: muted('claro') },
    ),
    ...items.map(([icon, t], i) =>
      darkCard('corpo', t, { y: 520 + i * 118, h: 100 }, 'claro', { icon, fontSize: 24 }),
    ),
    text(
      'corpo',
      outro,
      { x: M, y: 890, w: IW, h: 100 },
      { size: 26, lineHeight: 1.32, color: muted('claro') },
    ),
    text(
      'corpo',
      close,
      { x: M, y: 1010, w: IW, h: 90 },
      { size: 30, weight: 600, lineHeight: 1.25, color: 'fundo' },
    ),
    ...footer('claro'),
  ])
}

export const adaptaNoticia: Template = {
  id: 'adapta-noticia',
  name: 'Notícia Explicada',
  description:
    'Explica uma notícia em etapas: o que aconteceu, por quê, o detalhe, os dois lados e a chamada final.',
  funnel: 'topo',
  ...BASE,
  slides: [
    cover({
      hook: 'Esse produto agora vai pensar diferente em cada país',
      sub: 'A **marca** criou uma segunda IA, só para um **mercado**.',
      subStyle: 'normal',
      align: 'center',
      logoAlign: 'left',
    }),
    featureSlide(
      'Contexto',
      'O que está acontecendo',
      'A empresa treinou um modelo de IA próprio, feito sob medida para outro mercado',
      'O recurso chega ao país nos próximos meses.\n**Mas não é o mesmo que roda no resto do mundo:**',
      [
        ['robo', 'Modelo treinado para as exigências regulatórias locais'],
        ['pessoas', 'Parceria com uma empresa local de tecnologia'],
        ['chip', 'Tecnologia de outro parceiro também integra o pacote'],
      ],
      'No resto do mundo, ela usa tecnologia própria e parceiros globais. Lá, os dois são proibidos.',
      'Mas por que ela aceitou jogar esse jogo? →',
    ),
    slide('Por quê', 'texto', [
      img(2, { x: 380, y: 0, w: 700, h: 430 }),
      {
        ...gradient({ color: 'texto', from: 0.25, to: 0.95, opacity: 1 }),
        fullBleed: false,
        x: 380,
        w: 700,
        h: 430,
      },
      {
        ...gradient({ color: 'texto', direction: 'left', from: 0.45, to: 1, opacity: 1 }),
        fullBleed: false,
        x: 380,
        w: 700,
        h: 430,
      },
      ...topbar('claro'),
      kicker('Por que ela cedeu', 300),
      text(
        'titulo',
        'Sem IA, o produto encalhou no país.',
        { x: M, y: 340, w: IW, h: 190 },
        T({ size: 72, color: 'fundo' }),
      ),
      text(
        'subtitulo',
        'A ausência do recurso derrubava as vendas: o consumidor migrava para quem já vendia com assistente integrado.',
        { x: M, y: 550, w: IW, h: 100 },
        { size: 26, lineHeight: 1.32, color: muted('claro') },
      ),
      text(
        'corpo',
        'A empresa conversou com vários parceiros locais antes de fechar.',
        { x: M, y: 660, w: IW, h: 50 },
        { size: 26, lineHeight: 1.32, color: muted('claro') },
      ),
      card(
        'corpo',
        '**“Eles conversaram com várias empresas. No fim, escolheram fazer negócio conosco.”**\nNome, cargo na empresa parceira',
        { x: M, y: 740, w: IW, h: 190 },
        {
          fill: '#FFFFFF',
          textColor: 'fundo',
          fontSize: 28,
          lineHeight: 1.3,
          padding: 30,
          radius: 20,
        },
      ),
      text(
        'corpo',
        'Quando o acordo foi registrado, as ações do parceiro subiram. E um detalhe curioso apareceu no caminho.',
        { x: M, y: 970, w: IW, h: 100 },
        { size: 26, lineHeight: 1.32, color: muted('claro') },
      ),
      text(
        'corpo',
        'E é aqui que mora o detalhe que ninguém percebeu →',
        { x: M, y: 1100, w: IW, h: 50 },
        { size: 30, weight: 600, color: 'fundo' },
      ),
      ...footer('claro'),
    ]),
    slide('Detalhe', 'fundo', [
      img(3, { x: 0, y: 0, w: 1080, h: 640 }),
      { ...gradient({ color: 'fundo', from: 0.4, to: 1, opacity: 1 }), fullBleed: false, h: 640 },
      ...topbar('escuro'),
      kicker('O detalhe que muda tudo', 600),
      text(
        'titulo',
        'A empresa não levou a IA dela para lá. Treinou outra.',
        { x: M, y: 640, w: IW, h: 200 },
        T({ size: 64 }),
      ),
      text(
        'subtitulo',
        'Mesmo aparelho. Duas inteligências diferentes, cada uma obedecendo às regras do lugar onde opera.',
        { x: M, y: 860, w: IW, h: 110 },
        { size: 26, lineHeight: 1.32, color: muted('escuro') },
      ),
      text(
        'corpo',
        'A pergunta que você faz em um país pode ter outra resposta no outro, por design.',
        { x: M, y: 980, w: IW, h: 90 },
        { size: 26, lineHeight: 1.32, color: muted('escuro') },
      ),
      card(
        'corpo',
        '**A IA deixou de ser global. Agora ela tem passaporte.**',
        { x: M, y: 1100, w: IW, h: 100 },
        {
          fill: 'rgba(255,255,255,0.08)',
          textColor: 'texto',
          fontSize: 30,
          padding: 26,
          radius: 18,
        },
      ),
      ...footer('escuro'),
    ]),
    featureSlide(
      'Regras',
      'O jogo por trás',
      'O mundo está se dividindo em blocos de IA. E cada bloco decide o que a IA pode dizer.',
      'Cada região está criando as próprias regras para a IA:',
      [
        ['balanca', 'Um bloco exige marca d’água e transparência'],
        ['chat', 'Outro aprova o que os modelos podem responder antes de operar'],
        ['lupa', 'Um terceiro discute banir modelos estrangeiros'],
      ],
      'Até a empresa mais valiosa do mundo não conseguiu atravessar essa fronteira sozinha: precisou de um sócio local.',
      'Quem escreve a regra do mercado define o que a IA pode pensar nele.',
    ),
    slide('Dois lados', 'texto', [
      ...topbar('claro'),
      img(4, { x: M, y: 100, w: IW, h: 330 }, { radius: 20 }),
      kicker('Os dois lados disso', 470),
      text(
        'titulo',
        'De um lado: pragmatismo.',
        { x: M, y: 510, w: IW, h: 80 },
        T({ size: 60, color: 'fundo' }),
      ),
      text(
        'subtitulo',
        'O país é o **segundo maior mercado** da empresa: ficar de fora não era opção, e adaptar-se à lei local é o que toda empresa global sempre fez.',
        { x: M, y: 600, w: IW, h: 110 },
        { size: 26, lineHeight: 1.32, color: muted('claro') },
      ),
      card(
        'corpo',
        '**Do outro: princípio.**\nA marca que construiu reputação em cima de “privacidade” agora treina uma IA moldada pelas exigências de um Estado.',
        { x: M, y: 740, w: IW, h: 210 },
        {
          fill: '#FFFFFF',
          textColor: 'fundo',
          fontSize: 26,
          lineHeight: 1.32,
          padding: 30,
          radius: 20,
        },
      ),
      card(
        'corpo',
        'A linha entre “**respeitar a lei local**” e “**terceirizar seus valores**” é mais fina do que parece.',
        { x: M, y: 980, w: IW, h: 130 },
        {
          fill: '#FFFFFF',
          textColor: 'fundo',
          fontSize: 26,
          lineHeight: 1.32,
          padding: 30,
          radius: 20,
        },
      ),
      ...footer('claro'),
    ]),
    slide('Chamada', 'texto', [
      ...topbar('claro'),
      kicker('Não seja refém de uma IA só', 120, 'center'),
      text(
        'titulo',
        'As melhores IAs do mundo, num lugar só',
        { x: M, y: 160, w: IW, h: 240 },
        T({ size: 76, align: 'center', color: 'fundo' }),
      ),
      img(5, { x: M, y: 430, w: IW, h: 320 }, { radius: 20 }),
      rect({ x: M, y: 780, w: IW, h: 440 }, '#FFFFFF', 24),
      img(6, { x: 100, y: 820, w: 110, h: 110 }, { radius: 16 }),
      text(
        'corpo',
        '**Vários modelos de IA** numa tela só, sem pagar uma assinatura para cada.',
        { x: 240, y: 822, w: 740, h: 120 },
        { size: 30, weight: 500, lineHeight: 1.25, color: 'fundo' },
      ),
      card(
        'cta',
        '**ACESSE PELO LINK DA BIO**\nLeva menos de 2 minutos para começar.',
        { x: 100, y: 990, w: 880, h: 170 },
        {
          icon: 'link',
          fill: 'rgba(0,0,0,0.04)',
          stroke: { color: 'rgba(0,0,0,0.08)', width: 1.5 },
          textColor: 'fundo',
          iconColor: 'destaque',
          fontSize: 26,
          lineHeight: 1.35,
          padding: 28,
          radius: 18,
        },
      ),
      ...footer('claro', 'Salve o post'),
    ]),
  ],
}
