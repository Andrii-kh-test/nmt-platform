import { Test } from "@/app/types/test";
import { Question } from "@/app/types/question";

export function mapPrismaTest(test: any): Test {
  return {
    id: test.id,

    title: test.title,

    subject: test.subject,
examType: test.examType,
    description: test.description ?? "",

    duration: test.duration,

    schoolYear: test.schoolYear,

    maxPoints: test.maxPoints,

    isPublished: test.isPublished ?? false,

    codeRequired: test.codeRequired ?? true,

    accessCode: test.accessCode ?? "",

    questions: test.questions.map(
      (question: any): Question => {
        const options = question.options ?? [];

        const isMatching =
          question.type === "matching";

        const matchingLeftItems = isMatching
          ? options
              .filter((option: any) =>
                option.text?.startsWith("L|")
              )
              .map((option: any) => {
                const parts =
                  option.text.split("|");

                return {
                  id: Number(parts[1]),
                  text: parts[2] ?? "",
                  correctRightId:
                    Number(parts[3]),
                };
              })
              .sort(
                (a: any, b: any) =>
                  a.id - b.id
              )
          : [];

        const matchingRightItems = isMatching
          ? options
              .filter((option: any) =>
                option.text?.startsWith("R|")
              )
              .map((option: any) => {
                const parts =
                  option.text.split("|");

                return {
                  id: Number(parts[1]),
                  text: parts.slice(2).join("|"),
                };
              })
              .sort(
                (a: any, b: any) =>
                  a.id - b.id
              )
          : [];

        return {
          id: question.id,

          order: question.order,

          type: question.type,

          text: question.text,

          points: question.points,

          shuffleQuestion:
            question.shuffleQuestion ?? true,

          options: isMatching
            ? []
            : options.map(
                (option: any) => ({
                  id: option.id,
                  order: option.order,
                  text: option.text,
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