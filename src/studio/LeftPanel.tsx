import {
  Copy,
  FileText,
  Globe,
  History,
  ImageIcon,
  LayoutTemplate,
  Loader2,
  Palette as PaletteIcon,
  Ratio,
  RotateCcw,
  Sparkles,
  Type,
  Upload,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Button,
  ColorField,
  ConfirmDialog,
  cx,
  Field,
  FontSelect,
  inputClass,
  Section,
  Segmented,
  textareaClass,
  toast,
  Toggle,
} from '../components/ui'
import { COLOR_TOKENS } from '../lib/colors'
import { imageSlots, mapLeaves } from '../lib/elements'
import * as db from '../services/cloud'
import { assetUrl } from '../lib/assets'
import { uploadImage, pickFiles } from '../lib/image'
import { clearHashParam, getHashParam } from '../lib/router'
import { applyKit, instantiateTemplate, swapTemplate } from '../lib/templateOps'
import { SlideView } from '../render/SlideView'
import { useApp } from '../store/app'
import { useEditor } from '../store/editor'
import { getTemplate, TEMPLATES } from '../templates'
import type { Carousel, ImageElement, Version } from '../types'
import { ColorRefPicker } from './Inspector'
import { update } from './ops'
import { OttoChatDrawer } from './OttoChatDrawer'

