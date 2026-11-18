import type {
  FillableElement,
  ImageElement,
  LeafElement,
  Slide,
  SlideElement,
  StackElement,
} from '../types'
import { uid } from './id'

export function isFillable(el: LeafElement): el is FillableElement {
  // CTA entra no autofill pelo `label` (papel cta), senão o botão fica com o texto do template.
  return el.type === 'text' || el.type === 'card' || el.type === 'cta'
}

/** Percorre todos os elementos de um slide (inclusive filhos de stacks), na ordem visual. */
export function walk(slide: Slide, fn: (el: LeafElement, parent?: StackElement) => void) {
  for (const el of slide.elements) {
    if (el.type === 'stack') el.children.forEach((c) => fn(c, el))
    else fn(el)
  }
}

export function allLeaves(slide: Slide): LeafElement[] {
  const out: LeafElement[] = []
  walk(slide, (el) => out.push(el))
  return out
}

export function findElement(slide: Slide, id: string): SlideElement | undefined {
  for (const el of slide.elements) {
    if (el.id === id) return el
    if (el.type === 'stack') {
      const child = el.children.find((c) => c.id === id)
      if (child) return child
    }
  }
  return undefined
}

/** Atualiza um elemento (imutável). */
export function updateElement(
  slide: Slide,
  id: string,
  patch: (el: SlideElement) => SlideElement,
): Slide {
  return {
    ...slide,
    elements: slide.elements.map((el) => {
      if (el.id === id) return patch(el)
      if (el.type === 'stack' && el.children.some((c) => c.id === id)) {
        return {
          ...el,
          children: el.children.map((c) => (c.id === id ? (patch(c) as LeafElement) : c)),
        }
      }
      return el
    }),
  }
}

/** Aplica uma transformação a todas as folhas de todos os slides. */
export function mapLeaves(slides: Slide[], fn: (el: LeafElement) => LeafElement): Slide[] {
  return slides.map((s) => ({
    ...s,
    elements: s.elements.map((el) =>
      el.type === 'stack' ? { ...el, children: el.children.map(fn) } : fn(el),
    ),
  }))
}

/** Clona slides gerando ids novos (para instanciar templates e duplicar slides). */
export function cloneSlides(slides: Slide[]): Slide[] {
  return structuredClone(slides).map((s) => ({
    ...s,
    id: uid('s_'),
    elements: s.elements.map((el) =>
      el.type === 'stack'
        ? { ...el, id: uid('e_'), children: el.children.map((c) => ({ ...c, id: uid('e_') })) }
        : { ...el, id: uid('e_') },
    ),
  }))
}

/**
 * Renumera a ordem dos textos com papel e dos slots de imagem seguindo a ordem dos slides.
 * Chamado depois de reordenar, duplicar, adicionar ou excluir slides.
 */
export function renumber(slides: Slide[]): Slide[] {
  let order = 0
  let slot = 0
  return mapLeaves(slides, (el) => {
    // CTA sem role explícito ainda participa do autofill (papel cta).
    if (el.type === 'cta' && !el.hidden) return { ...el, role: el.role ?? 'cta', order: ++order }
    if (isFillable(el) && el.role) return { ...el, order: ++order }
    if (el.type === 'image' && el.slot !== undefined) return { ...el, slot: ++slot } as ImageElement
    return el
  })
}

export function imageSlots(slides: Slide[]) {
  const out: { slideIndex: number; el: ImageElement }[] = []
  slides.forEach((s, slideIndex) =>
    walk(s, (el) => {
      if (el.type === 'image' && el.slot !== undefined) out.push({ slideIndex, el })
    }),
  )
  return out.sort((a, b) => (a.el.slot ?? 0) - (b.el.slot ?? 0))
}
