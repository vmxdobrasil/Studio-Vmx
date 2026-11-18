import { uploadMedia } from '../services/cloud'

/** Lê uma imagem, reduz para no máximo `maxSide` px e devolve um arquivo leve (WebP, ou PNG para logos). */
async function compressImage(
  file: Blob,
  maxSide: number,
  quality: number,
): Promise<{ blob: Blob; ext: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  // PNG com transparência (logos) continua PNG; o resto vira WebP.
  const keepAlpha = file.type === 'image/png' && maxSide <= 1024
  const type = keepAlpha ? 'image/png' : 'image/webp'
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  if (!blob) throw new Error('Não foi possível processar a imagem.')
  return { blob, ext: keepAlpha ? 'png' : 'webp' }
}

/** Reduz a imagem, envia para o Skip Cloud e devolve o endereço dela. */
export async function uploadImage(file: Blob, maxSide = 2160, quality = 0.86): Promise<string> {
  const { blob, ext } = await compressImage(file, maxSide, quality)
  return uploadMedia(blob, `imagem.${ext}`)
}

export function pickFiles(accept = 'image/*', multiple = false): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = multiple
    input.onchange = () => resolve(Array.from(input.files ?? []))
    input.click()
  })
}

/** Pega a primeira imagem de um evento de colar (Ctrl+V). */
export function imageFromClipboard(e: ClipboardEvent): File | null {
  for (const item of Array.from(e.clipboardData?.items ?? [])) {
    if (item.type.startsWith('image/')) return item.getAsFile()
  }
  return null
}
