import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCentavos, STATUS_LABELS, STATUS_ORDEM } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function ComercialPage() {
  const empresas = await prisma.empresa.findMany({
    orderBy: { atualizadoEm: 'desc' },
  })

  const porStatus = STATUS_ORDEM.map((status) => ({
    status,
    empresas: empresas.filter((e) => e.status === status),
  }))

  const totalMensalAtivo = empresas
    .filter((e) => e.status === 'ATIVO')
    .reduce((soma, e) => soma + (e.valorMensalCentavos ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Gestão Comercial</h1>
          <p className="text-sm text-neutral-500">
            {empresas.length} empresa(s) no funil · MRR ativo: {formatCentavos(totalMensalAtivo)}
          </p>
        </div>
        <Link
          href="/comercial/nova"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Nova empresa
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {porStatus.map(({ status, empresas: lista }) => (
          <div key={status} className="rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-3 py-2">
              <h2 className="text-sm font-medium text-neutral-700">
                {STATUS_LABELS[status]} <span className="text-neutral-400">({lista.length})</span>
              </h2>
            </div>
            <div className="flex flex-col gap-2 p-2">
              {lista.length === 0 && (
                <p className="px-1 py-2 text-xs text-neutral-400">Nenhuma empresa aqui.</p>
              )}
              {lista.map((empresa) => (
                <Link
                  key={empresa.id}
                  href={`/comercial/${empresa.id}`}
                  className="rounded-md border border-neutral-100 bg-neutral-50 p-2 text-sm hover:border-brand-300 hover:bg-brand-50"
                >
                  <div className="font-medium text-neutral-800">{empresa.nomeEmpresa}</div>
                  <div className="text-xs text-neutral-500">{empresa.responsavelNome}</div>
                  {empresa.valorMensalCentavos != null && (
                    <div className="mt-1 text-xs text-brand-700">
                      {formatCentavos(empresa.valorMensalCentavos)}/mês
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
