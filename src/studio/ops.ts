import { cloneSlides, findElement, renumber, updateElement } from '../lib/elements'
import { uid } from '../lib/id'
import { useApp } from '../store/app'
import { useEditor } from '../store/editor'
import type { Carousel, ImageElement, LeafElement, Slide, SlideElement } from '../types'

/** Carrossel aberto no Studio. */
export function useCurrent() {
  const id = useEditor((s) => s.carouselId)
  return useApp((s) => (id ? s.carousels[id] : undefined))
}

export function current(): Carousel | undefined {
  const id = useEditor.getState().carouselId
  return id ? useApp.getState().carousels[id] : undefined
}

export function update(fn: (c: Carousel) => Carousel, key?: string) {
  const c = current()
  if (c) useEditor.getState().commit(fn(c), key)
}

export function updateSlide(index: number, fn: (s: Slide) => Slide, key?: string) {
  update((c) => ({ ...c, slides: c.slides.map((s, i) => (i === index ? fn(s) : s)) }), key)
}

export function updateEl<T extends SlideElement>(
  slideIndex: number,
  id: string,
  fn: (el: T) => T,
  key?: string,
) {
  updateSlide(slideIndex, (s) => updateElement(s, id, (el) => fn(el as T)), key)
}

export function selectedElement(): { slideIndex: number; el: SlideElement } | undefined {
  const c = current()
  const { slideIndex, selectedId } = useEditor.getState()
  if (!c || !selectedId) return
  const el = findElement(c.slides[slideIndex], selectedId)
  return el ? { slideIndex, el } : undefined
}

/** Stack que contém o elemento (para mover o grupo inteiro). */
export function parentStack(slide: Slide, childId: string) {
  return slide.elements.find((e) => e.type === 'stack' && e.children.some((c) => c.id === childId))
}

// --- Slides -----------------------------------------------------------------

export function duplicateSlide(index: number) {
  update((c) => {
    const [copy] = cloneSlides([c.slides[index]])
    const slides = [...c.slides]
    slides.splice(index + 1, 0, { ...copy, name: `${c.slides[index].name} (cópia)` })
    return { ...c, slides: renumber(slides) }
  })
  useEditor.getState().selectSlide(index + 1)
}

export function deleteSlide(index: number) {
  const c = current()
  if (!c || c.slides.length <= 1) return
  update((c) => ({ ...c, slides: renumber(c.slides.filter((_, i) => i !== index)) }))
  useEditor.getState().selectSlide(Math.max(0, Math.min(index, c.slides.length - 2)))
}

export function moveSlide(from: number, to: number) {
  const c = current()
  if (!c || to < 0 || to >= c.slides.length || from === to) return
  update((c) => {
    const slides = [...c.slides]
    const [s] = slides.splice(from, 1)
    slides.splice(to, 0, s)
    return { ...c, slides: renumber(slides) }
  })
  useEditor.getState().selectSlide(to)
}

export function insertSlide(slide: Slide, at: number) {
  update((c) => {
    const [copy] = cloneSlides([slide])
    const slides = [...c.slides]
    slides.splice(at, 0, copy)
    return { ...c, slides: renumber(slides) }
  })
  useEditor.getState().selectSlide(at)
}

export function blankSlide(): Slide {
  return {
    id: uid('s_'),
    name: 'Slide em branco',
    background: 'fundo',
    gradientStrength: 1,
    elements: [],
  }
}

// --- Imagens ----------------------------------------------------------------

/** Coloca uma imagem no elemento indicado ou no primeiro slot vazio (do slide atual, depois de todos). */
export function placeImage(src: string, target?: { slideIndex: number; id: string }) {
  const c = current()
  if (!c) return false
  let dest = target
  if (!dest) {
    const { slideIndex, selectedId } = useEditor.getState()
    const sel = selectedId ? findElement(c.slides[slideIndex], selectedId) : undefined
    if (sel?.type === 'image') dest = { slideIndex, id: sel.id }
  }
  if (!dest) {
    const order = [useEditor.getState().slideIndex, ...c.slides.map((_, i) => i)]
    for (const i of order) {
      const empty = leaves(c.slides[i]).find(
        (e): e is ImageElement => e.type === 'image' && e.slot !== undefined && !e.src,
      )
      if (empty) {
        dest = { slideIndex: i, id: empty.id }
        break
      }
    }
  }
  if (!dest) return false
  updateEl<ImageElement>(dest.slideIndex, dest.id, (el) => ({
    ...el,
    src,
    posX: 50,
    posY: 50,
    zoom: 1,
  }))
  return true
}

function leaves(slide: Slide): LeafElement[] {
  return slide.elements.flatMap((e) => (e.type === 'stack' ? e.children : [e]))
}
