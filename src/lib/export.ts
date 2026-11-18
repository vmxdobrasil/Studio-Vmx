import { toJpeg, toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'
import { createElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { CANVAS_W } from '../config'
import { canvasHeight, SlideView } from '../render/SlideView'
import type { Carousel } from '../types'
import { assetUrl, refreshFileToken, stripFileToken } from './assets'
import { walk } from './elements'
import { ensureFont, resolveFontFamily } from './fonts'

export type Progress = (done: number, total: number) => void

function slug(s: string) {
  return (
    s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'carrossel'
  )
}

export function fileName(c: Carousel, index: number, ext: string) {
  return `${slug(c.name)}-${String(index + 1).padStart(2, '0')}.${ext}`
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

async function dataUrlToBlob(dataUrl: string) {
  return (await fetch(dataUrl)).blob()
}

interface Face {
  family: string
  weight: number
  style: 'normal' | 'italic'
}

/** Lista cada combinação família/peso/estilo usada nos slides e garante que estão carregadas. */
async function loadFaces(carousel: Carousel, indices: number[]): Promise<Face[]> {
  const { corpo } = carousel.fonts
  const map = new Map<string, Face>()
  const add = (family: string, weight: number, style: Face['style'] = 'normal') =>
    map.set(`${family}|${weight}|${style}`, { family, weight, style })
  // Perfil, cabeçalho e botões usam a fonte do corpo em 400-800.
  ;[400, 500, 600, 700, 800].forEach((w) => add(corpo, w))
  indices.forEach((i) =>
    walk(carousel.slides[i], (el) => {
      if (el.type === 'counter') add(resolveFontFamily(el.font ?? 'corpo', carousel.fonts), 400)
      if (el.type === 'card') add(corpo, el.weight)
      if (el.type !== 'text') return
      const family = resolveFontFamily(el.style.font, carousel.fonts)
      const style = el.style.italic ? 'italic' : 'normal'
      add(family, el.style.weight, style)
      if (el.text.includes('**')) add(family, 800, style) // **negrito**
      if (/(^|[^\w@])_[^_]+_/.test(el.text)) add(family, el.style.weight, 'italic') // _itálico_
    }),
  )
  const faces = [...map.values()]
  await Promise.all([...new Set(faces.map((f) => f.family))].map(ensureFont))
  await Promise.all(
    faces.map((f) =>
      document.fonts
        .load(`${f.style === 'italic' ? 'italic ' : ''}${f.weight} 40px "${f.family}"`, 'AaÇçÃãÉé')
        .catch(() => undefined),
    ),
  )
  await document.fonts.ready
  return faces
}

const fontData = new Map<string, Promise<string>>()
function fetchAsDataUrl(url: string) {
  let p = fontData.get(url)
  if (!p) {
    // Arquivo protegido do Skip Cloud: o download só aceita file token (o da URL
    // pode ter vencido), então renova antes de buscar.
    p = refreshFileToken()
      .then(() => fetch(assetUrl(stripFileToken(url))))
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(blob)
          }),
      )
    fontData.set(url, p)
  }
  return p
}

function weightMatches(declared: string, weight: number) {
  const [a, b] = declared
    .split(/\s+/)
    .map((v) => (v === 'normal' ? 400 : v === 'bold' ? 700 : Number(v)))
  return b ? weight >= a && weight <= b : weight === a
}

/**
 * Monta o CSS @font-face embutido só com as fontes usadas (alfabeto latino).
 * Embutir tudo (todas as variações e alfabetos) deixa a imagem pesada e a fonte
 * às vezes não decodifica a tempo.
 */