export function LeftPanel({ carousel, onPublish }: { carousel: Carousel; onPublish?: () => void }) {
  return (
    <aside className="w-[320px] shrink-0 border-r border-line bg-paper overflow-y-auto overflow-x-hidden">
      <Section title="Criador de conteúdo" icon={<Sparkles size={15} />} defaultOpen>
        <ContentCreator carousel={carousel} onPublish={onPublish} />
      </Section>
      <Section title="Campos globais" icon={<Globe size={15} />}>
        <GlobalsPanel carousel={carousel} />
      </Section>
      <Section title="Mídia" icon={<ImageIcon size={15} />}>
        <MediaPanel carousel={carousel} />
      </Section>
      <Section title="Cores e destaque" icon={<PaletteIcon size={15} />}>
        <ColorsPanel carousel={carousel} />
      </Section>
      <Section title="Fontes" icon={<Type size={15} />}>
        <Field label="Títulos">
          <FontSelect
            value={carousel.fonts.titulo}
            onChange={(f) => update((c) => ({ ...c, fonts: { ...c.fonts, titulo: f } }))}
          />
        </Field>
        <Field label="Corpo">
          <FontSelect
            value={carousel.fonts.corpo}
            onChange={(f) => update((c) => ({ ...c, fonts: { ...c.fonts, corpo: f } }))}
          />
        </Field>
      </Section>
      <Section title="Template" icon={<LayoutTemplate size={15} />}>
        <TemplatePanel carousel={carousel} />
      </Section>
      <Section title="Proporção" icon={<Ratio size={15} />}>
        <Segmented
          value={carousel.format}
          onChange={(v) => update((c) => ({ ...c, format: v }))}
          options={[
            { value: '4:5', label: '4:5' },
            { value: '3:4', label: '3:4' },
            { value: '1:1', label: '1:1' },
            { value: '9:16', label: '9:16' },
          ]}
        />
        <p className="text-[11px] text-ink/50">
          Feed 4:5 (1080×1350), feed 3:4 (1080×1440), quadrado 1:1 (1080×1080) ou Stories 9:16. Fora
          da proporção original do template, o fundo cresce em cima e embaixo sem mexer no conteúdo.
        </p>
      </Section>
      <Section title="Legenda" icon={<FileText size={15} />}>
        <CaptionPanel carousel={carousel} />
      </Section>
      <Section title="Histórico" icon={<History size={15} />}>
        <HistoryPanel carousel={carousel} />
      </Section>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Criador de conteúdo
// ---------------------------------------------------------------------------

function ContentCreator({ carousel, onPublish }: { carousel: Carousel; onPublish?: () => void }) {
  const [chatOpen, setChatOpen] = useState(() => getHashParam('otto') === '1')
  const imageCount = imageSlots(carousel.slides).length

  useEffect(() => {
    if (getHashParam('otto') !== '1') return
    setChatOpen(true)
    clearHashParam('otto')
  }, [carousel.id])

  return (
    <>
      <div className="rounded-xl border border-line bg-surface p-3">
        <p className="text-[12px] leading-relaxed text-ink/70">
          O <span className="text-ink font-medium">Otto</span> monta o carrossel: textos + fotos nos{' '}
          {imageCount} slot{imageCount === 1 ? '' : 's'} de imagem do template.
        </p>
        <Button variant="primary" className="w-full mt-2.5" onClick={() => setChatOpen(true)}>
          <Sparkles size={15} /> Gerar com IA
        </Button>
        <p className="text-[11px] text-ink/45 mt-1.5">
          Depois do roteiro, Adicionar no template aplica textos e fotos nos slides.
        </p>
      </div>
      <OttoChatDrawer
        carousel={carousel}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onPublish={onPublish}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Campos globais
// ---------------------------------------------------------------------------

function GlobalsPanel({ carousel }: { carousel: Carousel }) {
  const kits = useApp((s) => s.brandKits)
  const [kitId, setKitId] = useState(carousel.brandKitId ?? kits.find((k) => k.isDefault)?.id ?? '')
  const [confirm, setConfirm] = useState(false)
  const g = carousel.globals
  const set = (patch: Partial<Carousel['globals']>, key?: string) =>
    update((c) => ({ ...c, globals: { ...c.globals, ...patch } }), key)

  const uploadAvatar = async () => {
    const [file] = await pickFiles('image/*')
    if (!file) return
    try {
      set({ avatar: await uploadImage(file, 600) })
    } catch {
      toast('Não foi possível enviar a imagem. Tente de novo.', 'erro')
    }
  }
  const uploadLogo = async () => {
    const [file] = await pickFiles('image/*')
    if (!file) return
    try {
      set({ logo: await uploadImage(file, 800) })
    } catch {
      toast('Não foi possível enviar a imagem. Tente de novo.', 'erro')
    }
  }

  return (
    <>
      <Field label="Nome da marca">
        <input
          className={inputClass}
          value={g.brandName}
          onChange={(e) => set({ brandName: e.target.value }, 'g-name')}
        />
      </Field>
      <Field label="@ do Instagram">
        <input
          className={inputClass}
          value={g.handle}
          onChange={(e) => set({ handle: e.target.value }, 'g-handle')}
        />
      </Field>
      <Field label="Copyright">
        <input
          className={inputClass}
          value={g.copyright}
          onChange={(e) => set({ copyright: e.target.value }, 'g-copy')}
        />
      </Field>
      <Field
        label="Tagline / assinatura"
        hint="Aparece no cabeçalho de alguns templates. Pode ter 2 linhas."
      >
        <textarea
          rows={2}
          className={textareaClass}
          value={g.tagline ?? ''}
          placeholder="Ex.: Estratégia de Marca e Negócios"
          onChange={(e) => set({ tagline: e.target.value }, 'g-tag')}
        />
      </Field>
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full overflow-hidden bg-ink/5 grid place-items-center shrink-0">
          {g.avatar ? (
            <img src={assetUrl(g.avatar)} className="w-full h-full object-cover" />
          ) : (
            <Upload size={16} className="text-ink/30" />
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={uploadAvatar}>
            {g.avatar ? 'Trocar avatar' : 'Enviar avatar'}
          </Button>
          {g.avatar && (
            <Button size="sm" variant="ghost" onClick={() => set({ avatar: undefined })}>
              Remover
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-md overflow-hidden bg-field border border-line grid place-items-center shrink-0">
          {g.logo ? (
            <img src={assetUrl(g.logo)} className="w-full h-full object-contain" />
          ) : (
            <Upload size={16} className="text-white/50" />
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={uploadLogo}>
            {g.logo ? 'Trocar logo' : 'Enviar logo'}
          </Button>
          {g.logo && (
            <Button size="sm" variant="ghost" onClick={() => set({ logo: undefined })}>
              Remover
            </Button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-ink/50 -mt-1">
        O logo (PNG transparente) aparece no elemento "Logo" dos templates; sem logo, aparece o nome
        da marca.
      </p>
      <Toggle
        checked={g.verified}
        onChange={(v) => set({ verified: v })}
        label="Selo de verificado"
      />
      <div className="rounded-lg bg-ink/[.03] p-3 space-y-2">
        <div className="text-[12px] font-semibold">Reaplicar Brand Kit</div>
        <select className={inputClass} value={kitId} onChange={(e) => setKitId(e.target.value)}>
          {kits.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          disabled={!kitId}
          onClick={() => setConfirm(true)}
        >
          Aplicar kit neste carrossel
        </Button>
        <a href="#/brand-kits" className="block text-[12px] text-accent">
          Gerenciar Brand Kits
        </a>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Reaplicar Brand Kit?"
        message="Substitui cores, fontes e campos globais deste carrossel pelos do kit, inclusive o que você mudou à mão aqui."
        confirmLabel="Aplicar"
        onConfirm={() => {
          const kit = kits.find((k) => k.id === kitId)
          if (kit) update((c) => applyKit(c, getTemplate(c.templateId), kit))
          toast('Brand Kit aplicado')
        }}
        onClose={() => setConfirm(false)}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Mídia
// ---------------------------------------------------------------------------

function MediaPanel({ carousel }: { carousel: Carousel }) {
  const slots = imageSlots(carousel.slides)
  const filled = slots.filter((s) => s.el.src).length
  const { selectSlide, select } = useEditor()
  const [busy, setBusy] = useState(false)

  const uploadMany = async () => {
    const files = await pickFiles('image/*', true)
    if (!files.length) return
    setBusy(true)
    try {
      const srcs = await Promise.all(files.map((f) => uploadImage(f)))
      // Preenche a partir do primeiro slot vazio, em ordem.
      const empty = slots.filter((s) => !s.el.src).map((s) => s.el.id)
      const order =
        empty.length >= srcs.length
          ? empty
          : [...empty, ...slots.filter((s) => s.el.src).map((s) => s.el.id)]
      const byId = new Map(order.slice(0, srcs.length).map((id, i) => [id, srcs[i]]))
      update((c) => ({
        ...c,
        slides: mapLeaves(c.slides, (el) =>
          el.type === 'image' && byId.has(el.id)
            ? ({ ...el, src: byId.get(el.id), posX: 50, posY: 50, zoom: 1 } as ImageElement)
            : el,
        ),
      }))
      toast(`${byId.size} imagem(ns) aplicada(s)`)
    } catch {
      toast('Não foi possível enviar as imagens. Tente de novo.', 'erro')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={uploadMany}
        className="w-full rounded-xl border-2 border-dashed border-ink/20 py-5 text-center hover:border-accent hover:bg-accent-soft/30"
      >
        {busy ? (
          <Loader2 className="mx-auto animate-spin text-accent" />
        ) : (
          <Upload className="mx-auto text-ink/40" size={20} />
        )}
        <div className="text-sm font-medium mt-1">Enviar imagens</div>
        <div className="text-[11px] text-ink/50">
          Preenchem os slots em ordem · {filled} de {slots.length} slots
        </div>
      </button>
      <div className="grid grid-cols-4 gap-1.5">
        {slots.map(({ slideIndex, el }) => (
          <button
            key={el.id}
            onClick={() => {
              selectSlide(slideIndex)
              select(el.id)
            }}
            className="relative aspect-square rounded-md overflow-hidden bg-ink/5 border border-line hover:border-accent"
            title={`Slot ${el.slot} · slide ${slideIndex + 1}`}
          >
            {el.src ? (
              <img src={assetUrl(el.src)} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={14} className="m-auto text-ink/25" />
            )}
            <span className="absolute bottom-0.5 left-1 text-[10px] font-bold text-white drop-shadow">
              {el.slot}
            </span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-ink/50">
        Também dá para colar uma imagem com Ctrl+V: ela vai para a imagem selecionada ou para o
        próximo slot vazio.
      </p>
    </>
  )
}

// ---------------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------------

function ColorsPanel({ carousel }: { carousel: Carousel }) {
  return (
    <>
      <div className="space-y-2.5">
        {COLOR_TOKENS.map((t) => (
          <ColorField
            key={t.token}
            label={t.label}
            hint={t.hint}
            value={carousel.palette[t.token]}
            onChange={(v) =>
              update((c) => ({ ...c, palette: { ...c.palette, [t.token]: v } }), `pal:${t.token}`)
            }
          />
        ))}
      </div>
      <div className="pt-2 border-t border-line space-y-2">
        <div className="text-[12px] font-semibold">Destaque de palavras</div>
        <Segmented
          value={carousel.highlight.mode}
          onChange={(v) => update((c) => ({ ...c, highlight: { ...c.highlight, mode: v } }))}
          options={[
            { value: 'cor', label: 'Cor' },
            { value: 'fundo', label: 'Marca-texto' },
            { value: 'sublinhado', label: 'Sublinhado' },
            { value: 'gradiente', label: 'Degradê' },
          ]}
        />
        <ColorRefPicker
          label="Cor do destaque"
          value={carousel.highlight.color}
          palette={carousel.palette}
          onChange={(v) => update((c) => ({ ...c, highlight: { ...c.highlight, color: v } }))}
        />
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

function TemplatePanel({ carousel }: { carousel: Carousel }) {
  const [target, setTarget] = useState<string | null>(null)
  const addVersion = useApp((s) => s.addVersion)
  return (
    <>
      <p className="text-[12px] text-ink/60">
        Atual: <b>{getTemplate(carousel.templateId).name}</b>. Ao trocar, o texto e as imagens são
        mantidos na ordem.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map((t) => {
          const preview = instantiateTemplate(t, { projectId: '', name: '' })
          const ctx = {
            ...preview,
            globals: carousel.globals,
            fonts: t.fonts ? preview.fonts : carousel.fonts,
          }
          return (
            <button
              key={t.id}
              onClick={() => t.id !== carousel.templateId && setTarget(t.id)}
              className={cx(
                'text-left rounded-lg overflow-hidden border-2',
                t.id === carousel.templateId
                  ? 'border-accent'
                  : 'border-transparent hover:border-ink/20',
              )}
            >
              <SlideView ctx={ctx} slide={preview.slides[0]} scale={128 / 1080} />
              <div className="text-[11px] font-medium px-1 py-1 truncate">{t.name}</div>
            </button>
          )
        })}
      </div>
      <ConfirmDialog
        open={!!target}
        title="Trocar template?"
        message="O layout muda, mas o texto e as imagens são reaproveitados na ordem dos campos. Uma versão é salva no histórico antes."
        confirmLabel="Trocar"
        onConfirm={async () => {
          if (!target) return
          await addVersion(carousel.id, 'template', 'Antes de trocar o template')
          update((c) => swapTemplate(c, getTemplate(target)))
          useEditor.getState().selectSlide(0)
        }}
        onClose={() => setTarget(null)}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Legenda
// ---------------------------------------------------------------------------

function CaptionPanel({ carousel }: { carousel: Carousel }) {
  return (
    <>
      <textarea
        rows={8}
        className={textareaClass}
        value={carousel.caption ?? ''}
        placeholder="Legenda do post"
        onChange={(e) => update((c) => ({ ...c, caption: e.target.value }), 'caption')}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          disabled={!carousel.caption}
          onClick={async () => {
            await navigator.clipboard.writeText(carousel.caption ?? '')
            toast('Legenda copiada')
          }}
        >
          <Copy size={14} /> Copiar
        </Button>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Histórico
// ---------------------------------------------------------------------------

function HistoryPanel({ carousel }: { carousel: Carousel }) {
  const [versions, setVersions] = useState<Version[] | null>(null)
  const [restore, setRestore] = useState<Version | null>(null)
  const addVersion = useApp((s) => s.addVersion)
  const reload = () => void db.loadVersions(carousel.id).then(setVersions)

  useEffect(reload, [carousel.id])

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        className="w-full"
        onClick={async () => {
          await addVersion(carousel.id, 'manual', 'Versão salva manualmente')
          reload()
          toast('Versão salva')
        }}
      >
        Salvar versão agora
      </Button>
      <p className="text-[11px] text-ink/50">
        Versões automáticas são salvas antes de gerar com IA, aplicar texto e trocar template.
      </p>
      {versions === null ? null : versions.length === 0 ? (
        <p className="text-[12px] text-ink/50">Nenhuma versão salva ainda.</p>
      ) : (
        <div className="space-y-1.5">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate">{v.label}</div>
                <div className="text-[11px] text-ink/50">
                  {new Date(v.at).toLocaleString('pt-BR')}
                </div>
              </div>
              <button className="text-accent" title="Restaurar" onClick={() => setRestore(v)}>
                <RotateCcw size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!restore}
        title="Restaurar esta versão?"
        message="O estado atual é salvo no histórico antes, então dá para voltar."
        confirmLabel="Restaurar"
        onConfirm={async () => {
          if (!restore) return
          await addVersion(carousel.id, 'restauracao', 'Antes de restaurar uma versão')
          update((c) => ({ ...c, ...restore.snapshot }))
          useEditor.getState().selectSlide(0)
          reload()
          toast('Versão restaurada')
        }}
        onClose={() => setRestore(null)}
      />
    </>
  )
}
