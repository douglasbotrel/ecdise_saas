'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_SESSION_COOKIE, criarSessionToken, senhaAdminCorreta } from '@/lib/admin-session'
import { registrarAuditoria } from '@/lib/auditoria'

// Limite simples de tentativas por processo — não é à prova de restart nem
// de múltiplas instâncias, mas já dificulta força bruta contra a única
// senha do painel. (Mesma limitação, documentada, do rate-limit do login do
// Ecdise: em produção com múltiplas instâncias precisaria de um store
// compartilhado, ex: Redis.)
const tentativas = new Map<string, { count: number; resetAt: number }>()
const JANELA_MS = 15 * 60 * 1000
const LIMITE_TENTATIVAS = 10

function chaveTentativa(): string {
  // Sem IP real disponível aqui de forma confiável (Server Action, não
  // request), então o limite é global ao processo — ainda assim útil.
  return 'admin-login'
}

function bloqueado(): boolean {
  const registro = tentativas.get(chaveTentativa())
  if (!registro) return false
  if (Date.now() > registro.resetAt) {
    tentativas.delete(chaveTentativa())
    return false
  }
  return registro.count >= LIMITE_TENTATIVAS
}

function registrarTentativaFalha() {
  const chave = chaveTentativa()
  const registro = tentativas.get(chave)
  if (!registro || Date.now() > registro.resetAt) {
    tentativas.set(chave, { count: 1, resetAt: Date.now() + JANELA_MS })
  } else {
    registro.count += 1
  }
}

function limparTentativas() {
  tentativas.delete(chaveTentativa())
}

export async function login(formData: FormData) {
  const senha = formData.get('senha')

  if (bloqueado()) {
    await registrarAuditoria({
      acao: 'ADMIN_LOGIN_BLOQUEADO',
      sucesso: false,
      detalhes: 'Muitas tentativas seguidas — aguarde alguns minutos.',
    })
    throw new Error('Muitas tentativas de login seguidas. Aguarde alguns minutos e tente de novo.')
  }

  if (typeof senha !== 'string' || senha === '') {
    throw new Error('Senha é obrigatória.')
  }

  const correta = await senhaAdminCorreta(senha)
  if (!correta) {
    registrarTentativaFalha()
    await registrarAuditoria({ acao: 'ADMIN_LOGIN_FALHOU', sucesso: false })
    throw new Error('Senha incorreta.')
  }

  limparTentativas()

  const token = await criarSessionToken()
  cookies().set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  await registrarAuditoria({ acao: 'ADMIN_LOGIN_OK' })

  redirect('/comercial')
}

export async function logout() {
  cookies().delete(ADMIN_SESSION_COOKIE)
  await registrarAuditoria({ acao: 'ADMIN_LOGOUT' })
  redirect('/login')
}