async function buildFontCSS(faces: Face[]) {
  const rules: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    let list: CSSRuleList
    try {
      list = sheet.cssRules
    } catch {
      continue
    }
    for (const rule of Array.from(list)) {
      if (!(rule instanceof CSSFontFaceRule)) continue
      const s = rule.style
      const family = s.getPropertyValue('font-family').replace(/["']/g, '').trim()
      const weight = s.getPropertyValue('font-weight') || '400'
      const style = s.getPropertyValue('font-style') || 'normal'
      const range = s.getPropertyValue('unicode-range')
      if (
        !faces.some(
          (f) => f.family === family && f.style === style && weightMatches(weight, f.weight),
        )
      )
        continue
      // Só latim e latim estendido (português); ignora cirílico, grego, vietnamita etc.
      if (range && !/^U\+0{0,4}-0{0,2}FF\b|^U\+0{0,1}100-/i.test(range.trim())) continue
      const url = s.getPropertyValue('src').match(/url\(["']?([^"')]+)["']?\)/)?.[1]
      if (!url) continue
      const data = url.startsWith('data:')
        ? url
        : await fetchAsDataUrl(new URL(url, sheet.href ?? location.href).href).catch(() => '')
      if (!data) continue
      rules.push(
        `@font-face{font-family:"${family}";font-style:${style};font-weight:${weight};src:url(${data});${range ? `unicode-range:${range};` : ''}}`,
      )
    }
  }
  return rules.join('\n')
}

/** Renderiza os slides fora da tela, em tamanho real, e devolve as imagens. */
export async function renderSlides(
  carousel: Carousel,
  indices: number[],
  type: 'png' | 'jpeg' = 'png',
  onProgress?: Progress,
): Promise<string[]> {
  const height = canvasHeight(carousel.format)

  const faces = await loadFaces(carousel, indices)
  const fontEmbedCSS = await buildFontCSS(faces)

  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-${CANVAS_W * 2}px;top:0;width:${CANVAS_W}px;pointer-events:none;`
  document.body.appendChild(host)
  const root = createRoot(host)

  try {
    const out: string[] = []
    for (let n = 0; n < indices.length; n++) {
      const slide = carousel.slides[indices[n]]
      flushSync(() =>
        root.render(
          createElement(SlideView, {
            ctx: carousel,
            slide,
            scale: 1,
            page: { index: indices[n], total: carousel.slides.length },
          }),
        ),
      )
      const node = host.querySelector<HTMLElement>('[data-slide-root]')!
      // Força o layout (dispara o carregamento de fontes pendentes) e espera tudo carregar.
      void node.offsetHeight
      await document.fonts.ready
      await Promise.all(
        Array.from(node.querySelectorAll('img')).map((img) =>
          img.complete ? Promise.resolve() : img.decode().catch(() => undefined),
        ),
      )
      const opts = { width: CANVAS_W, height, pixelRatio: 1, fontEmbedCSS, cacheBust: false }
      out.push(
        type === 'png' ? await toPng(node, opts) : await toJpeg(node, { ...opts, quality: 0.92 }),
      )
      onProgress?.(n + 1, indices.length)
    }
    return out
  } finally {
    root.unmount()
    host.remove()
  }
}

export async function exportSlidePng(carousel: Carousel, index: number) {
  const [url] = await renderSlides(carousel, [index])
  downloadBlob(await dataUrlToBlob(url), fileName(carousel, index, 'png'))
}

export async function exportAllPng(carousel: Carousel, onProgress?: Progress) {
  const all = carousel.slides.map((_, i) => i)
  const urls = await renderSlides(carousel, all, 'png', onProgress)
  for (let i = 0; i < urls.length; i++) {
    downloadBlob(await dataUrlToBlob(urls[i]), fileName(carousel, i, 'png'))
    await new Promise((r) => setTimeout(r, 250))
  }
}

export async function exportZip(carousel: Carousel, onProgress?: Progress) {
  const all = carousel.slides.map((_, i) => i)
  const urls = await renderSlides(carousel, all, 'png', onProgress)
  const zip = new JSZip()
  urls.forEach((u, i) => zip.file(fileName(carousel, i, 'png'), u.split(',')[1], { base64: true }))
  if (carousel.caption) zip.file('legenda.txt', carousel.caption)
  downloadBlob(await zip.generateAsync({ type: 'blob' }), `${slug(carousel.name)}.zip`)
}

/** Monta o PDF do carrossel (uma página por slide) e devolve o Blob — sem baixar. */
export async function buildPdfBlob(
  carousel: Carousel,
  onProgress?: Progress,
): Promise<{ blob: Blob; fileName: string }> {
  const height = canvasHeight(carousel.format)
  const all = carousel.slides.map((_, i) => i)
  const urls = await renderSlides(carousel, all, 'jpeg', onProgress)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [CANVAS_W, height],
    hotfixes: ['px_scaling'],
  })
  urls.forEach((u, i) => {
    if (i > 0) pdf.addPage([CANVAS_W, height], 'portrait')
    pdf.addImage(u, 'JPEG', 0, 0, CANVAS_W, height)
  })
  const raw = pdf.output('blob')
  const blob = raw.type === 'application/pdf' ? raw : new Blob([raw], { type: 'application/pdf' })
  return { blob, fileName: `${slug(carousel.name)}.pdf` }
}

export async function exportPdf(carousel: Carousel, onProgress?: Progress) {
  const { blob, fileName: name } = await buildPdfBlob(carousel, onProgress)
  downloadBlob(blob, name)
}
