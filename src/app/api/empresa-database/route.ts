// Endpoint interno consultado pelo Ecdise a cada requisição autenticada
// (não só no login), pra redescobrir o banco de uma empresa a partir do
// empresaId guardado no JWT. Complementa /api/login-roteamento (que resolve
// por e-mail, só usado no momento do login).
//
// Mesma proteção por segredo compartilhado (CONTROL_PLANE_INTERNAL_SECRET).
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'

export async function POST(request: NextRequest) {
  const segredoEsperado = process.env.CONTROL_PLANE_INTERNAL_SECRET
  if (!segredoEsperado) {
    return NextResponse.json({ error: 'CONTROL_PLANE_INTERNAL_SECRET não configurado.' }, { status: 500 })
  }
  const segredoRecebido = request.headers.get('x-internal-secret')
  if (segredoRecebido !== segredoEsperado) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const empresaId = typeof body?.empresaId === 'string' ? body.empresaId : null
  if (!empresaId) {
    return NextResponse.json({ error: 'empresaId é obrigatório.' }, { status: 400 })
  }

  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } })
  if (!empresa) {
    return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })
  }
  if (!empresa.databaseUrlCriptografada) {
    return NextResponse.json({ error: 'Empresa sem banco de dados configurado.' }, { status: 409 })
  }

  let databaseUrl: string
  try {
    databaseUrl = decrypt(empresa.databaseUrlCriptografada)
  } catch {
    return NextResponse.json({ error: 'Falha ao descriptografar a connection string.' }, { status: 500 })
  }

  return NextResponse.json({ databaseUrl, nomeEmpresa: empresa.nomeEmpresa })
}
