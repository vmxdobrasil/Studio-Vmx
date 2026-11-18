import { Check, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../lib/router'
import { instantiateTemplate, resizeSlides } from '../lib/templateOps'
import { SlideView } from '../render/SlideView'
import { useApp } from '../store/app'
import { FUNNEL_INFO, TEMPLATES } from '../templates'
import type { FunnelStage } from '../types'
import { Button, cx, Field, inputClass, Modal } from './ui'

export function NewCarouselModal({
  open,
  onClose,
  projectId,
}: {
  open: boolean
  onClose: () => void
  projectId?: string
}) {
  const projects = useApp((s) => s.projects)
  const kits = useApp((s) => s.brandKits)
  const [name, setName] = useState('')
  const [project, setProject] = useState(projectId ?? '')
  const [kitId, setKitId] = useState('')
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id)
  const [slideCount, setSlideCount] = useState(TEMPLATES[0].slides.length)

  useEffect(() => {
    if (!open) return
    setName('')
    setProject(projectId ?? projects[0]?.id ?? '')
    setKitId(kits.find((k) => k.isDefault)?.id ?? '')
  }, [open, projectId, projects, kits])

  const kit = kits.find((k) => k.id === kitId)
  const previews = useMemo(
    () =>
      Object.fromEntries(
        TEMPLATES.map((t) => [t.id, instantiateTemplate(t, { projectId: '', name: '', kit })]),
      ),
    [kit],
  )

  const selectedTemplate = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]

  const create = (opts?: { openOtto?: boolean }) => {
    let pid = project
    if (!pid) pid = useApp.getState().createProject('Meu projeto').id
    const c = useApp.getState().createCarousel({
      name: name.trim() || 'Novo carrossel',
      projectId: pid,
      templateId,
      brandKitId: kitId || undefined,
    })
    if (slideCount !== c.slides.length) {
      useApp.getState().putCarousel({
        ...c,
        slides: resizeSlides(c.slides, slideCount),
      })
    }
    onClose()
    navigate(opts?.openOtto ? `/studio/${c.id}?otto=1` : `/studio/${c.id}`)
  }

  const stages: FunnelStage[] = ['topo', 'meio', 'fundo']

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo carrossel"
      subtitle="Escolha o template; com Otto o roteiro e as fotos entram depois no studio."
      width={920}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={() => create()}>
            Criar em branco
          </Button>
          <Button variant="primary" onClick={() => create({ openOtto: true })}>
            <Sparkles size={15} /> Criar com Otto
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <Field label="Nome do carrossel">
          <input
            autoFocus
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: 5 erros do Instagram"
            onKeyDown={(e) => e.key === 'Enter' && create({ openOtto: true })}
          />
        </Field>
        <Field label="Projeto">
          <select
            className={inputClass}
            value={project}
            onChange={(e) => setProject(e.target.value)}
          >
            {projects.length === 0 && <option value="">Meu projeto (novo)</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Brand Kit">
          <select className={inputClass} value={kitId} onChange={(e) => setKitId(e.target.value)}>
            <option value="">Nenhum (padrão do template)</option>
            {kits.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
                {k.isDefault ? ' (padrão)' : ''}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mb-5 rounded-xl border border-line bg-surface p-3">
        <div className="text-[12px] font-semibold text-ink">Quantos slides?</div>
        <p className="text-[11px] text-mute mt-0.5 mb-2">
          Template {selectedTemplate.name} vem com {selectedTemplate.slides.length} slides — você
          pode ajustar agora.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSlideCount(n)}
              className={cx(
                'min-w-10 rounded-full border px-2.5 py-1 text-[12px] font-medium tabular-nums',
                slideCount === n
                  ? 'border-accent bg-accent-soft text-ink'
                  : 'border-line bg-paper text-ink/80 hover:border-accent',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {stages.map((stage) => {
        const list = TEMPLATES.filter((t) => t.funnel === stage)
        if (list.length === 0) return null
        return (
          <div key={stage} className="mb-6">
            <div className="eyebrow text-ink">{FUNNEL_INFO[stage].label}</div>
            <p className="text-[12px] text-mute mt-1 mb-3">{FUNNEL_INFO[stage].hint}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {list.map((t) => {
                const preview = previews[t.id]
                const selected = templateId === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTemplateId(t.id)
                      setSlideCount(t.slides.length)
                    }}
                    onDoubleClick={() => create({ openOtto: true })}
                    className="text-left group"
                  >
                    <div
                      className={cx(
                        'relative w-fit rounded-xl overflow-hidden border-2 transition-all',
                        selected ? 'border-accent' : 'border-line group-hover:border-ink/30',
                      )}
                    >
                      <SlideView
                        ctx={preview}
                        slide={preview.slides[0]}
                        scale={196 / 1080}
                        page={{ index: 0, total: preview.slides.length }}
                      />
                      {selected && (
                        <span className="absolute top-2 right-2 size-6 rounded-full bg-accent text-paper grid place-items-center">
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-[13px]">{t.name}</div>
                    <div className="text-[11px] text-mute leading-snug">
                      {t.slides.length} slides · {t.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </Modal>
  )
}
