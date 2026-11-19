/** Login, cadastro e sessão (coleção `users` do Skip Cloud). */
import { ClientResponseError } from 'pocketbase'
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'

export interface SessionUser {
  id: string
  email: string
  name: string
}

function currentUser(): SessionUser | null {
  const r = pb.authStore.record
  if (!pb.authStore.isValid || !r) return null
  return { id: r.id, email: String(r.email ?? ''), name: String(r.name ?? '') }
}

/** Usuário logado (ou null). Atualiza sozinho ao entrar e sair. */
export function useSession() {
  const [user, setUser] = useState(currentUser)
  const [checking, setChecking] = useState(pb.authStore.isValid)

  useEffect(() => {
    const off = pb.authStore.onChange(() => setUser(currentUser()))
    // Confere no servidor se a sessão salva ainda vale.
    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .catch(() => pb.authStore.clear())
        .finally(() => setChecking(false))
    } else if (pb.authStore.record) {
      pb.authStore.clear()
    }
    return off
  }, [])

  return { user, checking }
}

/** Pede um link mágico de login (somente e-mails @adapta.org; uso único, 15 min). */
export async function requestMagicLink(email: string): Promise<void> {
  await pb.send('/backend/v1/magic_link_request', { method: 'POST', body: { email } })
}

/** Mensagem em português para os erros de login e cadastro. */
export function authErrorMessage(err: unknown, semSenha = false): string {
  if (err instanceof ClientResponseError) {
    if (err.status === 0) return 'Sem conexão com o servidor. Tente de novo em instantes.'
    if (err.status === 429) return 'Muitas tentativas seguidas. Espere um pouco e tente de novo.'
    const data = (err.response?.data ?? {}) as Record<string, { code?: string }>
    if (data.email?.code === 'validation_not_unique')
      return 'Já existe uma conta com esse e-mail. Use "Entrar".'
    if (data.email?.code === 'validation_is_email') return 'Digite um e-mail válido.'
    if (
      data.password?.code === 'validation_min_text_constraint' ||
      data.password?.code === 'validation_length_out_of_range'
    ) {
      return 'A senha precisa ter pelo menos 8 caracteres.'
    }
    if (err.status === 400 && /authenticate/i.test(err.message) && !semSenha)
      return 'E-mail ou senha incorretos.'
    if (err.status === 400)
      return semSenha
        ? 'Não foi possível enviar o link agora. Confira o e-mail e tente de novo.'
        : 'Confira os dados e tente de novo.'
  }
  return semSenha
    ? 'Não foi possível enviar o link de acesso agora. Tente de novo em instantes.'
    : 'Algo deu errado. Tente de novo.'
}

export async function signIn(email: string, password: string) {
  await pb.collection('users').authWithPassword(email.trim(), password)
}

export async function signUp(name: string, email: string, password: string) {
  await pb
    .collection('users')
    .create({ name: name.trim(), email: email.trim(), password, passwordConfirm: password })
  await signIn(email, password)
}

export async function requestPasswordReset(email: string) {
  await pb.collection('users').requestPasswordReset(email.trim())
}

export function signOut() {
  pb.authStore.clear()
}
