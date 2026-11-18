import { RotateCcw, Sparkles, X, ClipboardPaste, ClipboardCheck, Check } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import pb from '../lib/pocketbase/client'
import { streamAgentChat } from '../lib/skipAi'
import { applyLines, cleanLine, getSlots } from '../lib/autofill'
import { imageSlots } from '../lib/elements'
import { fillEmptySlotsFromBank } from '../lib/imageBank'
import {
  alignDeliveryToSlots,
  buildCarouselContext,
  estruturaOttoChoices,
  OTTO_REGENERATE,
  parseOttoDelivery,
  starterOttoChoices,
} from '../lib/otto'
import type { OttoChoice, ParsedOttoDelivery } from '../lib/otto'
import { resizeSlides } from '../lib/templateOps'
import { getTemplate } from '../templates'
import { Button, cx, toast } from '../components/ui'
import { useApp } from '../store/app'
import { useEditor } from '../store/editor'
import { update } from './ops'
import type { Carousel } from '../types'

const SLIDE_COUNT_OPTIONS = [5, 6, 7, 8, 9, 10] as const

const URL = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/otto/chat`

/** Frases leves enquanto o Otto aplica textos + fotos no template. */
const OTTO_ASSEMBLY_QUIPS = [
  'Colando os textos nos slides sem errar a ordem…',
  'Procurando fotos que combinam com o tema (sem stock de aperto de mão)…',
  'Ajustando o hook pra não parecer copy de 2019…',
  'Enchendo os slots de imagem. Café virtual liberado.',
  'Alinhando legenda, CTA e um toque de drama…',
  'Contando caracteres. O algoritmo odeia enrolação.',
  'Montando o carrossel como quem monta playlist de sexta…',
  'Quase lá — só mais um polimento nos slides…',
  'Otto no modo “entregar pronto, sem reunião”…',
  'Separando o que é insight do que é enrolação…',
] as const

interface Displayable {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  failed?: boolean
}

let seq = 0
const nextId = () => `local-${Date.now()}-${seq++}`

export function OttoChatDrawer({
  carousel,
  open,
  onClose,
  onPublish: _onPublish,
}: {
  carousel: Carousel
  open: boolean
  onClose: () => void
  /** Reservado: abrir publicação (Instagram) depois de aplicar o texto. */
  onPublish?: () => void
}) {
  void _onPublish
  const [messages, setMessages] = useState<Displayable[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [appliedId, setAppliedId] = useState<string | null>(null)
  const [starterObjetivo, setStarterObjetivo] = useState<OttoChoice | null>(null)
  const [starterEstrutura, setStarterEstrutura] = useState<OttoChoice | null>(null)
  const [starterTema, setStarterTema] = useState('')
  const [starterSlideCount, setStarterSlideCount] = useState(carousel.slides.length)
  /** Depois de "Gerar roteiro", sempre mostrar ações de aplicar / gerar de novo. */
  const [awaitingApply, setAwaitingApply] = useState(false)
  const [fillingImages, setFillingImages] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const starterObjetivos = useMemo(() => starterOttoChoices(), [])
  const estruturaChoices = useMemo(() => estruturaOttoChoices(), [])

  const context = useMemo(
    () => buildCarouselContext(carousel, getTemplate(carousel.templateId).name),
    [carousel.templateId, carousel.slides, carousel.globals, carousel.funnel],
  )

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort()
      abortRef.current = null
      setMessages([])
      setConversationId(null)
      setInput('')
      setCopied(false)
      setAppliedId(null)
      setStarterObjetivo(null)
      setStarterEstrutura(null)
      setStarterTema('')
      setStarterSlideCount(carousel.slides.length)
      setAwaitingApply(false)
      setFillingImages(false)
    } else {
      setStarterSlideCount(carousel.slides.length)
    }
  }, [open, carousel.id, carousel.slides.length])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, busy])

  const send = useCallback(
    async (text: string, opts?: { display?: string; contextOverride?: string }) => {
      const message = text.trim()
      if (!message || busy) return
      const userMsg: Displayable = {
        id: nextId(),
        role: 'user',
        content: (opts?.display ?? message).trim() || message,
      }
      const botMsg: Displayable = {
        id: nextId(),
        role: 'assistant',
        content: '',
        streaming: true,
      }
      const isFirst = messages.length === 0
      const ctx = opts?.contextOverride ?? context
      const payload = isFirst ? `${ctx}\n\n${message}` : message
      setMessages((m) => [...m, userMsg, botMsg])
      setInput('')
      setBusy(true)
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const res = await fetch(URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: pb.authStore.token },
          body: JSON.stringify({ message: payload, conversation_id: conversationId }),
          signal: ctrl.signal,
        })
        const result = await streamAgentChat(res, {
          signal: ctrl.signal,
          onChunk: (_delta, full) => {
            setMessages((m) =>
              m.map((msg) => (msg.id === botMsg.id ? { ...msg, content: full } : msg)),
            )
          },
        })
        setConversationId(
          result.conversation_id || res.headers.get('X-Conversation-Id') || conversationId,
        )
      } catch (err) {
        const aborted = ctrl.signal.aborted
        if (!aborted) {
          const detail = err instanceof Error && err.message ? err.message : ''
          setMessages((m) =>
            m.map((msg) =>
              msg.id === botMsg.id
                ? {
                    ...msg,
                    content:
                      msg.content ||
                      (detail
                        ? `Não consegui falar com o Otto agora. ${detail}`
                        : 'Não consegui falar com o Otto agora. Tente de novo.'),
                    streaming: false,
                    failed: true,
                  }
                : msg,
            ),
          )
          toast('Falha ao falar com o Otto. Tente de novo.', 'erro')
        }
      } finally {
        setMessages((m) =>
          m.map((msg) => {
            if (msg.id !== botMsg.id) return msg
            const content = msg.content || 'O Otto respondeu em branco. Tente mandar de novo.'
            return { ...msg, content, streaming: false, failed: !msg.content }
          }),
        )
        setBusy(false)
        abortRef.current = null
      }
    },
    [busy, context, conversationId, messages.length],
  )

  const linesForLayout = (delivery: ParsedOttoDelivery) => {
    const slots = getSlots(carousel.slides)
    const aligned = alignDeliveryToSlots(delivery, slots).map(cleanLine)
    while (aligned.length < slots.length) aligned.push('')
    return aligned
  }

  const applyDelivery = async (
    msgId: string,
    delivery: ParsedOttoDelivery,
    opts?: { keepOpen?: boolean },
  ) => {
    const addVersion = useApp.getState().addVersion
    setFillingImages(true)
    try {
      await addVersion(carousel.id, 'texto', 'Antes de aplicar texto do Otto')
      const lines = linesForLayout(delivery)
      let result = { applied: 0, total: getSlots(carousel.slides).length }
      update((c) => {
        const r = applyLines(c.slides, lines, { clearEmpty: true })
        result = r
        return {
          ...c,
          slides: r.slides,
          ...(delivery.caption ? { caption: delivery.caption } : {}),
        }
      })
      setAppliedId(msgId)

      // Banco de imagens nativo: preenche os slots de foto do template.
      let imageNote = ''
      const slotTotal = imageSlots(
        useApp.getState().carousels[carousel.id]?.slides ?? carousel.slides,
      ).length
      if (slotTotal > 0) {
        try {
          const theme = starterTema.trim() || carousel.name
          const current = useApp.getState().carousels[carousel.id]
          if (current) {
            const filled = await fillEmptySlotsFromBank(current.slides, theme, { replace: true })
            if (filled.filled > 0) {
              update((c) => ({ ...c, slides: filled.slides }))
              imageNote = ` · ${filled.filled}/${filled.total} fotos nos slides`
            } else {
              imageNote = ' · sem fotos no banco para este tema'
            }
          }
        } catch {
          imageNote = ' · falha ao buscar fotos'
        }
      }

      const captionNote = delivery.caption ? ' · legenda atualizada' : ''
      toast(
        `${result.applied} de ${result.total} campos aplicados no layout${captionNote}${imageNote}`,
      )
      setFillingImages(false)
      if (!opts?.keepOpen) onClose()
      return true
    } catch {
      setFillingImages(false)
      toast('Não foi possível aplicar o texto. Tente de novo.', 'erro')
      return false
    }
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && !m.streaming)
  const lastDelivery = lastAssistant ? parseOttoDelivery(lastAssistant.content) : null

  const renderAssistant = (msg: Displayable, delivery: ParsedOttoDelivery | null) => {
    // Opções de escolha ficam só na barra "Continuar com" (evita botões duplicados).
    if (!delivery) {
      return <Markdownish content={msg.content} />
    }

    const slots = getSlots(carousel.slides)
    const aligned = linesForLayout(delivery)
    const filled = aligned.filter((l) => l.trim()).length
    const applied = appliedId === msg.id

    return (
      <div className="space-y-2">
        {delivery.rest && <Markdownish content={delivery.rest} />}
        <div className="rounded-lg border border-accent/30 bg-accent-soft/40 p-2.5">
          <div className="text-[11px] font-semibold text-accent mb-1.5 flex items-center gap-1.5">
            <ClipboardPaste size={13} /> Roteiro pronto — {filled} de {slots.length} campos
            {delivery.bySlide ? ' (alinhado por slide)' : ''}
          </div>
          <pre className="text-[11px] leading-relaxed whitespace-pre-wrap break-words text-ink/90 font-mono max-h-48 overflow-y-auto">
            {aligned.map((l, i) => `${i + 1}. ${l || '(vazio)'}`).join('\n')}
          </pre>
          {delivery.caption && (
            <div className="mt-2 rounded-md border border-line/60 bg-paper/60 p-2">
              <div className="text-[10.5px] font-semibold text-ink/55 mb-0.5">Legenda</div>
              <p className="text-[11.5px] leading-relaxed whitespace-pre-wrap text-ink/80">
                {delivery.caption}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {applied ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[11.5px] font-semibold text-accent">
                <Check size={14} /> Adicionado no template
              </span>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() => void applyDelivery(msg.id, delivery)}
                disabled={busy || fillingImages || filled === 0}
              >
                {fillingImages ? 'Aplicando textos e fotos…' : 'Adicionar no template'}
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || fillingImages}
              onClick={() => {
                setAwaitingApply(true)
                setAppliedId(null)
                void send(OTTO_REGENERATE.value)
              }}
            >
              Gerar novamente
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await navigator.clipboard.writeText(aligned.join('\n'))
                setCopied(true)
                setTimeout(() => setCopied(false), 1600)
              }}
            >
              {copied ? <ClipboardCheck size={14} /> : <ClipboardPaste size={14} />}
              Copiar
            </Button>
          </div>
          <p className="text-[10.5px] text-ink/45 mt-1.5">
            {applied
              ? 'Textos e fotos já foram aplicados nos slides. Gere novamente se quiser outra versão.'
              : fillingImages
                ? 'Aplicando o roteiro e preenchendo os slots de imagem…'
                : 'Adicionar no template aplica textos e fotos nos slots do carrossel.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cx('fixed inset-0 z-50', open ? '' : 'pointer-events-none')}>
      <div
        className={cx(
          'absolute inset-0 bg-black/40 transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={() => {
          if (!fillingImages) onClose()
        }}
      />
      <aside
        className={cx(
          'absolute top-0 right-0 bottom-0 w-full max-w-md bg-paper border-l border-line shadow-2xl flex flex-col transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {fillingImages && <OttoAssemblyLoader />}
        <header className="shrink-0 px-4 py-3 border-b border-line flex items-center gap-2">
          <span className="size-8 rounded-full bg-accent-soft grid place-items-center text-accent">
            <Sparkles size={16} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">Otto Carrossel</div>
            <div className="text-[11px] text-ink/50 truncate">
              {carousel.name} · {getTemplate(carousel.templateId).name} · {carousel.slides.length}{' '}
              slides
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            title="Fechar"
            disabled={fillingImages}
          >
            <X size={16} />
          </Button>
        </header>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <StarterBriefing
              tema={starterTema}
              onTema={setStarterTema}
              objetivos={starterObjetivos}
              objetivo={starterObjetivo}
              onObjetivo={setStarterObjetivo}
              estruturas={estruturaChoices}
              estrutura={starterEstrutura}
              onEstrutura={setStarterEstrutura}
              slideCount={starterSlideCount}
              onSlideCount={setStarterSlideCount}
              imageSlotHint={imageSlots(resizeSlides(carousel.slides, starterSlideCount)).length}
              busy={busy || fillingImages}
              onContinue={() => {
                if (!starterObjetivo || !starterEstrutura || !starterTema.trim()) return
                const tema = starterTema.trim()
                const count = starterSlideCount
                const slides =
                  count !== carousel.slides.length
                    ? resizeSlides(carousel.slides, count)
                    : carousel.slides
                if (count !== carousel.slides.length) {
                  update((c) => ({ ...c, slides }))
                  useEditor.getState().selectSlide(0)
                }
                const ctxCarousel = { ...carousel, slides }
                const ctx = buildCarouselContext(ctxCarousel, getTemplate(carousel.templateId).name)
                setAwaitingApply(true)
                void send(
                  [
                    `${starterObjetivo.value}.`,
                    'Ponto de partida: desenvolver junto.',
                    `Assunto do carrossel: ${tema}.`,
                    `O carrossel tem ${count} slides — escreva conteúdo pra essa quantidade.`,
                    starterEstrutura.value,
                    'Não faça perguntas nem peça insumos.',
                    'Entregue AGORA o bloco Colar texto cercado por --- (uma linha por campo do template, na ordem do contexto, sem numeração e sem "Slide N:").',
                    'Depois do bloco, a legenda com o rótulo exatamente: Legenda (não cole no Colar texto):',
                  ].join(' '),
                  {
                    contextOverride: ctx,
                    display: [
                      `Assunto: ${tema}`,
                      `Objetivo: ${starterObjetivo.label}`,
                      `Tipo: ${starterEstrutura.label}`,
                      `Slides: ${count}`,
                      '',
                      'Gerar roteiro completo.',
                    ].join('\n'),
                  },
                )
              }}
            />
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cx(
                  'max-w-[92%] rounded-xl px-3 py-2 text-[13px] leading-relaxed',
                  m.role === 'user'
                    ? 'bg-accent text-paper'
                    : m.failed
                      ? 'bg-surface border border-sunset/50 text-ink'
                      : 'bg-surface border border-line text-ink',
                )}
              >
                {m.role === 'user' ? (
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                ) : m.streaming && !m.content ? (
                  <p className="flex items-center gap-1.5 text-ink/50">
                    <span className="size-1.5 rounded-full bg-ink/40 animate-pulse" /> Otto está
                    pensando…
                  </p>
                ) : (
                  renderAssistant(m, parseOttoDelivery(m.content))
                )}
              </div>
            </div>
          ))}
        </div>

        {lastAssistant &&
          !lastAssistant.streaming &&
          !lastAssistant.failed &&
          awaitingApply &&
          appliedId !== lastAssistant.id &&
          null}

        <footer className="shrink-0 border-t border-line p-3">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void send(input)
            }}
          >
            <textarea
              rows={2}
              className="flex-1 resize-none rounded-lg border border-line bg-field px-2.5 py-2 text-[13px] outline-none focus:ring-2 focus:ring-ink/10"
              placeholder="Ou escreva sua mensagem pro Otto…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send(input)
                }
              }}
            />
            <Button type="submit" variant="primary" disabled={busy || !input.trim()}>
              {busy ? '…' : 'Enviar'}
            </Button>
          </form>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10.5px] text-ink/45">
              Use os botões pra seguir o briefing. O layout só muda quando você aprovar.
            </p>
            {messages.length > 0 && (
              <button
                className="text-[11px] text-ink/55 hover:text-ink inline-flex items-center gap-1 shrink-0 disabled:opacity-40"
                disabled={busy || fillingImages}
                onClick={() => {
                  if (busy || fillingImages) return
                  setMessages([])
                  setConversationId(null)
                  setAppliedId(null)
                  setStarterObjetivo(null)
                  setStarterEstrutura(null)
                  setStarterTema('')
                  setStarterSlideCount(carousel.slides.length)
                  setAwaitingApply(false)
                }}
              >
                <RotateCcw size={12} /> Nova conversa
              </button>
            )}
          </div>
        </footer>
      </aside>
    </div>
  )
}

/** Overlay full-drawer: Otto montando textos + fotos com frases rotativas. */
function OttoAssemblyLoader() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % OTTO_ASSEMBLY_QUIPS.length)
    }, 2800)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-paper/92 backdrop-blur-sm px-8 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="relative size-14 grid place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-accent/25 border-t-accent animate-spin" />
        <span className="size-10 rounded-full bg-accent-soft grid place-items-center text-accent">
          <Sparkles size={20} className="animate-pulse" />
        </span>
      </span>
      <div className="space-y-1.5 max-w-[280px]">
        <p className="text-[15px] font-semibold text-ink">Otto está montando o template</p>
        <p
          key={idx}
          className="text-[12.5px] leading-relaxed text-ink/60 min-h-[3rem] transition-opacity duration-300"
        >
          {OTTO_ASSEMBLY_QUIPS[idx]}
        </p>
      </div>
      <div className="flex items-center gap-1.5" aria-hidden>
        <span className="size-1.5 rounded-full bg-accent animate-pulse" />
        <span className="size-1.5 rounded-full bg-accent/70 animate-pulse [animation-delay:150ms]" />
        <span className="size-1.5 rounded-full bg-accent/40 animate-pulse [animation-delay:300ms]" />
      </div>
    </div>
  )
}

const OBJETIVO_HINTS: Record<string, string> = {
  Seguir: 'Fazer a pessoa seguir o perfil',
  Compartilhar: 'Gerar alcance — alguém manda pra outra',
  Salvar: 'Conteúdo útil que a pessoa guarda',
  Comentar: 'Provocar resposta nos comentários',
  Vender: 'Levar pra compra ou oferta',
}

const ESTRUTURA_HINTS: Record<string, string> = {
  'N1-EM': 'Problema → Insight → Método',
  Picture: 'Antes × depois da transformação',
  'Contra Soluções': 'Desmonta soluções comuns',
  Storynomics: 'História com tensão e virada',
  AIDA: 'Atenção → Interesse → Desejo → Ação',
  '6 Pontos': 'Lista clara em 6 slides',
}

function StarterBriefing({
  tema,
  onTema,
  objetivos,
  objetivo,
  onObjetivo,
  estruturas,
  estrutura,
  onEstrutura,
  slideCount,
  onSlideCount,
  imageSlotHint,
  busy,
  onContinue,
}: {
  tema: string
  onTema: (v: string) => void
  objetivos: OttoChoice[]
  objetivo: OttoChoice | null
  onObjetivo: (c: OttoChoice) => void
  estruturas: OttoChoice[]
  estrutura: OttoChoice | null
  onEstrutura: (c: OttoChoice) => void
  slideCount: number
  onSlideCount: (n: number) => void
  imageSlotHint: number
  busy: boolean
  onContinue: () => void
}) {
  const temaOk = tema.trim().length > 0
  const objetivoOk = !!objetivo
  const estruturaOk = !!estrutura
  const slidesOk = slideCount >= 5
  const ready = temaOk && objetivoOk && estruturaOk && slidesOk

  const nextHint = !temaOk
    ? 'Comece pelo assunto do carrossel.'
    : !objetivoOk
      ? 'Agora escolha o objetivo.'
      : !estruturaOk
        ? 'Escolha o tipo de estrutura.'
        : !slidesOk
          ? 'Escolha quantos slides o carrossel terá.'
          : 'O Otto escreve o roteiro; na hora de adicionar, as fotos preenchem os slots.'

  return (
    <div className="rounded-xl border border-line bg-surface p-3.5 text-[12px] leading-relaxed text-ink/70 space-y-4">
      <div className="space-y-2">
        <p className="font-semibold text-ink text-[13px]">Vamos montar seu carrossel em 4 passos</p>
        <ol className="grid grid-cols-4 gap-1.5">
          {(
            [
              { n: 1, label: 'Assunto', done: temaOk },
              { n: 2, label: 'Objetivo', done: objetivoOk },
              { n: 3, label: 'Tipo', done: estruturaOk },
              { n: 4, label: 'Slides', done: slidesOk },
            ] as const
          ).map((step) => (
            <li
              key={step.n}
              className={cx(
                'rounded-lg border px-1.5 py-1.5 text-center',
                step.done
                  ? 'border-accent/40 bg-accent-soft/50 text-ink'
                  : 'border-line bg-paper text-ink/55',
              )}
            >
              <div className="text-[9.5px] font-semibold uppercase tracking-wide">
                {step.done ? '✓ ' : ''}
                {step.n}
              </div>
              <div className="text-[11px] font-medium mt-0.5">{step.label}</div>
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-ink/50">
          Preencha os passos. Depois do roteiro, use Adicionar no template pra textos + fotos.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <label className="text-[11px] font-semibold text-ink">
            <span className="text-accent">1.</span> Sobre o que é o carrossel?
          </label>
          {temaOk && <span className="text-[10.5px] text-accent font-medium">Pronto</span>}
        </div>
        <p className="text-[11px] text-ink/50">
          Escreva o tema em linguagem simples — produto, dor, hábito ou promessa.
        </p>
        <textarea
          rows={3}
          className="w-full resize-none rounded-lg border border-line bg-field px-2.5 py-2 text-[12.5px] outline-none focus:ring-2 focus:ring-ink/10"
          placeholder="Ex.: home office sem perder o foco, dieta no fim de semana, como usar IA no trabalho…"
          value={tema}
          disabled={busy}
          onChange={(e) => onTema(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <label className="text-[11px] font-semibold text-ink">
            <span className="text-accent">2.</span> O que você quer que a pessoa faça?
          </label>
          {objetivoOk && <span className="text-[10.5px] text-accent font-medium">Pronto</span>}
        </div>
        <p className="text-[11px] text-ink/50">
          Escolha um objetivo. Isso muda o tom e o CTA do carrossel.
        </p>
        <ChoiceRow
          choices={objetivos}
          hints={OBJETIVO_HINTS}
          selected={objetivo?.value}
          disabled={busy}
          onPick={onObjetivo}
        />
        {objetivo && OBJETIVO_HINTS[objetivo.label] && (
          <p className="text-[11px] text-ink/60 rounded-md bg-accent-soft/40 border border-accent/20 px-2.5 py-1.5">
            <span className="font-medium text-ink">{objetivo.label}:</span>{' '}
            {OBJETIVO_HINTS[objetivo.label]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <label className="text-[11px] font-semibold text-ink">
            <span className="text-accent">3.</span> Qual tipo de carrossel?
          </label>
          {estruturaOk && <span className="text-[10.5px] text-accent font-medium">Pronto</span>}
        </div>
        <p className="text-[11px] text-ink/50">Cada estrutura organiza os slides de um jeito.</p>
        <ChoiceRow
          choices={estruturas}
          hints={ESTRUTURA_HINTS}
          selected={estrutura?.value}
          disabled={busy}
          onPick={onEstrutura}
        />
        {estrutura && ESTRUTURA_HINTS[estrutura.label] && (
          <p className="text-[11px] text-ink/60 rounded-md bg-accent-soft/40 border border-accent/20 px-2.5 py-1.5">
            <span className="font-medium text-ink">{estrutura.label}:</span>{' '}
            {ESTRUTURA_HINTS[estrutura.label]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <label className="text-[11px] font-semibold text-ink">
            <span className="text-accent">4.</span> Quantos slides (e imagens)?
          </label>
          {slidesOk && <span className="text-[10.5px] text-accent font-medium">Pronto</span>}
        </div>
        <p className="text-[11px] text-ink/50">
          Define o tamanho do carrossel. Este template tem {imageSlotHint} slot(s) de imagem — o
          banco preenche os vazios ao final.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SLIDE_COUNT_OPTIONS.map((n) => {
            const active = slideCount === n
            return (
              <button
                key={n}
                type="button"
                disabled={busy}
                onClick={() => onSlideCount(n)}
                className={cx(
                  'min-w-10 rounded-full border px-2.5 py-1 text-[11.5px] font-medium tabular-nums transition-colors',
                  'disabled:opacity-40 disabled:pointer-events-none',
                  active
                    ? 'border-accent bg-accent-soft text-ink'
                    : 'border-line bg-paper text-ink/80 hover:border-accent hover:bg-accent-soft/60',
                )}
              >
                {n}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Button variant="primary" className="w-full" disabled={busy || !ready} onClick={onContinue}>
          {ready ? 'Gerar roteiro' : 'Preencha os 4 passos'}
        </Button>
        <p className="text-[10.5px] text-ink/45 text-center">{nextHint}</p>
      </div>
    </div>
  )
}

function ChoiceRow({
  choices,
  disabled,
  selected,
  hints,
  onPick,
}: {
  choices: OttoChoice[]
  disabled?: boolean
  selected?: string | null
  hints?: Record<string, string>
  onPick: (c: OttoChoice) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {choices.map((c) => {
        const active = selected === c.value
        const hint = hints?.[c.label]
        return (
          <button
            key={c.value}
            type="button"
            title={hint}
            disabled={disabled}
            onClick={() => onPick(c)}
            className={cx(
              'rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
              'disabled:opacity-40 disabled:pointer-events-none',
              active
                ? 'border-accent bg-accent-soft text-ink'
                : 'border-line bg-paper text-ink/80 hover:border-accent hover:bg-accent-soft/60 hover:text-ink',
            )}
          >
            {c.label}
          </button>
        )
      })}
    </div>
  )
}

function Markdownish({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/)
  return (
    <div className="space-y-1.5">
      {blocks.map((b, i) => (
        <p key={i} className="whitespace-pre-wrap break-words">
          <Inline text={b} />
        </p>
      ))}
    </div>
  )
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(==[^=]+==|\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('==') && p.endsWith('=='))
          return (
            <strong key={i} className="text-accent">
              {p.slice(2, -2)}
            </strong>
          )
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
        if (p.startsWith('`') && p.endsWith('`'))
          return (
            <code key={i} className="px-1 rounded bg-ink/[.08] text-[11.5px]">
              {p.slice(1, -1)}
            </code>
          )
        return <span key={i}>{p}</span>
      })}
    </>
  )
}
