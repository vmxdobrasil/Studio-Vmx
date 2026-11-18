/**
 * Publicação de carrossel no LinkedIn pela CONTA DO USUÁRIO (conector Skip).
 * Mesmo padrão do fluxo do Instagram (src/lib/instagram.ts): renderiza os
 * slides, envia as imagens para a coleção `media` e chama a rota do backend
 * /backend/v1/linkedin/publish, que já existe no servidor.
 */
import { ClientResponseError } from 'pocketbase'
import { renderSlides } from '@/lib/export'
import { listConnectors, type ConnectorState } from '@/lib/skipConnectors'
import { uploadMedia } from '@/services/cloud'
import pb from '@/lib/pocketbase/client'
import type { Carousel } from '@/types'

export const TOOLKIT = 'linkedin'

export type ConnectorStateOf = ConnectorState['status']

/** Erro já traduzido para o que o usuário precisa fazer (backend ou daqui). */
export class LinkedInError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LinkedInError'
  }
}

/** Estado do conector LinkedIn deste usuário (ou null se não deu para consultar). */
export async function linkedinStatus(): Promise<ConnectorStateOf | null> {
  try {
    const all = await listConnectors()
    return all.find((c) => c.toolkit === TOOLKIT)?.status ?? null
  } catch {
    return null
  }
}

/** Publica um carrossel pronto no LinkedIn; devolve o id e o link da publicação. */
export async function postCarouselToLinkedIn(
  carousel: Carousel,
  onProgress: (step: 'render' | 'upload' | 'publish', done: number, total: number) => void,
): Promise<{ postId: string; permalink: string | null }> {
  const slides = carousel.slides.length
  if (slides < 2 || slides > 20) {
    throw new LinkedInError('Prepare um carrossel de 2 a 20 slides para publicar no LinkedIn.')
  }

  onProgress('render', 0, slides)
  let urls: string[]
  try {
    urls = await renderSlides(
      carousel,
      carousel.slides.map((_, i) => i),
      'jpeg',
      (d, t) => onProgress('render', d, t),
    )
  } catch {
    throw new LinkedInError('Não conseguimos preparar as imagens do carrossel. Tente de novo.')
  }

  onProgress('upload', 0, slides)
  const publicUrls: string[] = []
  try {
    for (let i = 0; i < urls.length; i++) {
      const blob = await (await fetch(urls[i])).blob()
      publicUrls.push(await uploadMedia(blob, `${carousel.name || 'carrossel'}-${i + 1}.jpg`))
      onProgress('upload', i + 1, slides)
    }
  } catch (err) {
    if (err instanceof LinkedInError) throw err
    throw new LinkedInError(
      'Não conseguimos enviar as imagens. Verifique sua internet e tente de novo.',
    )
  }

  // Mesma convenção do Instagram: o app manda a REFERÊNCIA de cada imagem
  // enviada (o hook confere a posse e gera link público assinado) e, como
  // reserva, as URLs de origem.
  const refs = publicUrls.map(mediaIdFromUrl)
  const withRef = refs.filter((r): r is string => !!r)
  const withoutRef = publicUrls
    .filter((_, i) => refs[i] === null)
    .map((u) => new URL(u.split('?')[0], window.location.origin).toString())

  onProgress('publish', 0, 1)
  let res: { post_id?: unknown; post_urn?: unknown; permalink?: unknown }
  try {
    res = await pb.send('/backend/v1/linkedin/publish', {
      method: 'POST',
      body: {
        image_refs: withRef,
        image_urls: withoutRef,
        origin: pb.baseURL || window.location.origin,
        caption: carousel.caption ?? '',
        carousel: carousel.name || '',
      },
    })
  } catch (err) {
    throw new LinkedInError(publishErrorMessage(err))
  }

  const postId =
    typeof res?.post_id === 'string'
      ? res.post_id
      : typeof res?.post_urn === 'string'
        ? res.post_urn
        : ''
  if (!postId) {
    throw new LinkedInError(
      'O LinkedIn não confirmou a publicação. Confira o perfil e tente de novo.',
    )
  }
  onProgress('publish', 1, 1)

  const permalink =
    typeof res?.permalink === 'string' && res.permalink.startsWith('http') ? res.permalink : null
  return { postId, permalink }
}

/** Mesma extração de id de registro de `media` usada no fluxo do Instagram. */
function mediaIdFromUrl(u: string): string | null {
  const m = u.split('?')[0].match(/\/api\/files\/[^/]+\/([a-z0-9]{15})(?:\/|$)/i)
  return m ? m[1].toLowerCase() : null
}

/** Mensagem do backend para a falha da publicação (já em português do app). */
function publishErrorMessage(err: unknown): string {
  if (err instanceof ClientResponseError) {
    const body = (err.response ?? {}) as Record<string, unknown>
    if (typeof body.error === 'string' && body.error.trim()) return body.error
    if (err.status === 0) {
      return 'Não conseguimos falar com o servidor. Verifique sua internet e tente de novo.'
    }
  }
  return 'Não foi possível publicar no LinkedIn agora. Tente de novo em alguns instantes.'
}

export function linkedinErrorMessage(err: unknown): string {
  if (err instanceof LinkedInError) return err.message
  const raw = err instanceof Error ? err.message : String(err ?? '')
  const m = raw.toLowerCase()
  if (m.includes('oauth') || m.includes('token') || m.includes('expired')) {
    return 'Sua conexão com o LinkedIn expirou. Desconecte e conecte sua conta de novo.'
  }
  if (m.includes('permission') || m.includes('scope') || m.includes('authorize')) {
    return 'Falta permissão para publicar. Desconecte e conecte sua conta de novo, aceitando as permissões de publicação.'
  }
  if (m.includes('rate') || m.includes('429') || m.includes('limit')) {
    return 'O LinkedIn está limitando as publicações da sua conta agora. Tente de novo mais tarde.'
  }
  return 'Não foi possível publicar no LinkedIn agora. Tente de novo em alguns instantes.'
}

/** Se o conector do LinkedIn não estiver conectado, devolve o motivo amigável. */
export async function requireLinkedInConnected(): Promise<string | null> {
  const status = await linkedinStatus()
  if (status === 'connected') return null
  if (status === 'expired') return 'Sua conexão com o LinkedIn expirou. Conecte sua conta de novo.'
  return 'Conecte sua conta do LinkedIn para publicar.'
}
