import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { excluirEmpresa } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function ExcluirEmpresaPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { erro?: string }
}) {
  const empresa = await prisma.empresa.findUnique({ where: { id: params.id } })
  if (!empresa) notFound()

  const excluirComId = excluirEmpresa.bind(null, empresa.id)

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-red-700">Excluir "{empresa.nomeEmpresa}"</h1>

      <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p>Isso vai apagar da gestão comercial:</p>
        <ul className="list-disc pl-5">
          <li>o registro da empresa e todos os dados comerciais;</li>
          <li>os módulos contratados;</li>
          <li>todos os acessos (roteamento de login) — os e-mails cadastrados deixam de conseguir entrar no Ecdise.</li>
        </ul>
        <p className="font-medium">
          O banco de dados Neon desse cliente e os usuários que existem dentro dele NÃO são apagados — só ficam sem
          nenhum acesso possível a partir daqui. Se quiser reaproveitar esse banco depois, cadastre a connection
          string dele em "Bancos Neon disponíveis" antes ou depois de excluir.
        </p>
        <p>Essa ação não pode ser desfeita.</p>
      </div>

      {searchParams.erro && (
        <div className="rounded-md border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-800">
          {searchParams.erro}
        </div>
      )}

      <form action={excluirComId} className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        {empresa.databaseUrlCriptografada && (
          <label className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <input type="checkbox" name="apagarDados" className="mt-0.5 rounded border-neutral-300" />
            <span>
              Também apagar todos os dados de dentro do banco Neon desta empresa (clientes, contratos, projetos,
              usuários...). A estrutura do banco continua — só fica vazio, pronto pra reaproveitar com outro cliente
              sem precisar rodar migração de novo. <strong>Irreversível.</strong> Se deixar desmarcado, o banco
              continua com os dados como estão — cadastre em "Bancos" depois se quiser limpar manualmente mais tarde.
            </span>
          </label>
        )}
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">
            Digite exatamente <span className="font-mono">{empresa.nomeEmpresa}</span> pra confirmar
          </span>
          <input name="confirmacao" required className="input" autoComplete="off" />
        </label>
        <div className="flex gap-3">
          <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            Excluir definitivamente
          </button>
          <a
            href={`/comercial/${empresa.id}`}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}
