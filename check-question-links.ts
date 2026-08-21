import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const links =
    await prisma.testQuestion.findMany({
      select: {
        id: true,
        testId: true,
        questionId: true,
        order: true,

        question: {
          select: {
            id: true,
            text: true,
          },
        },
      },

      orderBy: [
        {
          testId: "asc",
        },
        {
          order: "asc",
        },
      ],
    });

  console.table(
    links.map((link) => ({
      testQuestionId:
        link.id,

      testId:
        link.testId,

      questionId:
        link.questionId,

      order:
        link.order,

      text:
        link.question.text.substring(
          0,
          60
        ),
    }))
  );

  const grouped =
    new Map<number, number>();

  for (const link of links) {
    grouped.set(
      link.testId,
      (grouped.get(link.testId) ?? 0) + 1
    );
  }

  console.log(
    "\n=== КІЛЬКІСТЬ ПИТАНЬ ЗА ТЕСТАМИ ==="
  );

  for (
    const [testId, count] of grouped
  ) {
    console.log(
      `Test ${testId}: ${count} питань`
    );
  }

  console.log(
    "\n=== ПЕРЕВІРКА ДУБЛІКАТІВ ==="
  );

  const duplicateLinks =
    await prisma.testQuestion.groupBy({
      by: [
        "testId",
        "questionId",
      ],

      _count: {
        id: true,
      },

      having: {
        id: {
          _count: {
            gt: 1,
          },
        },
      },
    });

  if (
    duplicateLinks.length === 0
  ) {
    console.log(
      "Дублікатів зв'язків TestQuestion не знайдено."
    );
  } else {
    console.table(
      duplicateLinks.map(
        (item) => ({
          testId:
            item.testId,

          questionId:
            item.questionId,

          count:
            item._count.id,
        })
      )
    );
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