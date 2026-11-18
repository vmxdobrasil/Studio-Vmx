import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { CANVAS_W } from '../config'
import { canvasHeight, SlideView } from '../render/SlideView'
import { useEditor } from '../store/editor'
import type { Carousel, ImageElement, LeafElement, StackElement } from '../types'
import { updateEl } from './ops'

interface Drag {
  mode: 'move' | 'pan'
  id: string
  startX: number
  startY: number
  origX: number
  origY: number
  w: number
  h: number
  moved: boolean
}

export function Canvas({ carousel }: { carousel: Carousel }) {
  const { slideIndex, selectedId, zoom, select, setZoom } = useEditor()
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })
  const drag = useRef<Drag | null>(null)
  const slide = carousel.slides[slideIndex] ?? carousel.slides[0]
  const height = canvasHeight(carousel.format)

  useEffect(() => {
    if (!box.current) return
    const ro = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    )
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [])

  const fit = Math.max(0.1, Math.min((size.w - 88) / CANVAS_W, (size.h - 88) / height))
  const scale = zoom > 0 ? zoom : fit

  // Ctrl + roda do mouse = zoom
  useEffect(() => {
    const el = box.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const z = useEditor.getState().zoom || fit
      setZoom(Math.min(2, Math.max(0.15, z * (e.deltaY < 0 ? 1.1 : 0.9))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [fit, setZoom])

  const onElementPointerDown = (e: ReactPointerEvent, el: LeafElement, parent?: StackElement) => {
    if (e.button !== 0) return
    select(el.id)
    const pan = el.type === 'image' && !!el.src && !e.shiftKey
    // Fundo de foto e gradientes ocupando o slide inteiro não são movidos.
    if (!pan && el.fullBleed) return
    const target = parent ?? el
    drag.current = {
      mode: pan ? 'pan' : 'move',
      id: pan ? el.id : target.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: pan ? (el as ImageElement).posX : target.x,
      origY: pan ? (el as ImageElement).posY : target.y,
      w: el.w,
      h: el.h,
      moved: false,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.startX) / scale
    const dy = (e.clientY - d.startY) / scale
    if (!d.moved && Math.hypot(dx, dy) < 3) return
    d.moved = true
    if (d.mode === 'move') {
      updateEl(
        slideIndex,
        d.id,
        (el) => ({ ...el, x: Math.round(d.origX + dx), y: Math.round(d.origY + dy) }),
        `move:${d.id}`,
      )
    } else {
      const clamp = (v: number) => Math.max(0, Math.min(100, v))
      updateEl<ImageElement>(
        slideIndex,
        d.id,
        (el) => ({
          ...el,
          posX: clamp(d.origX - (dx / d.w) * 100),
          posY: clamp(d.origY - (dy / d.h) * 100),
        }),
        `pan:${d.id}`,
      )
    }
  }

  const endDrag = () => {
    drag.current = null
  }

  return (
    <div
      ref={box}
      className="relative flex-1 min-h-0 overflow-auto checker"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="min-h-full min-w-full grid place-items-center p-8"
        onPointerDown={() => select(null)}
      >
        <div className="ring-1 ring-white/10 rounded-sm" onPointerDown={(e) => e.stopPropagation()}>
          {slide && (
            <SlideView
              ctx={carousel}
              slide={slide}
              scale={scale}
              page={{ index: slideIndex, total: carousel.slides.length }}
              editor={{
                selectedId,
                onBackgroundPointerDown: () => select(null),
                onElementPointerDown,
                onElementDoubleClick: (el) => {
                  if (el.type === 'text') window.dispatchEvent(new CustomEvent('studio:focus-text'))
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
