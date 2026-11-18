import {
  ArrowLeft,
  Check,
  ChevronDown,
  CloudOff,
  Download,
  Eye,
  FileArchive,
  FileImage,
  FileText,
  Images,
  Instagram,
  Loader2,
  Minus,
  Plus,
  Redo2,
  Undo2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, cx, toast } from '../components/ui'
import { exportAllPng, exportPdf, exportSlidePng, exportZip } from '../lib/export'
import { uploadImage, imageFromClipboard } from '../lib/image'
import { navigate } from '../lib/router'
import { useApp } from '../store/app'
import { useEditor } from '../store/editor'
import { Canvas } from './Canvas'
import { Filmstrip } from './Filmstrip'
import { Inspector } from './Inspector'
import { InstagramModal } from './InstagramModal'
import { LeftPanel } from './LeftPanel'
import { current, placeImage, selectedElement, update, updateEl, useCurrent } from './ops'
import { PreviewModal } from './PreviewModal'

export function StudioPage({ id }: { id: string }) {
  const open = useEditor((s) => s.open)
  const exists = useApp((s) => !!s.carousels[id])
  const [showInstagram, setShowInstagram] = useState(false)

  useEffect(() => {
    open(id)
  }, [id, open])

  useShortcuts()

  const carousel = useCurrent()
  if (!exists) {
    return (
      <div className="h-full grid place-items-center text-center">
        <div>
          <p className="font-semibold">Carrossel não encontrado.</p>
          <Button className="mt-3" onClick={() => navigate('/')}>
            Voltar ao início
          </Button>
        </div>
      </div>
    )
  }
  if (!carousel) return null

  return (
    <div className="h-full flex flex-col">
      <TopBar onInstagram={() => setShowInstagram(true)} />
      <div className="flex-1 min-h-0 flex">
        <LeftPanel carousel={carousel} onPublish={() => setShowInstagram(true)} />
        <main className="flex-1 min-w-0 flex flex-col">
          <Canvas carousel={carousel} />
          <Filmstrip carousel={carousel} />
        </main>
        <Inspector carousel={carousel} />
      </div>
      <InstagramModal
        carousel={carousel}
        open={showInstagram}
        onClose={() => setShowInstagram(false)}
      />
    </div>
  )
}

function TopBar({ onInstagram }: { onInstagram: () => void }) {
  const carousel = useCurrent()!
  const project = useApp((s) => s.projects.find((p) => p.id === carousel.projectId))
  const saveState = useApp((s) => s.saveState)
  const { undo, redo, past, future, zoom, setZoom } = useEditor()
  const [preview, setPreview] = useState(false)

  return (
    <div className="h-12 shrink-0 border-b border-line bg-paper flex items-center gap-2 px-3">
      <Button size="sm" variant="ghost" onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> {project?.name ?? 'Projetos'}
      </Button>
      <span className="text-ink/25">/</span>
      <input
        value={carousel.name}
        onChange={(e) => update((c) => ({ ...c, name: e.target.value }), 'name')}
        className="h-8 px-2 rounded-md text-sm bg-transparent hover:bg-ink/[.06] focus:bg-field focus:ring-2 focus:ring-ink/10 outline-none min-w-[120px] max-w-[320px]"
      />
      <span
        className={cx(
          'text-[12px] inline-flex items-center gap-1',
          saveState === 'erro' ? 'text-red-400' : 'text-mute',
        )}
      >
        {saveState === 'salvando' ? (
          <Loader2 size={12} className="animate-spin" />
        ) : saveState === 'erro' ? (
          <CloudOff size={12} />
        ) : (
          <Check size={12} />
        )}
        {saveState === 'salvando' ? 'Salvando' : saveState === 'erro' ? 'Erro ao salvar' : 'Salvo'}
      </span>

      <div className="flex-1" />

      <div className="flex items-center gap-0.5">
        <button
          className="size-8 grid place-items-center rounded-lg hover:bg-ink/5 disabled:opacity-30"
          disabled={!past.length}
          onClick={undo}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          className="size-8 grid place-items-center rounded-lg hover:bg-ink/5 disabled:opacity-30"
          disabled={!future.length}
          onClick={redo}
          title="Refazer (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
      </div>
      <div className="flex items-center gap-0.5 rounded-lg border border-line px-1">
        <button
          className="size-7 grid place-items-center"
          onClick={() => setZoom(Math.max(0.15, (zoom || 0.5) * 0.85))}
          title="Diminuir zoom"
        >
          <Minus size={14} />
        </button>
        <button
          className="text-[12px] tabular-nums w-12"
          onClick={() => setZoom(0)}
          title="Ajustar à tela"
        >
          {zoom ? `${Math.round(zoom * 100)}%` : 'Ajustar'}
        </button>
        <button
          className="size-7 grid place-items-center"
          onClick={() => setZoom(Math.min(2, (zoom || 0.5) * 1.15))}
          title="Aumentar zoom"
        >
          <Plus size={14} />
        </button>
      </div>
      <Button size="sm" variant="secondary" onClick={() => setPreview(true)}>
        <Eye size={15} /> Preview
      </Button>
      <ExportMenu onInstagram={onInstagram} />
      <PreviewModal carousel={carousel} open={preview} onClose={() => setPreview(false)} />
    </div>
  )
}

