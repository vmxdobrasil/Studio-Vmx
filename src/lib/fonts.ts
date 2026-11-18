import { FONT_LIST } from '../config'
import type { CustomFont, Fonts, TextStyle } from '../types'
import { assetUrl } from './assets'

const loaded = new Map<string, Promise<void>>()
let customFamilies = new Set<string>()

/** Carrega uma fonte do Google Fonts (uma vez). Fontes próprias já vêm registradas. */
export function ensureFont(family: string): Promise<void> {
  if (!family || customFamilies.has(family)) return Promise.resolve()
  const existing = loaded.get(family)
  if (existing) return existing

  const known = FONT_LIST.find((f) => f.family === family)
  const weights = known?.weights ?? [400, 700]
  const fam = family.trim().replace(/ /g, '+')
  const withWeights = `https://fonts.googleapis.com/css2?family=${fam}:ital,wght@${[0, 1]
    .flatMap((ital) => weights.map((w) => `${ital},${w}`))
    .join(';')}&display=swap`
  const plain = `https://fonts.googleapis.com/css2?family=${fam}&display=swap`

  // Nem toda fonte tem itálico: se a URL com pesos falhar, tenta sem itálico e depois só o regular.
  const noItalic = `https://fonts.googleapis.com/css2?family=${fam}:wght@${weights.join(';')}&display=swap`

  const p = new Promise<void>((resolve) => {
    const linkWith = (href: string, fallbacks: string[]) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      // crossorigin permite que o export leia as regras @font-face para embutir as fontes.
      link.crossOrigin = 'anonymous'
      link.dataset.font = family
      link.onload = () => {
        document.fonts.load(`400 32px "${family}"`).finally(() => resolve())
      }
      link.onerror = () => {
        link.remove()
        const [next, ...rest] = fallbacks
        if (next) linkWith(next, rest)
        else resolve()
      }
      document.head.appendChild(link)
    }
    linkWith(withWeights, [noItalic, plain])
  })
  loaded.set(family, p)
  return p
}

/** Registra as fontes enviadas pelo usuário via @font-face (embutíveis no export). */
export function registerCustomFonts(fonts: CustomFont[]) {
  customFamilies = new Set(fonts.map((f) => f.family))
  let style = document.getElementById('custom-fonts') as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = 'custom-fonts'
    document.head.appendChild(style)
  }
  style.textContent = fonts
    .map(
      (f) =>
        `@font-face{font-family:"${f.family}";src:url(${assetUrl(f.dataUrl)});font-display:block;}`,
    )
    .join('\n')
}

export function resolveFontFamily(font: TextStyle['font'], fonts: Fonts) {
  if (font === 'titulo') return fonts.titulo
  if (font === 'corpo') return fonts.corpo
  return font
}

export function cssFontStack(family: string) {
  return `"${family}", "Inter", system-ui, sans-serif`
}

export function allFamilies(custom: CustomFont[]) {
  return [...custom.map((f) => f.family), ...FONT_LIST.map((f) => f.family)]
}

/** Nome da família a partir do nome do arquivo (ex.: "Minha-Fonte_Bold.woff2" → "Minha Fonte Bold"). */
export function fontFamilyFromFile(file: File) {
  return file.name
    .replace(/\.(woff2?|ttf|otf)$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
}
