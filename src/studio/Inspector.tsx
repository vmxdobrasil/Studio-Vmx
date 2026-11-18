import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  Eye,
  EyeOff,
  Highlighter,
  ImageIcon,
  Layers,
  Loader2,
  MousePointerClick,
  RectangleHorizontal,
  Sparkles,
  Trash2,
  Type,
  UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  Button,
  cx,
  Field,
  FontSelect,
  inputClass,
  Segmented,
  Slider,
  textareaClass,
  toast,
  Toggle,
} from '../components/ui'
import { ROLE_LABEL } from '../lib/autofill'
import { COLOR_TOKENS, isToken, resolveColor } from '../lib/colors'
import { allLeaves, findElement, renumber } from '../lib/elements'
import { assetUrl } from '../lib/assets'
import { uid } from '../lib/id'
import { uploadImage, pickFiles } from '../lib/image'
import { fetchOneBankImage, themeForImageSlot } from '../lib/imageBank'
import { wrapSelection } from '../lib/richtext'
import { useEditor } from '../store/editor'
import type {
  Carousel,
  ColorRef,
  CtaElement,
  CtaIcon,
  CardElement,
  CardIcon,
  CounterElement,
  DoodleElement,
  FooterElement,
  HeaderElement,
  LogoElement,
  ImageElement,
  LeafElement,
  Palette,
  ProfileElement,
  ShapeElement,
  Slide,
  StackElement,
  TextElement,
} from '../types'
import {
  current,
  deleteSlide,
  duplicateSlide,
  parentStack,
  update,
  updateEl,
  updateSlide,
} from './ops'

export function Inspector({ carousel }: { carousel: Carousel }) {
  const { slideIndex, selectedId } = useEditor()
  const slide = carousel.slides[slideIndex]
  if (!slide) return null
  const el = selectedId ? findElement(slide, selectedId) : undefined

  return (
    <aside className="w-[300px] shrink-0 border-l border-line bg-paper overflow-y-auto">
      {el && el.type !== 'stack' ? (
        <ElementPanel carousel={carousel} slide={slide} slideIndex={slideIndex} el={el} />
      ) : (
        <SlidePanel carousel={carousel} slide={slide} slideIndex={slideIndex} />
      )}
    </aside>
  )
}

function PanelTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-line">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-accent">{icon}</span>
        {title}
      </div>
      {sub && <div className="text-[12px] text-ink/50 mt-0.5">{sub}</div>}
    </div>
  )
}

