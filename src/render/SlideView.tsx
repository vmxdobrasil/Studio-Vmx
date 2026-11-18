import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Bot,
  Camera,
  Check,
  Cpu,
  Eye,
  Heart,
  Image as ImageIcon,
  Link2,
  MessageCircle,
  MessageSquare,
  MoveRight,
  Scale,
  Search,
  Send,
  Star,
  TrendingUp,
  TriangleAlert,
  Users,
  Zap,
} from 'lucide-react'
import {
  createContext,
  useContext,
  useEffect,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { CANVAS_W, FORMAT_HEIGHT } from '../config'
import { assetUrl } from '../lib/assets'
import { resolveColor, withAlpha } from '../lib/colors'
import { cssFontStack, ensureFont, resolveFontFamily } from '../lib/fonts'
import { renderRich } from '../lib/richtext'
import type {
  Carousel,
  CardElement,
  CardIcon,
  CounterElement,
  CtaElement,
  DoodleElement,
  FooterElement,
  LogoElement,
  HeaderElement,
  ImageElement,
  LeafElement,
  ProfileElement,
  ShapeElement,
  Slide,
  SlideElement,
  StackElement,
  TextElement,
} from '../types'

export type RenderContext = Pick<
  Carousel,
  'palette' | 'fonts' | 'globals' | 'highlight' | 'format' | 'baseFormat'
>

export interface EditorHooks {
  selectedId?: string | null
  onBackgroundPointerDown?: (e: ReactPointerEvent) => void
  onElementPointerDown?: (e: ReactPointerEvent, el: LeafElement, parent?: StackElement) => void
  onElementDoubleClick?: (el: LeafElement) => void
}

interface Props {
  ctx: RenderContext
  slide: Slide
  /** Escala visual (1 = 1080 px de largura). */
  scale?: number
  editor?: EditorHooks
  className?: string
  /** Posição do slide no carrossel (para o contador automático de páginas). */
  page?: { index: number; total: number }
}

const PageContext = createContext({ index: 0, total: 1 })

export function canvasHeight(format: Carousel['format']) {
  return FORMAT_HEIGHT[format] ?? FORMAT_HEIGHT['4:5']
}

/** Proporção em que o carrossel foi desenhado (miniaturas usam esta, não a de exportação). */
export function baseFormatOf(ctx: Pick<Carousel, 'baseFormat'>) {
  return ctx.baseFormat ?? '4:5'
}

export function SlideView({ ctx, slide, scale = 1, editor, className, page }: Props) {
  const height = canvasHeight(ctx.format)
  // Em outra proporção, o conteúdo fica centralizado e o fundo cresce (ou é cortado) em cima e embaixo.
  const offsetY = (height - canvasHeight(baseFormatOf(ctx))) / 2

  useEffect(() => {
    const families = new Set([ctx.fonts.titulo, ctx.fonts.corpo])
    for (const el of slide.elements) {
      const list = el.type === 'stack' ? el.children : [el]
      for (const c of list)
        if (c.type === 'text') families.add(resolveFontFamily(c.style.font, ctx.fonts))
    }
    families.forEach((f) => void ensureFont(f))
  }, [ctx.fonts, slide.elements])

  return (
    <PageContext.Provider value={page ?? { index: 0, total: 1 }}>
      <div
        className={className}
        style={{
          width: CANVAS_W * scale,
          height: height * scale,
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          data-slide-root
          onPointerDown={editor?.onBackgroundPointerDown}
          style={{
            width: CANVAS_W,
            height,
            position: 'absolute',
            left: 0,
            top: 0,
            transform: scale === 1 ? undefined : `scale(${scale})`,
            transformOrigin: 'top left',
            background: resolveColor(slide.background, ctx.palette),
            overflow: 'hidden',
            fontFamily: cssFontStack(ctx.fonts.corpo),
          }}
        >
          {slide.elements.map((el) =>
            el.hidden ? null : (
              <Positioned key={el.id} el={el} offsetY={offsetY} height={height}>
                {el.type === 'stack' ? (
                  <StackView el={el} ctx={ctx} slide={slide} editor={editor} scale={scale} />
                ) : (
                  <Selectable el={el} editor={editor} scale={scale}>
                    <Leaf el={el} ctx={ctx} slide={slide} />
                  </Selectable>
                )}
              </Positioned>
            ),
          )}
        </div>
      </div>
    </PageContext.Provider>
  )
}

function Positioned({
  el,
  offsetY,
  height,
  children,
}: {
  el: SlideElement
  offsetY: number
  height: number
  children: ReactNode
}) {
  const style: CSSProperties = el.fullBleed
    ? { position: 'absolute', left: 0, top: 0, width: CANVAS_W, height }
    : {
        position: 'absolute',
        left: el.x,
        top: el.y + offsetY,
        width: el.w,
        height: el.type === 'text' || el.type === 'card' ? undefined : el.h,
      }
  if (el.type === 'stack') style.height = el.h
  if (el.rotate) {
    style.transform = `rotate(${el.rotate}deg)`
    style.transformOrigin = 'center'
  }
  return <div style={{ ...style, opacity: el.opacity ?? 1 }}>{children}</div>
}

function Selectable({
  el,
  parent,
  editor,
  scale,
  children,
  style,
}: {
  el: LeafElement
  parent?: StackElement
  editor?: EditorHooks
  scale: number
  children: ReactNode
  style?: CSSProperties
}) {
  if (!editor) return <div style={{ width: '100%', height: '100%', ...style }}>{children}</div>
  const selected = editor.selectedId === el.id
  const line = Math.max(2, 2 / scale)
  return (
    <div
      data-el={el.id}
      className="slide-el"
      onPointerDown={(e) => {
        e.stopPropagation()
        editor.onElementPointerDown?.(e, el, parent)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        editor.onElementDoubleClick?.(el)
      }}
      style={{
        width: '100%',
        height: '100%',
        cursor: el.type === 'image' && el.src ? 'grab' : 'move',
        // Gradientes de tela cheia deixam o clique passar para a foto embaixo.
        pointerEvents: el.type === 'shape' && el.fullBleed ? 'none' : undefined,
        outline: selected ? `${line}px solid #FF7A17` : undefined,
        outlineOffset: selected ? line * 2 : undefined,
        ['--hover-outline' as string]: `${line}px dashed rgba(255,122,23,.75)`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function StackView({
  el,
  ctx,
  slide,
  editor,
  scale,
}: {
  el: StackElement
  ctx: RenderContext
  slide: Slide
  editor?: EditorHooks
  scale: number
}) {
  const justify =
    el.anchor === 'top' ? 'flex-start' : el.anchor === 'center' ? 'center' : 'flex-end'
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: justify,
        gap: el.gap,
      }}
    >
      {el.children.map((c) => {
        if (c.hidden) return null
        const sized: CSSProperties =
          c.type === 'image'
            ? { height: c.h }
            : c.type === 'shape'
              ? { width: c.w, height: c.h, flexShrink: 0 }
              : {}
        return (
          <div
            key={c.id}
            style={{ position: 'relative', flexShrink: 0, opacity: c.opacity ?? 1, ...sized }}
          >
            <Selectable el={c} parent={el} editor={editor} scale={scale}>
              <Leaf el={c} ctx={ctx} slide={slide} />
            </Selectable>
          </div>
        )
      })}
    </div>
  )
}

function Leaf({ el, ctx, slide }: { el: LeafElement; ctx: RenderContext; slide: Slide }) {
  switch (el.type) {
    case 'text':
      return <TextView el={el} ctx={ctx} />
    case 'image':
      return <ImageView el={el} />
    case 'shape':
      return <ShapeView el={el} ctx={ctx} strength={slide.gradientStrength} />
    case 'profile':
      return <ProfileView el={el} ctx={ctx} />
    case 'header':
      return <HeaderView el={el} ctx={ctx} />
    case 'card':
      return <CardView el={el} ctx={ctx} />
    case 'logo':
      return <LogoView el={el} ctx={ctx} />
    case 'counter':
      return <CounterView el={el} ctx={ctx} />
    case 'doodle':
      return <DoodleView el={el} ctx={ctx} />
    case 'footer':
      return <FooterView el={el} ctx={ctx} />
    case 'cta':
      return <CtaView el={el} ctx={ctx} />
  }
}

function TextView({ el, ctx }: { el: TextElement; ctx: RenderContext }) {
  const s = el.style
  const family = resolveFontFamily(s.font, ctx.fonts)
  const content = el.global ? (ctx.globals[el.global] ?? '') : el.text
  const highlight = {
    mode: s.highlightMode ?? ctx.highlight.mode,
    color: s.highlight ?? ctx.highlight.color,
  }
  return (
    <div
      style={{
        fontFamily: cssFontStack(family),
        fontSize: s.size,
        fontWeight: s.weight,
        lineHeight: s.lineHeight,
        letterSpacing: `${s.letterSpacing}em`,
        textAlign: s.align,
        textTransform: s.uppercase ? 'uppercase' : undefined,
        fontStyle: s.italic ? 'italic' : undefined,
        textDecoration: s.underline ? 'underline' : undefined,
        textDecorationThickness: s.underline ? '0.06em' : undefined,
        textUnderlineOffset: s.underline ? '0.16em' : undefined,
        color: resolveColor(s.color, ctx.palette),
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
      }}
    >
      {renderRich(content, highlight, ctx.palette)}
    </div>
  )
}

function ImageView({ el }: { el: ImageElement }) {
  const frame: CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: el.radius,
    overflow: 'hidden',
    position: 'relative',
  }
  if (!el.src) {
    return (
      <div style={{ ...frame, background: 'linear-gradient(180deg,#d9dce1 0%,#aeb4bc 100%)' }}>
        <svg
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMax slice"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <circle cx="120" cy="110" r="26" fill="#eef0f3" opacity=".8" />
          <path
            d="M0 300 L0 230 Q 90 150 170 210 Q 250 60 400 190 L400 300 Z"
            fill="#f4f5f7"
            opacity=".85"
          />
        </svg>
        {el.slot !== undefined && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              font: '600 26px Inter, sans-serif',
              color: 'rgba(0,0,0,.32)',
            }}
          >
            Imagem {el.slot}
          </div>
        )}
      </div>
    )
  }
  return (
    <div style={frame}>
      <img
        src={assetUrl(el.src)}
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: el.fit,
          objectPosition: `${el.posX}% ${el.posY}%`,
          transform: el.zoom !== 1 ? `scale(${el.zoom})` : undefined,
          transformOrigin: `${el.posX}% ${el.posY}%`,
          filter: el.grayscale ? 'grayscale(1)' : undefined,
          display: 'block',
          userSelect: 'none',
        }}
      />
    </div>
  )
}

