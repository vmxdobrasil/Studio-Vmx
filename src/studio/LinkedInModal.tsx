import { AlertCircle, Linkedin, Loader2, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Modal, textareaClass, toast } from '../components/ui'
import { ConnectorButton } from '../components/skip/ConnectorButton'
import {
  linkedinErrorMessage,
  linkedinStatus,
  postCarouselToLinkedIn,
  TOOLKIT,
} from '../lib/linkedin'
import type { Carousel } from '../types'
import { update } from './ops'

const CAPTION_MAX = 3000 // limite de legenda do LinkedIn

type Step = 'render' | 'upload' | 'publish'

const STEP_LABEL: Record<Step, string> = {
  render: 'Renderizando os slides',
  upload: 'Enviando as imagens',
  publish: 'Publicando',
}

/**
 * Publica o carrossel no LinkedIn pela conta do PRÓPRIO usuário. Mesmo padrão
 * do fluxo do Instagram (InstagramModal): consulta o estado da conexão, pede a
 * autorização via conector Skip quando falta e publica com feedback de etapa.
 */
export function LinkedInModal({
  carousel,
  open,
  onClose,
}: {
  carousel: Carousel
  open: boolean
  onClose: () => void
}) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'not_connected'>('checking')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<Step | null>(null)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [permalink, setPermalink] = useState<string | null>(null)
  const [caption, setCaption] = useState(carousel.caption ?? '')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    let timer: number | undefined
    const check = async () => {
      const s = await linkedinStatus()
      if (!cancelled)
        setStatus(s === 'connected' ? 'connected' : s === null ? 'checking' : 'not_connected')
      if (!cancelled && s !== 'connected') timer = window.setTimeout(check, 2000)
    }
    void check()
    window.addEventListener('focus', check)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.removeEventListener('focus', check)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setCaption(carousel.caption ?? '')
      setError(null)
      setPermalink(null)
      setStep(null)
      setProgress('')
      setBusy(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const n = carousel.slides.length
  const publishable = n >= 2 && n <= 20

  const publish = async () => {
    setBusy(true)
    setError(null)
    setPermalink(null)
    try {
      if (caption !== (carousel.caption ?? '')) {
        update((c) => ({ ...c, caption }), 'caption')
      }
      const c = { ...carousel, caption }
      const result = await postCarouselToLinkedIn(c, (s, done, total) => {
        setStep(s)
        setProgress(total > 1 ? `${done}/${total}` : '')
      })
      setStep(null)
      setProgress('')
      setPermalink(result.permalink)
      toast('Carrossel publicado no LinkedIn!')
    } catch (err) {
      setStep(null)
      setProgress('')
      setError(linkedinErrorMessage(err))
      const s = await linkedinStatus()
      if (s !== null && s !== 'connected') setStatus('not_connected')
    } finally {
      setBusy(false)
    }
  }

  const fetching = step !== null
  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title="Postar no LinkedIn"
      subtitle={carousel.name}
      width={520}
      footer={
        status === 'connected' &&
        !permalink && (
          <>
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Fechar
            </Button>
            <Button variant="primary" onClick={publish} disabled={busy || !publishable}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {busy ? 'Publicando…' : 'Publicar carrossel'}
            </Button>
          </>
        )
      }
    >
      {status === 'checking' && (
        <div className="flex items-center gap-2 text-sm text-mute py-2">
          <Loader2 size={16} className="animate-spin" /> Verificando sua conexão com o LinkedIn…
        </div>
      )}

      {status === 'not_connected' && (
        <div className="space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-ink/90"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          <div className="flex items-start gap-3 rounded-xl border border-line bg-field p-3">
            <Linkedin size={20} className="mt-0.5 shrink-0 text-ink/70" />
            <div className="text-sm text-ink/80">
              <p className="font-medium">Conecte sua conta do LinkedIn</p>
              <p className="text-mute mt-1">
                Para publicar, cada usuário conecta a própria conta. Nada é publicado sem a sua
                confirmação neste botão.
              </p>
            </div>
          </div>
          <ConnectorButton toolkit={TOOLKIT} name="LinkedIn" />
          <p className="text-[12px] text-mute">
            Depois de conectar, volte aqui e clique em "Publicar carrossel".
          </p>
        </div>
      )}

      {status === 'connected' && (
        <div className="space-y-4">
          {permalink ? (
            <div className="rounded-xl border border-line bg-field p-4 text-sm">
              <p className="font-medium">Carrossel publicado! 🎉</p>
              <a
                href={permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] underline mt-1 inline-block"
              >
                Ver a publicação no LinkedIn
              </a>
            </div>
          ) : (
            <>
              <p className="text-sm text-mute">
                Publicando com a sua conta do LinkedIn. {n} {n === 1 ? 'slide' : 'slides'} · formato{' '}
                {carousel.format}.
              </p>
              {!publishable && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-ink/90">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  O LinkedIn aceita carrosséis de 2 a 20 slides. Ajuste a quantidade de slides para
                  publicar.
                </div>
              )}
              <label className="block">
                <span className="flex items-center justify-between text-[12px] text-ink/60 mb-1">
                  Texto do post
                  <span className="tabular-nums">
                    {caption.length}/{CAPTION_MAX}
                  </span>
                </span>
                <textarea
                  value={caption}
                  maxLength={CAPTION_MAX}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={5}
                  placeholder="Escreva o texto do post…"
                  className={textareaClass}
                  disabled={busy}
                />
              </label>
              {fetching && (
                <div className="flex items-center gap-2 text-sm text-mute">
                  <Loader2 size={15} className="animate-spin" />
                  {STEP_LABEL[step!]}
                  {progress && ` (${progress})`}…
                </div>
              )}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-ink/90"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
