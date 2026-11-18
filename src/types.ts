export type FunnelStage = 'topo' | 'meio' | 'fundo'
export type Format = '4:5' | '3:4' | '1:1' | '9:16'

/** Tokens de cor. Os elementos apontam para tokens; a paleta do carrossel define a cor real. */
export type ColorToken =
  | 'fundo'
  | 'fundo-alt'
  | 'texto'
  | 'texto-suave'
  | 'destaque'
  | 'apoio'
  | 'hook'
  | 'meta'
export type Palette = Record<ColorToken, string>
/** Um token ou uma cor CSS literal (#hex, rgba...). */
export type ColorRef = ColorToken | (string & {})

export type FontRole = 'titulo' | 'corpo'
export interface Fonts {
  titulo: string
  corpo: string
}

/** Papel de autofill: define a ordem em que as linhas coladas/geradas preenchem o template. */
export type TextRole = 'hook' | 'subhook' | 'rotulo' | 'titulo' | 'subtitulo' | 'corpo' | 'cta'
export type GlobalField = 'brandName' | 'handle' | 'copyright' | 'tagline'

export interface Globals {
  brandName: string
  handle: string
  copyright: string
  /** Assinatura curta do perfil (ex.: "Estratégia de Marca\ne Negócios"). */
  tagline?: string
  avatar?: string
  logo?: string
  verified: boolean
}

export type HighlightMode = 'cor' | 'fundo' | 'sublinhado' | 'gradiente'
export interface HighlightStyle {
  mode: HighlightMode
  color: ColorRef
}

export interface TextStyle {
  /** "titulo" | "corpo" (fontes do carrossel) ou o nome de uma família. */
  font: FontRole | (string & {})
  size: number
  weight: number
  lineHeight: number
  /** Em "em" (ex.: -0.02). */
  letterSpacing: number
  align: 'left' | 'center' | 'right' | 'justify'
  uppercase?: boolean
  italic?: boolean
  underline?: boolean
  color: ColorRef
  /** Cor e modo do destaque só neste texto (ex.: slide com fundo da cor de destaque). */
  highlight?: ColorRef
  highlightMode?: HighlightMode
}

interface ElementBase {
  id: string
  x: number
  y: number
  w: number
  h: number
  hidden?: boolean
  opacity?: number
  /** Ocupa o canvas inteiro (inclusive a área extra do 9:16). */
  fullBleed?: boolean
  /** Rotação em graus (sentido horário). */
  rotate?: number
}

export interface TextElement extends ElementBase {
  type: 'text'
  text: string
  role?: TextRole
  order?: number
  global?: GlobalField
  style: TextStyle
}

export interface ImageElement extends ElementBase {
  type: 'image'
  /** Número do slot (1, 2, 3...) usado pelo upload em lote. */
  slot?: number
  src?: string
  fit: 'cover' | 'contain'
  radius: number
  zoom: number
  /** Enquadramento em % (0-100), como object-position. */
  posX: number
  posY: number
  /** Foto em preto e branco. */
  grayscale?: boolean
}

export interface GradientFill {
  color: ColorRef
  /** 0-1: onde o gradiente começa e termina (de cima para baixo). */
  from: number
  to: number
  opacity: number
  /** "radial" = brilho circular centrado em (cx, cy), em %. */
  direction: 'down' | 'up' | 'left' | 'right' | 'radial'
  cx?: number
  cy?: number
}

export interface ShapeElement extends ElementBase {
  type: 'shape'
  fill?: ColorRef
  gradient?: GradientFill
  radius: number
  /** Borda (ex.: cartões com contorno). */
  stroke?: { color: ColorRef; width: number; style?: 'solid' | 'dashed' | 'dotted' }
  /** Textura de fundo. */
  pattern?: { kind: 'pontos' | 'grade' | 'triangulos'; color: ColorRef; size: number }
}

/** Indicador automático da página: "02 / 08", "02" ou quadradinhos de progresso. */
export interface CounterElement extends ElementBase {
  type: 'counter'
  variant: 'numero' | 'indice' | 'quadrados'
  fontSize: number
  color: ColorRef
  font?: FontRole | (string & {})
  align: 'left' | 'center' | 'right'
}

/** Rabisco feito à mão (seta, sublinhado, círculo). Estica para caber na caixa. */
export interface DoodleElement extends ElementBase {
  type: 'doodle'
  kind: 'seta-curva' | 'seta' | 'sublinhado' | 'circulo'
  color: ColorRef
  strokeWidth: number
  /** Espelha na horizontal. */
  flip?: boolean
}

/** Logo da marca (imagem enviada nos Campos globais ou, sem imagem, o nome da marca). */
export interface LogoElement extends ElementBase {
  type: 'logo'
  fontSize: number
  color: ColorRef
  align: 'left' | 'center' | 'right'
}

export type CardIcon =
  | 'check'
  | 'imagem'
  | 'camera'
  | 'olho'
  | 'robo'
  | 'pessoas'
  | 'chip'
  | 'selo'
  | 'link'
  | 'balanca'
  | 'chat'
  | 'lupa'
  | 'raio'
  | 'seta'
  | 'alerta'
  | 'estrela'
  | 'grafico'

