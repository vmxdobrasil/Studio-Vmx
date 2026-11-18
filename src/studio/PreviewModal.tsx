import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { cx } from '../components/ui'
import { assetUrl } from '../lib/assets'
import { canvasHeight, SlideView, VerifiedBadge } from '../render/SlideView'
import type { Carousel } from '../types'

const W = 380

export function PreviewModal({
  carousel,
  open,
  onClose,
}: {
  carousel: Carousel
  open: boolean
  onClose: () => void
}) {
  const [i, setI] = useState(0)
  const [more, setMore] = useState(false)
  const n = carousel.slides.length
  const story = carousel.format === '9:16'

  useEffect(() => {
    if (!open) return
    setI(0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setI((v) => Math.min(n - 1, v + 1))
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, n, onClose])

  if (!open) return null
  const g = carousel.globals
  const scale = W / 1080

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4"
      onPointerDown={onClose}
    >
      <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={onClose}>
        <X size={26} />
      </button>
      <div
        className="bg-surface border border-line rounded-[34px] p-3"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="rounded-[26px] overflow-hidden bg-paper" style={{ width: W }}>
          {!story && (
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <div className="size-8 rounded-full overflow-hidden bg-accent-soft grid place-items-center text-[12px] font-bold">
                {g.avatar ? (
                  <img src={assetUrl(g.avatar)} className="w-full h-full object-cover" />
                ) : (
                  (g.handle.replace('@', '')[0] ?? '?').toUpperCase()
                )}
              </div>
              <div className="flex-1 text-[13px] font-semibold flex items-center gap-1">
                {g.handle.replace(/^@/, '')} {g.verified && <VerifiedBadge size={13} />}
              </div>
              <MoreHorizontal size={18} />
            </div>
          )}
          <div
            className="relative bg-black"
            style={{ height: canvasHeight(carousel.format) * scale }}
          >
            {story && (
              <div className="absolute top-2 inset-x-2 z-10 flex gap-1">
                {carousel.slides.map((s, k) => (
                  <span
                    key={s.id}
                    className={cx('h-0.5 flex-1 rounded-full', k <= i ? 'bg-white' : 'bg-white/40')}
                  />
                ))}
              </div>
            )}
            <div
              className="flex transition-transform duration-300"
              style={{ transform: `translateX(${-i * W}px)` }}
            >
              {carousel.slides.map((s, k) => (
                <SlideView
                  key={s.id}
                  ctx={carousel}
                  slide={s}
                  scale={scale}
                  page={{ index: k, total: n }}
                />
              ))}
            </div>
            {!story && (
              <span className="absolute top-3 right-3 text-[11px] bg-black/60 text-white rounded-full px-2 py-0.5">
                {i + 1}/{n}
              </span>
            )}
            {i > 0 && (
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 size-7 rounded-full bg-white/90 text-paper grid place-items-center shadow"
                onClick={() => setI(i - 1)}
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {i < n - 1 && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 size-7 rounded-full bg-white/90 text-paper grid place-items-center shadow"
                onClick={() => setI(i + 1)}
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>
          {!story && (
            <div className="px-3 pt-2.5 pb-4">
              <div className="flex items-center gap-3.5">
                <Heart size={22} />
                <MessageCircle size={22} />
                <Send size={21} />
                <div className="flex-1 flex justify-center gap-1">
                  {carousel.slides.map((s, k) => (
                    <span
                      key={s.id}
                      className={cx('size-1.5 rounded-full', k === i ? 'bg-sky-500' : 'bg-ink/20')}
                    />
                  ))}
                </div>
                <Bookmark size={22} />
              </div>
              {carousel.caption && (
                <p className={cx('text-[13px] mt-2 whitespace-pre-line', !more && 'line-clamp-2')}>
                  <b>{g.handle.replace(/^@/, '')}</b> {carousel.caption}
                </p>
              )}
              {carousel.caption && !more && (
                <button className="text-[13px] text-ink/50" onClick={() => setMore(true)}>
                  mais
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