export function ColorRefPicker({
  label,
  value,
  onChange,
  palette,
}: {
  label: string
  value: ColorRef
  onChange: (v: ColorRef) => void
  palette: Palette
}) {
  return (
    <div>
      <div className="text-[12px] font-medium text-ink/70 mb-1">{label}</div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {COLOR_TOKENS.map((t) => (
          <button
            key={t.token}
            type="button"
            title={`${t.label} (${t.hint})`}
            onClick={() => onChange(t.token)}
            className={cx(
              'size-6 rounded-full border border-ink/15',
              value === t.token && 'ring-2 ring-accent ring-offset-2 ring-offset-paper',
            )}
            style={{ background: palette[t.token] }}
          />
        ))}
        <label
          title="Cor personalizada"
          className={cx(
            'relative size-6 rounded-full border border-dashed border-ink/30 overflow-hidden cursor-pointer',
            !isToken(value) && 'ring-2 ring-accent ring-offset-2 ring-offset-paper',
          )}
          style={{
            background: !isToken(value)
              ? value
              : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
          }}
        >
          <input
            type="color"
            value={resolveColor(value, palette).slice(0, 7)}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Slide
// ---------------------------------------------------------------------------

function SlidePanel({
  carousel,
  slide,
  slideIndex,
}: {
  carousel: Carousel
  slide: Slide
  slideIndex: number
}) {
  const select = useEditor((s) => s.select)
  const hasGradient = slide.elements.some((e) => e.type === 'shape' && e.gradient)
  const set = (fn: (s: Slide) => Slide, key?: string) => updateSlide(slideIndex, fn, key)
  const layers = slide.elements.flatMap((e) => (e.type === 'stack' ? e.children : [e]))

  return (
    <>
      <PanelTitle
        icon={<Layers size={16} />}
        title={`Slide ${slideIndex + 1}`}
        sub="Clique num elemento do slide para editar"
      />
      <div className="p-4 space-y-4">
        <Field label="Nome">
          <input
            className={inputClass}
            value={slide.name}
            onChange={(e) => set((s) => ({ ...s, name: e.target.value }), 'slide-name')}
          />
        </Field>
        <ColorRefPicker
          label="Fundo"
          value={slide.background}
          palette={carousel.palette}
          onChange={(v) => set((s) => ({ ...s, background: v }))}
        />
        {hasGradient && (
          <div className="space-y-2">
            <Slider
              label="Força do gradiente"
              value={Math.round(slide.gradientStrength * 100)}
              min={0}
              max={100}
              format={(v) => `${v}%`}
              onChange={(v) => set((s) => ({ ...s, gradientStrength: v / 100 }), 'grad')}
            />
            <button
              className="text-[12px] text-accent font-medium"
              onClick={() => {
                const g = slide.gradientStrength
                updateSlideAll(carousel, (s) => ({ ...s, gradientStrength: g }))
                toast('Gradiente aplicado em todos os slides')
              }}
            >
              Aplicar em todos os slides
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => duplicateSlide(slideIndex)}>
            <Copy size={14} /> Duplicar
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={carousel.slides.length <= 1}
            onClick={() => deleteSlide(slideIndex)}
          >
            <Trash2 size={14} /> Excluir
          </Button>
        </div>
        <div>
          <div className="eyebrow text-mute mb-2">Elementos</div>
          <div className="rounded-lg border border-line divide-y divide-line">
            {layers.map((l) => (
              <div key={l.id} className="flex items-center gap-2 px-2.5 py-1.5">
                <button
                  className="flex-1 flex items-center gap-2 text-left text-[13px] min-w-0"
                  onClick={() => select(l.id)}
                >
                  <span className="text-ink/40">{iconFor(l)}</span>
                  <span className="truncate">{labelFor(l)}</span>
                </button>
                <button
                  className="text-ink/40 hover:text-ink"
                  title={l.hidden ? 'Mostrar' : 'Ocultar'}
                  onClick={() =>
                    updateEl(slideIndex, l.id, (el) => ({ ...el, hidden: !el.hidden }))
                  }
                >
                  {l.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            ))}
            {layers.length === 0 && (
              <div className="px-3 py-2 text-[12px] text-ink/50">
                Slide vazio. Adicione elementos abaixo.
              </div>
            )}
          </div>
          <AddElement slideIndex={slideIndex} />
        </div>
      </div>
    </>
  )
}

function updateSlideAll(carousel: Carousel, fn: (s: Slide) => Slide) {
  carousel.slides.forEach((_, i) => updateSlide(i, fn, 'grad-all'))
}

function AddElement({ slideIndex }: { slideIndex: number }) {
  const add = (el: LeafElement) => {
    update((c) => {
      const slides = c.slides.map((s, i) =>
        i === slideIndex ? { ...s, elements: [...s.elements, el] } : s,
      )
      return { ...c, slides: renumber(slides) }
    })
    useEditor.getState().select(el.id)
  }
  const addImage = () => {
    const c = current()
    const slide = c?.slides[slideIndex]
    if (!slide) return
    const images = allLeaves(slide).filter((e): e is ImageElement => e.type === 'image')
    const empty = images.find((e) => !e.src)
    if (empty) {
      useEditor.getState().select(empty.id)
      toast('Slot vazio selecionado — use Enviar ou Gerar nova imagem com IA')
      return
    }
    if (images.length > 0) {
      useEditor.getState().select(images[0]!.id)
      toast('Imagem do template selecionada — use Gerar nova imagem com IA para trocar')
      return
    }
    add({
      id: uid('e_'),
      type: 'image',
      x: 72,
      y: 600,
      w: 936,
      h: 520,
      slot: 1,
      fit: 'cover',
      radius: 24,
      zoom: 1,
      posX: 50,
      posY: 50,
    } as ImageElement)
  }
  const base = { id: uid('e_'), x: 72, w: 936 }
  return (
    <div className="grid grid-cols-2 gap-1.5 mt-2">
      <Button
        size="sm"
        variant="soft"
        onClick={() =>
          add({
            ...base,
            type: 'text',
            y: 400,
            h: 200,
            role: 'titulo',
            text: 'Novo texto',
            style: {
              font: 'titulo',
              size: 64,
              weight: 800,
              lineHeight: 1.05,
              letterSpacing: -0.02,
              align: 'left',
              color: 'texto',
            },
          } as TextElement)
        }
      >
        <Type size={14} /> Texto
      </Button>
      <Button size="sm" variant="soft" onClick={addImage}>
        <ImageIcon size={14} /> Imagem
      </Button>
      <Button
        size="sm"
        variant="soft"
        onClick={() =>
          add({
            ...base,
            type: 'cta',
            y: 1100,
            h: 84,
            label: 'Saiba mais',
            icon: 'seta',
            variant: 'solido',
            color: 'destaque',
            textColor: 'texto',
            fontSize: 30,
            align: 'left',
          } as CtaElement)
        }
      >
        <MousePointerClick size={14} /> Botão
      </Button>
      <Button
        size="sm"
        variant="soft"
        onClick={() =>
          add({
            ...base,
            type: 'profile',
            y: 120,
            h: 60,
            avatarSize: 52,
            showName: false,
            showHandle: true,
            fontSize: 26,
            color: 'texto',
            align: 'left',
          } as ProfileElement)
        }
      >
        <UserRound size={14} /> Perfil
      </Button>
    </div>
  )
}

function iconFor(l: LeafElement) {
  switch (l.type) {
    case 'text':
      return <Type size={14} />
    case 'image':
      return <ImageIcon size={14} />
    case 'profile':
      return <UserRound size={14} />
    case 'cta':
      return <MousePointerClick size={14} />
    default:
      return <RectangleHorizontal size={14} />
  }
}

function labelFor(l: LeafElement) {
  switch (l.type) {
    case 'text':
      return l.global
        ? `Campo global: ${l.global}`
        : l.role
          ? `${ROLE_LABEL[l.role]} #${l.order}`
          : l.text.slice(0, 24) || 'Texto'
    case 'image':
      return l.slot !== undefined ? `Imagem (slot ${l.slot})` : 'Imagem'
    case 'shape':
      return l.gradient ? 'Gradiente' : 'Forma'
    case 'profile':
      return 'Perfil (avatar + @)'
    case 'header':
      return 'Cabeçalho'
    case 'footer':
      return 'Rodapé (pílulas)'
    case 'card':
      return l.role ? `Cartão · ${ROLE_LABEL[l.role]} #${l.order}` : 'Cartão'
    case 'logo':
      return 'Logo da marca'
    case 'counter':
      return 'Contador de páginas'
    case 'doodle':
      return 'Rabisco'
    case 'cta':
      return l.label ? `Botão: ${l.label.replace(/\*\*/g, '')}` : 'Botão de seta'
  }
}

// ---------------------------------------------------------------------------
// Elemento
// ---------------------------------------------------------------------------

function ElementPanel({
  carousel,
  slide,
  slideIndex,
  el,
}: {
  carousel: Carousel
  slide: Slide
  slideIndex: number
  el: LeafElement
}) {
  const stack = parentStack(slide, el.id) as StackElement | undefined
  const set = <T extends LeafElement>(fn: (e: T) => T, key?: string) =>
    updateEl<T>(slideIndex, el.id, fn, key ?? `el:${el.id}`)
  const select = useEditor((s) => s.select)

  return (
    <>
      <PanelTitle
        icon={iconFor(el)}
        title={labelFor(el)}
        sub={stack ? 'Faz parte de um grupo empilhado' : undefined}
      />
      <div className="p-4 space-y-4">
        {el.type === 'text' && <TextPanel carousel={carousel} el={el} set={set} />}
        {el.type === 'image' && <ImagePanel carousel={carousel} el={el} set={set} />}
        {el.type === 'shape' && <ShapePanel carousel={carousel} el={el} set={set} />}
        {el.type === 'profile' && <ProfilePanel carousel={carousel} el={el} set={set} />}
        {el.type === 'header' && <HeaderPanel carousel={carousel} el={el} set={set} />}
        {el.type === 'footer' && <FooterPanel carousel={carousel} el={el} set={set} />}
        {el.type === 'card' && <CardPanel carousel={carousel} el={el} set={set} />}
        {el.type === 'logo' && <LogoPanel carousel={carousel} el={el} set={set} />}
        {el.type === 'counter' && <CounterPanel carousel={carousel} el={el} set={set} />}
        {el.type === 'doodle' && <DoodlePanel carousel={carousel} el={el} set={set} />}
        {el.type === 'cta' && <CtaPanel carousel={carousel} el={el} set={set} />}

        {stack ? (
          <div className="rounded-lg bg-ink/[.03] p-3 space-y-3">
            <div className="eyebrow text-mute">Grupo</div>
            <Segmented
              value={stack.anchor}
              onChange={(v) =>
                updateEl<StackElement>(slideIndex, stack.id, (s) => ({ ...s, anchor: v }))
              }
              options={[
                { value: 'top', label: 'Topo' },
                { value: 'center', label: 'Centro' },
                { value: 'bottom', label: 'Base' },
              ]}
            />
            <Slider
              label="Espaço entre itens"
              value={stack.gap}
              min={0}
              max={80}
              onChange={(v) =>
                updateEl<StackElement>(slideIndex, stack.id, (s) => ({ ...s, gap: v }), 'gap')
              }
            />
            <p className="text-[11px] text-ink/50">
              Arraste qualquer item do grupo para mover o grupo inteiro.
            </p>
          </div>
        ) : (
          !el.fullBleed && <Geometry el={el} set={set} />
        )}

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => set((e) => ({ ...e, hidden: !e.hidden }))}
          >
            {el.hidden ? <Eye size={14} /> : <EyeOff size={14} />}{' '}
            {el.hidden ? 'Mostrar' : 'Ocultar'}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              updateSlide(slideIndex, (s) => ({
                ...s,
                elements: s.elements
                  .filter((e) => e.id !== el.id)
                  .map((e) =>
                    e.type === 'stack'
                      ? { ...e, children: e.children.filter((c) => c.id !== el.id) }
                      : e,
                  ),
              }))
              select(null)
            }}
          >
            <Trash2 size={14} /> Remover
          </Button>
        </div>
      </div>
    </>
  )
}

type Setter<T> = (fn: (e: T) => T, key?: string) => void

function Geometry({ el, set }: { el: LeafElement; set: Setter<LeafElement> }) {
  const num = (k: 'x' | 'y' | 'w' | 'h', label: string) => (
    <Field label={label}>
      <input
        type="number"
        className={inputClass}
        value={Math.round(el[k])}
        onChange={(e) => set((x) => ({ ...x, [k]: Number(e.target.value) }), `geo:${k}`)}
      />
    </Field>
  )
  return (
    <div className="grid grid-cols-4 gap-2">
      {num('x', 'X')}
      {num('y', 'Y')}
      {num('w', 'Larg.')}
      {num('h', 'Alt.')}
    </div>
  )
}

function TextPanel({
  carousel,
  el,
  set,
}: {
  carousel: Carousel
  el: TextElement
  set: Setter<TextElement>
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const s = el.style
  const st = (patch: Partial<TextElement['style']>, key?: string) =>
    set((e) => ({ ...e, style: { ...e.style, ...patch } }), key)

  useEffect(() => {
    const focus = () => ref.current?.focus()
    window.addEventListener('studio:focus-text', focus)
    return () => window.removeEventListener('studio:focus-text', focus)
  }, [])

  const mark = (m: string) => {
    const t = ref.current
    if (!t) return
    const r = wrapSelection(t.value, t.selectionStart, t.selectionEnd, m)
    set((e) => ({ ...e, text: r.value }))
    requestAnimationFrame(() => t.setSelectionRange(r.start, r.end))
  }

  const fontChoice = s.font === 'titulo' || s.font === 'corpo' ? s.font : 'outra'

  return (
    <>
      {el.global ? (
        <p className="text-[12px] rounded-lg bg-accent-soft text-accent px-3 py-2">
          Este texto vem dos Campos globais (barra da esquerda) e é igual em todos os slides.
        </p>
      ) : (
        <div>
          <textarea
            ref={ref}
            rows={5}
            className={textareaClass}
            value={el.text}
            onChange={(e) => set((x) => ({ ...x, text: e.target.value }), `text:${el.id}`)}
          />
          <div className="flex items-center gap-1.5 mt-1.5">
            <Button
              size="sm"
              variant="soft"
              onClick={() => mark('==')}
              title="Selecione palavras e clique para destacar"
            >
              <Highlighter size={14} /> Destacar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => mark('**')}>
              <Bold size={14} /> Negrito
            </Button>
            <span className="ml-auto text-[11px] text-ink/45 tabular-nums">
              {el.text.replace(/==|\*\*/g, '').length} car.
            </span>
          </div>
          <p className="text-[11px] text-ink/45 mt-1">
            Use <code>==palavra==</code> para destaque, <code>**palavra**</code> para negrito,{' '}
            <code>_palavra_</code> para itálico e <code>~~palavra~~</code> para tachado.
          </p>
        </div>
      )}

      <Field label="Fonte">
        <Segmented
          value={fontChoice}
          onChange={(v) => st({ font: v === 'outra' ? carousel.fonts.titulo : v })}
          options={[
            { value: 'titulo', label: 'Título' },
            { value: 'corpo', label: 'Corpo' },
            { value: 'outra', label: 'Outra' },
          ]}
        />
      </Field>
      {fontChoice === 'outra' && <FontSelect value={s.font} onChange={(f) => st({ font: f })} />}

      <Slider
        label="Tamanho"
        value={s.size}
        min={12}
        max={220}
        onChange={(v) => st({ size: v }, 'size')}
        format={(v) => `${v}px`}
      />
      <Field label="Peso">
        <select
          className={inputClass}
          value={s.weight}
          onChange={(e) => st({ weight: Number(e.target.value) })}
        >
          {[300, 400, 500, 600, 700, 800, 900].map((w) => (
            <option key={w} value={w}>
              {w} {w === 400 ? '(normal)' : w === 700 ? '(negrito)' : ''}
            </option>
          ))}
        </select>
      </Field>
      <Slider
        label="Altura da linha"
        value={s.lineHeight}
        min={0.8}
        max={2}
        step={0.02}
        onChange={(v) => st({ lineHeight: v }, 'lh')}
        format={(v) => v.toFixed(2)}
      />
      <Slider
        label="Espaçamento"
        value={s.letterSpacing}
        min={-0.08}
        max={0.3}
        step={0.005}
        onChange={(v) => st({ letterSpacing: v }, 'ls')}
        format={(v) => v.toFixed(3)}
      />
      <Slider
        label="Largura do parágrafo"
        value={el.w}
        min={200}
        max={1080}
        step={2}
        onChange={(v) => set((e) => ({ ...e, w: v }), 'width')}
        format={(v) => `${v}px`}
      />
      <Segmented
        value={s.align}
        onChange={(v) => st({ align: v })}
        options={[
          { value: 'left', label: <AlignLeft size={14} /> },
          { value: 'center', label: <AlignCenter size={14} /> },
          { value: 'right', label: <AlignRight size={14} /> },
          { value: 'justify', label: <AlignJustify size={14} /> },
        ]}
      />
      <Slider
        label="Rotação"
        value={el.rotate ?? 0}
        min={-20}
        max={20}
        onChange={(v) => set((e) => ({ ...e, rotate: v }), 'rot')}
        format={(v) => `${v}°`}
      />
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Toggle checked={!!s.uppercase} onChange={(v) => st({ uppercase: v })} label="Caixa alta" />
        <Toggle checked={!!s.italic} onChange={(v) => st({ italic: v })} label="Itálico" />
        <Toggle checked={!!s.underline} onChange={(v) => st({ underline: v })} label="Sublinhado" />
      </div>
      <ColorRefPicker
        label="Cor do texto"
        value={s.color}
        palette={carousel.palette}
        onChange={(v) => st({ color: v })}
      />
      <ColorRefPicker
        label="Cor do destaque neste texto"
        value={s.highlight ?? carousel.highlight.color}
        palette={carousel.palette}
        onChange={(v) => st({ highlight: v })}
      />
      <Slider
        label="Opacidade"
        value={Math.round((el.opacity ?? 1) * 100)}
        min={10}
        max={100}
        onChange={(v) => set((e) => ({ ...e, opacity: v / 100 }), 'op')}
        format={(v) => `${v}%`}
      />
      {el.role && (
        <p className="text-[11px] text-ink/50">
          Campo de autofill: <b>{ROLE_LABEL[el.role]}</b>, ordem {el.order}. A linha {el.order} do
          texto colado/gerado vai para cá.
        </p>
      )}
    </>
  )
}

function ImagePanel({
  carousel,
  el,
  set,
}: {
  carousel: Carousel
  el: ImageElement
  set: Setter<ImageElement>
}) {
  const slideIndex = useEditor((s) => s.slideIndex)
  const [searching, setSearching] = useState(false)

  const upload = async () => {
    const [file] = await pickFiles('image/*')
    if (!file) return
    try {
      const src = await uploadImage(file)
      set((e) => ({ ...e, src, posX: 50, posY: 50, zoom: 1 }))
    } catch {
      toast('Não foi possível enviar a imagem. Tente de novo.', 'erro')
    }
  }

  const generateAi = async () => {
    if (searching) return
    // Congela o alvo no clique — durante o fetch o usuário pode mudar a seleção.
    const targetId = el.id
    const targetSlide = slideIndex
    setSearching(true)
    try {
      const theme = themeForImageSlot(carousel, targetSlide)
      const src = await fetchOneBankImage(theme, `regen-${targetId}-${Date.now()}`)
      update((c) => {
        const slides = c.slides.map((s, i) => {
          if (i !== targetSlide) return s
          // Substitui o src do elemento escolhido e remove overlays vazios
          // (ex.: "Imagem 99" adicionada por cima do slot do template).
          const patched = {
            ...s,
            elements: s.elements
              .filter((e) => {
                if (e.type !== 'image') return true
                if (e.id === targetId) return true
                // overlay solto sem foto, fora de stack → lixo visual
                return !!e.src
              })
              .map((e) => {
                if (e.id === targetId && e.type === 'image') {
                  return { ...e, src, posX: 50, posY: 50, zoom: 1, fit: 'cover' as const }
                }
                if (e.type === 'stack') {
                  return {
                    ...e,
                    children: e.children.map((child) =>
                      child.id === targetId && child.type === 'image'
                        ? {
                            ...child,
                            src,
                            posX: 50,
                            posY: 50,
                            zoom: 1,
                            fit: 'cover' as const,
                          }
                        : child,
                    ),
                  }
                }
                return e
              }),
          }
          return patched
        })
        return { ...c, slides: renumber(slides) }
      }, `img-ai:${targetId}:${Date.now()}`)
      useEditor.getState().select(targetId)
      toast('Imagem substituída')
    } catch {
      toast('Não foi possível buscar uma imagem. Tente de novo.', 'erro')
    } finally {
      setSearching(false)
    }
  }

  return (
    <>
      <div className="relative rounded-lg overflow-hidden border border-line bg-ink/5 aspect-video grid place-items-center">
        {el.src ? (
          <img src={assetUrl(el.src)} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="text-ink/25" />
        )}
        {searching && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-paper/90 backdrop-blur-sm px-3 text-center"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2 size={22} className="animate-spin text-accent" />
            <p className="text-[12.5px] font-semibold text-ink">Buscando sua imagem</p>
            <p className="text-[11px] text-ink/55 leading-snug">
              Combinando com o texto deste slide…
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={upload} disabled={searching}>
          {el.src ? 'Trocar imagem' : 'Enviar imagem'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void generateAi()}
          disabled={searching}
        >
          {searching ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Buscando…
            </>
          ) : (
            <>
              <Sparkles size={14} /> Gerar nova imagem com IA
            </>
          )}
        </Button>
        {el.src && (
          <Button
            size="sm"
            variant="ghost"
            disabled={searching}
            onClick={() => set((e) => ({ ...e, src: undefined }))}
          >
            Remover
          </Button>
        )}
      </div>
      <p className="text-[11px] text-ink/50">
        Dica: arraste a imagem no slide para enquadrar. Shift + arrastar move o quadro. Ctrl+V cola
        uma imagem copiada. Gerar com IA busca no banco uma foto alinhada ao texto do slide.
      </p>
      <Slider
        label="Zoom"
        value={Math.round(el.zoom * 100)}
        min={100}
        max={300}
        onChange={(v) => set((e) => ({ ...e, zoom: v / 100 }), 'zoom')}
        format={(v) => `${v}%`}
      />
      <Slider
        label="Horizontal"
        value={Math.round(el.posX)}
        min={0}
        max={100}
        onChange={(v) => set((e) => ({ ...e, posX: v }), 'px')}
        format={(v) => `${v}%`}
      />
      <Slider
        label="Vertical"
        value={Math.round(el.posY)}
        min={0}
        max={100}
        onChange={(v) => set((e) => ({ ...e, posY: v }), 'py')}
        format={(v) => `${v}%`}
      />
      {!el.fullBleed && (
        <>
          <Slider
            label="Altura do quadro"
            value={el.h}
            min={120}
            max={1350}
            step={2}
            onChange={(v) => set((e) => ({ ...e, h: v }), 'h')}
            format={(v) => `${v}px`}
          />
          <Slider
            label="Cantos arredondados"
            value={el.radius}
            min={0}
            max={200}
            onChange={(v) => set((e) => ({ ...e, radius: v }), 'radius')}
            format={(v) => `${v}px`}
          />
        </>
      )}
      <Field label="Encaixe">
        <Segmented
          value={el.fit}
          onChange={(v) => set((e) => ({ ...e, fit: v }))}
          options={[
            { value: 'cover', label: 'Preencher' },
            { value: 'contain', label: 'Caber inteira' },
          ]}
        />
      </Field>
      <Field label="Cores">
        <Segmented
          value={el.grayscale ? 'pb' : 'cor'}
          onChange={(v) => set((e) => ({ ...e, grayscale: v === 'pb' }))}
          options={[
            { value: 'cor', label: 'Originais' },
            { value: 'pb', label: 'Preto e branco' },
          ]}
        />
      </Field>
    </>
  )
}

function ShapePanel({
  carousel,
  el,
  set,
}: {
  carousel: Carousel
  el: ShapeElement
  set: Setter<ShapeElement>
}) {
  if (el.gradient) {
    const g = el.gradient
    const gs = (patch: Partial<typeof g>, key?: string) =>
      set((e) => ({ ...e, gradient: { ...e.gradient!, ...patch } }), key)
    return (
      <>
        <ColorRefPicker
          label="Cor do gradiente"
          value={g.color}
          palette={carousel.palette}
          onChange={(v) => gs({ color: v })}
        />
        <Slider
          label="Começa em"
          value={Math.round(g.from * 100)}
          min={0}
          max={100}
          onChange={(v) => gs({ from: v / 100 }, 'gf')}
          format={(v) => `${v}%`}
        />
        <Slider
          label="Termina em"
          value={Math.round(g.to * 100)}
          min={0}
          max={100}
          onChange={(v) => gs({ to: v / 100 }, 'gt')}
          format={(v) => `${v}%`}
        />
        <Slider
          label="Opacidade máxima"
          value={Math.round(g.opacity * 100)}
          min={0}
          max={100}
          onChange={(v) => gs({ opacity: v / 100 }, 'go')}
          format={(v) => `${v}%`}
        />
        <Segmented
          value={g.direction}
          onChange={(v) => gs({ direction: v })}
          options={[
            { value: 'down', label: 'Baixo' },
            { value: 'up', label: 'Cima' },
            { value: 'left', label: 'Esq.' },
            { value: 'right', label: 'Dir.' },
            { value: 'radial', label: 'Brilho' },
          ]}
        />
      </>
    )
  }
  return (
    <>
      <ColorRefPicker
        label="Cor"
        value={el.fill ?? 'destaque'}
        palette={carousel.palette}
        onChange={(v) => set((e) => ({ ...e, fill: v }))}
      />
      <Slider
        label="Cantos"
        value={el.radius}
        min={0}
        max={200}
        onChange={(v) => set((e) => ({ ...e, radius: v }), 'r')}
      />
    </>
  )
}

function ProfilePanel({
  carousel,
  el,
  set,
}: {
  carousel: Carousel
  el: ProfileElement
  set: Setter<ProfileElement>
}) {
  return (
    <>
      <p className="text-[12px] text-ink/55">Avatar, nome e @ vêm dos Campos globais.</p>
      <Slider
        label="Tamanho do avatar"
        value={el.avatarSize}
        min={24}
        max={200}
        onChange={(v) => set((e) => ({ ...e, avatarSize: v }), 'av')}
        format={(v) => `${v}px`}
      />
      <Slider
        label="Tamanho do texto"
        value={el.fontSize}
        min={14}
        max={60}
        onChange={(v) => set((e) => ({ ...e, fontSize: v }), 'fs')}
        format={(v) => `${v}px`}
      />
      <div className="flex gap-4">
        <Toggle
          checked={el.showName}
          onChange={(v) => set((e) => ({ ...e, showName: v }))}
          label="Nome"
        />
        <Toggle
          checked={el.showHandle}
          onChange={(v) => set((e) => ({ ...e, showHandle: v }))}
          label="@"
        />
      </div>
      <Segmented
        value={el.align}
        onChange={(v) => set((e) => ({ ...e, align: v }))}
        options={[
          { value: 'left', label: 'Esquerda' },
          { value: 'center', label: 'Centro' },
        ]}
      />
      <ColorRefPicker
        label="Cor"
        value={el.color}
        palette={carousel.palette}
        onChange={(v) => set((e) => ({ ...e, color: v }))}
      />
    </>
  )
}

function HeaderPanel({
  carousel,
  el,
  set,
}: {
  carousel: Carousel
  el: HeaderElement
  set: Setter<HeaderElement>
}) {
  return (
    <>
      <Segmented
        value={el.variant ?? 'colunas'}
        onChange={(v) => set((e) => ({ ...e, variant: v }))}
        options={[
          { value: 'colunas', label: '@ · marca · ©' },
          { value: 'assinatura', label: 'Assinatura · ©' },
        ]}
      />
      <p className="text-[12px] text-ink/55">
        Os textos vêm dos Campos globais (a assinatura é o campo "Tagline").
      </p>
      <Slider
        label="Tamanho"
        value={el.fontSize}
        min={12}
        max={40}
        onChange={(v) => set((e) => ({ ...e, fontSize: v }), 'fs')}
        format={(v) => `${v}px`}
      />
      <ColorRefPicker
        label="Cor"
        value={el.color}
        palette={carousel.palette}
        onChange={(v) => set((e) => ({ ...e, color: v }))}
      />
    </>
  )
}

function FooterPanel({
  carousel,
  el,
  set,
}: {
  carousel: Carousel
  el: FooterElement
  set: Setter<FooterElement>
}) {
  return (
    <>
      <p className="text-[12px] text-ink/55">
        Pílulas com o @ e o nome da marca (Campos globais) e a seta de "arrasta".
      </p>
      <Slider
        label="Tamanho"
        value={el.fontSize}
        min={12}
        max={36}
        onChange={(v) => set((e) => ({ ...e, fontSize: v }), 'fs')}
        format={(v) => `${v}px`}
      />
      <Toggle
        checked={el.showArrow}
        onChange={(v) => set((e) => ({ ...e, showArrow: v }))}
        label="Mostrar seta"
      />
      <ColorRefPicker
        label="Cor"
        value={el.color}
        palette={carousel.palette}
        onChange={(v) => set((e) => ({ ...e, color: v }))}
      />
      <ColorRefPicker
        label="Cor da seta"
        value={el.accent}
        palette={carousel.palette}
        onChange={(v) => set((e) => ({ ...e, accent: v }))}
      />
    </>
  )
}

const ICONS: { value: CtaIcon; label: string }[] = [
  { value: 'seta', label: 'Seta' },
  { value: 'seta-longa', label: 'Seta longa' },
  { value: 'salvar', label: 'Salvar' },
  { value: 'compartilhar', label: 'Compartilhar' },
  { value: 'curtir', label: 'Curtir' },
  { value: 'comentar', label: 'Comentar' },
  { value: 'link', label: 'Link' },
  { value: 'nenhum', label: 'Sem ícone' },
]

function CtaPanel({
  carousel,
  el,
  set,
}: {
  carousel: Carousel
  el: CtaElement
  set: Setter<CtaElement>
}) {
  return (
    <>
      <Field label="Texto do botão">
        <input
          className={inputClass}
          value={el.label}
          onChange={(e) => set((x) => ({ ...x, label: e.target.value }), 'label')}
        />
      </Field>
      <Field label="Ícone">
        <select
          className={inputClass}
          value={el.icon}
          onChange={(e) => set((x) => ({ ...x, icon: e.target.value as CtaIcon }))}
        >
          {ICONS.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Estilo">
        <Segmented
          value={el.variant}
          onChange={(v) => set((x) => ({ ...x, variant: v }))}
          options={[
            { value: 'solido', label: 'Sólido' },
            { value: 'contorno', label: 'Contorno' },
            { value: 'glass', label: 'Vidro' },
          ]}
        />
      </Field>
      <Slider
        label="Tamanho"
        value={el.fontSize}
        min={16}
        max={60}
        onChange={(v) => set((x) => ({ ...x, fontSize: v }), 'fs')}
        format={(v) => `${v}px`}
      />
      <Segmented
        value={el.align}
        onChange={(v) => set((x) => ({ ...x, align: v }))}
        options={[
          { value: 'left', label: <AlignLeft size={14} /> },
          { value: 'center', label: <AlignCenter size={14} /> },
          { value: 'right', label: <AlignRight size={14} /> },
        ]}
      />
      <ColorRefPicker
        label="Cor do botão"
        value={el.color}
        palette={carousel.palette}
        onChange={(v) => set((x) => ({ ...x, color: v }))}
      />
      <ColorRefPicker
        label="Cor do texto"
        value={el.textColor}
        palette={carousel.palette}
        onChange={(v) => set((x) => ({ ...x, textColor: v }))}
      />
    </>
  )
}

const CARD_ICON_OPTIONS: { value: CardIcon | ''; label: string }[] = [
  { value: '', label: 'Sem ícone' },
  { value: 'check', label: 'Check' },
  { value: 'imagem', label: 'Imagem' },
  { value: 'camera', label: 'Câmera' },
  { value: 'olho', label: 'Olho' },
  { value: 'robo', label: 'Robô' },
  { value: 'pessoas', label: 'Pessoas' },
  { value: 'chip', label: 'Chip' },
  { value: 'selo', label: 'Selo' },
  { value: 'link', label: 'Link' },
  { value: 'balanca', label: 'Balança' },
  { value: 'chat', label: 'Conversa' },
  { value: 'lupa', label: 'Lupa' },
  { value: 'raio', label: 'Raio' },
  { value: 'seta', label: 'Seta' },
  { value: 'alerta', label: 'Alerta' },
  { value: 'estrela', label: 'Estrela' },
  { value: 'grafico', label: 'Gráfico' },
]

function CardPanel({
  carousel,
  el,
  set,
}: {
  carousel: Carousel
  el: CardElement
  set: Setter<CardElement>
}) {
  return (
    <>
      <textarea
        rows={4}
        className={textareaClass}
        value={el.text}
        onChange={(e) => set((x) => ({ ...x, text: e.target.value }), `text:${el.id}`)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Ícone">
          <select
            className={inputClass}
            value={el.icon ?? ''}
            onChange={(e) =>
              set((x) => ({
                ...x,
                icon: (e.target.value || undefined) as CardIcon | undefined,
                badge: e.target.value ? undefined : x.badge,
              }))
            }
          >
            {CARD_ICON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Número">
          <input
            className={inputClass}
            value={el.badge ?? ''}
            placeholder="ex.: 1"
            onChange={(e) =>
              set((x) => ({
                ...x,
                badge: e.target.value || undefined,
                icon: e.target.value ? undefined : x.icon,
              }))
            }
          />
        </Field>
      </div>
      <Slider
        label="Tamanho do texto"
        value={el.fontSize}
        min={14}
        max={60}
        onChange={(v) => set((x) => ({ ...x, fontSize: v }), 'fs')}
        format={(v) => `${v}px`}
      />
      <Slider
        label="Espaço interno"
        value={el.padding}
        min={0}
        max={80}
        onChange={(v) => set((x) => ({ ...x, padding: v }), 'pad')}
        format={(v) => `${v}px`}
      />
      <Slider
        label="Cantos"
        value={el.radius}
        min={0}
        max={60}
        onChange={(v) => set((x) => ({ ...x, radius: v }), 'r')}
        format={(v) => `${v}px`}
      />
      <Segmented
        value={el.align}
        onChange={(v) => set((x) => ({ ...x, align: v }))}
        options={[
          { value: 'left', label: <AlignLeft size={14} /> },
          { value: 'center', label: <AlignCenter size={14} /> },
        ]}
      />
      <Toggle
        checked={!!el.glass}
        onChange={(v) => set((x) => ({ ...x, glass: v }))}
        label="Vidro fosco (sobre foto)"
      />
      <ColorRefPicker
        label="Fundo do cartão"
        value={el.fill}
        palette={carousel.palette}
        onChange={(v) => set((x) => ({ ...x, fill: v }))}
      />
      <ColorRefPicker
        label="Cor do texto"
        value={el.textColor}
        palette={carousel.palette}
        onChange={(v) => set((x) => ({ ...x, textColor: v }))}
      />
      <ColorRefPicker
        label="Cor do ícone"
        value={el.iconColor}
        palette={carousel.palette}
        onChange={(v) => set((x) => ({ ...x, iconColor: v }))}
      />
    </>
  )
}

function LogoPanel({
  carousel,
  el,
  set,
}: {
  carousel: Carousel
  el: LogoElement
  set: Setter<LogoElement>
}) {
  return (
    <>
      <p className="text-[12px] text-ink/55">
        Mostra o logo enviado nos Campos globais. Sem logo, mostra o nome da marca.
      </p>
      <Slider
        label="Tamanho"
        value={el.fontSize}
        min={12}
        max={80}
        onChange={(v) => set((x) => ({ ...x, fontSize: v }), 'fs')}
        format={(v) => `${v}px`}
      />
      <Segmented
        value={el.align}
        onChange={(v) => set((x) => ({ ...x, align: v }))}
        options={[
          { value: 'left', label: <AlignLeft size={14} /> },
          { value: 'center', label: <AlignCenter size={14} /> },
          { value: 'right', label: <AlignRight size={14} /> },
        ]}
      />
      <ColorRefPicker
        label="Cor (quando é texto)"
        value={el.color}
        palette={carousel.palette}
        onChange={(v) => set((x) => ({ ...x, color: v }))}
      />
    </>
  )
}

function CounterPanel({
  carousel,
  el,
  set,
}: {
  carousel: Carousel
  el: CounterElement
  set: Setter<CounterElement>
}) {
  return (
    <>
      <p className="text-[12px] text-ink/55">Mostra a posição do slide automaticamente.</p>
      <Segmented
        value={el.variant}
        onChange={(v) => set((x) => ({ ...x, variant: v }))}
        options={[
          { value: 'numero', label: '02 / 08' },
          { value: 'indice', label: '02' },
          { value: 'quadrados', label: '■■□□' },
        ]}
      />
      <Slider
        label="Tamanho"
        value={el.fontSize}
        min={10}
        max={60}
        onChange={(v) => set((x) => ({ ...x, fontSize: v }), 'fs')}
        format={(v) => `${v}px`}
      />
      <ColorRefPicker
        label="Cor"
        value={el.color}
        palette={carousel.palette}
        onChange={(v) => set((x) => ({ ...x, color: v }))}
      />
    </>
  )
}

function DoodlePanel({
  carousel,
  el,
  set,
}: {
  carousel: Carousel
  el: DoodleElement
  set: Setter<DoodleElement>
}) {
  return (
    <>
      <Field label="Tipo">
        <select
          className={inputClass}
          value={el.kind}
          onChange={(e) => set((x) => ({ ...x, kind: e.target.value as DoodleElement['kind'] }))}
        >
          <option value="seta-curva">Seta curva</option>
          <option value="seta">Seta</option>
          <option value="sublinhado">Sublinhado</option>
          <option value="circulo">Círculo</option>
        </select>
      </Field>
      <Slider
        label="Espessura"
        value={el.strokeWidth}
        min={1}
        max={12}
        onChange={(v) => set((x) => ({ ...x, strokeWidth: v }), 'sw')}
        format={(v) => `${v}px`}
      />
      <Toggle
        checked={!!el.flip}
        onChange={(v) => set((x) => ({ ...x, flip: v }))}
        label="Espelhar"
      />
      <Slider
        label="Rotação"
        value={el.rotate ?? 0}
        min={-180}
        max={180}
        onChange={(v) => set((x) => ({ ...x, rotate: v }), 'rot')}
        format={(v) => `${v}°`}
      />
      <ColorRefPicker
        label="Cor"
        value={el.color}
        palette={carousel.palette}
        onChange={(v) => set((x) => ({ ...x, color: v }))}
      />
    </>
  )
}
