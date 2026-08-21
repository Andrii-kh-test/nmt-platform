import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRawUnsafe(`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Participant'
    ORDER BY ordinal_position;
  `);

  console.table(columns);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());