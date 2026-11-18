/**
 * Templates de guia e explicação: Guia Ilustrado (3:4), Minimal Didático (4:5) e
 * Princípios Anotados (1:1, foto com anotações à mão).
 */
import type { LeafElement, Slide, Template, TextStyle } from '../types'
import {
  card,
  counter,
  cta,
  doodle,
  fullImage,
  gradient,
  img,
  line,
  profile,
  rect,
  slide,
  stack,
  text,
} from './builders'

const M = 64
const IW = 1080 - M * 2
const HAND = 'Caveat'
const global = (
  field: 'brandName' | 'handle' | 'copyright' | 'tagline',
  box: { x: number; y: number; w: number; h: number },
  s: Partial<TextStyle>,
) => text(undefined, '', box, s, { global: field })

// ---------------------------------------------------------------------------
// 1. Guia Ilustrado (3:4 — 1080×1440, fundo branco, ilustrações e serifa)
// ---------------------------------------------------------------------------

const SANS = 'Archivo'

function guideFooter(): LeafElement[] {
  return [
    global(
      'handle',
      { x: M, y: 1366, w: 500, h: 26 },
      { font: SANS, size: 20, weight: 600, color: '#8A8A8A' },
    ),
    counter({ x: 716, y: 1366, w: 300, h: 26 }, { font: SANS, fontSize: 20, color: '#8A8A8A' }),
  ]
}

function section(n: number, title: string, body: string): Slide {
  return slide(`Seção ${n}`, 'fundo', [
    rect({ x: M, y: 64, w: IW, h: 660 }, 'apoio', 32),
    img(n, { x: M + 40, y: 104, w: IW - 80, h: 580 }, { fit: 'contain' }),
    rect({ x: M + 28, y: 92, w: 88, h: 56 }, 'texto', 14),
    text(
      undefined,
      `#${n}`,
      { x: M + 28, y: 104, w: 88, h: 34 },
      { font: SANS, size: 28, weight: 700, align: 'center', lineHeight: 1.2, color: 'fundo' },
    ),
    stack(
      { x: M, y: 780, w: IW, h: 560 },
      'top',
      [
        text(
          'titulo',
          title,
          { h: 150 },
          { font: SANS, size: 64, weight: 800, lineHeight: 1.04, letterSpacing: -0.03 },
        ),
        text('corpo', body, { h: 360 }, { size: 30, lineHeight: 1.55 }),
      ],
      28,
    ),
    ...guideFooter(),
  ])
}

export const guiaIlustrado: Template = {
  id: 'guia-ilustrado',
  name: 'Guia Ilustrado',
  description:
    'Guia passo a passo com ilustrações: capa com título serifado e anotação à mão, seções numeradas e slide de fonte.',
  funnel: 'meio',
  mode: 'claro',
  format: '3:4',
  fonts: { titulo: 'Playfair Display', corpo: 'Libre Baskerville' },
  colors: { fundo: '#FFFFFF', texto: '#111111', destaque: '#111111', apoio: '#F1F1F1' },
  highlight: { mode: 'sublinhado', color: 'texto' },
  slides: [
    slide('Capa', 'fundo', [
      text(
        'rotulo',
        'Guia prático',
        { x: M, y: 80, w: IW, h: 30 },
        {
          font: SANS,
          size: 22,
          weight: 700,
          uppercase: true,
          letterSpacing: 0.24,
          align: 'center',
        },
      ),
      img(1, { x: 190, y: 660, w: 700, h: 640 }, { fit: 'contain' }),
      stack(
        { x: M, y: 140, w: IW, h: 480 },
        'top',
        [
          text(
            'hook',
            'Como criar uma rotina que funciona',
            { h: 340 },
            {
              font: 'titulo',
              size: 118,
              weight: 800,
              lineHeight: 0.94,
              letterSpacing: -0.02,
              uppercase: true,
              align: 'center',
            },
          ),
          text(
            'subhook',
            '(mesmo quando a motivação acaba)',
            { h: 56 },
            { font: 'titulo', size: 42, italic: true, align: 'center' },
          ),
        ],
        24,
      ),
      text(
        undefined,
        'comece pequeno!',
        { x: 760, y: 650, w: 280, h: 60 },
        { font: HAND, size: 46, weight: 600, align: 'center' },
        { rotate: -8 },
      ),
      doodle(
        'seta-curva',
        { x: 790, y: 720, w: 110, h: 130 },
        { color: 'texto', strokeWidth: 3.5, flip: true },
      ),
      text(
        undefined,
        'Escrito por',
        { x: M, y: 1340, w: 400, h: 24 },
        { font: SANS, size: 18, color: '#8A8A8A' },
      ),
      global('handle', { x: M, y: 1366, w: 500, h: 30 }, { font: SANS, size: 22, weight: 700 }),
      text(
        undefined,
        'Arraste',
        { x: 716, y: 1362, w: 260, h: 30 },
        { font: SANS, size: 22, weight: 700, align: 'right' },
      ),
      rect({ x: 990, y: 1368, w: 22, h: 22 }, 'texto', 4),
    ]),
    section(
      2,
      'Defina a hora, não a meta.',
      'Uma rotina começa pelo **horário fixo**, não pela vontade.\n• Escolha um bloco de 30 minutos.\n• Proteja esse bloco como uma reunião.\n• Repita no mesmo horário por 7 dias.',
    ),
    section(
      3,
      'Reduza o atrito.',
      'Tudo o que você precisa deve estar **à vista e pronto**.\n• Deixe o material separado na véspera.\n• Remova uma distração por vez.\n• Facilite o primeiro passo.',
    ),
    section(
      4,
      'Meça o mínimo.',
      'Não acompanhe dez números. Acompanhe **um só**: se você apareceu.\n• Marque um X no calendário.\n• Não quebre a sequência duas vezes seguidas.',
    ),
    section(
      5,
      'Ajuste toda semana.',
      'A rotina boa é a que **sobrevive à vida real**.\n• Revise no domingo o que funcionou.\n• Corte o que travou.\n• Aumente só quando ficar fácil.',
    ),
    slide('Fonte', 'fundo', [
      stack(
        { x: M, y: 100, w: IW, h: 420 },
        'top',
        [
          text(
            'titulo',
            'Quer ir mais fundo?',
            { h: 200 },
            {
              font: 'titulo',
              size: 96,
              weight: 800,
              lineHeight: 1,
              letterSpacing: -0.02,
              uppercase: true,
              align: 'center',
            },
          ),
          text(
            'subtitulo',
            'Este guia foi baseado em um livro sobre hábitos e na experiência de quem já testou.',
            { h: 100 },
            { size: 30, lineHeight: 1.5, align: 'center' },
          ),
        ],
        28,
      ),
      img(6, { x: 290, y: 530, w: 500, h: 440 }, { fit: 'contain' }),
      card(
        'corpo',
        'Fonte: nome do livro ou estudo, autor e ano. Use este espaço para dar crédito à referência.',
        { x: M, y: 1010, w: IW, h: 190 },
        {
          fill: 'texto',
          textColor: 'fundo',
          fontSize: 28,
          lineHeight: 1.45,
          radius: 24,
          padding: 36,
          align: 'center',
        },
      ),
      ...guideFooter(),
    ]),
  ],
}

// ---------------------------------------------------------------------------
// 2. Minimal Didático (4:5, fundo gelo, lilás, títulos enormes em Outfit)
// ---------------------------------------------------------------------------

const softHeader = (): LeafElement[] => [
  global(
    'tagline',
    { x: M, y: 52, w: 600, h: 26 },
    { size: 20, weight: 500, color: 'texto-suave' },
  ),
  counter(
    { x: 716, y: 52, w: 300, h: 26 },
    { variant: 'indice', fontSize: 20, color: 'texto-suave' },
  ),
]
const softFooter = (arrow = true): LeafElement[] => [
  global(
    'copyright',
    { x: M, y: 1282, w: 600, h: 26 },
    { size: 20, weight: 500, color: 'texto-suave' },
  ),
  ...(arrow
    ? [
        text(
          undefined,
          '→',
          { x: 916, y: 1270, w: 100, h: 44 },
          { size: 40, weight: 500, align: 'right', lineHeight: 1 },
        ),
      ]
    : []),
]
const big: Partial<TextStyle> = {
  font: 'titulo',
  weight: 800,
  lineHeight: 0.98,
  letterSpacing: -0.045,
}

const pill = (content: string, y: number) =>
  card(
    'corpo',
    content,
    { x: M, y, w: IW, h: 104 },
    {
      fill: 'apoio',
      textColor: 'texto',
      fontSize: 38,
      weight: 600,
      radius: 52,
      padding: 28,
      align: 'center',
      lineHeight: 1.1,
    },
  )

