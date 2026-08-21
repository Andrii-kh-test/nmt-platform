import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();

async function main() {
  console.log("Починаю резервне копіювання Neon...");

  const backup = {
    createdAt: new Date().toISOString(),

    tests: await prisma.test.findMany(),

    questions: await prisma.question.findMany(),

    answerOptions: await prisma.answerOption.findMany(),

    participants: await prisma.participant.findMany(),

    testSessions: await prisma.testSession.findMany(),

    testResults: await prisma.testResult.findMany(),
  };

  const fileName = `neon-backup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;

  writeFileSync(
    fileName,
    JSON.stringify(
      backup,
      (_, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }

        return value;
      },
      2
    ),
    "utf-8"
  );

  console.log("");
  console.log("======================================");
  console.log("РЕЗЕРВНА КОПІЯ СТВОРЕНА");
  console.log("======================================");
  console.log(`Файл: ${fileName}`);
  console.log("");

  console.log("Кількість записів:");

  console.log(`Tests:          ${backup.tests.length}`);
  console.log(`Questions:      ${backup.questions.length}`);
  console.log(`AnswerOptions:  ${backup.answerOptions.length}`);
  console.log(`Participants:   ${backup.participants.length}`);
  console.log(`TestSessions:   ${backup.testSessions.length}`);
  console.log(`TestResults:    ${backup.testResults.length}`);

  console.log("");
  console.log("Neon БД не змінювалася.");
}

main()
  .catch((error) => {
    console.error("ПОМИЛКА РЕЗЕРВНОГО КОПІЮВАННЯ:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });