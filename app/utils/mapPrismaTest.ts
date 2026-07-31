import { Test } from "@/app/types/test";
import { Question } from "@/app/types/question";

export function mapPrismaTest(test: any): Test {
  return {
    id: test.id,

    title: test.title,

    subject: test.subject,

    description: test.description ?? "",

    duration: test.duration,

    schoolYear: test.schoolYear,

    maxPoints: test.maxPoints,

    // Нові поля
    isPublished: test.isPublished ?? false,

    codeRequired: test.codeRequired ?? true,

    accessCode: test.accessCode ?? "",

    questions: test.questions.map(
      (question: any): Question => ({
        id: question.id,

        order: question.order,

        type: question.type,

        text: question.text,

        points: question.points,

        options: question.options.map((option: any) => ({
          id: option.id,
          order: option.order,
          text: option.text,
          isCorrect: option.isCorrect,
        })),

        correctAnswers: question.options
          .filter((option: any) => option.isCorrect)
          .map((option: any) => option.order),

        matchingPairs: [],

        sequenceItems: [],

        textAnswer: "",

        explanation: "",
      })
    ),
  };
}