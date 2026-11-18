import pb from './pocketbase/client'
import { allLeaves, imageSlots, mapLeaves } from './elements'
import { uploadImage } from './image'
import type { Carousel, ImageElement, Slide } from '../types'

export interface BankImage {
  id: string
  url: string
  thumb: string
  title: string
  photographer: string
  source: string
}

/** Busca fotos no banco nativo (Wikimedia + fallback Picsum). */
export async function searchImageBank(query: string, count: number): Promise<BankImage[]> {
  const res = await pb.send('/backend/v1/images/search', {
    method: 'POST',
    body: { query, count },
  })
  const images = (res as { images?: BankImage[] })?.images
  return Array.isArray(images) ? images : []
}

function isDirectFetchable(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return (
      host.endsWith('picsum.photos') ||
      host.endsWith('fastly.picsum.photos') ||
      host.endsWith('images.unsplash.com')
    )
  } catch {
    return false
  }
}

/** Baixa via proxy autenticado (Wikimedia etc.) e devolve Blob. */
async function fetchBankBlobViaProxy(url: string): Promise<Blob> {
  const res = await pb.send('/backend/v1/images/fetch', {
    method: 'POST',
    body: { url },
  })
  const data = res as { base64?: string; contentType?: string }
  if (!data?.base64) throw new Error('Imagem vazia')
  const bin = atob(data.base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: data.contentType || 'image/jpeg' })
}

/** Baixa uma URL do banco — proxy no servidor, com fallback CORS no browser. */
async function fetchBankBlob(url: string): Promise<Blob> {
  try {
    return await fetchBankBlobViaProxy(url)
  } catch (proxyErr) {
    if (!isDirectFetchable(url)) throw proxyErr
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) throw proxyErr
    const blob = await res.blob()
    if (!blob.size || (blob.type && !blob.type.startsWith('image/'))) throw proxyErr
    return blob
  }
}

/**
 * Preenche os slots de imagem do carrossel com fotos do banco.
 * `replace: true` sobrescreve slots que já tinham foto.
 */
export async function fillEmptySlotsFromBank(
  slides: Slide[],
  theme: string,
  opts?: { replace?: boolean },
): Promise<{ slides: Slide[]; filled: number; total: number }> {
  const all = imageSlots(slides)
  const slots = opts?.replace ? all : all.filter((s) => !s.el.src)
  if (slots.length === 0) return { slides, filled: 0, total: all.length }

  const q = theme.trim() || 'business lifestyle'
  let found: BankImage[] = []
  try {
    // Pede extras pra cobrir falhas de download pontuais.
    found = await searchImageBank(q, Math.min(12, slots.length + 3))
  } catch (err) {
    console.error('imageBank search failed', err)
    return { slides, filled: 0, total: slots.length }
  }
  if (found.length === 0) return { slides, filled: 0, total: slots.length }

  const srcs: string[] = []
  for (const img of found) {
    if (srcs.length >= slots.length) break
    try {
      const blob = await fetchBankBlob(img.url)
      srcs.push(await uploadImage(blob))
    } catch (err) {
      console.error('imageBank fetch/upload failed', img.url, err)
    }
  }

  if (srcs.length === 0) return { slides, filled: 0, total: slots.length }

  const byId = new Map(slots.slice(0, srcs.length).map((s, i) => [s.el.id, srcs[i]!]))
  const next = mapLeaves(slides, (el) =>
    el.type === 'image' && byId.has(el.id)
      ? ({ ...el, src: byId.get(el.id), posX: 50, posY: 50, zoom: 1 } as ImageElement)
      : el,
  )
  return { slides: next, filled: byId.size, total: slots.length }
}

export async function fillCarouselImagesFromBank(carousel: Carousel, theme: string) {
  return fillEmptySlotsFromBank(carousel.slides, theme, { replace: true })
}

/** Extrai um tema curto a partir do nome do carrossel + textos do slide. */
export function themeForImageSlot(carousel: Carousel, slideIndex: number): string {
  const slide = carousel.slides[slideIndex]
  const bits: string[] = []
  if (carousel.name?.trim() && !/^novo carrossel$/i.test(carousel.name.trim())) {
    bits.push(carousel.name.trim())
  }
  if (slide) {
    for (const el of allLeaves(slide)) {
      if (el.hidden) continue
      if (el.type === 'text' && el.text?.trim()) bits.push(el.text.trim())
      else if (el.type === 'card' && el.text?.trim()) bits.push(el.text.trim())
      else if (el.type === 'cta' && el.label?.trim()) bits.push(el.label.trim())
      if (bits.join(' ').length > 120) break
    }
  }
  const raw = bits
    .join(' ')
    .replace(/==|\*\*|\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return raw.slice(0, 100) || 'editorial lifestyle photo'
}

/**
 * Busca UMA foto no banco (tema do layout) e devolve a URL já enviada ao cloud.
 * `salt` muda o resultado a cada clique (Picsum é determinístico por seed).
 */
export async function fetchOneBankImage(theme: string, salt?: string): Promise<string> {
  const q = `${theme.trim() || 'lifestyle'} ${salt || Date.now()}`
  const found = await searchImageBank(q, 4)
  if (found.length === 0) throw new Error('Nenhuma imagem no banco')
  // Embaralha pra variar qual resultado vira a foto escolhida.
  const order = found.map((img, i) => ({ img, i, r: Math.random() })).sort((a, b) => a.r - b.r)
  let lastErr: unknown
  for (const { img } of order) {
    try {
      const blob = await fetchBankBlob(img.url)
      return await uploadImage(blob)
    } catch (err) {
      lastErr = err
      console.error('imageBank single fetch failed', img.url, err)
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Falha ao baixar imagem')
}
