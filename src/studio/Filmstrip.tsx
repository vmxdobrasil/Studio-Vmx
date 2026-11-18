import { ChevronLeft, ChevronRight, Copy, Plus, Square, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cx } from '../components/ui'
import { instantiateTemplate } from '../lib/templateOps'
import { baseFormatOf, SlideView } from '../render/SlideView'
import { useEditor } from '../store/editor'
import { getTemplate } from '../templates'
import type { Carousel } from '../types'
import { blankSlide, deleteSlide, duplicateSlide, insertSlide, moveSlide } from './ops'

const THUMB = 104

export function Filmstrip({ carousel }: { carousel: Carousel }) {
  const { slideIndex, selectSlide } = useEditor()
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const ctx = carousel

  return (
    <div className="shrink-0 border-t border-line bg-paper">
      <div className="flex items-center gap-3 overflow-x-auto px-4 py-3">
        {carousel.slides.map((s, i) => (
          <div
            key={s.id}
            draggable
            onDragStart={() => setDragFrom(i)}
            onDragEnd={() => setDragFrom(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom !== null) moveSlide(dragFrom, i)
              setDragFrom(null)
            }}
            className={cx('group relative shrink-0', dragFrom === i && 'opacity-40')}
          >
            <button
              onClick={() => selectSlide(i)}
              className={cx(
                'block rounded-md overflow-hidden border-2 transition-colors',
                i === slideIndex ? 'border-accent' : 'border-transparent hover:border-ink/20',
              )}
            >
              <SlideView
                ctx={{ ...ctx, format: baseFormatOf(ctx) }}
                slide={s}
                scale={THUMB / 1080}
                page={{ index: i, total: carousel.slides.length }}
              />
            </button>
            <div className="flex items-center justify-between mt-1 px-0.5">
              <span className="text-[11px] font-semibold tabular-nums text-ink/60">
                {String(i + 1).padStart(2, '0')}{' '}
                <span className="font-normal text-ink/45">{s.name}</span>
              </span>
            </div>
            <div className="absolute top-1 right-1 hidden group-hover:flex flex-col gap-0.5">
              <MiniBtn title="Duplicar" onClick={() => duplicateSlide(i)}>
                <Copy size={12} />
              </MiniBtn>
              <MiniBtn
                title="Mover para a esquerda"
                onClick={() => moveSlide(i, i - 1)}
                disabled={i === 0}
              >
                <ChevronLeft size={12} />
              </MiniBtn>
              <MiniBtn
                title="Mover para a direita"
                onClick={() => moveSlide(i, i + 1)}
                disabled={i === carousel.slides.length - 1}
              >
                <ChevronRight size={12} />
              </MiniBtn>
              <MiniBtn
                title="Excluir slide"
                onClick={() => deleteSlide(i)}
                disabled={carousel.slides.length <= 1}
              >
                <Trash2 size={12} />
              </MiniBtn>
            </div>
          </div>
        ))}
        <div className="relative shrink-0">
          <button
            onClick={() => setAdding(!adding)}
            className="grid place-items-center rounded-md border-2 border-dashed border-ink/20 text-ink/50 hover:border-accent hover:text-accent"
            style={{ width: THUMB, height: THUMB * 1.25 }}
            title="Adicionar slide"
          >
            <Plus size={22} />
          </button>
          {adding && <AddSlideMenu carousel={carousel} onClose={() => setAdding(false)} />}
        </div>
      </div>
    </div>
  )
}

function MiniBtn({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="size-5 grid place-items-center rounded-full bg-surface/95 border border-line text-ink/70 hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function AddSlideMenu({ carousel, onClose }: { carousel: Carousel; onClose: () => void }) {
  const template = getTemplate(carousel.templateId)
  const preview = instantiateTemplate(template, { projectId: '', name: '' })
  const ctx = {
    ...preview,
    palette: carousel.palette,
    fonts: carousel.fonts,
    globals: carousel.globals,
    highlight: carousel.highlight,
    format: preview.baseFormat ?? '4:5',
  }
  const at = useEditor.getState().slideIndex + 1

  useEffect(() => {
    const close = () => onClose()
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [onClose])

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute bottom-full right-0 mb-2 z-30 w-[420px] rounded-xl border border-line bg-surface shadow-2xl shadow-black/60 p-3"
    >
      <div className="eyebrow text-mute mb-3">Adicionar slide depois do {at}</div>
      <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto">
        <button
          onClick={() => {
            insertSlide(blankSlide(), at)
            onClose()
          }}
          className="rounded-md border border-line grid place-items-center text-ink/50 text-[11px] hover:border-accent"
          style={{ height: 112 }}
        >
          <span className="flex flex-col items-center gap-1">
            <Square size={16} /> Em branco
          </span>
        </button>
        {template.slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              insertSlide(s, at)
              onClose()
            }}
            className="rounded-md overflow-hidden border border-line hover:border-accent"
            title={s.name}
          >
            <SlideView
              ctx={ctx}
              slide={preview.slides[i]}
              scale={88 / 1080}
              page={{ index: i, total: preview.slides.length }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
