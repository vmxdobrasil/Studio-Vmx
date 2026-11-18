import type { Carousel } from '../types'
import { getSlots, ROLE_LABEL, type TextSlot } from './autofill'

/**
 * Contexto do carrossel aberto, enviado com a primeira mensagem do chat.
 * Passa a anatomia real do template (campos de texto, em ordem) pro Otto
 * formatar o bloco "Colar texto" na ordem que o app entende.
 */
export function buildCarouselContext(carousel: Carousel, templateName: string): string {
  const slots = getSlots(carousel.slides)
  const list = slots
    .map(
      (s, i) =>
        `${i + 1}. [slide ${s.slideIndex + 1}] ${ROLE_LABEL[s.role]} — até ${s.maxChars} caracteres`,
    )
    .join('\n')
  return `Contexto de Projeto (carrossel aberto no Carrossel Studio):
- Template: ${templateName} (${carousel.slides.length} slides)
- Marca: ${carousel.globals.brandName} (${carousel.globals.handle})
- Objetivo do funil: ${carousel.funnel}

Campos de texto do template, EM ORDEM (${slots.length} no total). Quando você entregar o bloco "Colar texto", cada linha dele deve preencher exatamente estes campos, nesta ordem, uma linha por campo, sem numeração e sem rótulos:
${list}

Regras do bloco "Colar texto": nada além dos textos (sem "Slide 1:", sem linhas em branco); dois parágrafos no mesmo campo viram \\n (barra invertida + n) no meio da linha; ==palavra== e **trecho** valem por padrão. Depois do bloco, a legenda com o rótulo "Legenda (não cole no Colar texto):".

Fluxo neste app: o usuário já escolhe ASSUNTO + OBJETIVO + TIPO (estrutura) na primeira mensagem e pede pra gerar. Responda JÁ com o roteiro completo no formato Colar texto (uma linha por campo, na ordem acima) + legenda. Não faça perguntas de briefing, não peça insumos, não proponha estruturas — use [PREENCHER: …] onde faltar dado.`
}

/** Bloco "Colar texto" entregue pelo agente, separado da legenda. */
export interface ParsedOttoDelivery {
  /** As linhas do bloco (cruas, na ordem entregue), sem o cercado. */
  lines: string[]
  /** O bloco cru, com o cercado, pra exibição destacada. */
  block: string
  /** O restante da resposta (antes/depois do bloco), sem o bloco. */
  rest: string
  /** A legenda após o rótulo "Legenda (não cole no Colar texto):", se existir. */
  caption: string | null
  /**
   * Entrega no formato natural da skill ("Slide N: ...", possivelmente mais de
   * uma linha por slide). Nesse caso as linhas precisam passarem por
   * alignDeliveryToSlots antes de aplicar.
   */
  bySlide?: boolean
}

