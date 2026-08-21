import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.question.findMany({
    select: {
      id: true,
      testId: true,
      order: true,
      text: true,
    },
    orderBy: [
      { testId: "asc" },
      { order: "asc" },
    ],
  });

  console.table(
    questions.map((q) => ({
      questionId: q.id,
      testId: q.testId,
      order: q.order,
      text: q.text.substring(0, 60),
    }))
  );

  const grouped = new Map<number, number>();

  for (const q of questions) {
    grouped.set(q.testId, (grouped.get(q.testId) ?? 0) + 1);
  }

  console.log("\n=== КІЛЬКІСТЬ ПИТАНЬ ЗА ТЕСТАМИ ===");

  for (const [testId, count] of grouped) {
    console.log(`Test ${testId}: ${count} питань`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });