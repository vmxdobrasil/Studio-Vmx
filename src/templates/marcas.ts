/**
 * Templates de marca: Frases de Marca (creme e amarelo, caixa alta condensada) e a
 * família clássica da Adapta (fundo claro com triângulos, azul e brilho rosa na capa):
 * História em Citação e Estudo Explicado.
 */
import type { LeafElement, Slide, Template, TextStyle } from '../types'
import {
  card,
  counter,
  cta,
  fullImage,
  gradient,
  img,
  logo,
  rect,
  slide,
  stack,
  text,
} from './builders'

const M = 64
const IW = 1080 - M * 2
const global = (
  field: 'brandName' | 'handle' | 'copyright' | 'tagline',
  box: { x: number; y: number; w: number; h: number },
  s: Partial<TextStyle>,
) => text(undefined, '', box, s, { global: field })

// ---------------------------------------------------------------------------
// 1. Frases de Marca (creme, amarelo, palavras em cinza, quadradinhos de progresso)
// ---------------------------------------------------------------------------

const GOTHIC = 'League Gothic'
const GRAY = '#A29A8E'
const meta: Partial<TextStyle> = { size: 16, weight: 700, uppercase: true, letterSpacing: 0.08 }

const brandHeader = (): LeafElement[] => [
  global('brandName', { x: M, y: 50, w: 360, h: 24 }, meta),
  logo(44, { x: 390, w: 300, h: 34, fontSize: 22, color: 'texto' }),
  global('tagline', { x: 656, y: 50, w: 360, h: 24 }, { ...meta, align: 'right' }),
]
const brandFooter = (): LeafElement[] => [
  global('handle', { x: M, y: 1282, w: 360, h: 24 }, meta),
  counter(
    { x: 340, y: 1282, w: 400, h: 24 },
    { variant: 'quadrados', fontSize: 16, color: 'texto', align: 'center' },
  ),
  text(undefined, '2026', { x: 656, y: 1282, w: 360, h: 24 }, { ...meta, align: 'right' }),
]

/** Frase centralizada: _itálico_, **negrito** e ==palavras em cinza==. */
const statement = (name: string, content: string, size = 58): Slide =>
  slide(name, 'fundo', [
    ...brandHeader(),
    stack(
      { x: 110, y: 200, w: 860, h: 950 },
      'center',
      [
        text(
          'titulo',
          content,
          { h: 520 },
          {
            size,
            weight: 500,
            lineHeight: 1.22,
            letterSpacing: -0.02,
            align: 'center',
            highlight: GRAY,
            highlightMode: 'cor',
          },
        ),
      ],
      0,
    ),
    ...brandFooter(),
  ])

function pillar(n: number, title: string, lines: [string, string, string]): Slide {
  return slide(`Pilar ${n}`, 'fundo', [
    ...brandHeader(),
    text(
      'titulo',
      `${String(n).padStart(2, '0')}. ${title}`,
      { x: M, y: 400, w: IW, h: 150 },
      { font: GOTHIC, size: 150, lineHeight: 1, uppercase: true },
    ),
    {
      ...rect({ x: M, y: 590, w: IW, h: 10 }, 'transparent'),
      pattern: { kind: 'pontos' as const, color: 'texto', size: 12 },
    },
    ...lines.map((l, i) =>
      text(
        'corpo',
        l,
        { x: M, y: 660 + i * 120, w: IW, h: 100 },
        {
          size: 40,
          weight: 500,
          lineHeight: 1.2,
          letterSpacing: -0.015,
          highlight: GRAY,
          highlightMode: 'cor',
        },
      ),
    ),
    ...brandFooter(),
  ])
}

