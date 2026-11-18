/** Nome exibido no app. Troque pelo nome da sua marca. */
export const APP_NAME = 'Adapta Skip Studio'

/** Tamanho base dos slides (px). */
export const CANVAS_W = 1080
export const CANVAS_H = 1350
export const CANVAS_H_STORY = 1920
/** Altura de cada proporção (largura sempre 1080). */
export const FORMAT_HEIGHT = { '4:5': 1350, '3:4': 1440, '1:1': 1080, '9:16': 1920 } as const

/** Fontes do Google Fonts disponíveis no seletor, com os pesos que existem em cada uma. */
export const FONT_LIST: {
  family: string
  weights: number[]
  category: 'sans' | 'serif' | 'display' | 'mono' | 'hand'
}[] = [
  { family: 'Inter', weights: [300, 400, 500, 600, 700, 800, 900], category: 'sans' },
  { family: 'Inter Tight', weights: [300, 400, 500, 600, 700, 800, 900], category: 'sans' },
  { family: 'Urbanist', weights: [300, 400, 500, 600, 700, 800, 900], category: 'sans' },
  { family: 'Instrument Sans', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Plus Jakarta Sans', weights: [300, 400, 500, 600, 700, 800], category: 'sans' },
  { family: 'Manrope', weights: [300, 400, 500, 600, 700, 800], category: 'sans' },
  { family: 'Montserrat', weights: [300, 400, 500, 600, 700, 800, 900], category: 'sans' },
  { family: 'Poppins', weights: [300, 400, 500, 600, 700, 800, 900], category: 'sans' },
  { family: 'Outfit', weights: [300, 400, 500, 600, 700, 800, 900], category: 'sans' },
  { family: 'Figtree', weights: [300, 400, 500, 600, 700, 800, 900], category: 'sans' },
  { family: 'Work Sans', weights: [300, 400, 500, 600, 700, 800, 900], category: 'sans' },
  { family: 'Archivo', weights: [300, 400, 500, 600, 700, 800, 900], category: 'sans' },
  { family: 'Space Grotesk', weights: [300, 400, 500, 600, 700], category: 'sans' },
  { family: 'Bricolage Grotesque', weights: [300, 400, 500, 600, 700, 800], category: 'sans' },
  { family: 'Libre Franklin', weights: [300, 400, 500, 600, 700, 800, 900], category: 'sans' },
  { family: 'Raleway', weights: [300, 400, 500, 600, 700, 800, 900], category: 'sans' },
  { family: 'Rubik', weights: [300, 400, 500, 600, 700, 800, 900], category: 'sans' },
  { family: 'Lexend', weights: [300, 400, 500, 600, 700, 800, 900], category: 'sans' },
  { family: 'Roboto', weights: [300, 400, 500, 700, 900], category: 'sans' },
  { family: 'Roboto Condensed', weights: [300, 400, 700], category: 'sans' },
  { family: 'Barlow Condensed', weights: [300, 400, 500, 600, 700, 800, 900], category: 'display' },
  { family: 'Oswald', weights: [300, 400, 500, 600, 700], category: 'display' },
  { family: 'Anton', weights: [400], category: 'display' },
  { family: 'Bebas Neue', weights: [400], category: 'display' },
  { family: 'League Gothic', weights: [400], category: 'display' },
  { family: 'Archivo Black', weights: [400], category: 'display' },
  {
    family: 'Big Shoulders Display',
    weights: [300, 400, 500, 600, 700, 800, 900],
    category: 'display',
  },
  { family: 'Unbounded', weights: [300, 400, 500, 600, 700, 800, 900], category: 'display' },
  { family: 'Syne', weights: [400, 500, 600, 700, 800], category: 'display' },
  { family: 'Playfair Display', weights: [400, 500, 600, 700, 800, 900], category: 'serif' },
  { family: 'DM Serif Display', weights: [400], category: 'serif' },
  { family: 'Instrument Serif', weights: [400], category: 'serif' },
  { family: 'Fraunces', weights: [300, 400, 500, 600, 700, 800, 900], category: 'serif' },
  { family: 'Lora', weights: [400, 500, 600, 700], category: 'serif' },
  { family: 'Merriweather', weights: [300, 400, 700, 900], category: 'serif' },
  { family: 'Space Mono', weights: [400, 700], category: 'mono' },
  { family: 'JetBrains Mono', weights: [300, 400, 500, 600, 700, 800], category: 'mono' },
  { family: 'Libre Baskerville', weights: [400, 700], category: 'serif' },
  { family: 'Caveat', weights: [400, 500, 600, 700], category: 'hand' },
]
