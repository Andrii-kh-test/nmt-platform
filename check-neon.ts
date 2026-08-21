import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Test:", await prisma.test.count());
  console.log("Question:", await prisma.question.count());
  console.log("AnswerOption:", await prisma.answerOption.count());
  console.log("Participant:", await prisma.participant.count());
  console.log("TestSession:", await prisma.testSession.count());
  console.log("TestResult:", await prisma.testResult.count());
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