// Cerca do bloco: "---" (o formato pedido nas regras), mas também aceita
// "===" e cercas de código ``` (o Otto às vezes entrega em bloco markdown).
const BLOCK_FENCE = /(?:-{3,}|={3,}|`{3,}[a-z]*)\n([\s\S]*?)\n(?:-{3,}|={3,}|`{3,})/
const CAPTION_LABEL = /Legenda\s*\(n[ãa]o cole no Colar texto\)\s*:|Legenda\s*[:(]/i
/** "Slide 1:", "Card 2:", "Bloco 3:" — rótulo de slide no formato da skill. */
const SLIDE_PREFIX = /^(?:slide|card|bloco|frame)\s*(\d{1,2})\s*[:\-–—]\s*/i

/**
 * Encontra o bloco "Colar texto" numa resposta do agente.
 * Aceita: cercado por "---", formato "Slide N:", ou bloco corrido (uma linha
 * por campo) — este último só quando NÃO parece conversa de briefing.
 */
export function parseOttoDelivery(content: string): ParsedOttoDelivery | null {
  const text = content.replace(/\r\n/g, '\n')
  const hasCaption = CAPTION_LABEL.test(text)

  // 1) Cercado por "---": o formato pedido nas regras do bloco.
  const m = text.match(BLOCK_FENCE)
  if (m) {
    const inner = m[1]
    // Cerca no meio de uma conversa de briefing não conta como entrega.
    if (hasCaption || !looksLikeInterview(inner)) {
      const lines = deliveryLines(inner)
      const bySlide = isSlideLabeled(inner)
      if (lines.length >= 3 || (bySlide && countSlideLabels(inner) >= 2)) {
        const block = m[0]
        const before = text.slice(0, m.index).trim()
        const after = text.slice(m.index! + block.length).trim()
        return {
          lines,
          block,
          rest: before || after || '',
          caption: findCaption(after) ?? findCaption(text),
          bySlide,
        }
      }
    }
  }

  // 2) Sem cercado. Tira preâmbulo de chat e fica com o corpo do roteiro.
  const body = stripDeliveryPreamble(text.split(CAPTION_LABEL)[0].trim())
  const candidate = body || text.split(CAPTION_LABEL)[0].trim()
  const lines = deliveryLines(candidate)

  if (isSlideLabeled(candidate)) {
    if (countSlideLabels(candidate) < 2) return null
    // Com legenda ou ≥3 slides, é entrega — mesmo se o Otto citou "Ideia Conectiva".
    if (!hasCaption && countSlideLabels(candidate) < 3 && looksLikeInterview(candidate)) return null
    const captionMatch = text.match(CAPTION_LABEL)
    const caption = captionMatch
      ? text.slice(captionMatch.index! + captionMatch[0].length).trim() || null
      : null
    return { lines, block: candidate, rest: '', caption, bySlide: true }
  }

  // 3) Bloco corrido sem rótulo: só aceita se parecer entrega final de verdade.
  // Sem isso, a conversa do Otto ("Bora lá… objetivo micro…") virava layout.
  if (lines.length < 3) return null
  if (!hasCaption && looksLikeInterview(candidate)) return null
  if (!looksLikePlainDelivery(lines, text, hasCaption)) return null
  const labeled = lines.filter((l) =>
    /^(hook|subhook|t[íi]tulo|subt[íi]tulo|texto|corpo|cta)\s*[:\-–]/i.test(l),
  ).length
  if (labeled > lines.length / 2) return null
  const captionMatch = text.match(CAPTION_LABEL)
  const caption = captionMatch
    ? text.slice(captionMatch.index! + captionMatch[0].length).trim() || null
    : null
  return { lines, block: candidate, rest: '', caption, bySlide: false }
}

/** Remove intro do Otto antes do bloco útil ("Aqui vai", Ideia Conectiva, etc.). */
function stripDeliveryPreamble(text: string): string {
  const lines = text.split('\n')
  const start = lines.findIndex((raw) => {
    const l = raw.trim()
    if (!l) return false
    if (SLIDE_PREFIX.test(l)) return true
    if (/^(-{3,}|={3,}|`{3,})/.test(l)) return true
    if (/^colar texto\b/i.test(l)) return true
    // Linha de conteúdo (não heading de briefing).
    if (
      l.length >= 12 &&
      !/[?]$/.test(l) &&
      !/^(bora|perfeito|fechado|beleza|aqui|segue|ideia|objetivo|ponto de partida|estrutura|antes de)/i.test(
        l,
      )
    )
      return true
    return false
  })
  if (start <= 0) return text
  return lines.slice(start).join('\n').trim()
}

/** Conversa de briefing do Otto (ainda sem roteiro final). */
function looksLikeInterview(text: string): boolean {
  // Pedidos explícitos de escolha / próximo passo do briefing.
  if (
    /bora l[aá]|objetivo micro|ponto de partida|qual desses|me diz|antes de escrever|nas minhas op[cç][oõ]es|desenvolver junto|j[aá] (tenho|tem) conte[uú]do|preciso fechar|qual [aâ]ngulo|qual estrutura|escolhe (uma|o tipo|a estrutura)/i.test(
      text,
    )
  )
    return true
  // "Ideia Conectiva" sozinha não é entrevista — o Otto cita isso na entrega.
  const questions = (text.match(/\?/g) || []).length
  // Várias perguntas + lista numerada = briefing. Hook com "Por que…?" não conta.
  const numbered = text.split('\n').filter((l) => /^\d+[.)]\s/.test(l.trim())).length
  if (numbered >= 2 && questions >= 2) return true
  if (questions >= 3 && text.length < 600) return true
  return false
}

/** Bloco corrido de "Colar texto": linhas de slide, não parágrafos de chat. */
function looksLikePlainDelivery(
  lines: string[],
  fullText: string,
  hasCaption = CAPTION_LABEL.test(fullText),
): boolean {
  // Sinal forte: veio com legenda no formato pedido.
  if (hasCaption) return true
  // Hooks de capa frequentemente são perguntas ("Por que…?"). Isso NÃO invalida a entrega.
  const long = lines.filter((l) => l.length > 220).length
  if (long > Math.max(1, Math.floor(lines.length / 3))) return false
  // Precisa ter corpo suficiente pra um carrossel (capa + meio + CTA).
  return lines.length >= 5
}
function deliveryLines(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^-{3,}$/.test(l))
}

/**
 * Tem pelo menos 2 rótulos "Slide N:" / "Card N:" / "Bloco N:"?
 * Não exige maioria das linhas: a skill frequentemente entrega título + corpo
 * (linha sem rótulo) no mesmo slide — e isso quebrava o alinhamento com o layout.
 */
function isSlideLabeled(text: string): boolean {
  return countSlideLabels(text) >= 2
}

function countSlideLabels(text: string): number {
  return text.split('\n').filter((l) => SLIDE_PREFIX.test(l.trim())).length
}

function findCaption(after: string): string | null {
  const m = after.match(CAPTION_LABEL)
  if (!m) return null
  return after.slice(m.index + m[0].length).trim() || null
}

/** Opção clicável extraída (ou sugerida) a partir da resposta do Otto. */
export interface OttoChoice {
  /** Texto curto no botão. */
  label: string
  /** Mensagem enviada ao clicar. */
  value: string
}

const OBJETIVOS_MICRO: OttoChoice[] = [
  { label: 'Seguir', value: 'Objetivo micro: Seguir' },
  { label: 'Compartilhar', value: 'Objetivo micro: Compartilhar' },
  { label: 'Salvar', value: 'Objetivo micro: Salvar' },
  { label: 'Comentar', value: 'Objetivo micro: Comentar' },
  { label: 'Vender', value: 'Objetivo micro: Vender' },
]

const PONTOS_PARTIDA: OttoChoice[] = [
  { label: 'Desenvolver junto', value: 'Ponto de partida: desenvolver junto' },
  { label: 'Já tenho conteúdo', value: 'Ponto de partida: já tenho conteúdo (vou colar)' },
]

const GERAR_AGORA =
  'Com o que já temos, escreve o carrossel completo AGORA no formato Colar texto (uma linha por campo do template, sem numeração). Se faltar prova ou dado, use [PREENCHER: …]. Termine com a legenda.'

const ESTRUTURAS: OttoChoice[] = [
  { label: 'N1-EM', value: `Quero a estrutura N1-EM. ${GERAR_AGORA}` },
  {
    label: 'Picture',
    value: `Quero a estrutura Picture da Transformação. ${GERAR_AGORA}`,
  },
  {
    label: 'Contra Soluções',
    value: `Quero a estrutura Contra Soluções Comuns. ${GERAR_AGORA}`,
  },
  { label: 'Storynomics', value: `Quero a estrutura Storynomics. ${GERAR_AGORA}` },
  { label: 'AIDA', value: `Quero a estrutura AIDA. ${GERAR_AGORA}` },
  { label: '6 Pontos', value: `Quero a estrutura 6 Pontos. ${GERAR_AGORA}` },
]

export const OTTO_REGENERATE: OttoChoice = {
  label: 'Gerar novamente',
  value: `Reescreve o carrossel completo do zero, mantendo objetivo e assunto. ${GERAR_AGORA}`,
}

/** Objetivos do começo da conversa (assunto vem em campo à parte). */
export function starterOttoChoices(): OttoChoice[] {
  return [...OBJETIVOS_MICRO]
}

/** Tipos de estrutura — oferecidos depois de assunto + objetivo. */
export function estruturaOttoChoices(): OttoChoice[] {
  return [...ESTRUTURAS]
}

const KNOWN_CHOICES = [...OBJETIVOS_MICRO, ...PONTOS_PARTIDA, ...ESTRUTURAS]

function normalizeChoiceKey(label: string) {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Se o rótulo bate com um atalho conhecido, usa o value canônico. */
function matchKnownChoice(label: string): OttoChoice | null {
  const key = normalizeChoiceKey(label)
  if (!key) return null
  return (
    KNOWN_CHOICES.find((c) => {
      const ck = normalizeChoiceKey(c.label)
      return key === ck || key.startsWith(ck) || ck.startsWith(key)
    }) ?? null
  )
}

/**
 * Extrai botões de escolha da resposta do Otto (objetivo, ponto de partida,
 * estruturas ou itens numerados). Se a mensagem já é entrega final, não sugere.
 */
export function extractOttoChoices(content: string): OttoChoice[] {
  if (!content.trim()) return []
  if (parseOttoDelivery(content)) return []

  const text = content.replace(/\r\n/g, '\n')
  const found: OttoChoice[] = []
  const seen = new Set<string>()
  const push = (c: OttoChoice) => {
    // Dedupa pelo rótulo visível — evita "Desenvolver junto" 2x com values diferentes.
    const key = normalizeChoiceKey(c.label)
    if (!key || seen.has(key)) return
    seen.add(key)
    found.push(c)
  }

  const lower = text.toLowerCase()
  const askingObjetivo =
    /objetivo micro/i.test(text) ||
    (OBJETIVOS_MICRO.filter((c) => lower.includes(c.label.toLowerCase())).length >= 3 &&
      /qual desses|op[cç][oõ]es|escolher/i.test(text))
  const askingPartida = /ponto de partida|desenvolver junto|j[aá] tenho conte[uú]do/i.test(text)
  const askingEstrutura =
    /estrutura|skill-filha/i.test(text) ||
    ESTRUTURAS.filter((c) => lower.includes(c.label.toLowerCase().split(/\s|-/)[0]!)).length >= 2

  // Só catálogos reais de escolha. Não vira botão pedido de insumo
  // ("O fato central", "Uma prova concreta") — isso travava o fluxo.
  if (askingObjetivo) OBJETIVOS_MICRO.forEach(push)
  if (askingPartida) PONTOS_PARTIDA.forEach(push)
  if (askingEstrutura) ESTRUTURAS.forEach(push)

  // Itens numerados: apenas se casarem com um atalho conhecido.
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    const m = line.match(/^(?:[-•*]\s+|\d{1,2}[.)]\s+)(.+?)(?:\s*[:–—-]\s+.+)?$/)
    if (!m) continue
    let label = m[1].replace(/\*\*|__/g, '').trim()
    label = label.split(/\s{2,}|\(/)[0].trim()
    const known = matchKnownChoice(label)
    if (known) push(known)
  }

  if (/ajustar algum slide|reescrever a legenda|segunda vers[aã]o da capa/i.test(text)) {
    push(OTTO_REGENERATE)
    push({ label: 'Reescrever legenda', value: 'Reescreve só a legenda' })
    push({ label: 'Nova capa', value: 'Gera uma segunda versão só da capa' })
  }

  return found.slice(0, 8)
}

/**
 * Alinha a entrega com os campos do template, devolvendo uma linha por slot
 * (na ordem de getSlots), pronta pro applyLines.
 *
 * - Formato padrão (bySlide falsy): as linhas já estão na ordem dos campos.
 * - Formato da skill ("Slide N: ..."): as linhas de cada slide preenchem os
 *   campos daquele slide, em ordem. Sobram linhas no slide? O último campo
 *   absorve o resto como parágrafos (\n). Falta linha? O campo fica vazio.
 */
export function alignDeliveryToSlots(delivery: ParsedOttoDelivery, slots: TextSlot[]): string[] {
  if (!delivery.bySlide) return delivery.lines

  const groups = new Map<number, string[]>()
  let current = 0
  for (const raw of delivery.lines) {
    const pm = raw.match(SLIDE_PREFIX)
    if (pm) current = parseInt(pm[1], 10)
    if (current < 1) continue
    const text = (pm ? raw.slice(pm[0].length) : raw).trim()
    if (!text) continue
    const arr = groups.get(current) ?? []
    arr.push(text)
    groups.set(current, arr)
  }

  const perSlide = new Map<number, TextSlot[]>()
  let maxSlide = 0
  slots.forEach((s) => {
    const arr = perSlide.get(s.slideIndex) ?? []
    arr.push(s)
    perSlide.set(s.slideIndex, arr)
    maxSlide = Math.max(maxSlide, s.slideIndex)
  })

  const out: string[] = []
  for (let slide = 0; slide <= maxSlide; slide++) {
    const slideSlots = perSlide.get(slide) ?? []
    if (slideSlots.length === 0) continue
    const slideLines = groups.get(slide + 1) ?? []
    if (slideLines.length === 0) {
      slideSlots.forEach(() => out.push(''))
      continue
    }
    if (slideLines.length === 1 && slideSlots.length > 1) {
      // Uma linha pro slide inteiro: cai no campo mais "largo" (em geral o corpo),
      // e os outros campos do slide ficam vazios (placeholders somem no apply).
      const prefer = ['corpo', 'titulo', 'hook', 'subtitulo', 'subhook', 'rotulo', 'cta'] as const
      let target = 0
      for (const role of prefer) {
        const idx = slideSlots.findIndex((s) => s.role === role)
        if (idx >= 0) {
          target = idx
          break
        }
      }
      if (target === 0) {
        slideSlots.forEach((s, i) => {
          if (s.maxChars > slideSlots[target].maxChars) target = i
        })
      }
      slideSlots.forEach((_, i) => out.push(i === target ? slideLines[0] : ''))
      continue
    }
    if (slideLines.length <= slideSlots.length) {
      slideLines.forEach((l) => out.push(l))
      for (let i = slideLines.length; i < slideSlots.length; i++) out.push('')
    } else {
      // Mais linhas que campos: os campos iniciais recebem uma linha cada e
      // o último absorve o restante como parágrafos.
      slideLines.slice(0, slideSlots.length - 1).forEach((l) => out.push(l))
      out.push(slideLines.slice(slideSlots.length - 1).join('\n'))
    }
  }
  return out
}
