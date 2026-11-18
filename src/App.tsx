/* Componente raiz: pede login e, com a sessão ativa, carrega os dados do usuário e mostra o app. */
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Button, Toasts } from './components/ui'
import { SideNav } from './components/SideNav'
import { ensureFont } from './lib/fonts'
import { useRoute } from './lib/router'
import { AuthPage } from './pages/Auth'
import { BrandKitsPage } from './pages/BrandKits'
import { HomePage } from './pages/Home'
import { SkillPage } from './pages/SkillPage'
import { MagicLogin } from './pages/MagicLogin'
import { McpPage } from './pages/McpPage'
import { TrashPage } from './pages/Trash'
import { useSession, type SessionUser } from './services/auth'
import { StudioPage } from './studio/StudioPage'
import { useApp } from './store/app'

void ensureFont('Inter')

function Splash({ text }: { text: string }) {
  return (
    <div className="h-full grid place-items-center text-mute text-sm">
      <span className="inline-flex items-center gap-2">
        <Loader2 size={15} className="animate-spin" /> {text}
      </span>
    </div>
  )
}

function Workspace({ user }: { user: SessionUser }) {
  const ready = useApp((s) => s.ready)
  const loadError = useApp((s) => s.loadError)
  const route = useRoute()

  useEffect(() => {
    void useApp.getState().hydrate()
    return () => useApp.getState().reset()
  }, [])

  if (loadError) {
    return (
      <div className="h-full grid place-items-center px-4 text-center">
        <div>
          <p className="text-sm text-ink/70">{loadError}</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => void useApp.getState().hydrate()}
          >
            Tentar de novo
          </Button>
        </div>
      </div>
    )
  }
  if (!ready) return <Splash text="Carregando seus carrosséis…" />

  return (
    <div className="h-full flex overflow-hidden">
      <SideNav route={route} user={user} />
      <main className="flex-1 min-w-0 min-h-0">
        {route.name === 'studio' ? (
          <StudioPage id={route.id} />
        ) : route.name === 'brand-kits' ? (
          <BrandKitsPage />
        ) : route.name === 'trash' ? (
          <TrashPage />
        ) : route.name === 'mcp' ? (
          <McpPage />
        ) : (
          <HomePage />
        )}
      </main>
    </div>
  )
}

export default function App() {
  const { user, checking } = useSession()
  const route = useRoute()
  if (window.location.pathname.indexOf('/magic-login') >= 0) return <MagicLogin />
  return (
    <>
      {checking ? (
        <Splash text="Conectando…" />
      ) : route.name === 'skill' ? (
        <SkillPage />
      ) : user ? (
        <Workspace key={user.id} user={user} />
      ) : (
        <AuthPage />
      )}
      <Toasts />
    </>
  )
}
