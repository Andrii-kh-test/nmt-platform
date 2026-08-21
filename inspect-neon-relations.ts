import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== TEST RESULTS ===");

  const results = await prisma.$queryRawUnsafe(`
    SELECT
      id,
      "testId",
      "earnedPoints",
      "maxPoints",
      "percent",
      "finishReason",
      "startedAt",
      "finishedAt",
      "lastName",
      "firstName",
      "middleName",
      "accessCode"
    FROM "TestResult"
    ORDER BY id
  `);

  console.table(results);

  console.log("\n=== TEST SESSIONS ===");

  const sessions = await prisma.$queryRawUnsafe(`
    SELECT
      id,
      "testId",
      "participantId",
      "startedAt",
      "finishedAt",
      finished,
      blocked
    FROM "TestSession"
    ORDER BY id
  `);

  console.table(sessions);

  console.log("\n=== PARTICIPANTS ===");

  const participants = await prisma.$queryRawUnsafe(`
    SELECT
      id,
      "lastName",
      "firstName",
      "middleName",
      "accessCode"
    FROM "Participant"
    ORDER BY id
  `);

  console.table(participants);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