export const frasesDeMarca: Template = {
  id: 'frases-de-marca',
  name: 'Frases de Marca',
  description:
    'Manifesto de branding: capa com foto P&B e título condensado, frases centralizadas com palavras em cinza e pilares numerados.',
  funnel: 'topo',
  mode: 'claro',
  format: '4:5',
  fonts: { titulo: GOTHIC, corpo: 'Inter' },
  colors: { fundo: '#F8EBD9', texto: '#141414', destaque: '#F5D200', apoio: GRAY },
  highlight: { mode: 'fundo', color: 'destaque' },
  slides: [
    slide('Capa', 'fundo', [
      ...brandHeader(),
      img(1, { x: M, y: 110, w: IW, h: 720 }, { grayscale: true }),
      text(
        'hook',
        'Sua marca não é o ==logo==',
        { x: M, y: 870, w: IW, h: 360 },
        { font: 'titulo', size: 186, lineHeight: 0.96, uppercase: true },
      ),
      ...brandFooter(),
    ]),
    statement(
      'Frase 1',
      'Uma marca é _aquilo_ que as pessoas **sentem** ==quando você não está na sala.==',
    ),
    statement(
      'Frase 2',
      'O logo é a assinatura. ==A marca é a== **reputação** ==que vem antes dela.==',
    ),
    slide('Ícone', 'fundo', [
      ...brandHeader(),
      img(2, { x: 340, y: 260, w: 400, h: 400 }, { fit: 'contain' }),
      text(
        'titulo',
        'Marcas fortes são construídas com **três escolhas** ==repetidas todos os dias.==',
        { x: 110, y: 720, w: 860, h: 300 },
        {
          size: 52,
          weight: 500,
          lineHeight: 1.22,
          letterSpacing: -0.02,
          align: 'center',
          highlight: GRAY,
          highlightMode: 'cor',
        },
      ),
      ...brandFooter(),
    ]),
    pillar(1, 'Clareza', [
      'Você sabe dizer ==o que faz em uma frase.==',
      'O cliente entende ==em cinco segundos.==',
      'Ninguém precisa ==adivinhar o próximo passo.==',
    ]),
    pillar(2, 'Consistência', [
      'A mesma voz ==em todos os canais.==',
      'As mesmas cores ==em todos os materiais.==',
      'A mesma promessa ==em todas as entregas.==',
    ]),
    pillar(3, 'Coragem', [
      'Dizer ==não para o que não combina.==',
      'Escolher ==um público, não todos.==',
      'Defender ==uma ideia em público.==',
    ]),
    statement('Fechamento', 'Logo se faz em uma semana. **Marca se constrói** _em anos._', 64),
  ],
}

// ---------------------------------------------------------------------------
// 2. Família Adapta clássica (fundo claro com triângulos, azul, brilho rosa na capa)
// ---------------------------------------------------------------------------

const AD = {
  mode: 'claro' as const,
  format: '4:5' as const,
  fonts: { titulo: 'Manrope', corpo: 'Manrope' },
  colors: { fundo: '#F5F6FA', texto: '#151827', destaque: '#3F5BD9', apoio: '#E83E8C' },
  highlight: { mode: 'cor' as const, color: 'destaque' },
}
const BODY_GRAY = '#6B6F80'

const triangles = () => ({
  ...rect({ x: 0, y: 0, w: 1080, h: 1350 }, 'transparent'),
  fullBleed: true,
  pattern: { kind: 'triangulos' as const, color: 'rgba(63,91,217,0.07)', size: 72 },
})

function adFooter(last = false, color = 'texto'): LeafElement[] {
  return [
    logo(1252, { x: M, w: 420, h: 36, fontSize: 22, align: 'left', color }),
    global(
      'handle',
      { x: M, y: 1294, w: 420, h: 24 },
      { size: 18, weight: 500, color: color === 'texto' ? BODY_GRAY : 'hook' },
    ),
    text(
      undefined,
      last ? 'Compartilhe ↗' : 'Arraste →',
      { x: 616, y: 1266, w: 400, h: 30 },
      { size: 22, weight: 700, align: 'right', color: color === 'texto' ? 'destaque' : 'hook' },
    ),
  ]
}

