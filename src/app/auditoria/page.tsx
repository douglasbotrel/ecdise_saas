import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function badgeSucesso(sucesso: boolean) {
  return sucesso
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-red-50 text-red-700 border-red-200'
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: { acao?: string; empresaId?: string; busca?: string }
}) {
  const { acao, empresaId, busca } = searchParams

  const where: any = {}
  if (acao) where.acao = acao
  if (empresaId) where.empresaId = empresaId
  if (busca) {
    where.OR = [
      { detalhes: { contains: busca, mode: 'insensitive' } },
      { ator: { contains: busca, mode: 'insensitive' } },
      { ip: { contains: busca, mode: 'insensitive' } },
    ]
  }

  const [logs, acoesDisponiveis] = await Promise.all([
    prisma.logAuditoria.findMany({
      where,
      orderBy: { quando: 'desc' },
      take: 200,
    }),
    prisma.logAuditoria.findMany({
      distinct: ['acao'],
      select: { acao: true },
      orderBy: { acao: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Auditoria</h1>
        <p className="text-sm text-neutral-500">
          Trilha de ações administrativas — login, criação/edição de empresa, módulos, acessos e
          connection strings. Mostrando os {logs.length} registros mais recentes (máx. 200).
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-600">Ação</label>
          <select name="acao" defaultValue={acao ?? ''} className="input">
            <option value="">— todas —</option>
            {acoesDisponiveis.map((a: { acao: string }) => (
              <option key={a.acao} value={a.acao}>{a.acao}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-600">ID da empresa</label>
          <input name="empresaId" defaultValue={empresaId ?? ''} className="input" placeholder="empresaId" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-600">Busca (detalhes, ator, IP)</label>
          <input name="busca" defaultValue={busca ?? ''} className="input" placeholder="ex: outro@ecdise.com" />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
        >
          Filtrar
        </button>
        {(acao || empresaId || busca) && (
          <a href="/auditoria" className="text-sm text-neutral-500 hover:text-neutral-800">
            Limpar filtros
          </a>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Quando</th>
              <th className="px-3 py-2">Ação</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Empresa</th>
              <th className="px-3 py-2">Detalhes</th>
              <th className="px-3 py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-neutral-400">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {logs.map((log: (typeof logs)[number]) => (
              <tr key={log.id} className="border-b border-neutral-100 last:border-0">
                <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                  {log.quando.toLocaleString('pt-BR')}
                </td>
                <td className="px-3 py-2 font-medium text-neutral-800">{log.acao}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${badgeSucesso(log.sucesso)}`}>
                    {log.sucesso ? 'ok' : 'falhou'}
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-600">{log.empresaId ?? '—'}</td>
                <td className="max-w-xs truncate px-3 py-2 text-neutral-600" title={log.detalhes ?? ''}>
                  {log.detalhes ?? '—'}
                </td>
                <td className="px-3 py-2 text-neutral-500">{log.ip ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
