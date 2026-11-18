/**
 * Templates de estudo e opinião: Playbook em Princípios, Seleção Comentada e Manifesto em Fotos.
 */
import type { ColorRef, LeafElement, Slide, Template, TextStyle } from '../types'
import {
  counter,
  cta,
  fullImage,
  gradient,
  img,
  line,
  logo,
  rect,
  slide,
  stack,
  text,
} from './builders'

const M = 64
const IW = 1080 - M * 2
const pad = (n: number) => String(n).padStart(2, '0')
const global = (
  field: 'brandName' | 'handle' | 'copyright' | 'tagline',
  box: { x: number; y: number; w: number; h: number },
  s: Partial<TextStyle>,
) => text(undefined, '', box, s, { global: field })

// ---------------------------------------------------------------------------
// 1. Playbook em Princípios (fundo creme com pontinhos, números grandes em mono)
// ---------------------------------------------------------------------------

const MONO = 'JetBrains Mono'
const SERIF = 'Instrument Serif'
const MUTED = '#8A8A8A'

const dots = (color = 'rgba(0,0,0,0.06)') => ({
  ...rect({ x: 0, y: 0, w: 1080, h: 1350 }, 'transparent'),
  fullBleed: true,
  pattern: { kind: 'pontos' as const, color, size: 24 },
})

const kickerRow = (label: string): LeafElement[] => [
  rect({ x: M, y: 59, w: 12, h: 12 }, 'destaque', 6),
  text(
    undefined,
    label,
    { x: 88, y: 50, w: 600, h: 28 },
    { font: MONO, size: 21, uppercase: true, letterSpacing: 0.12 },
  ),
  counter({ x: 716, y: 50, w: 300, h: 28 }, { font: MONO, fontSize: 21, color: MUTED }),
]

const playbookFooter = (): LeafElement[] => [
  text(
    undefined,
    'Playbook',
    { x: M, y: 1280, w: 400, h: 24 },
    { font: MONO, size: 17, uppercase: true, letterSpacing: 0.12, color: MUTED },
  ),
  global(
    'handle',
    { x: 616, y: 1280, w: 400, h: 24 },
    { font: MONO, size: 17, uppercase: true, letterSpacing: 0.12, align: 'right', color: MUTED },
  ),
]

function principle(n: number, title: string, body: string): Slide {
  return slide(`Princípio ${n}`, 'fundo', [
    dots(),
    ...kickerRow(`Princípio ${pad(n)}`),
    text(
      undefined,
      pad(n),
      { x: 52, y: 120, w: 600, h: 260 },
      { font: MONO, size: 250, weight: 400, lineHeight: 1, letterSpacing: -0.04 },
    ),
    stack(
      { x: M, y: 620, w: IW, h: 600 },
      'bottom',
      [
        text(
          'titulo',
          title,
          { h: 200 },
          { font: 'titulo', size: 64, weight: 500, lineHeight: 1.08, letterSpacing: -0.025 },
        ),
        text('subtitulo', body, { h: 180 }, { size: 30, lineHeight: 1.45 }),
      ],
      30,
    ),
    ...playbookFooter(),
  ])
}

const SUMMARY: [string, string][] = [
  ['Comece pelos primeiros princípios.', 'Volte à base antes de aceitar o preço.'],
  ['Compare custo final e custo de material.', 'A diferença mostra onde está o desperdício.'],
  ['Questione todos os requisitos.', 'Todo requisito precisa de um dono.'],
  ['A melhor peça é peça nenhuma.', 'Elimine antes de otimizar.'],
  ['Reutilizar é uma forma brutal de reduzir custo.', 'Não jogue fora o que pode servir de novo.'],
]

