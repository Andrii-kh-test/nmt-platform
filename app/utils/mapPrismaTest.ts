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

        shuffleQuestion:
          question.shuffleQuestion ?? true,

        options: question.options.map(
          (option: any) => ({
            id: option.id,
            order: option.order,
            text: option.text,
            isCorrect: option.isCorrect,
          })
        ),

        matchingPairs: [],

        sequenceItems: [],

        textAnswer: "",

        explanation: "",
      })
    ),
  };
}