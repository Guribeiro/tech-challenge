import { PrismaService } from '@/infra/database/prisma/prisma.service.js'

export async function resetDatabase(prisma: PrismaService) {
  console.log('DATABASE_URL em uso:', process.env.DATABASE_URL)
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename != '_prisma_migrations';
  `

  if (!tables || tables.length === 0) return

  const formattedTables = tables
    .map(({ tablename }) => `"${tablename}"`)
    .join(', ')

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${formattedTables} RESTART IDENTITY CASCADE;`
  )
}