export const minimalDidatico: Template = {
  id: 'minimal-didatico',
  name: 'Minimal Didático',
  description:
    'Ensina um método em poucas palavras: títulos enormes, pílulas lilás, comparação certo × errado e fórmula final.',
  funnel: 'meio',
  mode: 'claro',
  format: '4:5',
  fonts: { titulo: 'Outfit', corpo: 'Outfit' },
  colors: { fundo: '#F4F4F8', texto: '#16161D', destaque: '#6E7EE0', apoio: '#A9B3F0' },
  highlight: { mode: 'cor', color: 'destaque' },
  slides: [
    slide('Capa', 'fundo', [
      ...softHeader(),
      text(
        'hook',
        'Como escrever ==carrosséis== que viralizam',
        { x: M, y: 150, w: IW, h: 520 },
        { ...big, size: 132 },
      ),
      { ...rect({ x: 40, y: 820, w: 1000, h: 300 }, 'apoio', 0), rotate: -5 },
      img(1, { x: 240, y: 700, w: 600, h: 540 }, { fit: 'contain' }),
      ...softFooter(),
    ]),
    slide('Pergunta', 'fundo', [
      ...softHeader(),
      text(
        'titulo',
        'Por que alguns carrosséis explodem e outros não?',
        { x: M, y: 170, w: IW, h: 400 },
        { ...big, size: 92 },
      ),
      pill('Gancho', 680),
      pill('Ritmo', 810),
      pill('Chamada', 940),
      ...softFooter(),
    ]),
    slide('Imagem', 'fundo', [
      ...softHeader(),
      img(2, { x: M, y: 130, w: IW, h: 680 }, { radius: 32 }),
      text(
        'titulo',
        'Qual é a ==primeira coisa== que alguém lê?',
        { x: M, y: 880, w: IW, h: 300 },
        { ...big, size: 80 },
      ),
      ...softFooter(),
    ]),
    slide('Comparação', 'fundo', [
      ...softHeader(),
      text('titulo', 'O erro mais comum', { x: M, y: 170, w: IW, h: 120 }, { ...big, size: 92 }),
      card(
        'corpo',
        'Começar explicando o contexto antes de dar um motivo para continuar.',
        { x: M, y: 380, w: IW, h: 300 },
        {
          icon: 'alerta',
          fill: '#FFFFFF',
          textColor: 'texto',
          iconColor: '#E5484D',
          fontSize: 38,
          lineHeight: 1.25,
          radius: 32,
          padding: 44,
        },
      ),
      card(
        'corpo',
        'Começar pela tensão: o problema que o leitor já sente.',
        { x: M, y: 720, w: IW, h: 300 },
        {
          icon: 'check',
          fill: 'apoio',
          textColor: 'texto',
          iconColor: 'texto',
          fontSize: 38,
          lineHeight: 1.25,
          radius: 32,
          padding: 44,
        },
      ),
      ...softFooter(),
    ]),
    slide('Afirmação', 'fundo', [
      ...softHeader(),
      text(
        'titulo',
        'O gancho faz ==80%== do trabalho.',
        { x: M, y: 380, w: IW, h: 560 },
        { ...big, size: 150, align: 'center' },
      ),
      ...softFooter(),
    ]),
    slide('Fórmula', 'fundo', [
      ...softHeader(),
      text(
        'rotulo',
        'A fórmula',
        { x: M, y: 170, w: IW, h: 40 },
        { size: 30, weight: 600, uppercase: true, letterSpacing: 0.16, color: 'destaque' },
      ),
      stack(
        { x: M, y: 250, w: IW, h: 900 },
        'top',
        [
          text('subtitulo', 'Tensão', { h: 130 }, { ...big, size: 120 }),
          text(undefined, '+', { h: 80 }, { ...big, size: 80, color: 'destaque' }),
          text('subtitulo', 'Promessa', { h: 130 }, { ...big, size: 120 }),
          text(undefined, '+', { h: 80 }, { ...big, size: 80, color: 'destaque' }),
          text('subtitulo', 'Prova', { h: 130 }, { ...big, size: 120 }),
          text(
            'corpo',
            '= um carrossel que as pessoas leem até o fim.',
            { h: 100 },
            { size: 40, weight: 500, lineHeight: 1.2, color: 'texto-suave' },
          ),
        ],
        6,
      ),
      ...softFooter(),
    ]),
    slide('Chamada', 'fundo', [
      ...softHeader(),
      text(
        'titulo',
        'Salve este post e use no seu ==próximo carrossel==.',
        { x: M, y: 220, w: IW, h: 480 },
        { ...big, size: 104 },
      ),
      doodle(
        'seta-curva',
        { x: 140, y: 760, w: 170, h: 200 },
        { color: 'destaque', strokeWidth: 4 },
      ),
      cta('Siga @seuperfil para mais', {
        x: 330,
        y: 930,
        w: 686,
        h: 104,
        variant: 'solido',
        color: 'texto',
        textColor: 'fundo',
        fontSize: 34,
        icon: 'nenhum',
        align: 'center',
      }),
      ...softFooter(false),
    ]),
  ],
}

// ---------------------------------------------------------------------------
// 3. Princípios Anotados (1:1 — 1080×1080, foto inteira com anotações à mão)
// ---------------------------------------------------------------------------

const H11 = 1080
const topTitle = (role: 'hook' | 'titulo', content: string, size = 70) =>
  text(
    role,
    content,
    { x: M, y: 64, w: 860, h: 260 },
    { font: 'titulo', size, weight: 800, lineHeight: 1.04, letterSpacing: -0.025, color: 'hook' },
  )