export const playbookPrincipios: Template = {
  id: 'playbook-principios',
  name: 'Playbook em Princípios',
  description:
    'Um método em princípios numerados: capa com foto recortada, números grandes em mono, resumo para salvar e slide final escuro.',
  funnel: 'meio',
  mode: 'claro',
  format: '4:5',
  fonts: { titulo: 'Inter Tight', corpo: 'Inter Tight' },
  colors: { fundo: '#F1EFEA', texto: '#151515', destaque: '#F0642B', apoio: '#F6CDCF' },
  highlight: { mode: 'fundo', color: 'apoio' },
  slides: [
    slide('Capa', 'fundo', [
      dots(),
      img(1, { x: 140, y: 360, w: 800, h: 990 }, { fit: 'contain', posY: 100 }),
      logo(56, { color: MUTED, fontSize: 26 }),
      stack(
        { x: M, y: 130, w: IW, h: 230 },
        'top',
        [
          text(
            'hook',
            'Como ==reduzir custos==',
            { h: 100 },
            {
              font: 'titulo',
              size: 84,
              weight: 400,
              lineHeight: 1.1,
              letterSpacing: -0.03,
              align: 'center',
            },
          ),
          text(
            'subhook',
            '(O playbook de quem faz isso bem)',
            { h: 40 },
            { font: MONO, size: 28, align: 'center' },
          ),
        ],
        18,
      ),
    ]),
    principle(
      1,
      'Comece pelos primeiros princípios.',
      'Antes de aceitar o preço de mercado, volte à base: matéria-prima, energia, tempo, mão de obra e processo.',
    ),
    principle(
      2,
      'Use o “índice do absurdo”.',
      'Compare o custo final de um produto com o custo dos materiais. Se a diferença é enorme, o problema não é o material: é o processo.',
    ),
    principle(
      3,
      'Questione todos os requisitos.',
      'Todo requisito precisa ter uma pessoa responsável, não “o jurídico pediu”. Departamento não responde pergunta. Pessoa responde.',
    ),
    principle(
      4,
      'A melhor peça é peça nenhuma.',
      'Antes de otimizar uma etapa, pergunte se ela precisa existir. Eliminar é sempre mais barato que melhorar.',
    ),
    principle(
      5,
      'Reutilizar é uma forma brutal de reduzir custo.',
      'Jogar fora algo que poderia ser usado de novo é desperdício escondido. Reaproveitamento muda a conta inteira.',
    ),
    slide('Resumo', 'fundo', [
      dots(),
      ...kickerRow('Salve este card'),
      text(
        'titulo',
        '_O Playbook de_\nQuem Faz Bem.',
        { x: M, y: 110, w: 900, h: 210 },
        { font: SERIF, size: 92, lineHeight: 0.98, letterSpacing: -0.01 },
      ),
      line({ x: M, y: 350, w: IW }, 'texto', 0.5),
      ...SUMMARY.flatMap(([t, s], i) => {
        const y = 382 + i * 150
        return [
          text(
            undefined,
            pad(i + 1),
            { x: M, y: y + 24, w: 70, h: 30 },
            { font: MONO, size: 22, color: i === SUMMARY.length - 1 ? 'destaque' : MUTED },
          ),
          text(
            'corpo',
            t,
            { x: 150, y: y + 16, w: 866, h: 44 },
            { size: 32, weight: 500, lineHeight: 1.2 },
          ),
          text('corpo', s, { x: 150, y: y + 66, w: 866, h: 30 }, { size: 22, color: '#6B6B6B' }),
          ...(i < SUMMARY.length - 1
            ? [line({ x: M, y: y + 140, w: IW }, 'texto', 0.15, 1.5)]
            : []),
        ]
      }),
      ...playbookFooter(),
    ]),
    slide('Final', 'texto', [
      { ...rect({ x: -30, y: 150, w: 110, h: 110 }, '#3A3A3A', 22), rotate: 12 },
      { ...rect({ x: 900, y: 140, w: 130, h: 130 }, '#4A4A4A', 24), rotate: -10 },
      { ...rect({ x: 860, y: 1110, w: 150, h: 150 }, '#3A3A3A', 26), rotate: 8 },
      rect({ x: 250, y: 230, w: 20, h: 20 }, '#FFFFFF', 10),
      rect({ x: 780, y: 300, w: 30, h: 30 }, 'destaque', 15),
      { ...rect({ x: 920, y: 900, w: 44, h: 44 }, '#C0232F', 8), rotate: 10 },
      rect({ x: 330, y: 1200, w: 26, h: 26 }, '#E5E5E5', 6),
      logo(56, { align: 'left', color: 'fundo', fontSize: 28 }),
      counter({ x: 716, y: 56, w: 300, h: 28 }, { font: MONO, fontSize: 21, color: MUTED }),
      text(
        'cta',
        'Estudamos o sucesso criativo e empreendedor no mundo.',
        { x: M, y: 440, w: 760, h: 380 },
        {
          font: 'titulo',
          size: 84,
          weight: 400,
          lineHeight: 1.08,
          letterSpacing: -0.03,
          color: 'fundo',
        },
      ),
      cta('Siga o @seuperfil  ●', {
        x: M,
        y: 860,
        w: 620,
        h: 80,
        variant: 'solido',
        color: 'fundo',
        textColor: 'texto',
        fontSize: 30,
        icon: 'nenhum',
        align: 'left',
      }),
      text(
        undefined,
        'Link na bio',
        { x: M, y: 970, w: 400, h: 24 },
        { font: MONO, size: 18, uppercase: true, letterSpacing: 0.2, color: MUTED },
      ),
    ]),
  ],
}

