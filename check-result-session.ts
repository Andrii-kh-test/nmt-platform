import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      r.id AS "resultId",
      r."testId",
      r."startedAt" AS "resultStartedAt",
      r."finishedAt" AS "resultFinishedAt",
      s.id AS "sessionId",
      s."startedAt" AS "sessionStartedAt",
      s."finishedAt" AS "sessionFinishedAt",
      s."participantId"
    FROM "TestResult" r
    LEFT JOIN "TestSession" s
      ON s."testId" = r."testId"
      AND (
        (
          r."startedAt" IS NOT NULL
          AND ABS(EXTRACT(EPOCH FROM (s."startedAt" - r."startedAt"))) < 5
        )
        OR
        (
          r."finishedAt" IS NOT NULL
          AND s."finishedAt" IS NOT NULL
          AND ABS(EXTRACT(EPOCH FROM (s."finishedAt" - r."finishedAt"))) < 5
        )
      )
    ORDER BY r.id, s.id;
  `);

  console.table(rows);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());