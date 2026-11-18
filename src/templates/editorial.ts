/**
 * Família "Editorial" (formato 3:4, 1080×1440): visual de revista, fundo quase preto,
 * tipografia grotesca grande, detalhes em serifa, destaque amarelo e cor de apoio.
 * Três templates compartilham os mesmos blocos: Case Editorial, Opinião Editorial e
 * Análise em Capítulos.
 */
import type { ColorRef, Slide, Template, TextStyle } from '../types'
import {
  cta,
  footer,
  fullImage,
  gradient,
  header,
  img,
  line,
  profile,
  rect,
  slide,
  stack,
  text,
} from './builders'

const H = 1440
const M = 64
const IW = 1080 - M * 2
const SERIF = 'Instrument Serif'

const FONTS = { titulo: 'Inter Tight', corpo: 'Inter Tight' }
const BASE = {
  mode: 'escuro' as const,
  format: '3:4' as const,
  fonts: FONTS,
  highlight: { mode: 'cor' as const, color: 'destaque' },
}

/** Estilo de título: grotesca, entrelinha curta, espaçamento negativo. */
const T = (p: Partial<TextStyle> = {}): Partial<TextStyle> => ({
  font: 'titulo',
  weight: 500,
  lineHeight: 1.05,
  letterSpacing: -0.025,
  ...p,
})
const serif = (p: Partial<TextStyle> = {}): Partial<TextStyle> => ({
  font: SERIF,
  size: 34,
  lineHeight: 1.16,
  ...p,
})
const hdr = (color: ColorRef = 'texto') =>
  header(color, 40, { variant: 'assinatura', fontSize: 20, h: 50 })
const arrowButton = (p: Parameters<typeof cta>[1] = {}) =>
  cta('', {
    icon: 'seta-longa',
    variant: 'contorno',
    color: 'destaque',
    textColor: 'texto',
    fontSize: 30,
    align: 'left',
    h: 60,
    ...p,
  })

// ---------------------------------------------------------------------------
// Slides compartilhados (chamada, lista em blocos e oferta)
// ---------------------------------------------------------------------------

function callSlide(title: string, sub: string): Slide {
  return slide('Chamada', 'fundo', [
    hdr(),
    stack(
      { x: M, y: 420, w: IW, h: 600 },
      'center',
      [
        text('titulo', title, { h: 200 }, T({ size: 60, weight: 700, lineHeight: 1.1 })),
        text('subtitulo', sub, { h: 110 }, { size: 32, lineHeight: 1.25, color: 'texto-suave' }),
        arrowButton(),
      ],
      34,
    ),
  ])
}

function blocksSlide(title: string, items: [string, string][]): Slide {
  return slide('Lista', 'fundo', [
    hdr(),
    text(
      'titulo',
      title,
      { x: M, y: 170, w: IW, h: 80 },
      T({ size: 56, weight: 700, underline: true }),
    ),
    ...items.map(([t, s], i) =>
      stack(
        { x: M, y: 300 + i * 190, w: IW, h: 170 },
        'top',
        [
          text(
            'subtitulo',
            `→ ${t}`,
            { h: 56 },
            { size: 44, weight: 500, letterSpacing: -0.02, lineHeight: 1.1 },
          ),
          text('corpo', s, { h: 40 }, { size: 28, lineHeight: 1.2, color: 'texto-suave' }),
        ],
        10,
      ),
    ),
    arrowButton({ x: M, y: 1100, w: IW }),
  ])
}

