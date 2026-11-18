import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Button, ConfirmDialog, toast } from '../components/ui'
import { useApp } from '../store/app'
import type { Carousel } from '../types'
import { CoverThumb } from './Home'

function timeAgo(t: number) {
  const s = (Date.now() - t) / 1000
  if (s < 60) return 'agora'
  if (s < 3600) return `há ${Math.floor(s / 60)} min`
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`
  return new Date(t).toLocaleDateString('pt-BR')
}

/** Lixeira: carrosséis excluídos podem voltar ou sumir de vez. */
export function TrashPage() {
  const carousels = useApp((s) => s.carousels)
  const app = useApp.getState()
  const trash = Object.values(carousels).filter((c) => c.deletedAt)
  const [confirm, setConfirm] = useState<null | {
    title: string
    message: string
    label: string
    action: () => void
  }>(null)

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-4xl display">Lixeira</h1>
        <p className="text-sm text-mute mt-2">
          Carrosséis excluídos ficam aqui. Restaure quando quiser ou apague para sempre.
        </p>

        {trash.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-line bg-surface p-10 text-center text-mute">
            A lixeira está vazia.
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-line bg-surface divide-y divide-line">
            {trash.map((c: Carousel) => (
              <div key={c.id} className="flex items-center gap-3 p-3">
                <div className="rounded overflow-hidden shrink-0">
                  <CoverThumb carousel={c} width={40} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{c.name}</div>
                  <div className="text-[11px] text-mute">Excluído {timeAgo(c.deletedAt!)}</div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    app.restoreCarousel(c.id)
                    toast('Carrossel restaurado')
                  }}
                >
                  <RotateCcw size={14} /> Restaurar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    setConfirm({
                      title: 'Excluir para sempre?',
                      message: `"${c.name}" será apagado definitivamente, sem como recuperar.`,
                      label: 'Excluir para sempre',
                      action: () => {
                        app.purgeCarousel(c.id)
                        toast('Carrossel apagado')
                      },
                    })
                  }
                >
                  Excluir
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.label}
        danger
        onConfirm={() => confirm?.action()}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}
