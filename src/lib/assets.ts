/**
 * Acesso a arquivos protegidos do Skip Cloud (media/fonts).
 *
 * Com `protected: true`, o PocketBase só serve o arquivo para requisições com o
 * file token (`?token=`) válido — cabeçalho Authorization normal NÃO basta (o
 * download só aceita o token, que também popula @request.auth para a regra de
 * view da coleção, aqui: só o dono). Como a validade é curta (~2 min), o token
 * é renovado em segundo plano e `assetUrl()` o anexa no uso (render/export).
 */
import pb from './pocketbase/client'

let fileToken = ''
let fetchedAt = 0
let inflight: Promise<void> | null = null
let lastUserId = pb.authStore.record?.id ?? ''

export function refreshFileToken(): Promise<void> {
  if (!pb.authStore.isValid) return Promise.resolve()
  if (inflight) return inflight
  inflight = pb.files
    .getToken()
    .then((t) => {
      fileToken = t
      fetchedAt = Date.now()
    })
    .catch(() => undefined)
    .finally(() => {
      inflight = null
    })
  return inflight
}

const isCloudFile = (url: string) => url.includes('/api/files/')

/** Anexa o file token a uma URL de arquivo do Skip Cloud (para <img> e CSS url()). */
export function assetUrl(url?: string): string {
  if (!url || !isCloudFile(url)) return url ?? ''
  // Token perto do vencimento: renova em segundo plano para a próxima renderização.
  if (fileToken && Date.now() - fetchedAt > 30_000) void refreshFileToken()
  return fileToken ? `${url}${url.includes('?') ? '&' : '?'}token=${fileToken}` : url
}

/** Remove o `?token=` de uma URL (o fetch autenticado não precisa dele). */
export function stripFileToken(url: string): string {
  if (!isCloudFile(url)) return url
  const [base, query] = url.split('?')
  if (!query) return url
  const params = query.split('&').filter((p) => p && !p.startsWith('token='))
  return params.length ? `${base}?${params.join('&')}` : base
}

// Renova o token em segundo plano enquanto o app estiver aberto (validade ~2 min).
if (typeof window !== 'undefined') {
  const tick = () => {
    if (pb.authStore.isValid && Date.now() - fetchedAt > 30_000) void refreshFileToken()
  }
  setInterval(tick, 30_000)
  window.addEventListener('focus', tick)
  document.addEventListener('visibilitychange', () => !document.hidden && tick())
  // Troca de conta: o file token é do usuário; força refetch no próximo uso.
  pb.authStore.onChange(() => {
    const id = pb.authStore.record?.id ?? ''
    if (id !== lastUserId) {
      lastUserId = id
      fileToken = ''
      fetchedAt = 0
    }
  })
}
