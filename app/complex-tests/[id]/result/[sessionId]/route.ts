import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      sessionId: string;
    }>;
  }
) {
  try {
    const { id, sessionId } = await params;

    const complexTestId = Number(id);
    const complexSessionId = Number(sessionId);

    if (
      !Number.isInteger(complexTestId) ||
      !Number.isInteger(complexSessionId)
    ) {
      return NextResponse.json(
        {
          message: "Некоректний ідентифікатор результату.",
        },
        {
          status: 400,
        }
      );
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
      return NextResponse.json(
        {
          message:
            "Сесію комбінованого тесту не знайдено.",
        },
        {
          status: 404,
        }
      );
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

    const subjects = session.complexTest.tests.map(
      (item) => {
        const test = item.test;

        const testAnswers =
          savedAnswers[String(test.id)] ?? {};

        let answeredCount = 0;
        let earnedPoints = 0;
        let maxPoints = 0;

        for (const testQuestion of test.questions) {
          const question =
            testQuestion.question;

          maxPoints += question.points;

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
                (option) => option.id
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
                correctSet.has(answerId)
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

          title: test.title,

          answeredCount,

          totalQuestions:
            test.questions.length,

          earnedPoints,

          maxPoints,
        };
      }
    );

    return NextResponse.json({
      complexTest: {
        id: session.complexTest.id,
        title: session.complexTest.title,
        description:
          session.complexTest.description,
        examType:
          session.complexTest.examType,
      },

      participant:
        session.participant
          ? {
              id: session.participant.id,
              lastName:
                session.participant.lastName,
              firstName:
                session.participant.firstName,
              middleName:
                session.participant.middleName,
            }
          : null,

      finished: session.finished,

      finishedAt:
        session.finishedAt,

      subjects,
    });
  } catch (error) {
    console.error(
      "GET COMPLEX TEST RESULT ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Не вдалося отримати результат комбінованого тесту.",
      },
      {
        status: 500,
      }
    );
  }
}