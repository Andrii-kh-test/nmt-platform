import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
    sessionId: string;
  }>;
};

export default async function ComplexTestResultPage({
  params,
}: Props) {
  const { id, sessionId } = await params;

  const complexTestId = Number(id);
  const complexSessionId = Number(sessionId);

  if (
    !Number.isInteger(complexTestId) ||
    !Number.isInteger(complexSessionId)
  ) {
    notFound();
  }

  const session =
    await prisma.complexTestSession.findFirst({
      where: {
        id: complexSessionId,
        complexTestId,
      },

      include: {
        participant: true,

        complexTest: {
          include: {
            tests: {
              orderBy: {
                order: "asc",
              },

              include: {
                test: {
                  include: {
                    questions: {
                      orderBy: {
                        order: "asc",
                      },

                      include: {
                        question: {
                          include: {
                            answerOptions: {
                              orderBy: {
                                order: "asc",
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!session) {
    notFound();
  }

  const savedAnswers =
    session.savedAnswers &&
    typeof session.savedAnswers === "object" &&
    !Array.isArray(session.savedAnswers)
      ? (session.savedAnswers as Record<
          string,
          Record<string, number[]>
        >)
      : {};

  const subjects =
    session.complexTest.tests.map(
      (item) => {
        const test = item.test;

        const testAnswers =
          savedAnswers[String(test.id)] ?? {};

        let answeredCount = 0;
        let earnedPoints = 0;

        for (const testQuestion of test.questions) {
          const question =
            testQuestion.question;

          const selectedAnswers =
            Array.isArray(
              testAnswers[String(question.id)]
            )
              ? testAnswers[String(question.id)]
              : [];

          if (selectedAnswers.length > 0) {
            answeredCount++;
          }

          const correctAnswers =
            question.answerOptions
              .filter(
                (option) =>
                  option.isCorrect
              )
              .map(
                (option) =>
                  option.id
              );

          const selectedSet =
            new Set(selectedAnswers);

          const correctSet =
            new Set(correctAnswers);

          const sameLength =
            selectedSet.size ===
            correctSet.size;

          const allCorrect =
            sameLength &&
            [...selectedSet].every(
              (answerId) =>
                correctSet.has(
                  answerId
                )
            );

          if (
            allCorrect &&
            correctSet.size > 0
          ) {
            earnedPoints +=
              question.points;
          }
        }

        return {
          testId: test.id,
          subject: test.subject,
          answeredCount,
          totalQuestions:
            test.questions.length,
          earnedPoints,
        };
      }
    );

  return (
    <main className="min-h-screen bg-[#F4F6F8]">
      <div className="mx-auto max-w-7xl px-8 py-10">

        <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-8 py-6">

            <h1 className="text-4xl font-bold text-[#7A1F2B]">
              Результати тестування
            </h1>

            <p className="mt-2 text-gray-600">
              {session.complexTest.title}
            </p>

            {session.participant && (
              <p className="mt-3 text-lg text-gray-700">
                {session.participant.lastName}{" "}
                {session.participant.firstName}{" "}
                {session.participant.middleName ?? ""}
              </p>
            )}

          </div>

          <div className="overflow-x-auto">

            <table className="w-full border-collapse">

              <thead>
                <tr className="bg-[#F8F9FA]">

                  <th className="border-b border-gray-300 px-8 py-5 text-left text-lg font-semibold text-gray-700">
                    Предмет
                  </th>

                  <th className="border-b border-gray-300 px-8 py-5 text-left text-lg font-semibold text-gray-700">
                    Надані і збережені відповіді
                  </th>

                  <th className="border-b border-gray-300 px-8 py-5 text-left text-lg font-semibold text-gray-700">
                    Результат
                  </th>

                </tr>
              </thead>

              <tbody>
                {subjects.map(
                  (subject) => (
                    <tr
                      key={
                        subject.testId
                      }
                      className="hover:bg-gray-50"
                    >

                      <td className="border-b border-gray-200 px-8 py-6 text-xl font-medium text-gray-800">
                        {subject.subject}
                      </td>

                      <td className="border-b border-gray-200 px-8 py-6 text-xl text-gray-700">
                        {subject.answeredCount} із{" "}
                        {subject.totalQuestions}
                      </td>

                      <td className="border-b border-gray-200 px-8 py-6">

                        <span className="inline-flex min-w-[90px] items-center justify-center rounded-lg border-2 border-green-500 bg-green-50 px-5 py-3 text-2xl font-bold text-green-700">
                          {subject.earnedPoints}
                        </span>

                      </td>

                    </tr>
                  )
                )}
              </tbody>

            </table>

          </div>

        </div>

      </div>
    </main>
  );
}