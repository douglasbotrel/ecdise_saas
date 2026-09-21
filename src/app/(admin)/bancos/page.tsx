import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import { mascararConnectionString } from '@/lib/format'
import { criarBancoDisponivel, removerBancoDisponivel } from './actions'

export const dynamic = 'force-dynamic'

export default async function BancosPage({
  searchParams,
}: {
  searchParams: { erro?: string; criado?: string; limpo?: string }
}) {
  const bancos = await prisma.bancoDisponivel.findMany({ orderBy: { criadoEm: 'desc' } })

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Bancos Neon disponíveis</h1>
        <p className="text-sm text-neutral-500">
          Pool de bancos já criados no Neon, ainda sem cliente atribuído — por exemplo, um banco que sobrou de um
          teste que você excluiu. Cadastre aqui pra poder atribuir a um cliente novo em vez de criar um banco do
          zero toda vez.
        </p>
      </div>

      {searchParams.erro && <Erro>{searchParams.erro}</Erro>}
      {searchParams.criado && <Aviso>Banco adicionado ao pool.</Aviso>}
      {searchParams.limpo && <Aviso>Dados de "{searchParams.limpo}" apagados — o banco está vazio e pronto pra um cliente novo.</Aviso>}

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-700">Disponíveis agora ({bancos.length})</h2>
        {bancos.length === 0 && (
          <p className="text-sm text-neutral-400">Nenhum banco no pool ainda.</p>
        )}
        <ul className="space-y-2">
          {bancos.map((banco) => {
            let preview = '(não consegui descriptografar)'
            try {
              preview = mascararConnectionString(decrypt(banco.databaseUrlCriptografada))
            } catch {
              // ENCRYPTION_KEY pode ter mudado desde que isso foi salvo — mostra aviso em vez de quebrar a página.
            }
            const removerComId = removerBancoDisponivel.bind(null, banco.id)
            return (
              <li key={banco.id} className="flex items-center justify-between rounded border border-neutral-100 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium text-neutral-800">{banco.apelido}</div>
                  <div className="text-xs text-neutral-500">{preview}</div>
                </div>
                <div className="flex items-center gap-3">
                  <a href={`/bancos/${banco.id}/limpar`} className="text-xs font-medium text-amber-600 hover:text-amber-800">
                    Limpar dados
                  </a>
                  <form action={removerComId}>
                    <button type="submit" className="text-xs font-medium text-red-600 hover:text-red-800">
                      Remover do pool
                    </button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-700">Adicionar banco ao pool</h2>
        <form action={criarBancoDisponivel} className="flex flex-wrap items-end gap-3">
          <Campo label="Apelido *">
            <input name="apelido" required placeholder="ex: banco do teste douglas" className="input" />
          </Campo>
          <Campo label="Connection string (postgresql://...) *">
            <input name="databaseUrl" required placeholder="postgresql://usuario:senha@host/banco?sslmode=require" className="input w-96" />
          </Campo>
          <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            + Adicionar ao pool
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
    <div className="rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm text-brand-700">{children}</div>
  )
}

function Erro({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{children}</div>
  )
}
