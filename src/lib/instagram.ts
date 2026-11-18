/**
 * Publicação de carrossel no Instagram pela CONTA DO USUÁRIO (conector Skip).
 *
 * A sequência da Graph API (criar o container do carrossel → publicar) roda no
 * backend, na rota /backend/v1/instagram/publish (pb_hook): é lá que cada passo
 * é logado e o erro real da API é traduzido. Aqui ficam as etapas do app:
 * renderizar os slides, enviar as imagens para a coleção `media` (o Instagram
 * baixa cada uma de um endereço público) e chamar a rota do backend.
 *
 * Qualquer falha vira InstagramError com a mensagem em português que diz o que
 * a pessoa precisa fazer — o fallback genérico só resta para o inesperado.
 */
import { ClientResponseError } from 'pocketbase'
import { renderSlides } from '@/lib/export'
import { listConnectors, type ConnectorState } from '@/lib/skipConnectors'
import { uploadMedia } from '@/services/cloud'
import pb from '@/lib/pocketbase/client'
import type { Carousel } from '@/types'

export const TOOLKIT = 'instagram'

export type ConnectorStateOf = ConnectorState['status']

/** Erro já traduzido para o que o usuário precisa fazer (backend ou daqui). */
export class InstagramError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InstagramError'
  }
}

/** Estado do conector Instagram deste usuário (ou null se não deu para consultar). */
export async function instagramStatus(): Promise<ConnectorStateOf | null> {
  try {
    const all = await listConnectors()
    return all.find((c) => c.toolkit === TOOLKIT)?.status ?? null
  } catch {
    return null
  }
}

/** Publica um carrossel pronto; devolve o id e o link da publicação. */
export async function postCarouselToInstagram(
  carousel: Carousel,
  onProgress: (step: 'render' | 'upload' | 'publish', done: number, total: number) => void,
): Promise<{ mediaId: string; permalink: string | null }> {
  const slides = carousel.slides.length
  if (slides < 2 || slides > 10) {
    throw new InstagramError(
      'O Instagram aceita carrosséis de 2 a 10 slides. Ajuste a quantidade de slides e tente de novo.',
    )
  }

  onProgress('render', 0, slides)
  // JPEG: imagens menores para enviar e o Instagram recomprime de qualquer forma.
  let urls: string[]
  try {
    urls = await renderSlides(
      carousel,
      carousel.slides.map((_, i) => i),
      'jpeg',
      (d, t) => onProgress('render', d, t),
    )
  } catch {
    throw new InstagramError('Não conseguimos preparar as imagens do carrossel. Tente de novo.')
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
    if (err instanceof InstagramError) throw err
    throw new InstagramError(
      'Não conseguimos enviar as imagens. Verifique sua internet e tente de novo.',
    )
  }

  // O app manda ao backend a REFERÊNCIA de cada imagem que acabou de enviar
  // (a URL do upload: /api/files/media/{id do registro}/{arquivo}). O hook
  // confere a posse pelo id e gera um link público assinado por imagem
  // (/backend/v1/media/shared/{token}) — a coleção `media` continua privada
  // e nenhuma URL crua de arquivo vai ao Instagram.
  const refs = publicUrls.map(mediaIdFromUrl)
  const withRef = refs.filter((r): r is string => !!r)
  const withoutRef = publicUrls
    .filter((_, i) => refs[i] === null)
    .map((u) => new URL(u.split('?')[0], window.location.origin).toString())

  onProgress('publish', 0, 1)
  let res: { media_id?: unknown; permalink?: unknown }
  try {
    res = await pb.send('/backend/v1/instagram/publish', {
      method: 'POST',
      body: {
        image_refs: withRef,
        image_urls: withoutRef,
        // Origem dos links assinados que o Instagram vai baixar: precisa ser o
        // BACKEND (o domínio do app não roteia /backend/*).
        origin: pb.baseURL || window.location.origin,
        caption: carousel.caption ?? '',
        carousel: carousel.name || '',
      },
    })
  } catch (err) {
    throw new InstagramError(publishErrorMessage(err))
  }

  const mediaId = typeof res?.media_id === 'string' ? res.media_id : ''
  if (!mediaId) {
    throw new InstagramError(
      'O Instagram não confirmou a publicação. Confira o perfil e tente de novo.',
    )
  }
  onProgress('publish', 1, 1)

  const permalink =
    typeof res?.permalink === 'string' && res.permalink.startsWith('http') ? res.permalink : null
  return { mediaId, permalink }
}

/**
 * Extrai o id do registro de `media` da URL de arquivo
 * (/api/files/<coleção>/{id}/{arquivo}). O segmento da coleção pode ser o nome
 * (`media`) ou o id interno do PocketBase (`pbc_...`) — o SDK monta a URL com o
 * id, então aceitamos qualquer segmento e validamos o id do registro depois.
 */
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
  return 'Não foi possível publicar no Instagram agora. Tente de novo em alguns instantes.'
}

// Rede de segurança para erros que escaparam do fluxo (técnicos do provedor):
// reconhece o tipo e diz a ação; o resto cai no fallback genérico.
export function instagramErrorMessage(err: unknown): string {
  if (err instanceof InstagramError) return err.message
  const raw = err instanceof Error ? err.message : String(err ?? '')
  const m = raw.toLowerCase()
  if (m.includes('oauth') || m.includes('token') || m.includes('expired')) {
    return 'Sua conexão com o Instagram expirou. Desconecte e conecte sua conta de novo.'
  }
  if (m.includes('permission') || m.includes('scope') || m.includes('authorize')) {
    return 'Falta permissão para publicar. Desconecte e conecte sua conta de novo, aceitando as permissões de publicação.'
  }
  if (m.includes('business') || m.includes('creator') || m.includes('professional')) {
    return 'Sua conta do Instagram precisa ser uma conta Profissional (Empresa ou Criadora) para publicar.'
  }
  if (m.includes('rate') || m.includes('429') || m.includes('limit')) {
    return 'O Instagram está limitando as publicações da sua conta agora. Tente de novo mais tarde.'
  }
  return 'Não foi possível publicar no Instagram agora. Tente de novo em alguns instantes.'
}

/** Se o conector do Instagram não estiver conectado, devolve o motivo amigável. */
export async function requireInstagramConnected(): Promise<string | null> {
  const status = await instagramStatus()
  if (status === 'connected') return null
  if (status === 'expired') return 'Sua conexão com o Instagram expirou. Conecte sua conta de novo.'
  return 'Conecte sua conta do Instagram para publicar.'
}