/** Ângulo de cada direção: a cor aparece no lado indicado. */
const GRADIENT_ANGLE = {
  down: '180deg',
  up: '0deg',
  right: '90deg',
  left: '270deg',
  radial: '180deg',
} as const

function ShapeView({
  el,
  ctx,
  strength,
}: {
  el: ShapeElement
  ctx: RenderContext
  strength: number
}) {
  let background: string | undefined
  if (el.gradient) {
    const g = el.gradient
    const c = resolveColor(g.color, ctx.palette)
    const a = Math.max(0, Math.min(1, g.opacity * strength))
    background =
      g.direction === 'radial'
        ? `radial-gradient(ellipse at ${g.cx ?? 50}% ${g.cy ?? 50}%, ${withAlpha(c, a)} ${g.from * 100}%, ${withAlpha(c, 0)} ${g.to * 100}%)`
        : `linear-gradient(${GRADIENT_ANGLE[g.direction]}, ${withAlpha(c, 0)} ${g.from * 100}%, ${withAlpha(c, a)} ${g.to * 100}%)`
  } else if (el.fill) {
    background = resolveColor(el.fill, ctx.palette)
  }
  const border = el.stroke
    ? `${el.stroke.width}px ${el.stroke.style ?? 'solid'} ${resolveColor(el.stroke.color, ctx.palette)}`
    : undefined
  const pattern: CSSProperties = el.pattern
    ? el.pattern.kind === 'triangulos'
      ? {
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='${el.pattern.size}' height='${el.pattern.size}' viewBox='0 0 40 40'><path d='M20 12 L27 25 L13 25 Z' fill='${resolveColor(el.pattern.color, ctx.palette)}'/></svg>`,
          )}")`,
          backgroundSize: `${el.pattern.size}px ${el.pattern.size}px`,
        }
      : el.pattern.kind === 'pontos'
        ? {
            backgroundImage: `radial-gradient(${resolveColor(el.pattern.color, ctx.palette)} 1.6px, transparent 1.8px)`,
            backgroundSize: `${el.pattern.size}px ${el.pattern.size}px`,
          }
        : {
            backgroundImage: `linear-gradient(${resolveColor(el.pattern.color, ctx.palette)} 1px, transparent 1px), linear-gradient(90deg, ${resolveColor(el.pattern.color, ctx.palette)} 1px, transparent 1px)`,
            backgroundSize: `${el.pattern.size}px ${el.pattern.size}px`,
          }
    : {}
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background,
        borderRadius: el.radius,
        border,
        boxSizing: 'border-box',
        ...pattern,
      }}
    />
  )
}

export function VerifiedBadge({ size }: { size: number }) {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const r = i % 2 === 0 ? 12 : 10.4
    const a = (Math.PI * 2 * i) / 24
    return `${12 + r * Math.cos(a)},${12 + r * Math.sin(a)}`
  }).join(' ')
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ flexShrink: 0, display: 'inline-block' }}
    >
      <polygon points={pts} fill="#1D9BF0" />
      <path
        d="M7.4 12.3l3 3 6.2-6.4"
        fill="none"
        stroke="#fff"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Avatar({
  src,
  size,
  name,
  ctx,
}: {
  src?: string
  size: number
  name: string
  ctx: RenderContext
}) {
  return src ? (
    <img
      src={assetUrl(src)}
      alt=""
      draggable={false}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: ctx.palette.destaque,
        color: ctx.palette.texto,
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        fontSize: size * 0.42,
        flexShrink: 0,
      }}
    >
      {(name.replace('@', '').trim()[0] ?? '?').toUpperCase()}
    </div>
  )
}

function ProfileView({ el, ctx }: { el: ProfileElement; ctx: RenderContext }) {
  const color = resolveColor(el.color, ctx.palette)
  const g = ctx.globals
  const badge = g.verified ? <VerifiedBadge size={el.fontSize * 0.95} /> : null
  const twoLines = el.showName && el.showHandle
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: el.align === 'center' ? 'center' : 'flex-start',
        flexDirection: el.align === 'center' && el.avatarSize > 80 ? 'column' : 'row',
        gap: el.avatarSize * 0.26,
        color,
        fontFamily: cssFontStack(ctx.fonts.corpo),
        textAlign: el.align,
      }}
    >
      <Avatar src={g.avatar} size={el.avatarSize} name={g.brandName || g.handle} ctx={ctx} />
      {twoLines ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: el.fontSize * 0.12,
            alignItems: el.align === 'center' ? 'center' : 'flex-start',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: el.fontSize * 0.25,
              fontSize: el.fontSize,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {g.brandName}
            {badge}
          </div>
          <div style={{ fontSize: el.fontSize * 0.86, opacity: 0.62, lineHeight: 1.1 }}>
            {g.handle}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: el.fontSize * 0.25,
            fontSize: el.fontSize,
            fontWeight: 600,
            lineHeight: 1.1,
          }}
        >
          {el.showName ? g.brandName : g.handle}
          {badge}
        </div>
      )}
    </div>
  )
}

