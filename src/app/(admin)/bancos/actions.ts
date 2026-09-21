'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { registrarAuditoria } from '@/lib/auditoria'
import { redirectComErro, isNextRedirectError } from '@/lib/redirect-erro'
import { encrypt, decrypt } from '@/lib/crypto'
import { limparDadosDoBanco } from '@/lib/limpar-banco'

function campoTexto(formData: FormData, nome: string): string | null {
  const valor = formData.get(nome)
  if (typeof valor !== 'string') return null
  const limpo = valor.trim()
  return limpo === '' ? null : limpo
}

function mensagemDeErro(err: unknown): string {
  return err instanceof Error ? err.message : 'Erro inesperado. Tenta de novo — se continuar, me avisa.'
}

function validarConnectionString(url: string) {
  if (!/^postgres(ql)?:\/\/.+/.test(url.trim())) {
    throw new Error('Isso não parece uma connection string do Postgres válida (precisa começar com "postgresql://").')
  }
}

export async function criarBancoDisponivel(formData: FormData) {
  try {
    const apelido = campoTexto(formData, 'apelido')
    const databaseUrl = campoTexto(formData, 'databaseUrl')
    if (!apelido) throw new Error('Apelido é obrigatório — é só pra você reconhecer esse banco depois.')
    if (!databaseUrl) throw new Error('Connection string é obrigatória.')
    validarConnectionString(databaseUrl)

    await prisma.bancoDisponivel.create({
      data: { apelido, databaseUrlCriptografada: encrypt(databaseUrl) },
    })

    await registrarAuditoria({ acao: 'BANCO_DISPONIVEL_CRIADO', detalhes: apelido })

    revalidatePath('/bancos')
    redirect('/bancos?criado=1')
  } catch (err) {
    if (isNextRedirectError(err)) throw err
    console.error('[criarBancoDisponivel] falha:', err)
    redirectComErro('/bancos', mensagemDeErro(err))
  }
}

export async function removerBancoDisponivel(id: string) {
  try {
    const banco = await prisma.bancoDisponivel.findUnique({ where: { id } })
    await prisma.bancoDisponivel.delete({ where: { id } })

    await registrarAuditoria({ acao: 'BANCO_DISPONIVEL_REMOVIDO', detalhes: banco?.apelido ?? id })

    revalidatePath('/bancos')
  } catch (err) {
    console.error('[removerBancoDisponivel] falha:', err)
    redirectComErro('/bancos', mensagemDeErro(err))
  }
}

// Atribui um banco do pool a uma empresa: copia a connection string
// criptografada direto (mesma chave de criptografia do sistema inteiro, não
// precisa descriptografar/recriptografar) e tira o banco do pool, já que
// agora está "em uso".
export async function usarBancoNaEmpresa(empresaId: string, formData: FormData) {
  try {
    const bancoId = campoTexto(formData, 'bancoId')
    if (!bancoId) throw new Error('Selecione um banco da lista.')

    const banco = await prisma.bancoDisponivel.findUnique({ where: { id: bancoId } })
    if (!banco) throw new Error('Esse banco não está mais disponível (talvez já tenha sido usado por outra aba).')

    await prisma.$transaction([
      prisma.empresa.update({
        where: { id: empresaId },
        data: { databaseUrlCriptografada: banco.databaseUrlCriptografada },
      }),
      prisma.bancoDisponivel.delete({ where: { id: bancoId } }),
    ])

    await registrarAuditoria({
      acao: 'BANCO_DISPONIVEL_ATRIBUIDO',
      empresaId,
      detalhes: `usou o banco "${banco.apelido}" do pool`,
    })

    revalidatePath(`/comercial/${empresaId}`)
    revalidatePath('/bancos')
    redirect(`/comercial/${empresaId}?bancoSalvo=1`)
  } catch (err) {
    if (isNextRedirectError(err)) throw err
    console.error('[usarBancoNaEmpresa] falha:', err)
    redirectComErro(`/comercial/${empresaId}`, mensagemDeErro(err))
  }
}

// Apaga todos os dados de dentro do banco (mantém no pool, só fica vazio).
// Exige digitar o apelido de novo pra confirmar — é irreversível.
export async function limparBancoDisponivel(id: string, formData: FormData) {
  const caminhoConfirmar = `/bancos/${id}/limpar`
  try {
    const banco = await prisma.bancoDisponivel.findUnique({ where: { id } })
    if (!banco) throw new Error('Esse banco não existe mais no pool.')

    const confirmacao = campoTexto(formData, 'confirmacao')
    if (confirmacao !== banco.apelido) {
      throw new Error('O apelido digitado não bate. Digite exatamente igual pra confirmar a limpeza.')
    }

    const databaseUrl = decrypt(banco.databaseUrlCriptografada)
    const { tabelas } = await limparDadosDoBanco(databaseUrl)

    await registrarAuditoria({
      acao: 'BANCO_DISPONIVEL_LIMPO',
      detalhes: `"${banco.apelido}" — ${tabelas.length} tabela(s) esvaziada(s): ${tabelas.join(', ') || '(nenhuma tabela encontrada)'}`,
    })

    revalidatePath('/bancos')
    redirect(`/bancos?limpo=${encodeURIComponent(banco.apelido)}`)
  } catch (err) {
    if (isNextRedirectError(err)) throw err
    console.error('[limparBancoDisponivel] falha:', err)
    redirectComErro(caminhoConfirmar, mensagemDeErro(err))
  }
}