/** Capa com foto, véu escuro e brilho rosa embaixo. */
function glowCover(children: LeafElement[], anchor: 'center' | 'bottom'): Slide {
  return slide('Capa', 'texto', [
    fullImage(1),
    gradient({ color: '#0B0D1A', from: 0.15, to: 0.95, opacity: 0.9 }),
    gradient({
      color: 'apoio',
      direction: 'radial',
      cx: 50,
      cy: 108,
      from: 0,
      to: 0.62,
      opacity: 0.8,
    }),
    stack(
      { x: M, y: anchor === 'center' ? 420 : 640, w: IW, h: anchor === 'center' ? 700 : 560 },
      anchor,
      children,
      28,
    ),
    ...adFooter(false, 'hook'),
  ])
}

const T: Partial<TextStyle> = {
  font: 'titulo',
  size: 62,
  weight: 800,
  lineHeight: 1.1,
  letterSpacing: -0.03,
}
const P: Partial<TextStyle> = { size: 32, lineHeight: 1.45, color: BODY_GRAY }
const kicker = (content: string) =>
  text(
    'rotulo',
    content,
    { h: 30 },
    { size: 22, weight: 800, uppercase: true, letterSpacing: 0.16, color: 'destaque' },
  )

/** Slide de conteúdo: texto ancorado embaixo, à esquerda. */
function bottomText(
  name: string,
  children: LeafElement[],
  extra: LeafElement[] = [],
  last = false,
): Slide {
  return slide(name, 'fundo', [
    triangles(),
    ...extra,
    stack({ x: M, y: 140, w: IW, h: 1060 }, 'bottom', children, 28),
    ...adFooter(last),
  ])
}

export const adaptaHistoria: Template = {
  id: 'adapta-historia',
  name: 'História em Citação',
  description:
    'Conta uma história a partir de uma frase marcante: capa com citação sobre foto e brilho rosa, slides claros com destaques em azul.',
  funnel: 'topo',
  ...AD,
  slides: [
    glowCover(
      [
        text(
          'hook',
          '“Uma frase marcante que resume a ==história== inteira.”',
          { h: 380 },
          {
            ...T,
            size: 70,
            lineHeight: 1.12,
            align: 'center',
            color: 'hook',
            highlight: '#9FB1FF',
          },
        ),
        text(
          'subhook',
          '— Nome da pessoa, cargo',
          { h: 40 },
          { size: 28, weight: 600, align: 'center', color: 'hook' },
          { opacity: 0.8 },
        ),
      ],
      'center',
    ),
    bottomText('Contexto', [
      kicker('O contexto'),
      text('titulo', 'Por trás da frase existe uma ==decisão difícil==.', { h: 220 }, T),
      text(
        'corpo',
        'Apresente quem é a pessoa, o que estava em jogo e por que essa história merece ser contada agora.',
        { h: 190 },
        P,
      ),
    ]),
    bottomText('Virada', [
      kicker('A virada'),
      text('titulo', 'O que mudou ==tudo== foi uma escolha simples.', { h: 220 }, T),
      text(
        'corpo',
        '• O primeiro sinal de que algo estava errado.\n• A decisão que ninguém esperava.\n• O resultado nos meses seguintes.',
        { h: 240 },
        P,
      ),
    ]),
    bottomText(
      'Imagem',
      [text('titulo', 'Uma imagem que ==mostra== o momento da história.', { h: 220 }, T)],
      [img(2, { x: M, y: 120, w: IW, h: 680 }, { radius: 28 })],
    ),
    bottomText('Lições', [
      kicker('O que aprender'),
      text('titulo', 'Três lições para levar para o ==seu trabalho==.', { h: 220 }, T),
      text(
        'corpo',
        '**==Lição 1:==** comece antes de estar pronto.\n**==Lição 2:==** ouça quem discorda de você.\n**==Lição 3:==** repita o que funciona.',
        { h: 260 },
        P,
      ),
    ]),
    bottomText(
      'Final',
      [
        text('titulo', 'Mande para alguém que ==precisa ouvir== isso hoje.', { h: 220 }, T),
        text(
          'corpo',
          'Siga o perfil para mais histórias sobre tecnologia, carreira e negócios.',
          { h: 140 },
          P,
        ),
      ],
      [],
      true,
    ),
  ],
}