function HeaderView({ el, ctx }: { el: HeaderElement; ctx: RenderContext }) {
  const g = ctx.globals
  if (el.variant === 'assinatura') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          fontSize: el.fontSize,
          fontWeight: 500,
          lineHeight: 1.2,
          color: resolveColor(el.color, ctx.palette),
          fontFamily: cssFontStack(ctx.fonts.corpo),
          opacity: 0.9,
        }}
      >
        <span style={{ whiteSpace: 'pre-line' }}>{g.tagline || g.brandName}</span>
        <span>{g.copyright}</span>
      </div>
    )
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        fontSize: el.fontSize,
        fontWeight: 600,
        letterSpacing: '0.01em',
        color: resolveColor(el.color, ctx.palette),
        fontFamily: cssFontStack(ctx.fonts.corpo),
        opacity: 0.88,
        height: '100%',
      }}
    >
      <span>{g.handle}</span>
      <span style={{ textAlign: 'center' }}>{g.brandName}</span>
      <span style={{ textAlign: 'right' }}>{g.copyright}</span>
    </div>
  )
}

function FooterView({ el, ctx }: { el: FooterElement; ctx: RenderContext }) {
  const color = resolveColor(el.color, ctx.palette)
  const pill: CSSProperties = {
    border: `2px solid ${withAlpha(color, 0.55)}`,
    borderRadius: 999,
    padding: `${el.fontSize * 0.42}px ${el.fontSize * 0.9}px`,
    lineHeight: 1,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  }
  const label = (s: string) => (s.startsWith('@') ? s : `@${s.replace(/\s+/g, '').toLowerCase()}`)
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        fontSize: el.fontSize,
        fontWeight: 500,
        color,
        fontFamily: cssFontStack(ctx.fonts.corpo),
      }}
    >
      <span style={pill}>{ctx.globals.handle}</span>
      <span style={pill}>{label(ctx.globals.brandName)}</span>
      {el.showArrow ? (
        <span
          style={{
            ...pill,
            borderColor: resolveColor(el.accent, ctx.palette),
            display: 'inline-flex',
            padding: `${el.fontSize * 0.2}px ${el.fontSize * 0.9}px`,
          }}
        >
          <MoveRight size={el.fontSize * 1.5} strokeWidth={1.6} color={color} />
        </span>
      ) : (
        <span />
      )}
    </div>
  )
}