// ---------------------------------------------------------------------------
// 2. Seleção Comentada (lista de indicações: slide branco com 2 fotos + slide preto de detalhe)
// ---------------------------------------------------------------------------

const GRAY = '#8C8C8C'

function pick(n: number, title: string, p1: string, p2: string): Slide {
  return slide(`Indicação ${n}`, 'texto', [
    text(
      undefined,
      pad(n),
      { x: M, y: 90, w: 400, h: 100 },
      { size: 80, weight: 500, letterSpacing: -0.03, color: 'fundo' },
    ),
    text(
      'titulo',
      title,
      { x: M, y: 250, w: 480, h: 300 },
      { size: 80, weight: 500, lineHeight: 1.05, letterSpacing: -0.03, color: 'fundo' },
    ),
    text(
      'subtitulo',
      p1,
      { x: M, y: 780, w: 470, h: 250 },
      { size: 25, lineHeight: 1.35, color: 'fundo' },
    ),
    text(
      'corpo',
      p2,
      { x: M, y: 1060, w: 470, h: 150 },
      { size: 25, lineHeight: 1.35, underline: true, color: 'fundo' },
    ),
    img(1, { x: 580, y: 40, w: 440, h: 390 }),
    img(2, { x: 580, y: 450, w: 440, h: 860 }),
  ])
}

function detail(n: number, p1: string, p2: string): Slide {
  return slide(`Detalhe ${n}`, 'fundo', [
    img(1, { x: 0, y: 0, w: 560, h: 640 }),
    text(
      'subtitulo',
      p1,
      { x: 620, y: 220, w: 400, h: 400 },
      { size: 28, lineHeight: 1.35, color: GRAY },
    ),
    text('corpo', p2, { x: 620, y: 660, w: 400, h: 400 }, { size: 28, lineHeight: 1.35 }),
  ])
}

