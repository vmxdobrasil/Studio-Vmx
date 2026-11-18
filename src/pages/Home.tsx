import {
  ArrowDownAZ,
  Check,
  Clock,
  Copy,
  FolderInput,
  FolderOpen,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { NewCarouselModal } from '../components/NewCarouselModal'
import { Button, ConfirmDialog, cx, inputClass, toast } from '../components/ui'
import { navigate } from '../lib/router'
import { baseFormatOf, SlideView } from '../render/SlideView'
import { activeCarousels, useApp } from '../store/app'
import type { Carousel } from '../types'

const LAST_PROJECT = 'cs:lastProject'

export const CoverThumb = memo(function CoverThumb({
  carousel,
  width,
}: {
  carousel: Carousel
  width: number
}) {
  const slide = carousel.slides[0]
  if (!slide) return <div style={{ width, height: width * 1.25 }} className="bg-ink/10" />
  return (
    <SlideView
      ctx={{ ...carousel, format: baseFormatOf(carousel) }}
      slide={slide}
      scale={width / 1080}
      page={{ index: 0, total: carousel.slides.length }}
    />
  )
})

function timeAgo(t: number) {
  const s = (Date.now() - t) / 1000
  if (s < 60) return 'agora'
  if (s < 3600) return `há ${Math.floor(s / 60)} min`
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`
  return new Date(t).toLocaleDateString('pt-BR')
}

export function HomePage() {
  const { projects, carousels, brandKits, settings } = useApp()
  const app = useApp.getState()
  const active = useMemo(() => activeCarousels(carousels), [carousels])

  const [projectId, setProjectId] = useState<string>(() => localStorage.getItem(LAST_PROJECT) ?? '')
  const [newProject, setNewProject] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'recentes' | 'az' | 'manual'>('recentes')
  const [modal, setModal] = useState(false)

  const [confirm, setConfirm] = useState<null | {
    title: string
    message: string
    label: string
    action: () => void
  }>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  const project = projects.find((p) => p.id === projectId) ?? projects[0]
  useEffect(() => {
    if (project) localStorage.setItem(LAST_PROJECT, project.id)
  }, [project])

  const list = useMemo(() => {
    const items = active.filter(
      (c) => c.projectId === project?.id && c.name.toLowerCase().includes(query.toLowerCase()),
    )
    if (sort === 'az') return items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    if (sort === 'manual')
      return items.sort(
        (a, b) => (a.position ?? 1e9) - (b.position ?? 1e9) || b.updatedAt - a.updatedAt,
      )
    return items.sort((a, b) => b.updatedAt - a.updatedAt)
  }, [active, project, query, sort])

  const createProject = () => {
    const p = app.createProject(newProject || 'Novo projeto')
    setNewProject('')
    setProjectId(p.id)
  }

  // Primeiros passos
  const kitCustomized = brandKits.some((k) => k.brandName !== 'Sua Marca' || k.avatar)
  const steps = [
    {
      done: projects.length > 0,
      label: 'Criar seu primeiro projeto',
      hint: 'Um projeto agrupa os carrosséis de uma marca',
    },
    {
      done: active.length > 0,
      label: 'Criar seu primeiro carrossel',
      hint: 'Escolha um template e comece',
      action: () => setModal(true),
      cta: 'Criar carrossel',
    },
    {
      done: kitCustomized,
      label: 'Montar seu Brand Kit',
      hint: 'Cores, fontes e logo aplicam sozinhos nos próximos carrosséis',
      action: () => navigate('/brand-kits'),
      cta: 'Montar',
    },
    {
      done: settings.exportsCount > 0,
      label: 'Exportar seu primeiro carrossel',
      hint: 'Baixe em PNG, ZIP ou PDF para postar',
    },
    {
      done: active.length >= 3,
      label: 'Criar o terceiro carrossel',
      hint: 'É a partir daqui que vira rotina',
    },
  ]
  const doneCount = steps.filter((s) => s.done).length
  const showOnboarding = !settings.onboardingDismissed && doneCount < steps.length

  const reorder = (targetId: string) => {
    if (!dragId || dragId === targetId || !project) return
    const ids = list.map((c) => c.id).filter((id) => id !== dragId)
    ids.splice(ids.indexOf(targetId), 0, dragId)
    app.reorderCarousels(project.id, ids)
    setSort('manual')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {showOnboarding && (
          <section className="rounded-2xl border border-line bg-surface bg-[radial-gradient(ellipse_at_top_right,rgb(139_81_255/0.20),transparent_60%)] p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="eyebrow text-ink">Primeiros passos</h2>
                <p className="text-[13px] text-mute mt-1">
                  Próximo: {steps.find((s) => !s.done)?.label.toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl display tabular-nums text-ink/50">
                  <span className="text-accent-2">{doneCount}</span>/{steps.length}
                </span>
                <button
                  onClick={app.dismissOnboarding}
                  className="text-ink/40 hover:text-ink"
                  title="Esconder"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {steps.map((s) => (
                <li key={s.label} className="flex items-center gap-3">
                  <span
                    className={cx(
                      'size-5 rounded-full border-2 grid place-items-center shrink-0',
                      s.done ? 'bg-accent border-accent text-paper' : 'border-ink/25',
                    )}
                  >
                    {s.done && <Check size={12} strokeWidth={3} />}
                  </span>
                  <div className="flex-1">
                    <div className={cx('text-sm', s.done && 'line-through text-ink/40')}>
                      {s.label}
                    </div>
                    <div className="text-[12px] text-mute">{s.hint}</div>
                  </div>
                  {!s.done && s.action && (
                    <Button size="sm" variant="soft" onClick={s.action}>
                      {s.cta}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Projetos */}
        <section>
          <div className="flex items-center justify-between mb-3 gap-3">
            <h2 className="eyebrow text-ink">Meus projetos</h2>
            <div className="flex gap-2">
              <input
                className={cx(inputClass, 'w-56')}
                placeholder="Nome do novo projeto"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createProject()}
              />
              <Button variant="secondary" onClick={createProject}>
                <Plus size={16} /> Projeto
              </Button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface bg-[radial-gradient(ellipse_at_top_right,rgb(139_81_255/0.20),transparent_60%)] p-10">
              <div className="eyebrow text-mute">Bem-vindo</div>
              <h1 className="text-5xl display mt-4">
                Vamos criar seu{' '}
                <span className="bg-gradient-to-r from-accent-2 to-dusk bg-clip-text text-transparent">
                  primeiro carrossel
                </span>
                ?
              </h1>
              <p className="text-mute mt-4 max-w-xl">
                Crie um projeto para organizar seus carrosséis. Pense nele como uma pasta:
                "Marketing 2026", "Lançamento" ou só o seu @.
              </p>
              <div className="flex gap-2 mt-5 max-w-lg">
                <input
                  className={inputClass}
                  placeholder='Ex.: "Marketing 2026" ou seu @'
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createProject()}
                />
                <Button variant="primary" onClick={createProject}>
                  Criar projeto
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {projects.map((p) => {
                const items = active
                  .filter((c) => c.projectId === p.id)
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                const selected = p.id === project?.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setProjectId(p.id)}
                    onDragOver={(e) => dragId && e.preventDefault()}
                    onDrop={() => {
                      if (dragId && p.id !== project?.id) {
                        app.moveCarousel(dragId, p.id)
                        toast(`Movido para ${p.name}`)
                      }
                      setDragId(null)
                    }}
                    className={cx(
                      'w-48 shrink-0 rounded-2xl border p-2.5 cursor-pointer transition-colors',
                      selected
                        ? 'border-ink/60 bg-ink/[.05]'
                        : 'border-line bg-surface hover:border-ink/25',
                    )}
                  >
                    <div className="grid grid-cols-3 gap-1 h-[72px] rounded-lg bg-ink/[.04] p-1 overflow-hidden">
                      {items.slice(0, 3).map((c) => (
                        <div key={c.id} className="rounded overflow-hidden">
                          <CoverThumb carousel={c} width={52} />
                        </div>
                      ))}
                      {items.length === 0 && (
                        <FolderOpen className="col-span-3 m-auto text-ink/25" size={26} />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-1">
                      {renaming === p.id ? (
                        <input
                          autoFocus
                          defaultValue={p.name}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => (
                            app.renameProject(p.id, e.target.value.trim() || p.name),
                            setRenaming(null)
                          )}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && (e.target as HTMLInputElement).blur()
                          }
                          className="text-sm w-full bg-field rounded px-1 outline-ink/40"
                        />
                      ) : (
                        <div className="min-w-0">
                          <div className="text-sm truncate">{p.name}</div>
                          <div className="text-[11px] text-mute">
                            {items.length === 0
                              ? 'vazio'
                              : `${items.length} carrossel${items.length > 1 ? 'éis' : ''}`}
                          </div>
                        </div>
                      )}
                      <ProjectMenu
                        onRename={() => setRenaming(p.id)}
                        onDelete={() =>
                          setConfirm({
                            title: 'Excluir projeto?',
                            message: `"${p.name}" será removido. Os carrosséis dele vão para a lixeira e podem ser restaurados.`,
                            label: 'Excluir projeto',
                            action: () => app.deleteProject(p.id),
                          })
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Carrosséis */}
        {project && (
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="eyebrow text-ink">
                Carrosséis <span className="text-mute">— {project.name}</span>
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/40"
                  />
                  <input
                    className={cx(inputClass, 'w-48 pl-8')}
                    placeholder="Buscar"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="flex rounded-full border border-line bg-field p-0.5">
                  {(
                    [
                      ['recentes', <Clock size={14} key="r" />, 'Recentes'],
                      ['az', <ArrowDownAZ size={14} key="a" />, 'A-Z'],
                      ['manual', <GripVertical size={14} key="m" />, 'Manual (arraste)'],
                    ] as const
                  ).map(([key, icon, title]) => (
                    <button
                      key={key}
                      title={title}
                      onClick={() => setSort(key)}
                      className={cx(
                        'h-8 px-2.5 rounded-full',
                        sort === key ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink',
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <Button variant="primary" onClick={() => setModal(true)}>
                  <Plus size={16} /> Novo carrossel
                </Button>
              </div>
            </div>

            {list.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-line p-12 text-center">
                <p className="text-2xl display">
                  Projeto <span className="text-mute">{project.name}</span> pronto para começar
                </p>
                <p className="text-sm text-mute mt-2">
                  Crie o primeiro carrossel quando quiser. É rápido.
                </p>
                <Button variant="primary" className="mt-4" onClick={() => setModal(true)}>
                  <Plus size={16} /> Criar carrossel
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {list.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    onDragEnd={() => setDragId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => reorder(c.id)}
                    className={cx('group', dragId === c.id && 'opacity-40')}
                  >
                    <button
                      onClick={() => navigate(`/studio/${c.id}`)}
                      className="block w-fit max-w-full rounded-xl overflow-hidden border border-line hover:border-ink/40 hover:-translate-y-0.5 transition-all"
                    >
                      <CoverThumb carousel={c} width={200} />
                    </button>
                    <div className="mt-2 flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <div className="text-sm truncate">{c.name}</div>
                        <div className="text-[11px] text-mute">
                          {c.slides.length} slides · {timeAgo(c.updatedAt)}
                        </div>
                      </div>
                      <CarouselMenu
                        projects={projects.filter((p) => p.id !== c.projectId)}
                        onDuplicate={() => {
                          app.duplicateCarousel(c.id)
                          toast('Carrossel duplicado')
                        }}
                        onMove={(pid) => app.moveCarousel(c.id, pid)}
                        onTrash={() => {
                          app.trashCarousel(c.id)
                          toast('Enviado para a lixeira')
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <NewCarouselModal open={modal} onClose={() => setModal(false)} projectId={project?.id} />
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.label}
        danger
        onConfirm={() => confirm?.action()}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}

/** Abre um menu por vez: ao abrir, os outros escutam e fecham. */
const POPOVER_CLOSE_EVENT = 'cs:popover-close'

function Popover({
  children,
  trigger,
}: {
  children: (close: () => void) => ReactNode
  trigger: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(`pop-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    const onCloseAll = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      if (detail !== idRef.current) setOpen(false)
    }
    window.addEventListener(POPOVER_CLOSE_EVENT, onCloseAll)
    return () => window.removeEventListener(POPOVER_CLOSE_EVENT, onCloseAll)
  }, [])

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const place = () => {
      const btn = btnRef.current
      const menu = menuRef.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const mw = menu?.offsetWidth ?? 208
      const mh = menu?.offsetHeight ?? 160
      const pad = 8
      let left = rect.right - mw
      left = Math.min(Math.max(pad, left), window.innerWidth - mw - pad)
      let top = rect.bottom + 4
      if (top + mh > window.innerHeight - pad) {
        top = Math.max(pad, rect.top - mh - 4)
      }
      setPos({ top, left })
    }
    place()
    // Remeasure after children paint (altura real do menu).
    const raf = requestAnimationFrame(place)
    const close = (e: PointerEvent) => {
      const t = e.target as Node | null
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    window.addEventListener('pointerdown', close)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) setPos(null)
  }, [open])

  const toggle = () => {
    setOpen((v) => {
      if (v) return false
      window.dispatchEvent(new CustomEvent(POPOVER_CLOSE_EVENT, { detail: idRef.current }))
      return true
    })
  }

  return (
    <div
      className="relative shrink-0"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="size-7 grid place-items-center rounded-full text-ink/50 hover:bg-ink/[.08] hover:text-ink"
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[100] w-52 rounded-xl border border-line bg-surface shadow-xl shadow-black/50 py-1"
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              visibility: pos ? 'visible' : 'hidden',
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {children(() => setOpen(false))}
          </div>,
          document.body,
        )}
    </div>
  )
}

