'use server'

import { prisma } from '@/lib/prisma'
import { parseValorParaCentavos } from '@/lib/format'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function campoTexto(formData: FormData, nome: string): string | null {
  const valor = formData.get(nome)
  if (typeof valor !== 'string') return null
  const limpo = valor.trim()
  return limpo === '' ? null : limpo
}

export async function criarEmpresa(formData: FormData) {
  const nomeEmpresa = campoTexto(formData, 'nomeEmpresa')
  const responsavelNome = campoTexto(formData, 'responsavelNome')
  const responsavelEmail = campoTexto(formData, 'responsavelEmail')

  if (!nomeEmpresa || !responsavelNome || !responsavelEmail) {
    throw new Error('Nome da empresa, responsável e e-mail são obrigatórios.')
  }

  const empresa = await prisma.empresa.create({
    data: {
      nomeEmpresa,
      cnpj: campoTexto(formData, 'cnpj'),
      responsavelNome,
      responsavelEmail,
      responsavelTelefone: campoTexto(formData, 'responsavelTelefone'),
      status: (campoTexto(formData, 'status') as any) ?? 'LEAD',
      tipoContrato: campoTexto(formData, 'tipoContrato') as any,
      dataFechamentoContrato: campoTexto(formData, 'dataFechamentoContrato')
        ? new Date(campoTexto(formData, 'dataFechamentoContrato')!)
        : null,
      valorFechadoCentavos: parseValorParaCentavos(campoTexto(formData, 'valorFechado')),
      valorInstalacaoCentavos: parseValorParaCentavos(campoTexto(formData, 'valorInstalacao')),
      valorMensalCentavos: parseValorParaCentavos(campoTexto(formData, 'valorMensal')),
      valorCustomizacaoCentavos: parseValorParaCentavos(campoTexto(formData, 'valorCustomizacao')),
      valorCompraCentavos: parseValorParaCentavos(campoTexto(formData, 'valorCompra')),
      observacoesComerciais: campoTexto(formData, 'observacoesComerciais'),
    },
  })

  revalidatePath('/comercial')
  redirect(`/comercial/${empresa.id}`)
}

export async function atualizarEmpresa(id: string, formData: FormData) {
  const nomeEmpresa = campoTexto(formData, 'nomeEmpresa')
  const responsavelNome = campoTexto(formData, 'responsavelNome')
  const responsavelEmail = campoTexto(formData, 'responsavelEmail')

  if (!nomeEmpresa || !responsavelNome || !responsavelEmail) {
    throw new Error('Nome da empresa, responsável e e-mail são obrigatórios.')
  }

  await prisma.empresa.update({
    where: { id },
    data: {
      nomeEmpresa,
      cnpj: campoTexto(formData, 'cnpj'),
      responsavelNome,
      responsavelEmail,
      responsavelTelefone: campoTexto(formData, 'responsavelTelefone'),
      status: campoTexto(formData, 'status') as any,
      tipoContrato: campoTexto(formData, 'tipoContrato') as any,
      dataFechamentoContrato: campoTexto(formData, 'dataFechamentoContrato')
        ? new Date(campoTexto(formData, 'dataFechamentoContrato')!)
        : null,
      valorFechadoCentavos: parseValorParaCentavos(campoTexto(formData, 'valorFechado')),
      valorInstalacaoCentavos: parseValorParaCentavos(campoTexto(formData, 'valorInstalacao')),
      valorMensalCentavos: parseValorParaCentavos(campoTexto(formData, 'valorMensal')),
      valorCustomizacaoCentavos: parseValorParaCentavos(campoTexto(formData, 'valorCustomizacao')),
      valorCompraCentavos: parseValorParaCentavos(campoTexto(formData, 'valorCompra')),
      observacoesComerciais: campoTexto(formData, 'observacoesComerciais'),
    },
  })

  revalidatePath('/comercial')
  revalidatePath(`/comercial/${id}`)
}

export async function atualizarModulos(id: string, modulosMarcados: string[]) {
  await prisma.$transaction([
    prisma.moduloContratado.deleteMany({ where: { empresaId: id } }),
    prisma.moduloContratado.createMany({
      data: modulosMarcados.map((modulo) => ({ empresaId: id, modulo: modulo as any })),
    }),
  ])
  revalidatePath(`/comercial/${id}`)
}

export async function criarAcesso(empresaId: string, formData: FormData) {
  const email = campoTexto(formData, 'email')
  if (!email) throw new Error('E-mail é obrigatório.')

  await prisma.acessoRoteamento.create({
    data: {
      empresaId,
      email,
      nome: campoTexto(formData, 'nome'),
    },
  })
  revalidatePath(`/comercial/${empresaId}`)
}

export async function atualizarModulosForm(id: string, formData: FormData) {
  const modulosMarcados = formData.getAll('modulos').map(String)
  await atualizarModulos(id, modulosMarcados)
}

export async function atualizarDatabaseUrl(id: string, formData: FormData) {
  const { encrypt } = await import('@/lib/crypto')
  const novaUrl = campoTexto(formData, 'databaseUrl')
  if (!novaUrl) throw new Error('Connection string é obrigatória.')

  await prisma.empresa.update({
    where: { id },
    data: { databaseUrlCriptografada: encrypt(novaUrl) },
  })
  revalidatePath(`/comercial/${id}`)
}
