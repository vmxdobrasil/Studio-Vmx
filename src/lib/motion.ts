/* Motor de animação de entrada por scroll, copiado do efeito do prado-demo:
   elementos com .entra / .entra-linhas / .cartao ganham .is-in quando entram
   na viewport (top < 88% da altura), com rAF + fila. O hero entra no carregamento.
   Também controla .is-scrolling no <html>: os hovers ficam suspensos enquanto a
   página rola. Tudo desligado com prefers-reduced-motion. */

export function initMotion() {
  document.documentElement.classList.add('js')

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    document
      .querySelectorAll('.entra, .entra-linhas, .cartao, [data-hero]')
      .forEach((el) => el.classList.add('is-in', 'is-pronto'))
    return
  }

  // O scroll pode acontecer na window ou num container com overflow (o app rola
  // dentro de uma div). Escutamos os dois; a checagem é por getBoundingClientRect,
  // então funciona em qualquer deles.
  const scroller = document.querySelector<HTMLElement>('.h-full.overflow-y-auto')
  const alvos: (Window | HTMLElement)[] = scroller ? [window, scroller] : [window]

  // --- fila de entrada por scroll ---
  const fila = new Set<Element>()
  let agendado = false

  const varrer = () => {
    agendado = false
    const limite = window.innerHeight * 0.88
    for (const el of Array.from(fila)) {
      if (el.getBoundingClientRect().top < limite) {
        fila.delete(el)
        el.classList.add('is-in')
      }
    }
    if (fila.size === 0) {
      for (const t of alvos) t.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }

  const onScroll = () => {
    if (!agendado) {
      agendado = true
      requestAnimationFrame(varrer)
    }
  }

  const observar = (raiz: ParentNode) => {
    raiz.querySelectorAll('.entra, .entra-linhas, .cartao').forEach((el) => {
      if (!el.closest('[data-hero]')) fila.add(el)
    })
    onScroll()
  }

  for (const t of alvos) t.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  observar(document)

  // --- hero: entra quando as imagens/fontes estiverem prontas ---
  const hero = document.querySelector('[data-hero]')
  if (hero) {
    const pronto = () => {
      hero.classList.add('is-pronto')
      hero.querySelectorAll('.entra, .entra-linhas').forEach((el) => el.classList.add('is-in'))
    }
    if (document.readyState === 'complete') pronto()
    else window.addEventListener('load', pronto, { once: true })
  }

  // --- is-scrolling: suspende hovers enquanto rola (igual ao prado) ---
  const html = document.documentElement
  let px = -1
  let py = -1
  const aoRolar = () => {
    html.classList.add('is-scrolling')
  }
  for (const t of alvos) t.addEventListener('scroll', aoRolar, { passive: true })
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'mouse') {
        if (Math.abs(e.clientX - px) > 2 && Math.abs(e.clientY - py) > 2 && px >= 0)
          html.classList.remove('is-scrolling')
        px = e.clientX
        py = e.clientY
      }
    },
    { passive: true },
  )
}