const menuItem = 'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-ink/[.06]'

function ProjectMenu({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
  return (
    <Popover trigger={<MoreHorizontal size={16} />}>
      {(close) => (
        <>
          <button className={menuItem} onClick={() => (onRename(), close())}>
            <Pencil size={14} /> Renomear
          </button>
          <button className={cx(menuItem, 'text-red-400')} onClick={() => (onDelete(), close())}>
            <Trash2 size={14} /> Excluir projeto
          </button>
        </>
      )}
    </Popover>
  )
}

function CarouselMenu({
  projects,
  onDuplicate,
  onMove,
  onTrash,
}: {
  projects: { id: string; name: string }[]
  onDuplicate: () => void
  onMove: (projectId: string) => void
  onTrash: () => void
}) {
  return (
    <Popover trigger={<MoreHorizontal size={16} />}>
      {(close) => (
        <>
          <button className={menuItem} onClick={() => (onDuplicate(), close())}>
            <Copy size={14} /> Duplicar
          </button>
          {projects.length > 0 && (
            <div className="px-3 pt-2 pb-1 eyebrow text-mute flex items-center gap-1">
              <FolderInput size={12} /> Mover para
            </div>
          )}
          {projects.map((p) => (
            <button
              key={p.id}
              className={cx(menuItem, 'pl-7')}
              onClick={() => (onMove(p.id), close())}
            >
              {p.name}
            </button>
          ))}
          <button
            className={cx(menuItem, 'text-red-400 border-t border-line mt-1')}
            onClick={() => (onTrash(), close())}
          >
            <Trash2 size={14} /> Mover para a lixeira
          </button>
        </>
      )}
    </Popover>
  )
}