export const selecaoComentada: Template = {
  id: 'selecao-comentada',
  name: 'Seleção Comentada',
  description:
    'Lista de indicações (filmes, livros, cases): cada item tem um slide branco com fotos e um slide preto de detalhe.',
  funnel: 'meio',
  mode: 'escuro',
  format: '4:5',
  fonts: { titulo: 'Inter', corpo: 'Inter' },
  colors: { fundo: '#FFFFFF', texto: '#0B0B0B', destaque: '#FFFFFF', apoio: '#0A0A1E' },
  highlight: { mode: 'sublinhado', color: 'hook' },
  slides: [
    slide('Capa', 'fundo', [
      fullImage(1),
      gradient({ from: 0.4, to: 1, opacity: 0.85 }),
      logo(56, { align: 'left', color: 'hook', fontSize: 30 }),
      stack(
        { x: M, y: 700, w: 900, h: 600 },
        'bottom',
        [
          text(
            'hook',
            '3 documentários para destravar seu ==processo criativo== de uma vez por todas',
            { h: 360 },
            { size: 64, weight: 500, lineHeight: 1.12, letterSpacing: -0.02, color: 'hook' },
          ),
        ],
        0,
      ),
    ]),
    slide('Introdução', 'fundo', [
      text(
        'subhook',
        'Quando uma obra chega ao público, boa parte do processo fica de fora. Estes três documentários acompanham artistas trabalhando: das referências aos problemas que precisam resolver.',
        { x: M, y: 70, w: IW, h: 300 },
        { size: 34, lineHeight: 1.3 },
      ),
      img(2, { x: M, y: 400, w: IW, h: 560 }),
      text(
        'corpo',
        'A seleção passa por uma coleção de moda, um projeto de arte e o ateliê de um cineasta.',
        { x: M, y: 1010, w: IW, h: 180 },
        { size: 32, lineHeight: 1.3, underline: true },
      ),
    ]),
    pick(
      1,
      'Nome do primeiro título',
      'Uma frase sobre do que se trata: quem acompanha, o desafio e o prazo.',
      'O que esse título mostra que ninguém costuma ver.',
    ),
    detail(
      1,
      'Uma etapa específica do processo e o problema que precisou ser resolvido.',
      'O que essa etapa ensina para quem trabalha com criação.',
    ),
    pick(
      2,
      'Nome do segundo título',
      'Uma frase sobre do que se trata: o artista, o projeto e onde acontece.',
      'Como o trabalho é feito e com quem.',
    ),
    detail(
      2,
      'Como as pessoas envolvidas participam da construção da obra.',
      'A reflexão que o título propõe para quem cria com outras pessoas.',
    ),
    pick(
      3,
      'Nome do terceiro título',
      'Uma frase sobre do que se trata e por que vale a pena assistir.',
      'O bastidor que o título revela.',
    ),
    detail(
      3,
      'O que acontece entre a ideia e a entrega final.',
      'O aprendizado mais útil para o seu próprio processo.',
    ),
    slide('Reflexão', 'texto', [
      text(
        'titulo',
        'Para quem vive de criação, desenvolver uma ideia também exige organizar o trabalho: prever etapas, combinar responsabilidades e reservar tempo para testar.',
        { x: M, y: 90, w: IW, h: 500 },
        { size: 48, weight: 500, lineHeight: 1.2, color: 'fundo' },
      ),
      img(9, { x: 300, y: 700, w: 480, h: 650 }),
    ]),
    slide('Chamada', 'apoio', [
      logo(56, { align: 'left', color: 'hook', fontSize: 30 }),
      img(10, { x: M, y: 160, w: IW, h: 520 }),
      text(
        'titulo',
        'A sua marca ajuda quem faz o seu mercado acontecer.',
        { x: M, y: 740, w: IW, h: 220 },
        { size: 50, weight: 500, lineHeight: 1.18 },
      ),
      text(
        'rotulo',
        'Quer entender seu próximo passo?',
        { x: M, y: 1000, w: IW, h: 50 },
        { size: 30, underline: true, color: '#B5B5C5' },
      ),
      text(
        'corpo',
        'Agende uma conversa gratuita pelo link na bio.',
        { x: M, y: 1070, w: IW, h: 100 },
        { size: 30, lineHeight: 1.3, color: '#B5B5C5' },
      ),
    ]),
  ],
}

// ---------------------------------------------------------------------------
// 3. Manifesto em Fotos (frase em caixa alta justificada sobre foto em cada slide)
// ---------------------------------------------------------------------------

const J: Partial<TextStyle> = {
  font: 'titulo',
  size: 64,
  lineHeight: 1.0,
  letterSpacing: 0.02,
  align: 'justify',
  uppercase: true,
}

/** Cabeçalho de três colunas. No slide final, a marca fica sobre a foto e o resto sobre o painel claro. */
const header3 = (color: ColorRef, split?: ColorRef): LeafElement[] => {
  const s: Partial<TextStyle> = {
    font: 'Inter',
    size: 15,
    weight: 600,
    uppercase: true,
    letterSpacing: 0.06,
    color,
  }
  return [
    global('brandName', { x: M, y: 40, w: 300, h: 22 }, split ? { ...s, color: split } : s),
    global('handle', split ? { x: 600, y: 40, w: 200, h: 22 } : { x: 390, y: 40, w: 300, h: 22 }, {
      ...s,
      align: split ? 'left' : 'center',
    }),
    text(
      undefined,
      '→ Branding e marketing',
      { x: 716, y: 40, w: 300, h: 22 },
      { ...s, align: 'right' },
    ),
  ]
}

