import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'studio'; id: string }
  | { name: 'brand-kits' }
  | { name: 'trash' }
  | { name: 'mcp' }
  | { name: 'integracoes' }
  | { name: 'skill' }

/** Separa path e query do hash (`#/studio/id?otto=1`). */
function splitHash(hash: string): { path: string; params: URLSearchParams } {
  const raw = hash.replace(/^#/, '') || '/'
  const q = raw.indexOf('?')
  if (q < 0) return { path: raw, params: new URLSearchParams() }
  return {
    path: raw.slice(0, q) || '/',
    params: new URLSearchParams(raw.slice(q + 1)),
  }
}

function parse(hash: string): Route {
  const { path } = splitHash(hash)
  const studio = path.match(/^\/studio\/([^/]+)/)
  if (studio) return { name: 'studio', id: decodeURIComponent(studio[1]) }
  if (path.startsWith('/brand-kits')) return { name: 'brand-kits' }
  if (path.startsWith('/lixeira')) return { name: 'trash' }
  if (path.startsWith('/integracoes')) return { name: 'integracoes' }
  if (path.startsWith('/mcp')) return { name: 'mcp' }
  if (path.startsWith('/skill')) return { name: 'skill' }
  return { name: 'home' }
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const on = () => setRoute(parse(location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export function navigate(path: string) {
  location.hash = path
}

/** Lê um parâmetro da query dentro do hash. */
export function getHashParam(key: string): string | null {
  return splitHash(location.hash).params.get(key)
}

/** Remove um parâmetro da query do hash sem mudar a rota. */
export function clearHashParam(key: string) {
  const { path, params } = splitHash(location.hash)
  if (!params.has(key)) return
  params.delete(key)
  const qs = params.toString()
  const next = qs ? `${path}?${qs}` : path
  history.replaceState(null, '', `${location.pathname}${location.search}#${next}`)
}
