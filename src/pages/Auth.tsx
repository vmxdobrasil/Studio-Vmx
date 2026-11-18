import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { Button, Field, inputClass, Segmented } from '../components/ui'
import {
  authErrorMessage,
  requestMagicLink,
  requestPasswordReset,
  signIn,
  signUp,
} from '../services/auth'

type Mode = 'entrar' | 'criar' | 'recuperar' | 'link'

/** Tela de login, cadastro e recuperação de senha. */
export function AuthPage() {
  const [mode, setMode] = useState<Mode>('entrar')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setNotice(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    if (!email.trim()) return setError('Digite seu e-mail.')
    if (mode !== 'recuperar' && mode !== 'link' && password.length < 8)
      return setError('A senha precisa ter pelo menos 8 caracteres.')
    setBusy(true)
    try {
      if (mode === 'entrar') await signIn(email, password)
      else if (mode === 'criar') await signUp(name, email, password)
      else if (mode === 'link') {
        await requestMagicLink(email)
        setNotice(
          'Se este e-mail tiver conta, o link de acesso chega em instantes — confira a caixa de entrada (e o spam). Vale por 15 minutos.',
        )
      } else {
        await requestPasswordReset(email)
        setNotice(
          'Se existir uma conta com esse e-mail, você vai receber um link para criar uma senha nova.',
        )
      }
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const title =
    mode === 'criar'
      ? 'Crie sua conta'
      : mode === 'recuperar'
        ? 'Recuperar senha'
        : mode === 'link'
          ? 'Entrar por link de e-mail'
          : 'Entre na sua conta'

  return (
    <div className="h-full overflow-y-auto bg-paper bg-[radial-gradient(ellipse_at_top,rgb(139_81_255/0.16),transparent_55%)]">
      <div className="min-h-full grid place-items-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="flex justify-center mb-10">
            <BrandLogo variant="onDark" size="lg" />
          </div>

          <div className="rounded-2xl border border-line bg-surface p-7">
            <div className="eyebrow text-mute">{mode === 'recuperar' ? 'Acesso' : 'Bem-vindo'}</div>
            <h1 className="text-4xl display mt-3">{title}</h1>
            <p className="text-sm text-mute mt-3">
              {mode === 'recuperar'
                ? 'Digite o e-mail da sua conta e enviamos um link para você criar uma senha nova.'
                : mode === 'link'
                  ? 'Digite seu e-mail @adapta.org e enviamos um link de acesso válido por 15 minutos, uso único.'
                  : 'Seus projetos, carrosséis e brand kits ficam salvos na nuvem e aparecem em qualquer computador.'}
            </p>

            {mode !== 'recuperar' && mode !== 'link' && (
              <div className="mt-6">
                <Segmented
                  value={mode}
                  onChange={(v) => switchMode(v)}
                  options={[
                    { value: 'entrar', label: 'Entrar' },
                    { value: 'criar', label: 'Criar conta' },
                  ]}
                />
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              {mode === 'criar' && (
                <Field label="Seu nome">
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Como quer ser chamado"
                  />
                </Field>
              )}
              <Field label="E-mail">
                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  autoFocus
                />
              </Field>
              {mode !== 'recuperar' && mode !== 'link' && (
                <Field
                  label="Senha"
                  hint={mode === 'criar' ? 'Mínimo de 8 caracteres.' : undefined}
                  right={
                    mode === 'entrar' ? (
                      <button
                        type="button"
                        className="text-[12px] text-ink/60 hover:text-ink"
                        onClick={() => switchMode('recuperar')}
                      >
                        Esqueci minha senha
                      </button>
                    ) : undefined
                  }
                >
                  <input
                    className={inputClass}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'criar' ? 'new-password' : 'current-password'}
                  />
                </Field>
              )}

              {error && (
                <p className="text-[13px] rounded-lg border border-red-400/30 bg-red-500/10 text-red-300 px-3 py-2">
                  {error}
                </p>
              )}
              {notice && (
                <p className="text-[13px] rounded-lg border border-line border-l-2 border-l-sunset bg-paper text-ink/80 px-3 py-2">
                  {notice}
                </p>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={busy}>
                {busy && <Loader2 size={15} className="animate-spin" />}
                {mode === 'entrar'
                  ? 'Entrar'
                  : mode === 'criar'
                    ? 'Criar conta'
                    : mode === 'link'
                      ? 'Enviar link de acesso'
                      : 'Enviar link'}
              </Button>
              {(mode === 'recuperar' || mode === 'link') && (
                <button
                  type="button"
                  className="w-full text-center text-[13px] text-ink/60 hover:text-ink"
                  onClick={() => switchMode('entrar')}
                >
                  Voltar para o login
                </button>
              )}
              {(mode === 'entrar' || mode === 'criar') && (
                <button
                  type="button"
                  className="w-full text-center text-[13px] text-ink/60 hover:text-ink"
                  onClick={() => switchMode('link')}
                >
                  Entrar com link de e-mail (sem senha)
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
