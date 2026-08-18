import { prisma } from "./lib/prisma";

async function main() {
  const tests = await prisma.test.findMany({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      title: true,
    },
  });

  console.log("Знайдено тестів:", tests.length);

  for (let index = 0; index < tests.length; index++) {
    const test = tests[index];

    await prisma.test.update({
      where: {
        id: test.id,
      },
      data: {
        displayOrder: index + 1,
      },
    });

    console.log(
      `Тест ID ${test.id}: displayOrder = ${index + 1}`
    );
  }

  console.log("Нумерацію завершено.");
}

main()
  .catch((error) => {
    console.error("Помилка:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });