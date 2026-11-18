/**
 * Funções curtas para escrever templates. Um template é só dados: slides com elementos
 * posicionados num canvas de 1080×1350. Os ids aqui são provisórios; ao criar um
 * carrossel eles são regenerados.
 */
import type {
  CardElement,
  ColorRef,
  CounterElement,
  CtaElement,
  DoodleElement,
  LogoElement,
  FooterElement,
  GradientFill,
  HeaderElement,
  ImageElement,
  LeafElement,
  ProfileElement,
  ShapeElement,
  Slide,
  SlideElement,
  StackElement,
  TextElement,
  TextRole,
  TextStyle,
} from '../types'

export const W = 1080
export const H = 1350
export const M = 72
export const INNER = W - M * 2

let seq = 0
const tid = () => `tpl_${++seq}`

type Box = { x?: number; y?: number; w?: number; h: number }

export const style = (p: Partial<TextStyle> = {}): TextStyle => ({
  font: 'corpo',
  size: 32,
  weight: 400,
  lineHeight: 1.35,
  letterSpacing: 0,
  align: 'left',
  color: 'texto',
  ...p,
})

export function text(
  role: TextRole | undefined,
  content: string,
  box: Box,
  s: Partial<TextStyle> = {},
  extra: Partial<TextElement> = {},
): TextElement {
  return {
    id: tid(),
    type: 'text',
    text: content,
    role,
    x: box.x ?? M,
    y: box.y ?? 0,
    w: box.w ?? INNER,
    h: box.h,
    style: style(s),
    ...extra,
  }
}

export function img(
  slot: number | undefined,
  box: Box,
  extra: Partial<ImageElement> = {},
): ImageElement {
  return {
    id: tid(),
    type: 'image',
    slot,
    x: box.x ?? M,
    y: box.y ?? 0,
    w: box.w ?? INNER,
    h: box.h,
    fit: 'cover',
    radius: 0,
    zoom: 1,
    posX: 50,
    posY: 50,
    ...extra,
  }
}

export const fullImage = (slot: number, h = H) =>
  img(slot, { x: 0, y: 0, w: W, h }, { fullBleed: true })

export function gradient(g: Partial<GradientFill> = {}, h = H): ShapeElement {
  return {
    id: tid(),
    type: 'shape',
    x: 0,
    y: 0,
    w: W,
    h,
    radius: 0,
    fullBleed: true,
    gradient: { color: '#000000', from: 0.3, to: 1, opacity: 0.9, direction: 'down', ...g },
  }
}

export function rect(box: Required<Box>, fill: ColorRef, radius = 0): ShapeElement {
  return { id: tid(), type: 'shape', ...box, fill, radius }
}

export function header(
  color: ColorRef = 'meta',
  y = 46,
  extra: Partial<HeaderElement> = {},
): HeaderElement {
  return { id: tid(), type: 'header', x: M, y, w: INNER, h: 30, fontSize: 21, color, ...extra }
}

export function footer(y: number, p: Partial<FooterElement> = {}): FooterElement {
  return {
    id: tid(),
    type: 'footer',
    x: M,
    y,
    w: INNER,
    h: 48,
    fontSize: 18,
    color: 'texto',
    accent: 'destaque',
    showArrow: true,
    ...p,
  }
}

/** Linha divisória fina (forma de 2 px). */
export function line(
  box: { x?: number; y?: number; w?: number },
  color: ColorRef = 'texto',
  opacity = 0.35,
  thickness = 2,
): ShapeElement {
  return {
    id: tid(),
    type: 'shape',
    x: box.x ?? M,
    y: box.y ?? 0,
    w: box.w ?? INNER,
    h: thickness,
    fill: color,
    radius: 0,
    opacity,
  }
}

export function card(
  role: TextRole | undefined,
  content: string,
  box: Box,
  p: Partial<CardElement> = {},
): CardElement {
  return {
    id: tid(),
    type: 'card',
    text: content,
    role,
    x: box.x ?? M,
    y: box.y ?? 0,
    w: box.w ?? INNER,
    h: box.h,
    fill: 'rgba(255,255,255,0.06)',
    textColor: 'texto',
    iconColor: 'destaque',
    fontSize: 26,
    lineHeight: 1.3,
    weight: 400,
    radius: 20,
    padding: 24,
    align: 'left',
    ...p,
  }
}

export function logo(y = 44, p: Partial<LogoElement> = {}): LogoElement {
  return {
    id: tid(),
    type: 'logo',
    x: M,
    y,
    w: INNER,
    h: 40,
    fontSize: 24,
    color: 'texto',
    align: 'center',
    ...p,
  }
}

/** Contador automático de páginas ("02 / 08", "02" ou quadradinhos). */
export function counter(
  box: { x: number; y: number; w: number; h: number },
  p: Partial<CounterElement> = {},
): CounterElement {
  return {
    id: tid(),
    type: 'counter',
    ...box,
    variant: 'numero',
    fontSize: 20,
    color: 'texto',
    align: 'right',
    ...p,
  }
}

/** Rabisco feito à mão que estica para caber na caixa. */
export function doodle(
  kind: DoodleElement['kind'],
  box: { x: number; y: number; w: number; h: number },
  p: Partial<DoodleElement> = {},
): DoodleElement {
  return { id: tid(), type: 'doodle', kind, ...box, color: 'hook', strokeWidth: 4, ...p }
}

export function profile(p: Partial<ProfileElement> = {}): ProfileElement {
  return {
    id: tid(),
    type: 'profile',
    x: M,
    y: 0,
    w: INNER,
    h: 60,
    avatarSize: 52,
    showName: false,
    showHandle: true,
    fontSize: 26,
    color: 'hook',
    align: 'left',
    ...p,
  }
}

export function cta(label: string, p: Partial<CtaElement> = {}): CtaElement {
  return {
    id: tid(),
    type: 'cta',
    label,
    role: 'cta',
    x: M,
    y: 0,
    w: INNER,
    h: 84,
    icon: 'seta',
    variant: 'solido',
    color: 'destaque',
    textColor: 'texto',
    fontSize: 30,
    align: 'left',
    ...p,
  }
}

export function stack(
  box: Required<Box>,
  anchor: StackElement['anchor'],
  children: LeafElement[],
  gap = 24,
): StackElement {
  return { id: tid(), type: 'stack', ...box, anchor, gap, children }
}

export function slide(
  name: string,
  background: ColorRef,
  elements: SlideElement[],
  gradientStrength = 1,
): Slide {
  return { id: tid(), name, background, gradientStrength, elements }
}