function offerSlide(slot: number, quote: string): Slide {
  const info = (t: string, x: number, y: number) => [
    line({ x, y, w: 380 }, 'hook', 0.6),
    text(
      'corpo',
      t,
      { x, y: y + 20, w: 380, h: 120 },
      { size: 28, lineHeight: 1.2, color: 'hook' },
    ),
  ]
  return slide('Oferta', 'apoio', [
    fullImage(slot, H),
    gradient({ color: 'apoio', from: 0, to: 0.6, opacity: 0.55 }, H),
    gradient({ color: '#000000', from: 0.45, to: 1, opacity: 0.75 }, H),
    text(
      undefined,
      '',
      { x: M, y: 110, w: IW, h: 60 },
      { font: SERIF, size: 48, italic: true, align: 'center', color: 'hook' },
      { global: 'brandName' },
    ),
    stack(
      { x: M, y: 200, w: IW, h: 440 },
      'top',
      [
        text(
          'titulo',
          'Workshop de Estratégia de Marca',
          { h: 200 },
          T({ size: 84, weight: 700, lineHeight: 1.02, align: 'center', color: 'hook' }),
        ),
        text('subtitulo', quote, { h: 60 }, serif({ size: 44, align: 'center', color: 'hook' })),
      ],
      24,
    ),
    cta('Comente → **QUERO**', {
      x: M,
      y: 690,
      w: IW,
      h: 100,
      variant: 'solido',
      color: 'destaque',
      textColor: '#111111',
      fontSize: 42,
      align: 'center',
      icon: 'nenhum',
    }),
    ...info('→ Datas e horários\nAo vivo, vagas limitadas.', 130, 880),
    ...info('↘ Materiais inclusos:\nmodelos, roteiros e exercícios.', 570, 880),
    ...info('→ Horas de prática para sair com o plano pronto.', 130, 1070),
    ...info('→ Como atrair, vender e entregar projetos maiores.', 570, 1070),
    profile({
      x: M,
      y: 1300,
      w: IW,
      h: 60,
      avatarSize: 52,
      fontSize: 24,
      showName: true,
      showHandle: false,
      color: 'hook',
      align: 'center',
    }),
  ])
}

const BLOCKS: [string, string][] = [
  ['01. A primeira reunião', 'Como sair do orçamento baixo com um roteiro estratégico'],
  ['02. Posicionamento', 'Como deixar de ser “mais um” na cabeça do cliente'],
  ['03. Prospecção', 'Onde estão os clientes que pagam bem'],
  ['04. Entrega estratégica', 'O que entregar para justificar um projeto maior'],
]

// ---------------------------------------------------------------------------
// 1. Case Editorial
// ---------------------------------------------------------------------------

