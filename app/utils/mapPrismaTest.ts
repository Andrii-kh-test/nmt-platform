import { Test } from "@/app/types/test";
import { Question } from "@/app/types/question";

export function mapPrismaTest(test: any): Test {
  return {
    id: test.id,

    title: test.title,

    subject: test.subject,

    examType: test.examType,

    description:
      test.description ?? "",

    duration: test.duration,

    schoolYear: test.schoolYear,

    maxPoints: test.maxPoints,

    displayOrder: test.displayOrder,

    isPublished:
      test.isPublished ?? false,

    codeRequired:
      test.codeRequired ?? true,

    accessCode:
      test.accessCode ?? "",

    questions: (test.questions ?? []).map(
      (testQuestion: any): Question => {
        /*
         * Актуальна структура Prisma:
         *
         * TestQuestion
         *   └── question
         *        └── answerOptions
         *
         * Підтримуємо також стару структуру,
         * якщо вона ще десь використовується.
         */

        const prismaQuestion =
          testQuestion.question ?? testQuestion;

        const options =
          prismaQuestion.answerOptions ??
          prismaQuestion.options ??
          [];

        const isMatching =
          prismaQuestion.type === "matching";

        // =====================================
        // ЛІВА ЧАСТИНА MATCHING
        // =====================================

        const matchingLeftItems =
          isMatching
            ? options
                .filter((option: any) =>
                  option.text?.startsWith("L|")
                )
                .map((option: any) => {
                  const parts =
                    option.text.split("|");

                  return {
                    id: Number(parts[1]),

                    text:
                      parts[2] ?? "",

                    correctRightId:
                      Number(parts[3]),
                  };
                })
                .sort(
                  (
                    a: any,
                    b: any
                  ) => a.id - b.id
                )
            : [];

        // =====================================
        // ПРАВА ЧАСТИНА MATCHING
        // =====================================

        const matchingRightItems =
          isMatching
            ? options
                .filter((option: any) =>
                  option.text?.startsWith("R|")
                )
                .map((option: any) => {
                  const parts =
                    option.text.split("|");

                  return {
                    id: Number(parts[1]),

                    text:
                      parts
                        .slice(2)
                        .join("|"),
                  };
                })
                .sort(
                  (
                    a: any,
                    b: any
                  ) => a.id - b.id
                )
            : [];

        // =====================================
        // QUESTION
        // =====================================

        return {
          id: prismaQuestion.id,

          order:
            testQuestion.order ??
            prismaQuestion.order,

          type:
            prismaQuestion.type,

          text:
            prismaQuestion.text,

          points:
            prismaQuestion.points,

          shuffleQuestion:
            prismaQuestion.shuffleQuestion ??
            true,

          options: isMatching
            ? []
            : options.map(
                (option: any) => ({
                  id: option.id,

                  order:
                    option.order,

                  text:
                    option.text,

                  isCorrect:
                    option.isCorrect,
                })
              ),

          matchingLeftItems,

          matchingRightItems,

          sequenceItems: [],

          textAnswer: "",

          explanation: "",
        };
      }
    ),
  };
}