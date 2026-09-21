// Trilha de auditoria: registra ações administrativas relevantes pra dar
// pra buscar "quem fez o quê, quando" depois de qualquer suspeita de uso
// indevido. Cada Server Action que muda dado (ou tenta e falha) chama isso.
//
// Nunca deixa uma falha de auditoria quebrar a ação principal: se o log
// falhar por algum motivo, só registra no console e segue o fluxo.
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function registrarAuditoria(params: {
  acao: string
  sucesso?: boolean
  empresaId?: string | null
  ator?: string | null
  detalhes?: string | null
}) {
  try {
    let ip: string | null = null
    try {
      const h = headers()
      // Primeiro IP de X-Forwarded-For é preenchível pelo cliente — serve só
      // como pista de auditoria (não pra decisão de segurança), então não
      // tem problema usar aqui como está.
      const forwarded = h.get('x-forwarded-for')
      ip = forwarded ? forwarded.split(',')[0].trim() : h.get('x-real-ip')
    } catch {
      // headers() pode não estar disponível fora de um request (ex: script) — ok ignorar.
    }

    await prisma.logAuditoria.create({
      data: {
        acao: params.acao,
        sucesso: params.sucesso ?? true,
        empresaId: params.empresaId ?? null,
        ator: params.ator ?? 'admin',
        detalhes: params.detalhes ?? null,
        ip,
      },
    })
  } catch (err) {
    console.error(`[auditoria] falha ao registrar log da ação "${params.acao}":`, err)
  }
}
