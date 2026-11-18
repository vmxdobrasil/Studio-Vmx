import type {
  BrandKit,
  Carousel,
  Fonts,
  Globals,
  HighlightStyle,
  ImageElement,
  Slide,
  Template,
} from '../types'
import { applyLines, getSlots } from './autofill'
import { DEFAULT_KIT_COLORS, paletteFromColors } from './colors'
import { allLeaves, cloneSlides, imageSlots, mapLeaves, renumber } from './elements'
import { uid } from './id'

export const DEFAULT_FONTS: Fonts = { titulo: 'Inter', corpo: 'Inter' }
export const DEFAULT_HIGHLIGHT: HighlightStyle = { mode: 'cor', color: 'destaque' }

export function defaultGlobals(): Globals {
  return {
    brandName: 'Sua Marca',
    handle: '@seuperfil',
    copyright: `© ${new Date().getFullYear()}`,
    verified: true,
  }
}

/** Partes do carrossel que vêm do Brand Kit (ou do padrão, se não houver kit). */
export function brandParts(template: Template, kit?: BrandKit) {
  // Templates com identidade própria (ex.: cores de uma marca) sobrescrevem as cores-base do kit.
  const colors = { ...(kit?.colors ?? DEFAULT_KIT_COLORS), ...template.colors }
  const palette = paletteFromColors(colors, template.mode, template.paletteOverrides)
  // Fontes definidas pelo template fazem parte do visual dele e têm prioridade sobre as do kit.
  const fonts: Fonts = { ...(kit ? kit.fonts : DEFAULT_FONTS), ...template.fonts }
  const globals: Globals = kit
    ? {
        brandName: kit.brandName || 'Sua Marca',
        handle: kit.handle || '@seuperfil',
        copyright: kit.copyright || `© ${new Date().getFullYear()}`,
        tagline: kit.tagline,
        avatar: kit.avatar,
        logo: kit.logo,
        verified: kit.verified,
      }
    : defaultGlobals()
  return { palette, fonts, globals }
}

export function instantiateTemplate(
  template: Template,
  opts: { projectId: string; name: string; kit?: BrandKit },
): Carousel {
  const now = Date.now()
  const { palette, fonts, globals } = brandParts(template, opts.kit)
  return {
    id: uid('c_'),
    projectId: opts.projectId,
    name: opts.name,
    templateId: template.id,
    brandKitId: opts.kit?.id,
    funnel: template.funnel,
    format: template.format ?? '4:5',
    baseFormat: template.format ?? '4:5',
    palette,
    fonts,
    globals,
    highlight: template.highlight ?? DEFAULT_HIGHLIGHT,
    slides: renumber(cloneSlides(template.slides)),
    createdAt: now,
    updatedAt: now,
  }
}

/** Reaplica o Brand Kit num carrossel existente (cores, fontes e campos globais). */
export function applyKit(carousel: Carousel, template: Template, kit: BrandKit): Carousel {
  const { palette, fonts, globals } = brandParts(template, kit)
  return { ...carousel, palette, fonts, globals, brandKitId: kit.id }
}

/**
 * Ajusta a quantidade de slides mantendo capa e CTA quando possível.
 * Usado pelo Otto / novo carrossel quando o usuário escolhe quantos slides quer.
 */
export function resizeSlides(slides: Slide[], count: number): Slide[] {
  const n = Math.max(1, Math.min(12, Math.floor(count) || 1))
  if (slides.length === n) return slides

  if (slides.length > n) {
    if (n === 1) return renumber(cloneSlides([slides[0]]))
    const first = slides[0]
    const last = slides[slides.length - 1]
    const middle = slides.slice(1, -1)
    const needMiddle = Math.max(0, n - 2)
    const kept = [first, ...middle.slice(0, needMiddle)]
    if (kept.length < n) kept.push(last)
    return renumber(cloneSlides(kept.slice(0, n)))
  }

  const out = cloneSlides(slides)
  const donorIdx = out.length >= 2 ? out.length - 2 : 0
  while (out.length < n) {
    const [copy] = cloneSlides([out[donorIdx] ?? out[0]])
    copy.name = `Slide ${out.length + 1}`
    const last = out[out.length - 1]
    const lastIsCta = allLeaves(last).some(
      (el) => el.type === 'cta' || (el.type !== 'image' && 'role' in el && el.role === 'cta'),
    )
    if (lastIsCta && out.length >= 2) out.splice(out.length - 1, 0, copy)
    else out.push(copy)
  }
  return renumber(out)
}

/** Troca o template mantendo o texto (na ordem dos campos) e as imagens (por slot). */
export function swapTemplate(carousel: Carousel, template: Template): Carousel {
  const lines = getSlots(carousel.slides).map((s) => s.text)
  const images = imageSlots(carousel.slides).map((s) => s.el)
  let slides = renumber(cloneSlides(template.slides))
  slides = applyLines(slides, lines).slides
  slides = mapLeaves(slides, (el) => {
    if (el.type !== 'image' || el.slot === undefined) return el
    const old = images[el.slot - 1]
    return old?.src
      ? ({ ...el, src: old.src, posX: old.posX, posY: old.posY, zoom: old.zoom } as ImageElement)
      : el
  })
  return {
    ...carousel,
    templateId: template.id,
    funnel: template.funnel,
    format: template.format ?? '4:5',
    baseFormat: template.format ?? '4:5',
    fonts: { ...carousel.fonts, ...template.fonts },
    palette: paletteFromColors(
      {
        fundo: carousel.palette.fundo,
        texto: carousel.palette.texto,
        destaque: carousel.palette.destaque,
        apoio: carousel.palette.apoio,
        ...template.colors,
      },
      template.mode,
      template.paletteOverrides,
    ),
    highlight: template.highlight ?? carousel.highlight,
    slides,
  }
}