const savePill = (y: number) =>
  card(
    undefined,
    'SALVAR PARA DEPOIS',
    { x: M, y, w: 400, h: 64 },
    {
      icon: 'selo',
      fill: 'transparent',
      stroke: { color: 'destaque', width: 2 },
      textColor: 'destaque',
      iconColor: 'destaque',
      fontSize: 20,
      weight: 800,
      radius: 32,
      padding: 16,
    },
  )

export const adaptaEstudo: Template = {
  id: 'adapta-estudo',
  name: 'Estudo Explicado',
  description:
    'Explica um estudo ou pesquisa: capa com foto e brilho rosa, número em destaque, prompt pronto para copiar e cartão para salvar.',
  funnel: 'meio',
  ...AD,
  slides: [
    glowCover(
      [
        text(
          'hook',
          'Um novo estudo mostra ==o que muda== no seu trabalho',
          { h: 360 },
          { ...T, size: 78, lineHeight: 1.06, color: 'hook', highlight: '#9FB1FF' },
        ),
        text(
          'subhook',
          'E o que você pode fazer a partir de hoje.',
          { h: 50 },
          { size: 32, weight: 500, color: 'hook' },
          { opacity: 0.85 },
        ),
      ],
      'bottom',
    ),
    bottomText('O estudo', [
      kicker('O estudo'),
      text(
        'titulo',
        'Pesquisadores acompanharam ==milhares de profissionais== por um ano.',
        { h: 280 },
        T,
      ),
      text(
        'corpo',
        'Explique quem fez o estudo, com quantas pessoas e qual pergunta ele tentou responder.',
        { h: 150 },
        P,
      ),
    ]),
    bottomText('O número', [
      text('titulo', '==73%==', { h: 230 }, { ...T, size: 220, lineHeight: 1 }),
      text(
        'subtitulo',
        'das pessoas disseram que economizam tempo **toda semana**.',
        { h: 160 },
        { ...T, size: 48, weight: 700 },
      ),
      text(
        'corpo',
        'Diga o que esse número significa na prática e compare com algo que o leitor conhece.',
        { h: 150 },
        P,
      ),
    ]),
    bottomText(
      'Prompt',
      [
        kicker('Teste agora'),
        text('titulo', 'Use este ==prompt== para aplicar o estudo.', { h: 160 }, T),
        card(
          'corpo',
          '“Analise minha rotina de trabalho desta semana e aponte três tarefas que eu poderia fazer na metade do tempo.”',
          { h: 300 },
          {
            icon: 'check',
            fill: '#FFFFFF',
            stroke: { color: 'rgba(21,24,39,0.08)', width: 2 },
            textColor: 'texto',
            iconColor: 'destaque',
            fontSize: 30,
            lineHeight: 1.45,
            radius: 24,
            padding: 36,
          },
        ),
      ],
      [savePill(140)],
    ),
    bottomText('Cuidados', [
      kicker('Antes de sair usando'),
      text('titulo', 'O estudo também mostra ==onde ter cuidado==.', { h: 220 }, T),
      text(
        'corpo',
        '• Confira os dados antes de enviar.\n• Não compartilhe informações sigilosas.\n• Revise o tom do texto final.',
        { h: 240 },
        P,
      ),
    ]),
    bottomText(
      'Final',
      [
        text('titulo', 'Compartilhe com quem ainda ==trabalha do jeito antigo==.', { h: 220 }, T),
        cta('Seguir o perfil', {
          h: 84,
          w: 420,
          variant: 'solido',
          color: 'destaque',
          textColor: '#FFFFFF',
          fontSize: 30,
          icon: 'seta',
          align: 'left',
        }),
      ],
      [],
      true,
    ),
  ],
}
