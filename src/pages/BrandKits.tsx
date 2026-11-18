import { Plus, Star, Trash2, Type, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Button,
  ColorField,
  ConfirmDialog,
  cx,
  Field,
  FontSelect,
  inputClass,
  textareaClass,
  toast,
  Toggle,
} from '../components/ui'
import { DEFAULT_APOIO, DEFAULT_KIT_COLORS } from '../lib/colors'
import { ensureFont, fontFamilyFromFile } from '../lib/fonts'
import { uid } from '../lib/id'
import { assetUrl } from '../lib/assets'
import { uploadImage, pickFiles } from '../lib/image'
import { VerifiedBadge } from '../render/SlideView'
import { useApp } from '../store/app'
import type { BrandKit } from '../types'

function newKit(n: number): BrandKit {
  return {
    id: uid('k_'),
    name: `Brand Kit ${n}`,
    brandName: '',
    handle: '',
    copyright: `© ${new Date().getFullYear()}`,
    colors: { ...DEFAULT_KIT_COLORS },
    fonts: { titulo: 'Inter', corpo: 'Inter' },
    verified: true,
    isDefault: false,
  }
}

export function BrandKitsPage() {
  const kits = useApp((s) => s.brandKits)
  const fonts = useApp((s) => s.fonts)
  const app = useApp.getState()
  const [editing, setEditing] = useState<BrandKit | null>(null)
  const [toDelete, setToDelete] = useState<BrandKit | null>(null)

  const uploadFonts = async () => {
    const files = await pickFiles('.woff2,.woff,.ttf,.otf', true)
    for (const f of files) {
      if (fonts.length >= 10) {
        toast('Limite de 10 fontes atingido', 'erro')
        break
      }
      try {
        await app.addFont(f, fontFamilyFromFile(f))
      } catch {
        toast(`Não foi possível enviar ${f.name}. Tente de novo.`, 'erro')
      }
    }
    if (files.length) toast('Fonte adicionada')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-5xl display">Brand Kit</h1>
            <p className="text-sm text-mute mt-3">
              Cores, fontes, logo e identidade das suas marcas. Cada carrossel novo herda do kit
              marcado como padrão.
            </p>
          </div>
          <Button variant="primary" onClick={() => setEditing(newKit(kits.length + 1))}>
            <Plus size={16} /> Novo kit
          </Button>
        </div>
        <p className="text-[13px] rounded-lg bg-surface border border-line border-l-2 border-l-sunset text-ink/70 px-3 py-2">
          Mudanças no Brand Kit valem para carrosséis criados depois de salvar. Para atualizar um
          carrossel existente, use "Reaplicar Brand Kit" dentro do Studio.
        </p>

        <div className="space-y-3">
          {kits.map((k) =>
            editing?.id === k.id ? (
              <KitEditor
                key={k.id}
                kit={editing}
                onChange={setEditing}
                onCancel={() => setEditing(null)}
                onSave={() => (
                  app.saveBrandKit(editing),
                  setEditing(null),
                  toast('Brand Kit salvo')
                )}
              />
            ) : (
              <div
                key={k.id}
                className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4"
              >
                <div className="flex -space-x-1.5">
                  {Object.values(k.colors).map((c, i) => (
                    <span
                      key={i}
                      className="size-7 rounded-full border border-ink/20 ring-2 ring-surface"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <button className="flex-1 text-left" onClick={() => setEditing(k)}>
                  <div className="flex items-center gap-2">
                    {k.name}
                    {k.isDefault && (
                      <span className="eyebrow text-ink/80 border border-ink/25 rounded-full px-2 py-0.5">
                        Padrão
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-mute">
                    {k.brandName || 'Sem nome de marca'} {k.handle && `· ${k.handle}`} ·{' '}
                    {k.fonts.titulo} / {k.fonts.corpo}
                  </div>
                </button>
                {!k.isDefault && (
                  <Button size="sm" variant="ghost" onClick={() => app.setDefaultKit(k.id)}>
                    <Star size={14} /> Tornar padrão
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => setEditing(k)}>
                  Editar
                </Button>
              </div>
            ),
          )}
          {editing && !kits.some((k) => k.id === editing.id) && (
            <KitEditor
              kit={editing}
              onChange={setEditing}
              onCancel={() => setEditing(null)}
              onSave={() => (
                app.saveBrandKit(editing),
                setEditing(null),
                toast('Brand Kit criado')
              )}
            />
          )}
        </div>

        {editing && kits.some((k) => k.id === editing.id) && kits.length > 1 && (
          <button
            onClick={() => setToDelete(editing)}
            className="text-sm text-red-400 inline-flex items-center gap-1.5"
          >
            <Trash2 size={14} /> Apagar "{editing.name}"
          </button>
        )}

        <section className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg display flex items-center gap-2">
                <Type size={16} /> Suas fontes
              </h2>
              <p className="text-[13px] text-mute mt-1">
                Envie fontes próprias (.woff2, .woff, .ttf, .otf). Elas aparecem no seletor de todos
                os kits e carrosséis. Limite de 10.
              </p>
            </div>
            <span className="text-sm text-ink/50 tabular-nums">{fonts.length}/10</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {fonts.map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm"
                style={{ fontFamily: `"${f.family}"` }}
              >
                {f.family}
                <button
                  onClick={() => app.removeFont(f.id)}
                  className="text-ink/40 hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </span>
            ))}
            <Button
              size="sm"
              variant="secondary"
              onClick={uploadFonts}
              disabled={fonts.length >= 10}
            >
              <Upload size={14} /> Adicionar fonte
            </Button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Apagar Brand Kit?"
        message="Os carrosséis que já usam este kit não mudam."
        confirmLabel="Apagar"
        danger
        onConfirm={() => {
          if (toDelete) app.deleteBrandKit(toDelete.id)
          setEditing(null)
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}

function KitEditor({
  kit,
  onChange,
  onCancel,
  onSave,
}: {
  kit: BrandKit
  onChange: (k: BrandKit) => void
  onCancel: () => void
  onSave: () => void
}) {
  const set = (patch: Partial<BrandKit>) => onChange({ ...kit, ...patch })
  const upload = async (field: 'logo' | 'avatar') => {
    const [file] = await pickFiles('image/*')
    if (!file) return
    try {
      set({ [field]: await uploadImage(file, 800) })
    } catch {
      toast('Não foi possível enviar a imagem. Tente de novo.', 'erro')
    }
  }
  return (
    <div className="rounded-xl border border-ink/30 bg-surface p-5 grid md:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-5">
        <Field label="Nome do kit">
          <input
            className={inputClass}
            value={kit.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        <div>
          <div className="eyebrow text-mute mb-3">Identidade</div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Nome da marca">
              <input
                className={inputClass}
                value={kit.brandName}
                placeholder="Ex.: Studio Aurora"
                onChange={(e) => set({ brandName: e.target.value })}
              />
            </Field>
            <Field label="@ do Instagram">
              <input
                className={inputClass}
                value={kit.handle}
                placeholder="@seuperfil"
                onChange={(e) => set({ handle: e.target.value })}
              />
            </Field>
            <Field label="Copyright">
              <input
                className={inputClass}
                value={kit.copyright}
                onChange={(e) => set({ copyright: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field
              label="Tagline / assinatura"
              hint="Aparece no cabeçalho de alguns templates. Pode ter 2 linhas."
            >
              <textarea
                rows={2}
                className={textareaClass}
                value={kit.tagline ?? ''}
                placeholder="Ex.: Estratégia de Marca e Negócios"
                onChange={(e) => set({ tagline: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <div>
          <div className="eyebrow text-mute mb-3">Cores do slide</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <ColorField
              label="Fundo"
              hint="fundo dos slides"
              value={kit.colors.fundo}
              onChange={(v) => set({ colors: { ...kit.colors, fundo: v } })}
            />
            <ColorField
              label="Textos"
              hint="cor dos textos"
              value={kit.colors.texto}
              onChange={(v) => set({ colors: { ...kit.colors, texto: v } })}
            />
            <ColorField
              label="Destaque"
              hint="palavras e botões"
              value={kit.colors.destaque}
              onChange={(v) => set({ colors: { ...kit.colors, destaque: v } })}
            />
            <ColorField
              label="Apoio"
              hint="slides coloridos"
              value={kit.colors.apoio ?? DEFAULT_APOIO}
              onChange={(v) => set({ colors: { ...kit.colors, apoio: v } })}
            />
          </div>
        </div>
        <div>
          <div className="eyebrow text-mute mb-3">Fontes</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Título">
              <FontSelect
                value={kit.fonts.titulo}
                onChange={(v) => set({ fonts: { ...kit.fonts, titulo: v } })}
              />
            </Field>
            <Field label="Corpo">
              <FontSelect
                value={kit.fonts.corpo}
                onChange={(v) => set({ fonts: { ...kit.fonts, corpo: v } })}
              />
            </Field>
          </div>
        </div>
        <div>
          <div className="eyebrow text-mute mb-3">Imagens</div>
          <div className="flex flex-wrap gap-3">
            {(['avatar', 'logo'] as const).map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 rounded-lg border border-line p-2 pr-3"
              >
                <div
                  className={cx(
                    'size-12 bg-ink/5 overflow-hidden grid place-items-center',
                    f === 'avatar' ? 'rounded-full' : 'rounded-md',
                  )}
                >
                  {kit[f] ? (
                    <img src={assetUrl(kit[f])} className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={16} className="text-ink/30" />
                  )}
                </div>
                <div>
                  <div className="text-sm">{f === 'avatar' ? 'Avatar' : 'Logo'}</div>
                  <div className="flex gap-2">
                    <button className="text-[12px] text-accent" onClick={() => upload(f)}>
                      Enviar
                    </button>
                    {kit[f] && (
                      <button
                        className="text-[12px] text-ink/50"
                        onClick={() => set({ [f]: undefined })}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <Toggle
            checked={kit.verified}
            onChange={(v) => set({ verified: v })}
            label="Mostrar selo de verificado"
          />
          <Toggle
            checked={kit.isDefault}
            onChange={(v) => set({ isDefault: v })}
            label="Kit padrão"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={onSave}>
            Salvar
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>

      <KitPreview kit={kit} />
    </div>
  )
}

function KitPreview({ kit }: { kit: BrandKit }) {
  useEffect(() => {
    void ensureFont(kit.fonts.titulo)
    void ensureFont(kit.fonts.corpo)
  }, [kit.fonts.titulo, kit.fonts.corpo])
  return (
    <div>
      <div className="eyebrow text-mute mb-3">Prévia</div>
      <div
        className="rounded-xl p-5 aspect-[4/5] flex flex-col justify-between border border-line"
        style={{ background: kit.colors.fundo, color: kit.colors.texto }}
      >
        <div className="flex items-center gap-2">
          <div
            className="size-9 rounded-full overflow-hidden grid place-items-center font-bold"
            style={{ background: kit.colors.destaque }}
          >
            {kit.avatar ? (
              <img src={assetUrl(kit.avatar)} className="w-full h-full object-cover" />
            ) : (
              (kit.brandName || 'M')[0]
            )}
          </div>
          <div className="text-[13px] leading-tight">
            <div className="font-bold flex items-center gap-1">
              {kit.brandName || 'Sua marca'} {kit.verified && <VerifiedBadge size={13} />}
            </div>
            <div className="opacity-60">{kit.handle || '@seuperfil'}</div>
          </div>
        </div>
        <div>
          <div
            className="text-2xl font-extrabold leading-tight"
            style={{ fontFamily: `"${kit.fonts.titulo}"` }}
          >
            Título de <span style={{ color: kit.colors.destaque }}>exemplo</span>
          </div>
          <p className="text-[13px] mt-2 opacity-75" style={{ fontFamily: `"${kit.fonts.corpo}"` }}>
            Texto de apoio com a fonte do corpo. É assim que o slide fica nas suas cores.
          </p>
        </div>
        <div className="text-[11px] opacity-60">{kit.copyright}</div>
      </div>
    </div>
  )
}
