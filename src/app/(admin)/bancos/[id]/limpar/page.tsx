import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { limparBancoDisponivel } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function LimparBancoPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { erro?: string }
}) {
  const banco = await prisma.bancoDisponivel.findUnique({ where: { id: params.id } })
  if (!banco) notFound()

  const limparComId = limparBancoDisponivel.bind(null, banco.id)

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-red-700">Limpar dados de "{banco.apelido}"</h1>

      <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p>
          Isso conecta direto nesse banco Neon e apaga <strong>todo o conteúdo de todas as tabelas</strong> — clientes,
          contratos, projetos, usuários, tudo. A estrutura (tabelas) continua existindo, só fica vazia — não precisa
          rodar migração de novo depois.
        </p>
        <p className="font-medium">Essa ação não pode ser desfeita. Só faça isso se tiver certeza que não precisa mais desses dados.</p>
      </div>

      {searchParams.erro && (
        <div className="rounded-md border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-800">
          {searchParams.erro}
        </div>
      )}

      <form action={limparComId} className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">
            Digite exatamente <span className="font-mono">{banco.apelido}</span> pra confirmar
          </span>
          <input name="confirmacao" required className="input" autoComplete="off" />
        </label>
        <div className="flex gap-3">
          <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            Apagar todos os dados
          </button>
          <a href="/bancos" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}
