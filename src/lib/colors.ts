import type { BrandKit, ColorRef, ColorToken, Palette, Template } from '../types'

export const COLOR_TOKENS: { token: ColorToken; label: string; hint: string }[] = [
  { token: 'fundo', label: 'Fundo', hint: 'fundo dos slides' },
  { token: 'fundo-alt', label: 'Fundo alternativo', hint: 'slides intercalados' },
  { token: 'texto', label: 'Texto', hint: 'títulos e textos' },
  { token: 'texto-suave', label: 'Texto suave', hint: 'subtítulos' },
  { token: 'destaque', label: 'Destaque', hint: 'palavras em destaque, botões' },
  { token: 'apoio', label: 'Cor de apoio', hint: 'slides coloridos, detalhes' },
  { token: 'hook', label: 'Texto sobre foto', hint: 'capa e slides com foto' },
  { token: 'meta', label: 'Metadados', hint: '@, cabeçalho, rodapé' },
]

const TOKENS = new Set<string>(COLOR_TOKENS.map((t) => t.token))

export function isToken(ref: ColorRef): ref is ColorToken {
  return TOKENS.has(ref)
}

export const DEFAULT_APOIO = '#2E4BE0'

export function resolveColor(
  ref: ColorRef | undefined,
  palette: Palette,
  fallback = '#000000',
): string {
  if (!ref) return fallback
  if (!isToken(ref)) return ref
  // Carrosséis antigos podem não ter tokens criados depois (ex.: "apoio").
  return palette[ref] ?? (ref === 'apoio' ? DEFAULT_APOIO : fallback)
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim()
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  const n = parseInt(h.slice(0, 6), 16)
  if (Number.isNaN(n)) return [0, 0, 0]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex([r, g, b]: [number, number, number]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
}

/** Mistura duas cores hex. t=0 → a, t=1 → b. */
export function mix(a: string, b: string, t: number) {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return rgbToHex([0, 1, 2].map((i) => ca[i] + (cb[i] - ca[i]) * t) as [number, number, number])
}

export function withAlpha(hex: string, alpha: number) {
  if (!hex.startsWith('#')) return hex
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const DEFAULT_KIT_COLORS = {
  fundo: '#F4F1EA',
  texto: '#141414',
  destaque: '#F2C230',
  apoio: DEFAULT_APOIO,
}

/** Gera a paleta completa (7 tokens) a partir das 3 cores do Brand Kit. */
export function paletteFromColors(
  colors: BrandKit['colors'],
  mode: Template['mode'] = 'claro',
  overrides?: Partial<Palette>,
): Palette {
  const light = luminance(colors.fundo) > luminance(colors.texto) ? colors.fundo : colors.texto
  const dark = light === colors.fundo ? colors.texto : colors.fundo
  const fundo = mode === 'claro' ? light : dark
  const texto = mode === 'claro' ? dark : light
  return {
    fundo,
    'fundo-alt': mix(fundo, texto, mode === 'claro' ? 0.07 : 0.1),
    texto,
    'texto-suave': mix(texto, fundo, 0.32),
    destaque: colors.destaque,
    apoio: colors.apoio ?? DEFAULT_APOIO,
    hook: '#FFFFFF',
    meta: mode === 'claro' ? mix(texto, fundo, 0.25) : mix(texto, fundo, 0.2),
    ...overrides,
  }
}
