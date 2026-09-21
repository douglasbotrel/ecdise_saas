import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { STATUS_LABELS, STATUS_ORDEM, TIPO_CONTRATO_LABELS, formatCentavos } from '@/lib/format'
import { MODULOS_CATALOGO } from '@/lib/modulos'
import { atualizarEmpresa, atualizarModulosForm, criarAcesso } from '../actions'

export const dynamic = 'force-dynamic'

export default async function EditarEmpresaPage({ params }: { params: { id: string } }) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: params.id },
    include: { modulosContratados: true, acessos: { orderBy: { criadoEm: 'desc' } } },
  })
  if (!empresa) notFound()

  const modulosAtivos = new Set(empresa.modulosContratados.filter((m) => m.ativo).map((m) => m.modulo))
  const atualizarComId = atualizarEmpresa.bind(null, empresa.id)
  const atualizarModulosComId = atualizarModulosForm.bind(null, empresa.id)
  const criarAcessoComId = criarAcesso.bind(null, empresa.id)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{empresa.nomeEmpresa}</h1>
        <p className="text-sm text-neutral-500">
          {STATUS_LABELS[empresa.status]}
          {empresa.tipoContrato ? ` · ${TIPO_CONTRATO_LABELS[empresa.tipoContrato]}` : ''}
        </p>
      </div>

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
        <h2 className="mb-1 text-sm font-semibold text-neutral-700">Acessos (roteamento de login)</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Cada e-mail cadastrado aqui é o que o sistema usa para saber, no login, a qual empresa (e banco) aquele usuário pertence.
          A senha em si é criada depois, direto no banco desta empresa.
        </p>
        <ul className="mb-4 space-y-1 text-sm">
          {empresa.acessos.length === 0 && <li className="text-neutral-400">Nenhum acesso cadastrado ainda.</li>}
          {empresa.acessos.map((acesso) => (
            <li key={acesso.id} className="flex items-center justify-between rounded border border-neutral-100 px-3 py-2">
              <span>{acesso.nome ? `${acesso.nome} — ` : ''}{acesso.email}</span>
              <span className={acesso.ativo ? 'text-brand-600' : 'text-neutral-400'}>
                {acesso.ativo ? 'ativo' : 'inativo'}
              </span>
            </li>
          ))}
        </ul>
        <form action={criarAcessoComId} className="flex flex-wrap items-end gap-3">
          <Campo label="Nome">
            <input name="nome" className="input" />
          </Campo>
          <Campo label="E-mail *">
            <input name="email" type="email" required className="input" />
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
