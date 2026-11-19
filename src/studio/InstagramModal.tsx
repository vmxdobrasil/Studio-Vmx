import { AlertCircle, Instagram, Loader2, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Modal, textareaClass, toast } from '../components/ui'
import { ConnectorButton } from '../components/skip/ConnectorButton'
import {
  instagramErrorMessage,
  instagramStatus,
  postCarouselToInstagram,
  TOOLKIT,
} from '../lib/instagram'
import type { Carousel } from '../types'
import { update } from './ops'

const CAPTION_MAX = 2200 // limite de legenda do Instagram

type Step = 'render' | 'upload' | 'container' | 'publish'

const STEP_LABEL: Record<Step, string> = {
  render: 'Renderizando os slides',
  upload: 'Enviando as imagens',
  container: 'Preparando o carrossel no Instagram',
  publish: 'Publicando',
}

/**
 * Publica o carrossel no Instagram pela conta do PRÓPRIO usuário. Se o conector
 * ainda não está conectado, mostra o pedido/botão de conexão da conta dele.
 */
export function InstagramModal({
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
  // 'carousel' = feed com 2 a 10 imagens e legenda; 'story' = 1 imagem, sem legenda.
  const [format, setFormat] = useState<'carousel' | 'story'>('carousel')

  // Consulta o estado da conexão do usuário e reavalia ao voltar do
  // consentimento (janela/página do provedor) e periodicamente.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    let timer: number | undefined
    const check = async () => {
      const s = await instagramStatus()
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
  const isStory = format === 'story'
  // Story publica só a primeira página; carrossel exige de 2 a 10.
  const publishable = isStory ? n >= 1 : n >= 2 && n <= 10

  const publish = async () => {
    setBusy(true)
    setError(null)
    setPermalink(null)
    try {
      // A legenda editada vai junto no carrossel que está no app.
      if (caption !== (carousel.caption ?? '')) {
        update((c) => ({ ...c, caption }), 'caption')
      }
      const c = { ...carousel, caption }
      const result = await postCarouselToInstagram(
        c,
        (s, done, total) => {
          setStep(s)
          setProgress(total > 1 ? `${done}/${total}` : '')
        },
        format,
      )
      setStep(null)
      setProgress('')
      // Link do post só existe para carrossel; Story não devolve permalink.
      if (isStory) {
        setPermalink('story')
      } else {
        const pr = await fetchInstagramPermalink(result.mediaId)
        setPermalink(pr ?? result.permalink)
      }
      toast(isStory ? 'Story publicado no Instagram!' : 'Carrossel publicado no Instagram!')
    } catch (err) {
      setStep(null)
      setProgress('')
      // Erro amigável: diz o motivo e o que a pessoa precisa fazer.
      setError(instagramErrorMessage(err))
      // Conexão expirada: volta para a tela de conexão, com o botão.
      const s = await instagramStatus()
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
      title="Postar no Instagram"
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
              {busy ? 'Publicando…' : isStory ? 'Publicar Story' : 'Publicar carrossel'}
            </Button>
          </>
        )
      }
    >
      {status === 'checking' && (
        <div className="flex items-center gap-2 text-sm text-mute py-2">
          <Loader2 size={16} className="animate-spin" /> Verificando sua conexão com o Instagram…
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
            <Instagram size={20} className="mt-0.5 shrink-0 text-ink/70" />
            <div className="text-sm text-ink/80">
              <p className="font-medium">Conecte sua conta do Instagram</p>
              <p className="text-mute mt-1">
                Para publicar, cada usuário conecta a própria conta. Sua conta precisa ser uma conta
                Profissional (Empresa ou Criadora) no Instagram. Nada é publicado sem a sua
                confirmação neste botão.
              </p>
            </div>
          </div>
          <ConnectorButton toolkit={TOOLKIT} name="Instagram" />
          <p className="text-[12px] text-mute">
            Depois de conectar, volte aqui e clique em "Publicar carrossel".
          </p>
        </div>
      )}

      {status === 'connected' && (
        <div className="space-y-4">
          {permalink ? (
            <div className="rounded-xl border border-line bg-field p-4 text-sm">
              <p className="font-medium">
                {permalink === 'story' ? 'Story publicado! 🎉' : 'Carrossel publicado! 🎉'}
              </p>
              {permalink !== 'story' && (
                <a
                  href={permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] underline mt-1 inline-block"
                >
                  Ver a publicação no Instagram
                </a>
              )}
              {permalink === 'story' && (
                <p className="text-[13px] text-mute mt-1">
                  Stories não têm link permanente. Abra o Instagram e toque no seu avatar para ver.
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Formato: carrossel no feed ou Story. Story usa só a 1ª página
                  e não tem legenda (a API do Instagram rejeita caption). */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('carousel')}
                  disabled={busy}
                  className={`flex-1 rounded-xl border p-3 text-left text-sm transition ${
                    !isStory ? 'border-ink bg-ink/[.06] font-medium' : 'border-line hover:bg-field'
                  }`}
                >
                  Carrossel no feed
                  <span className="block text-[12px] text-mute mt-0.5">
                    {n} {n === 1 ? 'slide' : 'slides'} · com legenda
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('story')}
                  disabled={busy}
                  className={`flex-1 rounded-xl border p-3 text-left text-sm transition ${
                    isStory ? 'border-ink bg-ink/[.06] font-medium' : 'border-line hover:bg-field'
                  }`}
                >
                  Story
                  <span className="block text-[12px] text-mute mt-0.5">
                    só a 1ª página · sem legenda
                  </span>
                </button>
              </div>

              {!publishable && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-ink/90">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  O Instagram aceita carrosséis de 2 a 10 slides. Ajuste a quantidade de slides para
                  publicar.
                </div>
              )}

              {isStory ? (
                <p className="text-[13px] text-mute">
                  O Story publica a primeira página do carrossel em 9:16. Ajuste a proporção em
                  “Proporção” se a arte não estiver no formato vertical.
                </p>
              ) : (
                <label className="block">
                  <span className="flex items-center justify-between text-[12px] text-ink/60 mb-1">
                    Legenda
                    <span className="tabular-nums">
                      {caption.length}/{CAPTION_MAX}
                    </span>
                  </span>
                  <textarea
                    value={caption}
                    maxLength={CAPTION_MAX}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={5}
                    placeholder="Escreva a legenda do carrossel…"
                    className={textareaClass}
                    disabled={busy}
                  />
                </label>
              )}
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

/** Busca o link da publicação recém-feita; sem link em caso de falha. */
async function fetchInstagramPermalink(mediaId: string): Promise<string | null> {
  try {
    const { execute } = await import('../lib/skipConnectors')
    const r = await execute('INSTAGRAM_GET_IG_MEDIA', { ig_media_id: mediaId, fields: 'permalink' })
    const d = r.data
    if (r.successful && d && typeof d === 'object' && 'permalink' in d) {
      const p = (d as Record<string, unknown>).permalink
      if (typeof p === 'string' && p.startsWith('http')) return p
    }
  } catch {
    // O post foi publicado; o link é um bônus.
  }
  return null
}
