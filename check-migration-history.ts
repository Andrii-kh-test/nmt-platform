import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== PRISMA MIGRATION HISTORY ===");

  const migrations = await prisma.$queryRawUnsafe<
    Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
      applied_steps_count: number;
    }>
  >(`
    SELECT
      migration_name,
      finished_at,
      rolled_back_at,
      applied_steps_count
    FROM "_prisma_migrations"
    ORDER BY started_at;
  `);

  console.table(migrations);

  console.log("");
  console.log("=== PARTICIPANT COLUMNS ===");

  const columns = await prisma.$queryRawUnsafe<
    Array<{
      column_name: string;
      data_type: string;
    }>
  >(`
    SELECT
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Participant'
    ORDER BY ordinal_position;
  `);

  console.table(columns);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });