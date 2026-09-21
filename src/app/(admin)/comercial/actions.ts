'use server'

import { prisma } from '@/lib/prisma'
import { parseValorParaCentavos } from '@/lib/format'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { registrarAuditoria } from '@/lib/auditoria'
import { redirectComErro, isNextRedirectError } from '@/lib/redirect-erro'

function campoTexto(formData: FormData, nome: string): string | null {
  const valor = formData.get(nome)
  if (typeof valor !== 'string') return null
  const limpo = valor.trim()
  return limpo === '' ? null : limpo
}

function mensagemDeErro(err: unknown): string {
  return err instanceof Error ? err.message : 'Erro inesperado. Tenta de novo — se continuar, me avisa.'
}

export async function criarEmpresa(formData: FormData) {
  try {
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

    await registrarAuditoria({ acao: 'EMPRESA_CRIADA', empresaId: empresa.id, detalhes: `"${empresa.nomeEmpresa}"` })

    revalidatePath('/comercial')
    redirect(`/comercial/${empresa.id}`)
  } catch (err) {
    if (isNextRedirectError(err)) throw err
    console.error('[criarEmpresa] falha:', err)
    redirectComErro('/comercial/nova', mensagemDeErro(err))
  }
}

export async function atualizarEmpresa(id: string, formData: FormData) {
  try {
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

    await registrarAuditoria({ acao: 'EMPRESA_ATUALIZADA', empresaId: id })

    revalidatePath('/comercial')
    revalidatePath(`/comercial/${id}`)
    redirect(`/comercial/${id}?salvo=1`)
  } catch (err) {
    if (isNextRedirectError(err)) throw err
    console.error('[atualizarEmpresa] falha:', err)
    redirectComErro(`/comercial/${id}`, mensagemDeErro(err))
  }
}

export async function atualizarModulos(id: string, modulosMarcados: string[]) {
  await prisma.$transaction([
    prisma.moduloContratado.deleteMany({ where: { empresaId: id } }),
    prisma.moduloContratado.createMany({
      data: modulosMarcados.map((modulo) => ({ empresaId: id, modulo: modulo as any })),
    }),
  ])

  await registrarAuditoria({
    acao: 'MODULOS_ATUALIZADOS',
    empresaId: id,
    detalhes: modulosMarcados.join(', ') || '(nenhum módulo ativo)',
  })

  revalidatePath(`/comercial/${id}`)
}

