// test/helpers/reset-db.ts
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'

export async function resetDatabase(prisma: PrismaService) {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname='public' 
      AND tablename != '_prisma_migrations';
  `

  if (tables.length === 0) return

  const formattedTables = tables
    .map(({ tablename }) => `"${tablename}"`)
    .join(', ')

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${formattedTables} CASCADE;`)
}