import { create } from 'zustand'
import type { Carousel } from '../types'
import { useApp } from './app'

/** Estado do Studio: seleção, zoom e desfazer/refazer. */
interface EditorState {
  carouselId: string | null
  slideIndex: number
  selectedId: string | null
  zoom: number
  past: Carousel[]
  future: Carousel[]
  lastKey: string | null
  lastAt: number

  open: (id: string) => void
  selectSlide: (i: number) => void
  select: (id: string | null) => void
  setZoom: (z: number) => void
  /** Grava uma alteração. Mudanças seguidas com a mesma `key` (ex.: arrastar um slider) viram um único passo de desfazer. */
  commit: (next: Carousel, key?: string) => void
  undo: () => void
  redo: () => void
}

const MAX_HISTORY = 60

export const useEditor = create<EditorState>((set, get) => ({
  carouselId: null,
  slideIndex: 0,
  selectedId: null,
  zoom: 0,
  past: [],
  future: [],
  lastKey: null,
  lastAt: 0,

  open: (id) => {
    if (get().carouselId === id) return
    set({ carouselId: id, slideIndex: 0, selectedId: null, past: [], future: [], lastKey: null })
  },
  selectSlide: (i) => set({ slideIndex: i, selectedId: null }),
  select: (id) => set({ selectedId: id }),
  setZoom: (zoom) => set({ zoom }),

  commit: (next, key) => {
    const { carouselId, past, lastKey, lastAt } = get()
    if (!carouselId) return
    const current = useApp.getState().carousels[carouselId]
    if (!current) return
    const now = Date.now()
    const coalesce = key && key === lastKey && now - lastAt < 800
    set({
      past: coalesce ? past : [...past, current].slice(-MAX_HISTORY),
      future: [],
      lastKey: key ?? null,
      lastAt: now,
    })
    useApp.getState().putCarousel(next)
  },
  undo: () => {
    const { past, future, carouselId } = get()
    if (!carouselId || past.length === 0) return
    const current = useApp.getState().carousels[carouselId]
    const prev = past[past.length - 1]
    set({ past: past.slice(0, -1), future: [current, ...future], lastKey: null })
    useApp.getState().putCarousel(prev)
    clampSlide()
  },
  redo: () => {
    const { past, future, carouselId } = get()
    if (!carouselId || future.length === 0) return
    const current = useApp.getState().carousels[carouselId]
    const [next, ...rest] = future
    set({ past: [...past, current], future: rest, lastKey: null })
    useApp.getState().putCarousel(next)
    clampSlide()
  },
}))

function clampSlide() {
  const { carouselId, slideIndex } = useEditor.getState()
  const c = carouselId ? useApp.getState().carousels[carouselId] : undefined
  if (c && slideIndex >= c.slides.length)
    useEditor.setState({ slideIndex: c.slides.length - 1, selectedId: null })
}
