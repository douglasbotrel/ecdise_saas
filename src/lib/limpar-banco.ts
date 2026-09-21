// Apaga TODOS os dados de dentro de um banco Neon de um tenant — usado
// quando uma empresa é excluída (opcional) ou antes de reaproveitar um
// banco do pool pra um cliente novo, pra não abrir o Ecdise com dado de
// outro cliente lá dentro.
//
// Não usa a lib `pg` (evita depender de instalar pacote novo, o que trava
// com frequência pela ponte deste ambiente) — reaproveita o próprio
// @prisma/client, que já sabe se conectar em qualquer Postgres arbitrário
// passando a connection string na hora, sem precisar do schema do Ecdise
// multi-tenant (não vive neste repositório). Descobre as tabelas na hora via
// catálogo do Postgres (pg_tables) e faz TRUNCATE nelas — funciona
// independente de como o schema do Ecdise evoluir.
import { PrismaClient } from '@prisma/client'

export async function limparDadosDoBanco(databaseUrl: string): Promise<{ tabelas: string[] }> {
  const client = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  try {
    const linhas = await client.$queryRawUnsafe<{ tablename: string }[]>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'`
    )
    const tabelas = linhas.map((l) => l.tablename)
    if (tabelas.length === 0) return { tabelas: [] }

    const listaEntreAspas = tabelas.map((t) => `"${t}"`).join(', ')
    await client.$executeRawUnsafe(`TRUNCATE TABLE ${listaEntreAspas} RESTART IDENTITY CASCADE`)

    return { tabelas }
  } finally {
    await client.$disconnect()
  }
}
