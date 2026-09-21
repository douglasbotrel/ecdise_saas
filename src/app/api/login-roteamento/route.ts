// Endpoint interno consultado pelo Ecdise (produto) no momento do login,
// quando ele estiver rodando em modo multi-tenant (MULTI_TENANT_MODE=true).
// Recebe um e-mail, devolve qual empresa é e a connection string real do
// banco dela (descriptografada só nessa resposta, nunca fica em texto puro
// no banco central).
//
// Protegido por um segredo compartilhado (CONTROL_PLANE_INTERNAL_SECRET) —
// o Ecdise precisa enviar o mesmo valor no header "x-internal-secret".
// Nunca expor esse endpoint sem essa checagem: ele devolve credencial de banco.
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
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : null
  if (!email) {
    return NextResponse.json({ error: 'email é obrigatório.' }, { status: 400 })
  }

  const acesso = await prisma.acessoRoteamento.findUnique({
    where: { email },
    include: { empresa: true },
  })

  if (!acesso || !acesso.ativo || !acesso.empresa) {
    return NextResponse.json({ error: 'Acesso não encontrado ou inativo.' }, { status: 404 })
  }

  if (!acesso.empresa.databaseUrlCriptografada) {
    return NextResponse.json(
      { error: `Empresa "${acesso.empresa.nomeEmpresa}" ainda não tem banco de dados configurado.` },
      { status: 409 }
    )
  }

  let databaseUrl: string
  try {
    databaseUrl = decrypt(acesso.empresa.databaseUrlCriptografada)
  } catch {
    return NextResponse.json({ error: 'Falha ao descriptografar a connection string da empresa.' }, { status: 500 })
  }

  return NextResponse.json({
    empresaId: acesso.empresa.id,
    nomeEmpresa: acesso.empresa.nomeEmpresa,
    databaseUrl,
  })
}