export const caseEditorial: Template = {
  id: 'case-editorial',
  name: 'Case Editorial',
  description:
    'Estudo de caso com cara de revista: capa com coluna lateral, fotos grandes, slide de cor e oferta no fim.',
  funnel: 'topo',
  ...BASE,
  slides: [
    slide('Capa', 'fundo', [
      text(
        'hook',
        'Uma marca levou meses para criar o logo que a internet chamou de “genérico”',
        { x: M, y: 58, w: 690, h: 420 },
        T({ size: 80, lineHeight: 1.02 }),
      ),
      line({ x: 790, y: 64, w: 226 }, 'texto', 0.5),
      text(
        'subhook',
        'Nova identidade visual depois de dez anos',
        { x: 790, y: 80, w: 226, h: 110 },
        { size: 23, lineHeight: 1.16 },
      ),
      line({ x: 790, y: 226, w: 226 }, 'texto', 0.5),
      text(
        'corpo',
        'Enquanto o mercado corre para a IA, ela foi na direção contrária. Mas por quê?',
        { x: 790, y: 242, w: 226, h: 160 },
        { size: 23, lineHeight: 1.16 },
      ),
      line({ x: M, y: 480, w: IW }, 'texto', 0.3),
      img(1, { x: M, y: 516, w: IW, h: 760 }, { radius: 14 }),
      footer(1340),
    ]),
    slide('Contexto', 'fundo', [
      hdr(),
      stack(
        { x: M, y: 150, w: 820, h: 520 },
        'top',
        [
          text(
            'titulo',
            'No dia do lançamento, o novo ícone apareceu sem aviso.\nSem a cor de sempre, só preto e branco.',
            { h: 260 },
            T({ size: 44, lineHeight: 1.18, letterSpacing: -0.02 }),
          ),
          text(
            'subtitulo',
            '==A internet== não perdoou.',
            { h: 60 },
            T({
              size: 44,
              lineHeight: 1.18,
              letterSpacing: -0.02,
              color: 'texto-suave',
              highlight: 'texto',
            }),
          ),
        ],
        40,
      ),
      text(
        'corpo',
        '“Chato”, “genérico”, “parece template”.\nForam alguns dos comentários mais gentis.',
        { x: 300, y: 690, w: 716, h: 90 },
        serif({ size: 30, align: 'right' }),
      ),
      img(2, { x: M, y: 812, w: 476, h: 476 }),
      img(3, { x: 540, y: 812, w: 476, h: 476 }),
      text(
        undefined,
        'Antes',
        { x: M, y: 1236, w: 476, h: 30 },
        { size: 22, align: 'center', color: 'hook' },
      ),
      text(
        undefined,
        'Depois',
        { x: 540, y: 1236, w: 476, h: 30 },
        { size: 22, align: 'center', color: 'hook' },
      ),
    ]),
    slide('Virada', 'fundo', [
      fullImage(4, H),
      gradient({ from: 0.35, to: 0.92, opacity: 0.95 }, H),
      hdr('hook'),
      stack(
        { x: M, y: 640, w: 880, h: 720 },
        'bottom',
        [
          text(
            'titulo',
            'Hoje, qualquer um faz um logo com IA.',
            { h: 150 },
            T({ size: 64, weight: 700, lineHeight: 1.06, color: 'hook' }),
          ),
          text(
            'subtitulo',
            'É rápido, é bonito e é tudo igual.\n\nPor isso o ícone pareceu genérico.\n\nMas o processo por trás dele conta outra história.',
            { h: 330 },
            { size: 34, lineHeight: 1.25, color: 'hook' },
          ),
        ],
        36,
      ),
    ]),
    slide('Processo', 'fundo', [
      hdr(),
      text(
        'titulo',
        '1. Som\n2. Óleo\n3. Câmera',
        { x: M, y: 150, w: 470, h: 400 },
        T({ size: 88, weight: 400, lineHeight: 1.06, letterSpacing: -0.03 }),
      ),
      text(
        'subtitulo',
        'Em vez de gerar a imagem, deixaram o som desenhar. A música vibrou uma bandeja de óleo e a câmera registrou as ondas.\n\nSem IA, sem computação gráfica.',
        { x: 570, y: 160, w: 446, h: 420 },
        { size: 30, lineHeight: 1.2 },
      ),
      img(5, { x: M, y: 640, w: IW, h: 720 }),
    ]),
    slide('Destaque', 'apoio', [
      hdr(),
      text(
        'titulo',
        'O logo novo tem ==trilha sonora==.',
        { x: M, y: 130, w: IW, h: 300 },
        T({ size: 96, lineHeight: 1.0, highlight: 'fundo' }),
      ),
      img(6, { x: M, y: 480, w: IW, h: 580 }),
      line({ x: M, y: 1110, w: 460 }, 'texto', 0.6),
      line({ x: 556, y: 1110, w: 460 }, 'texto', 0.6),
      text(
        'subtitulo',
        'A composição que fez o óleo vibrar virou a assinatura sonora da marca. Som e imagem nasceram juntos.',
        { x: M, y: 1132, w: 460, h: 200 },
        { size: 28, lineHeight: 1.18 },
      ),
      text(
        'corpo',
        'E não foi de primeira: notas graves ou agudas demais faziam a forma sumir. Foram meses de teste.',
        { x: 556, y: 1132, w: 460, h: 200 },
        { size: 28, lineHeight: 1.18 },
      ),
    ]),
    slide('Galeria', 'texto', [
      hdr('fundo'),
      stack(
        { x: M, y: 300, w: 470, h: 900 },
        'top',
        [
          text(
            'titulo',
            'Então, por que ir na contramão?',
            { h: 240 },
            T({ size: 58, weight: 600, lineHeight: 1.08, color: 'apoio' }),
          ),
          line({ w: 470 }, 'apoio', 0.8),
          text(
            'subtitulo',
            'Porque a IA entrega o desenho, mas não decide o que o desenho precisa dizer.\n\nNão escolhe a música nem aguenta semanas de teste até achar a nota certa.\n\nE isso ninguém consegue copiar.',
            { h: 520 },
            { size: 28, lineHeight: 1.22, color: 'apoio' },
          ),
        ],
        30,
      ),
      img(7, { x: 590, y: 0, w: 490, h: 450 }),
      img(8, { x: 590, y: 480, w: 490, h: 470 }),
      img(9, { x: 590, y: 980, w: 490, h: 460 }),
    ]),
    slide('Conclusão', 'fundo', [
      hdr(),
      text(
        'titulo',
        'O “genérico” não era o logo.\nEra a falta de conteúdo.',
        { x: M, y: 150, w: 820, h: 120 },
        T({ size: 44, lineHeight: 1.15, letterSpacing: -0.02 }),
      ),
      img(10, { x: M, y: 320, w: IW, h: 780 }),
      text(
        'subtitulo',
        'O ícone sozinho virou piada. Com conceito, processo e filme, virou case. Mesmo arquivo, outro valor.',
        { x: M, y: 1140, w: 460, h: 180 },
        { size: 28, lineHeight: 1.18 },
      ),
      text(
        'corpo',
        'Não é sobre fugir da IA. É fazer o que ela não faz: o raciocínio, a estratégia e, depois, o design.',
        { x: 556, y: 1140, w: 460, h: 180 },
        { size: 28, lineHeight: 1.18 },
      ),
    ]),
    callSlide(
      'Provar valor também é ==estratégia==, e dá para aprender.',
      'Por isso vou reunir designers de marca durante dois dias para mostrar, na prática, como fazer isso.',
    ),
    blocksSlide('Quatro blocos práticos', BLOCKS),
    offerSlide(11, '“O próximo nível não está na ferramenta”'),
  ],
}