function ExportMenu({ onInstagram }: { onInstagram: () => void }) {
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const bump = useApp((s) => s.bumpExports)
  const slideIndex = useEditor((s) => s.slideIndex)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])

  const run = async (kind: 'slide' | 'all' | 'zip' | 'pdf') => {
    const c = current()
    if (!c) return
    setOpen(false)
    const onProgress = (d: number, t: number) => setProgress(`${d}/${t}`)
    setProgress('…')
    try {
      if (kind === 'slide') await exportSlidePng(c, slideIndex)
      if (kind === 'all') await exportAllPng(c, onProgress)
      if (kind === 'zip') await exportZip(c, onProgress)
      if (kind === 'pdf') await exportPdf(c, onProgress)
      bump()
      toast('Exportado!')
    } catch (err) {
      console.error(err)
      toast('Não foi possível exportar. Veja o console para detalhes.', 'erro')
    } finally {
      setProgress(null)
    }
  }

  const item = 'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-ink/[.06]'
  return (
    <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex">
        <Button
          size="sm"
          variant="primary"
          className="rounded-r-none"
          disabled={!!progress}
          onClick={() => onInstagram()}
        >
          {progress ? <Loader2 size={15} className="animate-spin" /> : <Instagram size={15} />}
          {progress ? `Exportando ${progress}` : 'Postar no Instagram'}
        </Button>
        <Button
          size="sm"
          variant="primary"
          className="rounded-l-none border-l-black/20 px-2"
          disabled={!!progress}
          onClick={() => setOpen(!open)}
        >
          <ChevronDown size={15} />
        </Button>
      </div>
      {open && (
        <div className="absolute right-0 mt-1 w-64 z-40 rounded-xl border border-line bg-surface shadow-xl shadow-black/50 py-1">
          <button className={item} onClick={() => run('slide')}>
            <FileImage size={15} /> Slide atual ({slideIndex + 1}) em PNG
          </button>
          <button className={item} onClick={() => run('all')}>
            <Images size={15} /> Todos em arquivos separados
          </button>
          <button className={item} onClick={() => run('zip')}>
            <FileArchive size={15} /> Tudo em .zip (com legenda)
          </button>
          <button className={item} onClick={() => run('pdf')}>
            <FileText size={15} /> PDF
          </button>
          <div className="my-1 border-t border-line" />
          <button className={item} onClick={() => (setOpen(false), onInstagram())}>
            <Instagram size={15} /> Postar no Instagram
          </button>
        </div>
      )}
    </div>
  )
}

function isTyping(e: Event) {
  const t = e.target as HTMLElement | null
  return (
    !!t &&
    (t.tagName === 'INPUT' ||
      t.tagName === 'TEXTAREA' ||
      t.tagName === 'SELECT' ||
      t.isContentEditable)
  )
}

/** Atalhos: Ctrl+Z/Y, setas (mover elemento ou trocar slide), Esc, Delete, Ctrl+V com imagem. */
function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ed = useEditor.getState()
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z' && !isTyping(e)) {
        e.preventDefault()
        if (e.shiftKey) ed.redo()
        else ed.undo()
        return
      }
      if (mod && e.key.toLowerCase() === 'y' && !isTyping(e)) {
        e.preventDefault()
        ed.redo()
        return
      }
      if (isTyping(e)) return
      const sel = selectedElement()
      if (e.key === 'Escape') ed.select(null)
      if (e.key.startsWith('Arrow')) {
        e.preventDefault()
        if (sel && sel.el.type !== 'stack' && !sel.el.fullBleed) {
          const step = e.shiftKey ? 10 : 1
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
          updateEl(
            sel.slideIndex,
            sel.el.id,
            (el) => ({ ...el, x: el.x + dx, y: el.y + dy }),
            `nudge:${sel.el.id}`,
          )
        } else {
          const c = current()
          if (!c) return
          if (e.key === 'ArrowRight')
            ed.selectSlide(Math.min(c.slides.length - 1, ed.slideIndex + 1))
          if (e.key === 'ArrowLeft') ed.selectSlide(Math.max(0, ed.slideIndex - 1))
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) {
        updateEl(sel.slideIndex, sel.el.id, (el) => ({ ...el, hidden: true }))
        ed.select(null)
        toast('Elemento oculto. Ctrl+Z desfaz.', 'info')
      }
    }

    const onPaste = async (e: ClipboardEvent) => {
      if (isTyping(e)) return
      const file = imageFromClipboard(e)
      if (!file) return
      e.preventDefault()
      let src: string
      try {
        src = await uploadImage(file)
      } catch {
        toast('Não foi possível enviar a imagem colada. Tente de novo.', 'erro')
        return
      }
      if (placeImage(src)) toast('Imagem colada')
      else toast('Nenhum espaço de imagem livre. Selecione uma imagem para substituir.', 'info')
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('paste', onPaste)
    }
  }, [])
}
