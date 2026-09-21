import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { STATUS_LABELS, STATUS_ORDEM, TIPO_CONTRATO_LABELS, formatCentavos } from '@/lib/format'
import { MODULOS_CATALOGO } from '@/lib/modulos'
import { atualizarEmpresa, atualizarModulosForm, criarAcesso, removerAcesso, atualizarDatabaseUrl } from '../actions'
import { usarBancoNaEmpresa } from '../../bancos/actions'

export const dynamic = 'force-dynamic'

export default async function EditarEmpresaPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { modulosSalvos?: string; acessoCriado?: string; salvo?: string; bancoSalvo?: string; erro?: string }
}) {
  const [empresa, bancosDisponiveis] = await Promise.all([
    prisma.empresa.findUnique({
      where: { id: params.id },
      include: { modulosContratados: true, acessos: { orderBy: { criadoEm: 'desc' } } },
    }),
    prisma.bancoDisponivel.findMany({ orderBy: { criadoEm: 'desc' } }),
  ])
  if (!empresa) notFound()

  const modulosAtivos = new Set(empresa.modulosContratados.filter((m) => m.ativo).map((m) => m.modulo))
  const atualizarComId = atualizarEmpresa.bind(null, empresa.id)
  const atualizarModulosComId = atualizarModulosForm.bind(null, empresa.id)
  const criarAcessoComId = criarAcesso.bind(null, empresa.id)
  const atualizarDatabaseUrlComId = atualizarDatabaseUrl.bind(null, empresa.id)
  const usarBancoComId = usarBancoNaEmpresa.bind(null, empresa.id)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{empresa.nomeEmpresa}</h1>
          <p className="text-sm text-neutral-500">
            {STATUS_LABELS[empresa.status]}
            {empresa.tipoContrato ? ` · ${TIPO_CONTRATO_LABELS[empresa.tipoContrato]}` : ''}
          </p>
        </div>
        <a href={`/comercial/${empresa.id}/excluir`} className="text-xs font-medium text-red-600 hover:text-red-800">
          Excluir empresa
        </a>
      </div>

      {searchParams.erro && <Erro>{searchParams.erro}</Erro>}
      {searchParams.salvo && <Aviso>Dados salvos com sucesso.</Aviso>}
      {searchParams.modulosSalvos && <Aviso>Módulos salvos com sucesso.</Aviso>}
      {searchParams.acessoCriado && (
        <Aviso>Acesso criado — o usuário já pode logar no Ecdise com o e-mail e a senha cadastrados.</Aviso>
      )}
      {searchParams.bancoSalvo && <Aviso>Banco de dados desta empresa atualizado.</Aviso>}

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-700">Dados comerciais</h2>
        <form action={atualizarComId} className="space-y-4">
          <Campo label="Nome da empresa *">
            <input name="nomeEmpresa" defaultValue={empresa.nomeEmpresa} required className="input" />
          </Campo>
          <Campo label="CNPJ">
            <input name="cnpj" defaultValue={empresa.cnpj ?? ''} className="input" />
          </Campo>
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Responsável pelo contato *">
              <input name="responsavelNome" defaultValue={empresa.responsavelNome} required className="input" />
            </Campo>
            <Campo label="E-mail do responsável *">
              <input name="responsavelEmail" type="email" defaultValue={empresa.responsavelEmail} required className="input" />
            </Campo>
          </div>
          <Campo label="Telefone do responsável">
            <input name="responsavelTelefone" defaultValue={empresa.responsavelTelefone ?? ''} className="input" />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Status">
              <select name="status" defaultValue={empresa.status} className="input">
                {STATUS_ORDEM.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Tipo de contrato">
              <select name="tipoContrato" defaultValue={empresa.tipoContrato ?? ''} className="input">
                <option value="">— a definir —</option>
                {Object.entries(TIPO_CONTRATO_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo label="Data de fechamento do contrato">
            <input
              name="dataFechamentoContrato"
              type="date"
              defaultValue={empresa.dataFechamentoContrato?.toISOString().slice(0, 10) ?? ''}
              className="input"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label={`Valor fechado (R$) — atual: ${formatCentavos(empresa.valorFechadoCentavos)}`}>
              <input name="valorFechado" placeholder="0,00" className="input" />
            </Campo>
            <Campo label={`Valor de instalação (R$) — atual: ${formatCentavos(empresa.valorInstalacaoCentavos)}`}>
              <input name="valorInstalacao" placeholder="0,00" className="input" />
            </Campo>
            <Campo label={`Valor mensal (R$) — atual: ${formatCentavos(empresa.valorMensalCentavos)}`}>
              <input name="valorMensal" placeholder="0,00" className="input" />
            </Campo>
            <Campo label={`Valor de customização (R$) — atual: ${formatCentavos(empresa.valorCustomizacaoCentavos)}`}>
              <input name="valorCustomizacao" placeholder="0,00" className="input" />
            </Campo>
            <Campo label={`Valor de compra / licença (R$) — atual: ${formatCentavos(empresa.valorCompraCentavos)}`}>
              <input name="valorCompra" placeholder="0,00" className="input" />
            </Campo>
          </div>

          <Campo label="Observações">
            <textarea name="observacoesComerciais" rows={3} defaultValue={empresa.observacoesComerciais ?? ''} className="input" />
          </Campo>

          <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Salvar alterações
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-neutral-700">Módulos contratados (à la carte)</h2>
        <p className="mb-4 text-xs text-neutral-500">Marque só os módulos que essa empresa contratou.</p>
        <form action={atualizarModulosComId} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MODULOS_CATALOGO.map((modulo) => (
              <label key={modulo.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="modulos"
                  value={modulo.key}
                  defaultChecked={modulosAtivos.has(modulo.key as any)}
                  className="rounded border-neutral-300"
                />
                {modulo.label}
              </label>
            ))}
          </div>
          <button type="submit" className="rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900">
            Salvar módulos
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-neutral-700">Banco de dados desta empresa</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Connection string do banco Neon exclusivo desse cliente (criada seguindo o playbook de provisionamento).
          Fica guardada criptografada — é o que o login multi-tenant do Ecdise vai consultar pra saber em qual banco entrar.
        </p>
        <p className="mb-4 text-sm">
          Status:{' '}
          {empresa.databaseUrlCriptografada ? (
            <span className="font-medium text-brand-600">configurado</span>
          ) : (
            <span className="font-medium text-amber-600">ainda não configurado</span>
          )}
        </p>

        {bancosDisponiveis.length > 0 && (
          <form action={usarBancoComId} className="mb-4 flex flex-wrap items-end gap-3 rounded-md border border-neutral-100 bg-neutral-50 p-3">
            <Campo label="Ou use um banco já disponível no pool">
              <select name="bancoId" required className="input w-72">
                <option value="">— selecione —</option>
                {bancosDisponiveis.map((b) => (
                  <option key={b.id} value={b.id}>{b.apelido}</option>
                ))}
              </select>
            </Campo>
            <button type="submit" className="rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900">
              Usar este banco
            </button>
            <span className="text-xs text-neutral-500">
              (tira do pool e substitui o banco atual desta empresa, se já houver um configurado)
            </span>
          </form>
        )}

        <form action={atualizarDatabaseUrlComId} className="flex flex-wrap items-end gap-3">
          <Campo label="Ou cole a connection string diretamente (postgresql://...)">
            <input name="databaseUrl" placeholder="postgresql://usuario:senha@host/banco?sslmode=require" className="input w-96" />
          </Campo>
          <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Salvar (criptografado)
          </button>
        </form>
      </section>
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-neutral-700">Acessos (roteamento de login)</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Cada acesso cadastrado aqui cria o usuário de verdade (com a senha que você definir) dentro do banco desta
          empresa, e o e-mail é o que o sistema usa pra saber, no login, a qual empresa (e banco) ele pertence.
        </p>
        <ul className="mb-4 space-y-1 text-sm">
          {empresa.acessos.length === 0 && <li className="text-neutral-400">Nenhum acesso cadastrado ainda.</li>}
          {empresa.acessos.map((acesso) => {
            const removerAcessoComId = removerAcesso.bind(null, empresa.id, acesso.id)
            return (
              <li key={acesso.id} className="flex items-center justify-between rounded border border-neutral-100 px-3 py-2">
                <span>{acesso.nome ? `${acesso.nome} — ` : ''}{acesso.email}</span>
                <div className="flex items-center gap-3">
                  <span className={acesso.ativo ? 'text-brand-600' : 'text-neutral-400'}>
                    {acesso.ativo ? 'ativo' : 'inativo'}
                  </span>
                  <form action={removerAcessoComId}>
                    <button type="submit" className="text-xs font-medium text-red-600 hover:text-red-800">
                      Remover
                    </button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
        <form action={criarAcessoComId} className="flex flex-wrap items-end gap-3">
          <Campo label="Nome">
            <input name="nome" className="input" />
          </Campo>
          <Campo label="E-mail *">
            <input name="email" type="email" required className="input" />
          </Campo>
          <Campo label="Senha * (mín. 8 caracteres)">
            <input name="senha" type="text" required minLength={8} className="input" />
          </Campo>
          <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            + Adicionar acesso
          </button>
        </form>
      </section>

    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  )
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm text-brand-700">
      {children}
    </div>
  )
}

function Erro({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
      {children}
    </div>
  )
}