const CTA_ICONS = {
  seta: ArrowRight,
  'seta-longa': MoveRight,
  salvar: Bookmark,
  compartilhar: Send,
  curtir: Heart,
  comentar: MessageCircle,
  link: Link2,
} as const

function CtaView({ el, ctx }: { el: CtaElement; ctx: RenderContext }) {
  const color = resolveColor(el.color, ctx.palette)
  const textColor = resolveColor(el.textColor, ctx.palette)
  const Icon = el.icon !== 'nenhum' ? CTA_ICONS[el.icon] : null
  const variant: CSSProperties =
    el.variant === 'solido'
      ? { background: color, color: textColor }
      : el.variant === 'contorno'
        ? {
            border: `${Math.max(3, el.fontSize * 0.1)}px solid ${color}`,
            color: el.label ? color : textColor,
          }
        : {
            background: 'rgba(255,255,255,.16)',
            border: '2px solid rgba(255,255,255,.35)',
            color: ctx.palette.hook,
          }
  const iconOnly = !el.label.trim()
  return (
    <div
      style={{
        display: 'flex',
        justifyContent:
          el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: el.fontSize * 0.45,
          padding: iconOnly
            ? `${el.fontSize * 0.25}px ${el.fontSize * 0.9}px`
            : `${el.fontSize * 0.62}px ${el.fontSize * 1.15}px`,
          borderRadius: 999,
          fontSize: el.fontSize,
          fontWeight: 600,
          fontFamily: cssFontStack(ctx.fonts.corpo),
          lineHeight: 1,
          ...variant,
        }}
      >
        {!iconOnly && <span>{renderRich(el.label, ctx.highlight, ctx.palette)}</span>}
        {Icon && (
          <Icon
            size={el.fontSize * (el.icon === 'seta-longa' ? 1.6 : 1.05)}
            strokeWidth={el.icon === 'seta-longa' ? 1.6 : 2.4}
          />
        )}
      </div>
    </div>
  )
}

const CARD_ICONS: Record<CardIcon, typeof Check> = {
  check: Check,
  imagem: ImageIcon,
  camera: Camera,
  olho: Eye,
  robo: Bot,
  pessoas: Users,
  chip: Cpu,
  selo: BadgeCheck,
  link: Link2,
  balanca: Scale,
  chat: MessageSquare,
  lupa: Search,
  raio: Zap,
  seta: ArrowRight,
  alerta: TriangleAlert,
  estrela: Star,
  grafico: TrendingUp,
}

function CardView({ el, ctx }: { el: CardElement; ctx: RenderContext }) {
  const textColor = resolveColor(el.textColor, ctx.palette)
  const iconColor = resolveColor(el.iconColor, ctx.palette)
  const Icon = el.icon ? CARD_ICONS[el.icon] : null
  const box = el.fontSize * 1.75
  return (
    <div
      style={{
        minHeight: el.h,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: el.align === 'center' ? 'center' : 'flex-start',
        gap: el.fontSize * 0.75,
        padding: el.padding,
        borderRadius: el.radius,
        background: resolveColor(el.fill, ctx.palette),
        border: el.stroke
          ? `${el.stroke.width}px solid ${resolveColor(el.stroke.color, ctx.palette)}`
          : undefined,
        backdropFilter: el.glass ? 'blur(14px)' : undefined,
        color: textColor,
        fontFamily: cssFontStack(ctx.fonts.corpo),
      }}
    >
      {(Icon || el.badge) && (
        <div
          style={{
            width: box,
            height: box,
            flexShrink: 0,
            borderRadius: el.fontSize * 0.4,
            display: 'grid',
            placeItems: 'center',
            border: el.badge
              ? undefined
              : `2px solid ${withAlpha(iconColor.startsWith('#') ? iconColor : '#888888', 0.35)}`,
            background: el.badge
              ? withAlpha(iconColor.startsWith('#') ? iconColor : '#888888', 0.16)
              : undefined,
            color: iconColor,
            fontWeight: 700,
            fontSize: el.fontSize * 1.05,
          }}
        >
          {Icon ? <Icon size={el.fontSize * 1.05} strokeWidth={2} /> : el.badge}
        </div>
      )}
      <div
        style={{
          fontSize: el.fontSize,
          lineHeight: el.lineHeight,
          fontWeight: el.weight,
          textAlign: el.align,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
        }}
      >
        {renderRich(el.text, ctx.highlight, ctx.palette)}
      </div>
    </div>
  )
}