/** Caixa com texto (e ícone ou número opcional). O texto entra no preenchimento automático. */
export interface CardElement extends ElementBase {
  type: 'card'
  text: string
  role?: TextRole
  order?: number
  icon?: CardIcon
  /** Número ou letra num quadradinho à esquerda (ex.: "1"). */
  badge?: string
  fill: ColorRef
  stroke?: { color: ColorRef; width: number }
  textColor: ColorRef
  iconColor: ColorRef
  fontSize: number
  lineHeight: number
  weight: number
  radius: number
  padding: number
  align: 'left' | 'center'
  /** Vidro fosco (para cartões sobre foto). */
  glass?: boolean
}

export interface ProfileElement extends ElementBase {
  type: 'profile'
  avatarSize: number
  showName: boolean
  showHandle: boolean
  fontSize: number
  color: ColorRef
  align: 'left' | 'center'
}

export interface HeaderElement extends ElementBase {
  type: 'header'
  fontSize: number
  color: ColorRef
  /** "colunas": @ · marca · copyright. "assinatura": tagline à esquerda e copyright à direita. */
  variant?: 'colunas' | 'assinatura'
}

/** Rodapé com pílulas: @ do perfil, nome da marca e seta de "arrasta". */
export interface FooterElement extends ElementBase {
  type: 'footer'
  fontSize: number
  color: ColorRef
  accent: ColorRef
  showArrow: boolean
}

export type CtaIcon =
  | 'seta'
  | 'seta-longa'
  | 'salvar'
  | 'compartilhar'
  | 'curtir'
  | 'comentar'
  | 'link'
  | 'nenhum'
export interface CtaElement extends ElementBase {
  type: 'cta'
  label: string
  /** Entra no autofill ("Colar texto" / Otto) como papel CTA. */
  role?: TextRole
  order?: number
  icon: CtaIcon
  variant: 'solido' | 'contorno' | 'glass'
  color: ColorRef
  textColor: ColorRef
  fontSize: number
  align: 'left' | 'center' | 'right'
}

/** Coluna que empilha elementos (ex.: perfil + hook + subhook ancorados embaixo). */
export interface StackElement extends ElementBase {
  type: 'stack'
  anchor: 'top' | 'center' | 'bottom'
  gap: number
  children: LeafElement[]
}

export type LeafElement =
  | TextElement
  | CardElement
  | ImageElement
  | ShapeElement
  | ProfileElement
  | HeaderElement
  | FooterElement
  | LogoElement
  | CounterElement
  | DoodleElement
  | CtaElement

/** Elementos com texto preenchível (papel de autofill). */
export type FillableElement = TextElement | CardElement | CtaElement
export type SlideElement = LeafElement | StackElement

export interface Slide {
  id: string
  name: string
  background: ColorRef
  /** Multiplicador da opacidade dos gradientes do slide (0-1). */
  gradientStrength: number
  elements: SlideElement[]
}

export interface Template {
  id: string
  name: string
  description: string
  funnel: FunnelStage
  /** Templates escuros invertem fundo/texto do Brand Kit. */
  mode: 'claro' | 'escuro'
  fonts?: Partial<Fonts>
  highlight?: HighlightStyle
  paletteOverrides?: Partial<Palette>
  /** Cores-base próprias do template (substituem as do Brand Kit antes de gerar a paleta). */
  colors?: Partial<BrandKit['colors']>
  /** Proporção em que o template foi desenhado (padrão 4:5 = 1080×1350). */
  format?: Exclude<Format, '9:16'>
  slides: Slide[]
}

export interface Carousel {
  id: string
  projectId: string
  name: string
  templateId: string
  brandKitId?: string
  funnel: FunnelStage
  format: Format
  /** Proporção em que os slides foram desenhados; as outras proporções centralizam o conteúdo. */
  baseFormat?: Exclude<Format, '9:16'>
  palette: Palette
  fonts: Fonts
  globals: Globals
  highlight: HighlightStyle
  slides: Slide[]
  caption?: string
  createdAt: number
  updatedAt: number
  deletedAt?: number
  /** Ordem manual dentro do projeto. */
  position?: number
}

export interface Project {
  id: string
  name: string
  createdAt: number
}

export interface BrandKit {
  id: string
  name: string
  brandName: string
  handle: string
  copyright: string
  tagline?: string
  colors: { fundo: string; texto: string; destaque: string; apoio?: string }
  fonts: Fonts
  logo?: string
  avatar?: string
  verified: boolean
  isDefault: boolean
}

export interface CustomFont {
  id: string
  family: string
  /** Endereço do arquivo da fonte (no Skip Cloud). */
  dataUrl: string
}

export interface Settings {
  exportsCount: number
  onboardingDismissed?: boolean
}

export type VersionReason = 'manual' | 'ia' | 'texto' | 'template' | 'restauracao'
export interface Version {
  id: string
  at: number
  reason: VersionReason
  label: string
  snapshot: Pick<
    Carousel,
    | 'slides'
    | 'palette'
    | 'fonts'
    | 'globals'
    | 'highlight'
    | 'templateId'
    | 'format'
    | 'baseFormat'
  >
}