// ---------------------------------------------------------------------------
// 2. Opinião Editorial
// ---------------------------------------------------------------------------

const arrowDown = () =>
  text(undefined, '↓', { h: 70 }, { size: 64, weight: 300, align: 'center', lineHeight: 1 })

export const opiniaoEditorial: Template = {
  id: 'opiniao-editorial',
  name: 'Opinião Editorial',
  description:
    'Texto opinativo para provocar o mercado: destaques em amarelo, listas, comparação, tabela e oferta.',
  funnel: 'topo',
  ...BASE,
  slides: [
    slide('Capa', 'fundo', [
      fullImage(1, H),
      gradient({ from: 0.3, to: 0.9, opacity: 0.92 }, H),
      stack(
        { x: M, y: 700, w: IW, h: 600 },
        'bottom',
        [
          text(
            'hook',
            'O que está acontecendo com o mercado de design em 2026?',
            { h: 360 },
            T({
              size: 80,
              weight: 800,
              lineHeight: 1.0,
              letterSpacing: -0.01,
              uppercase: true,
              align: 'center',
              color: 'hook',
            }),
          ),
          text(
            'subhook',
            'Entenda o que mudou e por que quase ninguém se preparou para isso.',
            { h: 100 },
            serif({ size: 38, lineHeight: 1.12, align: 'center', color: 'hook' }),
          ),
        ],
        22,
      ),
      footer(1350, { color: 'hook' }),
    ]),
    slide('Contexto', 'fundo', [
      hdr(),
      stack(
        { x: M, y: 150, w: IW, h: 600 },
        'top',
        [
          text(
            'titulo',
            'A gente passou ==anos== dominando as ferramentas.',
            { h: 200 },
            T({ size: 58, lineHeight: 1.1 }),
          ),
          line({ w: IW }, 'texto', 0.25),
          text(
            'subtitulo',
            'Grid alinhado, kerning perfeito, teoria das cores…',
            { h: 120 },
            { size: 38, lineHeight: 1.25 },
          ),
        ],
        40,
      ),
      stack(
        { x: M, y: 900, w: IW, h: 440 },
        'bottom',
        [
          text('rotulo', 'E hoje?', { h: 50 }, { size: 38, underline: true }),
          text(
            'corpo',
            'O cliente manda um logo feito por IA no WhatsApp e pede para “dar uma refinada”.',
            { h: 110 },
            { size: 34, lineHeight: 1.25 },
          ),
        ],
        24,
      ),
    ]),
    slide('Choque', 'fundo', [
      hdr(),
      stack(
        { x: M, y: 140, w: IW, h: 1150 },
        'top',
        [
          text(
            'titulo',
            'O choque de realidade ==chegou==.',
            { h: 200 },
            T({ size: 90, lineHeight: 1.0 }),
          ),
          line({ w: IW }, 'texto', 0.25),
          text(
            'subtitulo',
            'E quem só executa está sentindo primeiro.',
            { h: 100 },
            { size: 38, underline: true, lineHeight: 1.25 },
          ),
          line({ w: IW }, 'texto', 0.25),
          text(
            'corpo',
            'Antes, ser designer freelancer era vantagem. As marcas precisavam de:',
            { h: 100 },
            { size: 32, lineHeight: 1.3 },
          ),
          text(
            'corpo',
            '→ Identidade visual\n→ Site\n→ Embalagens\n→ Social media',
            { h: 260 },
            serif({ size: 44, lineHeight: 1.35 }),
          ),
        ],
        34,
      ),
      text(
        'corpo',
        'Agora, a conversa é outra…',
        { x: M, y: 1330, w: IW, h: 50 },
        { size: 34, color: 'destaque' },
      ),
    ]),
    slide('Execução', 'texto', [
      hdr('fundo'),
      text(
        'titulo',
        'Execução virou comum',
        { x: M, y: 140, w: IW, h: 100 },
        T({ size: 84, color: 'fundo' }),
      ),
      line({ x: M, y: 270, w: IW }, 'fundo', 0.2),
      text(
        'subtitulo',
        'Antes, o cliente pagava pelo tempo de desenhar. A execução era escassa.\n\nHoje, a IA entrega 30 opções em 30 segundos. O que era raro virou abundante.',
        { x: M, y: 310, w: 820, h: 330 },
        { size: 34, lineHeight: 1.28, color: 'fundo' },
      ),
      text(
        'corpo',
        'Mas quem decide qual das 30 opções serve ao negócio continua valendo muito.',
        { x: 340, y: 690, w: 676, h: 100 },
        { size: 32, lineHeight: 1.2, align: 'right', color: 'fundo' },
        { opacity: 0.55 },
      ),
      img(2, { x: M, y: 830, w: IW, h: 540 }, { radius: 14 }),
    ]),
    slide('Mercado', 'texto', [
      hdr('fundo'),
      text(
        'titulo',
        'Agora todo mundo é “meio que” designer',
        { x: M, y: 140, w: IW, h: 180 },
        T({ size: 72, color: 'fundo' }),
      ),
      line({ x: M, y: 340, w: IW }, 'fundo', 0.2),
      text(
        'subtitulo',
        'É só rolar o feed de qualquer site de freela:',
        { x: M, y: 380, w: IW, h: 50 },
        { size: 32, weight: 600, underline: true, color: 'fundo' },
      ),
      text(
        'corpo',
        '•  “Logo profissional: R$ 50”\n•  “Identidade visual completa: R$ 150”\n•  “Revisões ilimitadas”',
        { x: M, y: 450, w: IW, h: 170 },
        serif({ size: 40, lineHeight: 1.25, color: 'fundo' }),
      ),
      img(3, { x: M, y: 650, w: IW, h: 420 }, { radius: 16 }),
      text(
        'corpo',
        'Mas sabe o que continua raro?\n**O pensamento estratégico.**',
        { x: M, y: 1130, w: IW, h: 110 },
        { size: 38, weight: 500, lineHeight: 1.2, color: 'fundo' },
      ),
    ]),
    slide('Fluxo', 'apoio', [
      hdr(),
      stack(
        { x: M, y: 150, w: IW, h: 1200 },
        'center',
        [
          text('rotulo', 'Sabe por que isso acontece?', { h: 50 }, { size: 40, align: 'center' }),
          arrowDown(),
          text('titulo', 'PREÇO', { h: 220 }, T({ size: 200, align: 'center', lineHeight: 1 })),
          arrowDown(),
          text(
            'subtitulo',
            'É a única coisa que o cliente consegue comparar quando ninguém explica o valor do design.',
            { h: 140 },
            { size: 36, align: 'center', lineHeight: 1.25 },
          ),
          arrowDown(),
          text(
            'corpo',
            'E quando o mercado fica lotado, o preço sempre cai.',
            { h: 100 },
            { size: 36, align: 'center', lineHeight: 1.25 },
          ),
        ],
        26,
      ),
    ]),
    slide('Contraste', 'fundo', [
      hdr(),
      text(
        'titulo',
        'Ser “==apenas um designer==” acabou.',
        { x: M, y: 150, w: IW, h: 90 },
        T({ size: 58, highlightMode: 'sublinhado' }),
      ),
      line({ x: M, y: 290, w: IW }, 'texto', 0.25),
      text('rotulo', 'O cliente:', { x: M, y: 340, w: IW, h: 50 }, { size: 36, weight: 500 }),
      text(
        'corpo',
        '❌  Arquivo em PDF\n❌  Logo com grid\n❌  Site bonito',
        { x: M, y: 440, w: 440, h: 220 },
        { size: 34, lineHeight: 1.9 },
      ),
      text(
        'corpo',
        '✅  Resultado\n✅  Posicionamento\n✅  Conversão clara',
        { x: 560, y: 440, w: 456, h: 220 },
        { size: 34, lineHeight: 1.9 },
      ),
      line({ x: M, y: 770, w: IW }, 'texto', 0.25),
      text(
        'subtitulo',
        'Quem está perdendo espaço continua vendendo recursos visuais. Quem está crescendo vende **impacto no negócio**. O mercado se dividiu em dois: ==executores e parceiros estratégicos==.',
        { x: M, y: 820, w: IW, h: 300 },
        { size: 36, lineHeight: 1.3, highlightMode: 'sublinhado', highlight: 'texto' },
      ),
    ]),
    slide('Tabela', 'fundo', [
      hdr(),
      text(
        'titulo',
        'Entenda.',
        { x: M, y: 150, w: IW, h: 90 },
        T({ size: 60, align: 'center', underline: true }),
      ),
      line({ x: M, y: 300, w: IW }, 'texto', 0.25),
      { ...rect({ x: 539, y: 300, w: 2, h: 520 }, 'texto'), opacity: 0.25 },
      text(
        'rotulo',
        'Executor',
        { x: M, y: 380, w: 440, h: 100 },
        { size: 38, weight: 700, align: 'center', color: 'destaque' },
      ),
      text(
        'rotulo',
        'Parceiro estratégico',
        { x: 576, y: 360, w: 440, h: 100 },
        { size: 38, weight: 700, align: 'center', lineHeight: 1.15, color: 'destaque' },
      ),
      text(
        'corpo',
        '•  Faz exatamente o que o cliente manda\n•  Espera o briefing pronto',
        { x: M + 20, y: 520, w: 420, h: 260 },
        { size: 32, lineHeight: 1.3 },
      ),
      text(
        'corpo',
        '•  Faz perguntas que incomodam\n•  Molda a história e a direção da marca',
        { x: 596, y: 520, w: 420, h: 260 },
        { size: 32, lineHeight: 1.3 },
      ),
      line({ x: M, y: 820, w: IW }, 'texto', 0.25),
      text(
        'subtitulo',
        'Adivinha quem a IA substitui primeiro?',
        { x: M, y: 900, w: IW, h: 160 },
        T({ size: 54, align: 'center', lineHeight: 1.15 }),
      ),
    ]),
    slide('Virada', 'fundo', [
      hdr(),
      stack(
        { x: M, y: 150, w: IW, h: 750 },
        'top',
        [
          text(
            'titulo',
            'Quem se dá bem usa a IA como assistente.',
            { h: 120 },
            { size: 44, weight: 500, underline: true, lineHeight: 1.2 },
          ),
          text(
            'subtitulo',
            'Antes de abrir o programa, conversa com o cliente.\n\nFala de lucro, de valor, de posicionamento…\n\nE assim deixa de competir com freela barato.',
            { h: 520 },
            { size: 44, lineHeight: 1.2 },
          ),
        ],
        60,
      ),
      text(
        'corpo',
        'O mercado não está morrendo: executar é que virou comum. Pensar virou raro, e o raro é o que paga bem.',
        { x: M, y: 1080, w: IW, h: 280 },
        { size: 50, weight: 600, lineHeight: 1.25, color: 'destaque', underline: true },
      ),
    ]),
    callSlide(
      'Pensar também é ==trabalho==, e tem que ser pago.',
      'Por isso estou reunindo profissionais criativos durante dois dias para falar exatamente sobre isso.',
    ),
    blocksSlide('Quatro blocos práticos', BLOCKS),
    offerSlide(4, '“O próximo nível não está na ferramenta”'),
  ],
}

