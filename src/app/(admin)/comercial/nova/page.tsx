import { criarEmpresa } from '../actions'
import { STATUS_LABELS, STATUS_ORDEM, TIPO_CONTRATO_LABELS } from '@/lib/format'

export default function NovaEmpresaPage({
  searchParams,
}: {
  searchParams: { erro?: string }
}) {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Nova empresa</h1>
      {searchParams.erro && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {searchParams.erro}
        </div>
      )}
      <form action={criarEmpresa} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
        <Campo label="Nome da empresa *">
          <input name="nomeEmpresa" required className="input" />
        </Campo>
        <Campo label="CNPJ">
          <input name="cnpj" className="input" />
        </Campo>
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Responsável pelo contato *">
            <input name="responsavelNome" required className="input" />
          </Campo>
          <Campo label="E-mail do responsável *">
            <input name="responsavelEmail" type="email" required className="input" />
          </Campo>
        </div>
        <Campo label="Telefone do responsável">
          <input name="responsavelTelefone" className="input" />
        </Campo>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Status">
            <select name="status" defaultValue="LEAD" className="input">
              {STATUS_ORDEM.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Tipo de contrato">
            <select name="tipoContrato" defaultValue="" className="input">
              <option value="">— a definir —</option>
              {Object.entries(TIPO_CONTRATO_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo label="Data de fechamento do contrato">
          <input name="dataFechamentoContrato" type="date" className="input" />
        </Campo>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Valor fechado (R$)">
            <input name="valorFechado" placeholder="0,00" className="input" />
          </Campo>
          <Campo label="Valor de instalação (R$)">
            <input name="valorInstalacao" placeholder="0,00" className="input" />
          </Campo>
          <Campo label="Valor mensal (R$)">
            <input name="valorMensal" placeholder="0,00" className="input" />
          </Campo>
          <Campo label="Valor de customização (R$)">
            <input name="valorCustomizacao" placeholder="0,00" className="input" />
          </Campo>
          <Campo label="Valor de compra / licença (R$)">
            <input name="valorCompra" placeholder="0,00" className="input" />
          </Campo>
        </div>

        <Campo label="Observações">
          <textarea name="observacoesComerciais" rows={3} className="input" />
        </Campo>

        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Salvar empresa
        </button>
      </form>
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
