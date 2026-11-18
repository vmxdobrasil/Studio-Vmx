import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'

/** /magic-login?token=… — consome o link mágico (uso único) e abre a sessão. */
export function MagicLogin() {
  const [msg, setMsg] = useState('Validando link…')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') || ''
    if (!token) {
      setMsg('Link inválido ou expirado. Peça um novo link.')
      setFailed(true)
      return
    }
    ;(async () => {
      try {
        const res: any = await pb.send('/backend/v1/magic_link_consume', {
          method: 'POST',
          body: { token },
        })
        pb.authStore.save(res.token, res.record)
        window.location.replace('/')
      } catch (_e) {
        setMsg('Link inválido ou expirado. Peça um novo link.')
        setFailed(true)
      }
    })()
  }, [])

  return (
    <div className="h-full grid place-items-center px-4">
      <p className="text-sm text-mute flex items-center gap-2">
        {!failed && <Loader2 size={15} className="animate-spin" />}
        {msg}
      </p>
    </div>
  )
}