/** Anotação à mão. `role: null` deixa a anotação fora do preenchimento automático. */
const note = (
  content: string,
  box: { x: number; y: number; w: number; h: number },
  rotate = -4,
  role: 'corpo' | 'cta' | null = 'corpo',
) =>
  text(
    role ?? undefined,
    content,
    box,
    { font: HAND, size: 50, weight: 600, lineHeight: 1.05, color: 'hook' },
    { rotate },
  )
const shade = () => gradient({ from: 0, to: 0.75, opacity: 0.75, direction: 'up' }, H11)

export const principiosAnotados: Template = {
  id: 'principios-anotados',
  name: 'Princípios Anotados',
  description:
    'Lições curtas sobre fotos quadradas: título forte no topo e anotações escritas à mão com setas e círculos.',
  funnel: 'topo',
  mode: 'escuro',
  format: '1:1',
  fonts: { titulo: 'Inter', corpo: 'Inter' },
  colors: { fundo: '#FFFFFF', texto: '#111111', destaque: '#FFD43B', apoio: '#1C1C1C' },
  highlight: { mode: 'cor', color: 'destaque' },
  slides: [
    slide('Capa', 'fundo', [
      fullImage(1, H11),
      shade(),
      topTitle('hook', '7 princípios que mudaram meu jeito de ==trabalhar==', 78),
      note('arrasta pro lado', { x: 700, y: 930, w: 300, h: 60 }, -3, null),
      doodle('seta', { x: 760, y: 990, w: 220, h: 50 }, { strokeWidth: 3.5 }),
    ]),
    slide('Princípio 1', 'fundo', [
      fullImage(2, H11),
      shade(),
      topTitle('titulo', '1. Feito é melhor que perfeito.'),
      note('a versão 1 sempre\nensina mais que o plano', { x: 90, y: 760, w: 520, h: 120 }),
      doodle('seta-curva', { x: 560, y: 760, w: 150, h: 160 }, { strokeWidth: 3.5 }),
    ]),
    slide('Princípio 2', 'fundo', [
      fullImage(3, H11),
      shade(),
      topTitle('titulo', '2. Proteja as suas manhãs.'),
      doodle('sublinhado', { x: M, y: 222, w: 520, h: 30 }, { color: 'destaque', strokeWidth: 5 }),
      note('nada de e-mail\nantes das 10h', { x: 620, y: 800, w: 400, h: 120 }, 4),
      doodle('seta-curva', { x: 470, y: 720, w: 140, h: 150 }, { strokeWidth: 3.5, flip: true }),
    ]),
    slide('Princípio 3', 'fundo', [
      fullImage(4, H11),
      shade(),
      topTitle('titulo', '3. Diga não para quase tudo.'),
      note('o sim fica\nmais valioso', { x: 120, y: 820, w: 380, h: 120 }, -6),
      doodle('circulo', { x: 80, y: 790, w: 440, h: 190 }, { strokeWidth: 3.5 }),
    ]),
    slide('Princípio 4', 'fundo', [
      fullImage(5, H11),
      shade(),
      topTitle('titulo', '4. Escreva antes de decidir.'),
      note(
        'se não cabe numa página,\nainda não está claro',
        { x: 380, y: 820, w: 640, h: 120 },
        -2,
      ),
      doodle('seta-curva', { x: 250, y: 700, w: 140, h: 150 }, { strokeWidth: 3.5 }),
    ]),
    slide('Princípio 5', 'fundo', [
      fullImage(6, H11),
      shade(),
      topTitle('titulo', '5. Cerque-se de quem está à frente.'),
      note('você vira a média\ndo seu ambiente', { x: 90, y: 820, w: 520, h: 120 }, 3),
      doodle('sublinhado', { x: 90, y: 950, w: 420, h: 30 }, { color: 'destaque', strokeWidth: 5 }),
    ]),
    slide('Chamada', 'fundo', [
      text(
        'titulo',
        'Qual desses você vai aplicar ==primeiro==?',
        { x: M, y: 200, w: IW, h: 360 },
        { font: 'titulo', size: 92, weight: 800, lineHeight: 1.02, letterSpacing: -0.03 },
      ),
      note('comenta o número', { x: M, y: 620, w: 500, h: 60 }, -3, 'cta'),
      doodle('seta', { x: 560, y: 630, w: 200, h: 50 }, { strokeWidth: 3.5 }),
      line({ x: M, y: 860, w: IW }, 'texto', 0.2),
      profile({
        x: M,
        y: 900,
        w: IW,
        h: 80,
        avatarSize: 72,
        fontSize: 30,
        showName: true,
        showHandle: true,
        color: 'texto',
      }),
    ]),
  ],
}
