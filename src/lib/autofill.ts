import type { Carousel, FillableElement, Slide, TextRole } from '../types'
import { isFillable, mapLeaves, walk } from './elements'
import { plainText } from './richtext'

export interface TextSlot {
  order: number
  role: TextRole
  slideIndex: number
  elementId: string
  maxChars: number
  text: string
}

export const ROLE_LABEL: Record<TextRole, string> = {
  hook: 'Hook (título da capa)',
  subhook: 'Subhook (apoio da capa)',
  rotulo: 'Rótulo (chamada curta acima do título)',
  titulo: 'Título',
  subtitulo: 'Subtítulo',
  corpo: 'Texto',
  cta: 'Chamada final (CTA)',
}

/** Estimativa de quantos caracteres cabem na caixa de texto. */
export function estimateMaxChars(el: FillableElement) {
  if (el.type === 'cta') {
    const charWidth = el.fontSize * 0.5
    const perLine = Math.max(8, Math.floor(el.w / charWidth))
    return Math.max(12, Math.min(80, Math.floor(perLine * 0.9)))
  }
  const { size, lineHeight, uppercase } =
    el.type === 'text'
      ? el.style
      : { size: el.fontSize, lineHeight: el.lineHeight, uppercase: false }
  const w =
    el.type === 'card' ? el.w - el.padding * 2 - (el.icon || el.badge ? el.fontSize * 2 : 0) : el.w
  const h = el.type === 'card' ? Math.max(el.h - el.padding * 2, size * lineHeight) : el.h
  const charWidth = size * (uppercase ? 0.56 : 0.5)
  const perLine = Math.max(8, Math.floor(w / charWidth))
  const lines = Math.max(1, Math.floor(h / (size * lineHeight)))
  return Math.max(20, Math.min(400, Math.floor(perLine * lines * 0.88)))
}

function slotText(el: FillableElement) {
  return el.type === 'cta' ? el.label : el.text
}

/** Lista os campos de texto preenchíveis (com papel), na ordem de autofill. */
export function getSlots(slides: Slide[]): TextSlot[] {
  const slots: TextSlot[] = []
  // Ordem = ordem visual do walk (slide a slide). Não depende de el.order:
  // carrosséis antigos têm CTA sem order e o sort por 0 jogava o botão pro início.
  let seq = 0
  slides.forEach((slide, slideIndex) =>
    walk(slide, (el) => {
      // CTA sem role explícito ainda conta (botão do template).
      if (el.type === 'cta' && !el.hidden) {
        slots.push({
          order: ++seq,
          role: el.role ?? 'cta',
          slideIndex,
          elementId: el.id,
          maxChars: estimateMaxChars(el),
          text: el.label,
        })
        return
      }
      if (isFillable(el) && el.role && !el.hidden) {
        slots.push({
          order: ++seq,
          role: el.role!,
          slideIndex,
          elementId: el.id,
          maxChars: estimateMaxChars(el),
          text: slotText(el),
        })
      }
    }),
  )
  return slots
}

/** Limpa uma linha colada: tira marcadores, numeração e rótulos ("Slide 2:", "Hook:"). */
export function cleanLine(line: string) {
  return line
    .trim()
    .replace(/^[-•*–—]\s+/, '')
    .replace(/^\d{1,2}\s*[.)\-–]\s+/, '')
    .replace(/^(slide|card|bloco|frame)\s*\d+\s*[:\-–]\s*/i, '')
    .replace(/^(hook|subhook|t[íi]tulo|subt[íi]tulo|texto|corpo|cta|linha\s*\d+)\s*[:\-–]\s*/i, '')
    .trim()
}

export function parsePasted(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((l) => l.length > 0 && !/^-{3,}$/.test(l))
}

/** Preenche os campos na ordem com as linhas dadas. Linhas a mais são ignoradas. */
export function applyLines(
  slides: Slide[],
  lines: string[],
  opts: { clearEmpty?: boolean } = {},
): { slides: Slide[]; applied: number; total: number } {
  const slots = getSlots(slides)
  const byId = new Map<string, string>()
  slots.forEach((s, i) => {
    if (lines[i] === undefined) return
    const raw = lines[i].trim().replace(/\s*\\n\s*/g, '\n')
    // clearEmpty: Otto/entrega completa — campo sem linha limpa o placeholder do template.
    if (raw !== '' || opts.clearEmpty) byId.set(s.elementId, raw)
  })
  const next = mapLeaves(slides, (el) => {
    if (!byId.has(el.id)) return el
    const value = byId.get(el.id)!
    if (el.type === 'cta') return { ...el, label: value }
    if (el.type === 'text' || el.type === 'card') return { ...el, text: value }
    return el
  })
  return {
    slides: next,
    applied: [...byId.values()].filter((v) => v !== '').length,
    total: slots.length,
  }
}

/** Texto corrido do carrossel (para legenda, headlines, contexto da IA). */
export function carouselPlainText(slides: Slide[]) {
  return slides
    .map((s, i) => {
      const parts: string[] = []
      walk(s, (el) => {
        if (el.type === 'cta' && !el.hidden && el.label.trim()) {
          parts.push(plainText(el.label))
          return
        }
        if (isFillable(el) && el.role && el.type !== 'cta' && el.text.trim())
          parts.push(plainText(el.text))
      })
      return parts.length ? `Slide ${i + 1}: ${parts.join(' — ')}` : ''
    })
    .filter(Boolean)
    .join('\n')
}

const FUNNEL_TEXT = {
  topo: 'topo de funil (alcance: gancho forte, tensão, curiosidade)',
  meio: 'meio de funil (confiança: listas, passo a passo, comparações)',
  fundo: 'fundo de funil (conversão: problema, solução, prova, oferta)',
}

/** Prompt para usar em qualquer chat de IA (ChatGPT, Claude...) quando não há chave de API. */
export function buildExternalPrompt(carousel: Carousel, briefing: string) {
  const slots = getSlots(carousel.slides)
  const list = slots
    .map(
      (s, i) =>
        `${i + 1}. [slide ${s.slideIndex + 1}] ${ROLE_LABEL[s.role]} — até ${s.maxChars} caracteres`,
    )
    .join('\n')
  return `Escreva o texto de um carrossel de Instagram em português do Brasil.

Assunto / briefing: ${briefing.trim() || '(descreva aqui o assunto do carrossel)'}
Etapa do funil: ${FUNNEL_TEXT[carousel.funnel]}
Marca: ${carousel.globals.brandName} (${carousel.globals.handle})

O layout já está pronto e tem ${slots.length} campos de texto, nesta ordem:
${list}

Regras:
- Cada slide traz uma ideia só, com progressão: contexto → tensão → virada → aplicação → fechamento.
- O hook precisa parar o scroll (nada de "Você sabia" ou "Descubra").
- Respeite o limite de caracteres de cada campo.
- Marque 1 a 3 palavras-chave dos títulos com ==assim== para destaque.
- Para quebrar parágrafo dentro de um mesmo campo, escreva \\n (barra invertida + n) no meio da linha.
- Não invente estatísticas como fato.

Formato da resposta: exatamente ${slots.length} linhas, uma por campo, na ordem acima, sem numeração, sem rótulos e sem linhas em branco.`
}