function LogoView({ el, ctx }: { el: LogoElement; ctx: RenderContext }) {
  const justify =
    el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start'
  return (
    <div style={{ display: 'flex', justifyContent: justify, alignItems: 'center', height: '100%' }}>
      {ctx.globals.logo ? (
        <img
          src={assetUrl(ctx.globals.logo)}
          alt=""
          draggable={false}
          style={{ height: el.fontSize * 1.4, width: 'auto', objectFit: 'contain' }}
        />
      ) : (
        <span
          style={{
            fontSize: el.fontSize,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: resolveColor(el.color, ctx.palette),
            fontFamily: cssFontStack(ctx.fonts.corpo),
            lineHeight: 1,
          }}
        >
          {ctx.globals.brandName}
        </span>
      )}
    </div>
  )
}

function CounterView({ el, ctx }: { el: CounterElement; ctx: RenderContext }) {
  const { index, total } = useContext(PageContext)
  const color = resolveColor(el.color, ctx.palette)
  const pad = (n: number) => String(n).padStart(2, '0')
  const justify =
    el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start'
  if (el.variant === 'quadrados') {
    const size = el.fontSize
    return (
      <div
        style={{
          display: 'flex',
          gap: size * 0.18,
          justifyContent: justify,
          alignItems: 'center',
          height: '100%',
        }}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            style={{
              width: size,
              height: size,
              boxSizing: 'border-box',
              border: `${Math.max(2, size * 0.1)}px solid ${color}`,
              background: i <= index ? color : 'transparent',
            }}
          />
        ))}
      </div>
    )
  }
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: justify,
        alignItems: 'center',
        height: '100%',
        fontSize: el.fontSize,
        color,
        fontFamily: cssFontStack(resolveFontFamily(el.font ?? 'corpo', ctx.fonts)),
        letterSpacing: '0.04em',
        whiteSpace: 'pre',
      }}
    >
      {el.variant === 'indice' ? pad(index + 1) : `${pad(index + 1)} / ${pad(total)}`}
    </div>
  )
}

const DOODLE_PATHS: Record<DoodleElement['kind'], { d: string; viewBox: string; head?: string }> = {
  'seta-curva': {
    viewBox: '0 0 100 100',
    d: 'M6 10 C 40 6, 72 30, 84 86',
    head: 'M70 74 L84 88 L92 70',
  },
  seta: { viewBox: '0 0 100 40', d: 'M4 22 C 30 18, 60 24, 92 20', head: 'M78 8 L94 20 L80 32' },
  sublinhado: { viewBox: '0 0 200 20', d: 'M4 12 C 50 4, 120 18, 196 8' },
  circulo: {
    viewBox: '0 0 200 100',
    d: 'M100 6 C 160 4, 196 30, 194 52 C 192 82, 140 96, 96 94 C 44 92, 6 76, 6 50 C 6 24, 46 8, 110 10',
  },
}

function DoodleView({ el, ctx }: { el: DoodleElement; ctx: RenderContext }) {
  const p = DOODLE_PATHS[el.kind]
  const color = resolveColor(el.color, ctx.palette)
  return (
    <svg
      viewBox={p.viewBox}
      preserveAspectRatio="none"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
        transform: el.flip ? 'scaleX(-1)' : undefined,
      }}
    >
      <path
        d={p.d}
        fill="none"
        stroke={color}
        strokeWidth={el.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {p.head && (
        <path
          d={p.head}
          fill="none"
          stroke={color}
          strokeWidth={el.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}