// ---------------------------------------------------------------------------
// 3. Análise em Capítulos
// ---------------------------------------------------------------------------

type Tone = 'claro' | 'escuro'
const fgOf = (t: Tone): ColorRef => (t === 'claro' ? 'fundo' : 'texto')
const bgOf = (t: Tone): ColorRef => (t === 'claro' ? 'texto' : 'fundo')
const kicker = (t: string, tone: Tone) =>
  text(
    'rotulo',
    t,
    { x: M, y: 110, w: IW, h: 40 },
    { size: 26, weight: 700, uppercase: true, letterSpacing: -0.01, color: fgOf(tone) },
  )
const body = (tone: Tone, p: Partial<TextStyle> = {}): Partial<TextStyle> => ({
  size: 46,
  lineHeight: 1.2,
  letterSpacing: -0.015,
  color: fgOf(tone),
  ...p,
})

function chapterImageTop(
  name: string,
  tone: Tone,
  k: string,
  a: string,
  b: string,
  note: string,
): Slide {
  const fg = fgOf(tone)
  return slide(name, bgOf(tone), [
    hdr(fg),
    kicker(k, tone),
    img(1, { x: M, y: 170, w: IW, h: 560 }, { radius: 12 }),
    stack(
      { x: M, y: 780, w: IW, h: 600 },
      'top',
      [
        text('titulo', a, { h: 160 }, body(tone)),
        text('subtitulo', b, { h: 160 }, body(tone)),
        line({ w: 64 }, fg, 0.8, 3),
        text('corpo', note, { h: 100 }, serif({ color: fg })),
      ],
      26,
    ),
  ])
}