export const manifestoFotos: Template = {
  id: 'manifesto-fotos',
  name: 'Manifesto em Fotos',
  description:
    'Narrativa provocativa: uma frase de impacto por slide, em caixa alta justificada, sobre fotos editoriais.',
  funnel: 'topo',
  mode: 'escuro',
  format: '4:5',
  fonts: { titulo: 'Bebas Neue', corpo: 'Bebas Neue' },
  colors: { fundo: '#EDEDED', texto: '#111111', destaque: '#C8102E', apoio: '#111111' },
  highlight: { mode: 'cor', color: 'destaque' },
  slides: [
    slide('Capa', 'fundo', [
      fullImage(1),
      gradient({ from: 0.2, to: 1, opacity: 0.6 }),
      ...header3('hook'),
      stack(
        { x: M, y: 560, w: 780, h: 560 },
        'bottom',
        [
          text(
            'rotulo',
            'Isso é uma marca ou',
            { h: 70 },
            { font: 'titulo', size: 70, lineHeight: 1, uppercase: true, color: 'hook' },
          ),
          text(
            'hook',
            'Um culto de verdade?',
            { h: 420 },
            { font: 'titulo', size: 170, lineHeight: 0.9, uppercase: true, color: 'hook' },
          ),
        ],
        0,
      ),
    ]),
    slide('Frase 1', 'texto', [
      fullImage(2),
      ...header3('fundo'),
      text(
        'titulo',
        'Vender qualquer coisa hoje em dia é fácil.',
        { x: 180, y: 150, w: 720, h: 150 },
        { ...J, size: 66, color: 'destaque' },
      ),
    ]),
    slide('Frase 2', 'fundo', [
      fullImage(3),
      ...header3('hook'),
      text(
        'titulo',
        'Ter logo bonitinho, serviço ok e preço atraente é o mínimo, meu querido.',
        { x: 150, y: 640, w: 700, h: 220 },
        { ...J, size: 60, color: 'hook' },
        { rotate: -4 },
      ),
    ]),
    slide('Frase 3', 'texto', [
      fullImage(4),
      ...header3('fundo'),
      text(
        'titulo',
        'Mas se você só entrega o mínimo,',
        { x: 80, y: 110, w: 560, h: 150 },
        { ...J, size: 66, color: 'destaque' },
      ),
      text(
        'subtitulo',
        'vai continuar sofrendo com cliente chato pedindo desconto.',
        { x: 480, y: 290, w: 540, h: 200 },
        {
          font: 'titulo',
          size: 66,
          lineHeight: 1,
          uppercase: true,
          align: 'right',
          color: 'destaque',
        },
      ),
    ]),
    slide('Frase 4', 'texto', [
      fullImage(5),
      ...header3('fundo'),
      text(
        'titulo',
        'Eu já estive nesse lugar frustrante, achando que bastava ser bom para ser valorizado.',
        { x: 100, y: 170, w: 880, h: 220 },
        { ...J, size: 58, color: 'fundo' },
      ),
      text(
        'subtitulo',
        '~~É perda de tempo.~~',
        { x: 240, y: 430, w: 600, h: 80 },
        { font: 'titulo', size: 62, uppercase: true, align: 'center', color: 'destaque' },
      ),
    ]),
    slide('Frase 5', 'fundo', [
      fullImage(6),
      gradient({ from: 0, to: 1, opacity: 0.35 }),
      ...header3('hook'),
      text(
        'titulo',
        'E o meu jogo só mudou quando entendi o segredo por trás de uma marca de alto impacto.',
        { x: 120, y: 520, w: 780, h: 300 },
        { ...J, size: 62, color: 'hook' },
      ),
    ]),
    slide('Chamada', 'texto', [
      img(7, { x: 0, y: 0, w: 560, h: 1350 }),
      rect({ x: 560, y: 0, w: 520, h: 1350 }, '#E4E2EA'),
      ...header3('fundo', 'hook'),
      text(
        'titulo',
        'Pronto para construir algo com propósito assim? O celular está na sua mão.',
        { x: 600, y: 520, w: 420, h: 330 },
        {
          font: 'titulo',
          size: 56,
          lineHeight: 1.0,
          uppercase: true,
          align: 'right',
          color: 'fundo',
        },
      ),
      text(
        'cta',
        'Comenta “PALAVRA”',
        { x: 600, y: 880, w: 420, h: 80 },
        { font: 'titulo', size: 66, uppercase: true, align: 'right', color: 'fundo' },
      ),
    ]),
  ],
}
