// test/helpers/reset-db.ts
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'

let cachedFormattedTables: string | null = null

export async function resetDatabase(prisma: PrismaService) {
  // Busca o nome das tabelas apenas na primeira chamada da execução
  if (!cachedFormattedTables) {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname='public' 
        AND tablename != '_prisma_migrations';
    `

    if (tables.length === 0) return

    cachedFormattedTables = tables
      .map(({ tablename }) => `"${tablename}"`)
      .join(', ')
  }

  // Trunca todas as tabelas usando a string já em cache
  if (cachedFormattedTables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${cachedFormattedTables} RESTART IDENTITY CASCADE;`)
  }
}