function chapterImageMid(
  name: string,
  tone: Tone,
  k: string,
  a: string,
  b: string,
  note: string,
): Slide {
  const fg = fgOf(tone)
  return slide(name, bgOf(tone), [
    hdr(fg),
    kicker(k, tone),
    stack(
      { x: M, y: 170, w: IW, h: 540 },
      'top',
      [text('titulo', a, { h: 120 }, body(tone)), text('subtitulo', b, { h: 220 }, body(tone))],
      22,
    ),
    img(1, { x: M, y: 740, w: IW, h: 500 }, { radius: 12 }),
    text('corpo', note, { x: M, y: 1270, w: IW, h: 110 }, serif({ size: 32, color: fg })),
  ])
}

export const analiseCapitulos: Template = {
  id: 'analise-capitulos',
  name: 'Análise em Capítulos',
  description:
    'Análise de um caso em capítulos numerados, alternando slides claros e escuros, com foto em cada etapa.',
  funnel: 'meio',
  ...BASE,
  slides: [
    slide('Capa', 'fundo', [
      fullImage(1, H),
      gradient({ from: 0.4, to: 0.95, opacity: 0.9 }, H),
      hdr('hook'),
      stack(
        { x: M, y: 760, w: IW, h: 620 },
        'bottom',
        [
          text(
            'rotulo',
            '***A marca** lança seu novo produto depois do rebranding',
            { h: 40 },
            { size: 28, align: 'center', color: 'hook' },
          ),
          text(
            'hook',
            'O rebranding mais polêmico da década tinha um plano?',
            { h: 260 },
            T({ size: 78, lineHeight: 1.05, align: 'center', color: 'hook' }),
          ),
          text(
            'subhook',
            'Por trás do meme existe uma decisão de negócio que pouca gente analisou.',
            { h: 100 },
            serif({ size: 38, lineHeight: 1.12, align: 'center', color: 'hook' }),
          ),
        ],
        22,
      ),
    ]),
    chapterImageTop(
      'Capítulo 1',
      'claro',
      '01. O que aconteceu?',
      'A marca apresentou o primeiro produto depois de mudar toda a identidade visual.',
      'É a primeira entrega depois do rebrand **que virou meme na internet**.',
      'E os comentários seguem divididos: “perdeu a essência” × “o futuro é isso”.',
    ),
    chapterImageTop(
      'Capítulo 2',
      'escuro',
      '02. O erro de quase todo mundo',
      'A maioria está discutindo se ficou bonito ou feio.',
      'Só que estratégia de marca não se avalia pelo gosto. Se avalia pelo processo.',
      'A análise passa por quatro lentes: negócio, audiência, valor e história.',
    ),
    chapterImageMid(
      'Capítulo 3',
      'claro',
      '03. O negócio',
      'Antes de ser uma decisão de marca, foi uma decisão de **negócio**.',
      'A empresa já tinha decidido vender menos, cobrar mais e sair da briga por volume com as concorrentes tradicionais.',
      '* Branding vem depois do negócio. O rebrand só traduz uma mudança que já tinha sido decidida.',
    ),
    chapterImageMid(
      'Capítulo 4',
      'escuro',
      '04. A audiência',
      'O cliente clássico da marca era mais velho e conservador.',
      'O público novo é mais jovem, tem mais dinheiro e é mais ligado em tecnologia. A comunicação foi feita **para ele**.',
      '* Escolher um público não impede ninguém de comprar. Só define com quem a marca vai falar.',
    ),
    chapterImageMid(
      'Capítulo 5',
      'claro',
      '05. O valor',
      'Já existem **muitas marcas prometendo** a mesma coisa no mesmo segmento.',
      'A liderança resumiu assim: “ser igual aos concorrentes faria a **marca sumir** no meio deles”.',
      '* O verdadeiro concorrente é a poluição conceitual: um mercado cheio de opções parecidas.',
    ),
    slide('Capítulo 6', 'texto', [
      hdr('fundo'),
      kicker('06. A história', 'claro'),
      stack(
        { x: M, y: 170, w: IW, h: 640 },
        'top',
        [
          text(
            'titulo',
            'A marca contou a história antes de mostrar o produto.',
            { h: 120 },
            body('claro'),
          ),
          text(
            'subtitulo',
            'Foi uma **narrativa sem prova real**. Por isso a internet preencheu o vazio com memes.',
            { h: 220 },
            body('claro'),
          ),
          text(
            'corpo',
            'Agora o produto traz a prova: o nome, as proporções e os detalhes conversam com a história da marca.',
            { h: 140 },
            serif({ color: 'fundo' }),
          ),
        ],
        22,
      ),
      img(1, { x: M, y: 850, w: 470, h: 260 }, { radius: 10 }),
      img(2, { x: 546, y: 850, w: 470, h: 260 }, { radius: 10 }),
      img(3, { x: M, y: 1124, w: 470, h: 260 }, { radius: 10 }),
      img(4, { x: 546, y: 1124, w: 470, h: 260 }, { radius: 10 }),
    ]),
    slide('Capítulo 7', 'fundo', [
      hdr(),
      kicker('07. O que a análise mostra', 'escuro'),
      stack(
        { x: M, y: 170, w: IW, h: 740 },
        'top',
        [
          text(
            'titulo',
            'O problema nunca foi a ousadia. Foi a ordem das etapas.',
            { h: 120 },
            body('escuro'),
          ),
          text(
            'subtitulo',
            'A marca mostrou a história antes de provar o valor. Não existe branding sem produto.',
            { h: 160 },
            body('escuro'),
          ),
          line({ w: 64 }, 'texto', 0.8, 3),
          text(
            'corpo',
            'Se vai dar certo, o mercado responde quando as entregas começarem. Mas agora a estratégia tem um produto para sustentar.',
            { h: 140 },
            serif(),
          ),
        ],
        26,
      ),
      img(1, { x: M, y: 960, w: IW, h: 520 }, { radius: 12 }),
    ]),
    slide('Método', 'fundo', [
      hdr(),
      kicker('08. O método', 'escuro'),
      stack(
        { x: M, y: 170, w: IW, h: 620 },
        'top',
        [
          text('titulo', 'Toda marca forte foi decidida antes do logo.', { h: 60 }, body('escuro')),
          text(
            'subtitulo',
            'Vale para a clínica, o restaurante ou a marca de roupa que você atende hoje.',
            { h: 110 },
            body('escuro'),
          ),
          text(
            'corpo',
            'No **workshop**, você aprende a aplicar o método no seu próximo projeto.',
            { h: 110 },
            body('escuro'),
          ),
        ],
        26,
      ),
      {
        ...rect({ x: M, y: 860, w: IW, h: 480 }, 'fundo-alt', 16),
        stroke: { color: 'texto', width: 2 },
      },
      text(
        'rotulo',
        'Constante iteração',
        { x: 104, y: 920, w: 520, h: 40 },
        { size: 22, weight: 700, uppercase: true, color: 'destaque' },
      ),
      text(
        'corpo',
        'Um método testado em anos de projetos de marca.',
        { x: 104, y: 970, w: 520, h: 200 },
        T({ size: 46, lineHeight: 1.1 }),
      ),
      text(
        'corpo',
        '* E muitos processos estratégicos depois.',
        { x: 104, y: 1200, w: 520, h: 100 },
        serif({ size: 32 }),
      ),
      text(
        undefined,
        'NEGÓCIO\nAUDIÊNCIA\nVALOR\nHISTÓRIA',
        { x: 660, y: 960, w: 330, h: 300 },
        { size: 44, weight: 700, lineHeight: 1.15, color: 'texto-suave' },
      ),
    ]),
    offerSlide(5, '“Da prospecção à entrega”'),
  ],
}