export async function criarAcesso(empresaId: string, formData: FormData) {
  try {
    const emailDigitado = campoTexto(formData, 'email')
    const nome = campoTexto(formData, 'nome')
    const senha = campoTexto(formData, 'senha')
    if (!emailDigitado) throw new Error('E-mail é obrigatório.')
    if (!senha) throw new Error('Senha é obrigatória — é ela que o cliente vai usar pra entrar.')
    if (senha.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.')

    // Normaliza pra minúsculo aqui — o login (e o roteamento) sempre comparam
    // e-mail em minúsculo, então um cadastro com maiúsculas nunca bateria.
    const email = emailDigitado.toLowerCase()

    const jaExiste = await prisma.acessoRoteamento.findUnique({ where: { email } })
    if (jaExiste && jaExiste.empresaId !== empresaId) {
      throw new Error(
        `O e-mail "${email}" já está cadastrado como acesso de outra empresa. Cada e-mail só pode apontar pra uma empresa.`
      )
    }

    // 1) Cria/reseta o usuário DE VERDADE (com senha) no banco daquele tenant.
    //    O AcessoRoteamento abaixo é só o roteamento — sem isso aqui, o e-mail
    //    cadastrado nunca conseguiria logar (não existiria como Usuario em
    //    banco nenhum).
    await provisionarUsuarioNoTenant({ empresaId, nome, email, senha })

    // 2) Cria o roteamento (email -> empresa) que o login do Ecdise consulta.
    await prisma.acessoRoteamento.upsert({
      where: { email },
      update: { empresaId, nome },
      create: { empresaId, email, nome },
    })

    await registrarAuditoria({ acao: 'ACESSO_CRIADO', empresaId, detalhes: email })

    revalidatePath(`/comercial/${empresaId}`)
    redirect(`/comercial/${empresaId}?acessoCriado=1`)
  } catch (err) {
    if (isNextRedirectError(err)) throw err
    console.error('[criarAcesso] falha:', err)
    await registrarAuditoria({ acao: 'ACESSO_CRIADO_FALHOU', sucesso: false, empresaId, detalhes: mensagemDeErro(err) })
    redirectComErro(`/comercial/${empresaId}`, mensagemDeErro(err))
  }
}

async function provisionarUsuarioNoTenant(params: {
  empresaId: string
  nome: string | null
  email: string
  senha: string
}) {
  const url = process.env.ECDISE_APP_URL
  const secret = process.env.CONTROL_PLANE_INTERNAL_SECRET
  if (!url || !secret) {
    throw new Error('ECDISE_APP_URL e/ou CONTROL_PLANE_INTERNAL_SECRET não configurados nas variáveis de ambiente.')
  }

  let res: Response
  try {
    res = await fetch(`${url.replace(/\/$/, '')}/api/admin/provisionar-usuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
      body: JSON.stringify({
        empresaId: params.empresaId,
        nome: params.nome || params.email,
        email: params.email,
        senha: params.senha,
      }),
      cache: 'no-store',
    })
  } catch (err) {
    throw new Error(`Não consegui chamar o Ecdise (${url}) pra criar o usuário: ${err}`)
  }

  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.ok) {
    // Cobre inclusive o caso do Ecdise redirecionar a chamada (ex: pra tela
    // de login, se a rota não estiver liberada no middleware dele) — nesse
    // caso o fetch segue o redirect e devolve 200 de uma página HTML, não
    // do JSON esperado, então checar só res.ok não bastava.
    throw new Error(data?.error || `O Ecdise não confirmou a criação do usuário (HTTP ${res.status}).`)
  }
}

export async function removerAcesso(empresaId: string, acessoId: string) {
  try {
    const acesso = await prisma.acessoRoteamento.findUnique({ where: { id: acessoId } })
    await prisma.acessoRoteamento.delete({ where: { id: acessoId } })

    await registrarAuditoria({ acao: 'ACESSO_REMOVIDO', empresaId, detalhes: acesso?.email ?? acessoId })

    revalidatePath(`/comercial/${empresaId}`)
  } catch (err) {
    console.error('[removerAcesso] falha:', err)
    redirectComErro(`/comercial/${empresaId}`, mensagemDeErro(err))
  }
}

export async function atualizarModulosForm(id: string, formData: FormData) {
  try {
    const modulosMarcados = formData.getAll('modulos').map(String)
    await atualizarModulos(id, modulosMarcados)
    redirect(`/comercial/${id}?modulosSalvos=1`)
  } catch (err) {
    if (isNextRedirectError(err)) throw err
    console.error('[atualizarModulosForm] falha:', err)
    redirectComErro(`/comercial/${id}`, mensagemDeErro(err))
  }
}

// Aceita só postgres://... ou postgresql://..., checagem simples de formato
// pra pegar erro de cópia/cola antes de salvar algo que só ia quebrar na
// hora do cliente tentar logar.
function validarConnectionString(url: string) {
  if (!/^postgres(ql)?:\/\/.+/.test(url.trim())) {
    throw new Error('Isso não parece uma connection string do Postgres válida (precisa começar com "postgresql://").')
  }
}

export async function atualizarDatabaseUrl(id: string, formData: FormData) {
  try {
    const { encrypt } = await import('@/lib/crypto')
    const novaUrl = campoTexto(formData, 'databaseUrl')
    if (!novaUrl) throw new Error('Connection string é obrigatória.')
    validarConnectionString(novaUrl)

    await prisma.empresa.update({
      where: { id },
      data: { databaseUrlCriptografada: encrypt(novaUrl) },
    })

    await registrarAuditoria({
      acao: 'DATABASE_URL_ATUALIZADA',
      empresaId: id,
      detalhes: 'connection string trocada (valor não fica no log, só a ação)',
    })

    revalidatePath(`/comercial/${id}`)
    redirect(`/comercial/${id}?bancoSalvo=1`)
  } catch (err) {
    if (isNextRedirectError(err)) throw err
    console.error('[atualizarDatabaseUrl] falha:', err)
    redirectComErro(`/comercial/${id}`, mensagemDeErro(err))
  }
}

export async function excluirEmpresa(id: string, formData: FormData) {
  const caminhoConfirmar = `/comercial/${id}/excluir`
  try {
    const empresa = await prisma.empresa.findUnique({ where: { id } })
    if (!empresa) throw new Error('Empresa não encontrada.')

    const confirmacao = campoTexto(formData, 'confirmacao')
    if (confirmacao !== empresa.nomeEmpresa) {
      throw new Error('O nome digitado não bate com o nome da empresa. Digite exatamente igual pra confirmar a exclusão.')
    }

    // Cascade no schema já apaga ModuloContratado e AcessoRoteamento junto.
    // O banco Neon do cliente NÃO é apagado (fica fora do controle deste
    // sistema) — nem o Usuario real que existe no banco do tenant. Só some
    // o registro comercial e o roteamento de login daqui pra frente.
    await prisma.empresa.delete({ where: { id } })

    await registrarAuditoria({
      acao: 'EMPRESA_EXCLUIDA',
      empresaId: id,
      detalhes: `"${empresa.nomeEmpresa}" — banco Neon e usuário do tenant NÃO foram apagados, só o registro comercial.`,
    })

    revalidatePath('/comercial')
    redirect('/comercial?empresaExcluida=1')
  } catch (err) {
    if (isNextRedirectError(err)) throw err
    console.error('[excluirEmpresa] falha:', err)
    redirectComErro(caminhoConfirmar, mensagemDeErro(err))
  }
}
