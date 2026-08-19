import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// РІВЕНЬ СКЛАДНОСТІ
// =====================================================

function getDifficulty(
  correctPercent: number
) {
  if (correctPercent > 80) {
    return {
      label: "Дуже легке",
      color: "green",
    };
  }

  if (correctPercent >= 60) {
    return {
      label: "Легке",
      color: "green",
    };
  }

  if (correctPercent >= 40) {
    return {
      label: "Оптимальне",
      color: "yellow",
    };
  }

  if (correctPercent >= 21) {
    return {
      label: "Складне",
      color: "orange",
    };
  }

  return {
    label: "Дуже складне",
    color: "red",
  };
}

// =====================================================
// ОТРИМАННЯ ID ВІДПОВІДЕЙ
// =====================================================

function getAnswerIds(
  value: unknown
): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => Number(item))
    .filter((item) =>
      Number.isInteger(item)
    );
}

// =====================================================
// ПОРІВНЯННЯ ВІДПОВІДЕЙ
// =====================================================

function isSameAnswers(
  userAnswer: number[],
  correctAnswers: number[]
) {
  if (
    userAnswer.length !==
    correctAnswers.length
  ) {
    return false;
  }

  return correctAnswers.every((id) =>
    userAnswer.includes(id)
  );
}

// =====================================================
// GET
// =====================================================

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    // =================================================
    // ID ТЕСТУ
    // =================================================

    const testIdParam =
      searchParams.get("testId");

    if (!testIdParam) {
      return NextResponse.json(
        {
          message:
            "Не вказано ID тесту.",
        },
        {
          status: 400,
        }
      );
    }

    const testId =
      Number(testIdParam);

    if (
      !Number.isInteger(testId) ||
      testId <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "Некоректний ID тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // ВИБРАНІ УЧАСНИКИ
    // =================================================

    const participantsParam =
      searchParams.get(
        "participants"
      );

    let participantIds:
      | number[]
      | null = null;

    if (participantsParam) {
      try {
        const parsed =
          JSON.parse(
            participantsParam
          );

        if (!Array.isArray(parsed)) {
          return NextResponse.json(
            {
              message:
                "Список учасників має бути масивом.",
            },
            {
              status: 400,
            }
          );
        }

        participantIds =
          parsed
            .map((id) => Number(id))
            .filter(
              (id) =>
                Number.isInteger(id) &&
                id > 0
            );
      } catch {
        return NextResponse.json(
          {
            message:
              "Некоректний список учасників.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // =================================================
    // ТЕСТ
    // =================================================

    const test =
      await prisma.test.findUnique({
        where: {
          id: testId,
        },

        include: {
          questions: {
            orderBy: {
              order: "asc",
            },

            include: {
              options: {
                orderBy: {
                  order: "asc",
                },
              },
            },
          },
        },
      });

    if (!test) {
      return NextResponse.json(
        {
          message:
            "Тест не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // РЕЗУЛЬТАТИ
    // =================================================

    const results =
      await prisma.testResult.findMany({
        where: {
          testId,
          ...(participantIds !== null
            ? {
                id: {
                  in: participantIds,
                },
              }
            : {}),
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    // =================================================
    // УЧАСНИКИ
    // =================================================

    const participantResults =
      results.map((result) => ({
        id: result.id,

        name:
          [
            result.lastName,
            result.firstName,
            result.middleName,
          ]
            .filter(Boolean)
            .join(" ") ||
          "Не вказано",

        earnedPoints:
          result.earnedPoints,

        percent:
          result.percent,
      }));

    const totalParticipants =
      results.length;

    // =================================================
    // СТАТИСТИКА ПИТАНЬ
    // =================================================

    const questionStatistics =
      test.questions.map(
        (question) => {
          let correct = 0;
          let incorrect = 0;
          let skipped = 0;

          // -------------------------------------------
          // Правильні відповіді
          // -------------------------------------------

          const correctAnswers =
            question.options
              .filter(
                (option) =>
                  option.isCorrect === true
              )
              .map(
                (option) =>
                  option.id
              );

          // -------------------------------------------
          // Результати учасників
          // -------------------------------------------

          results.forEach(
            (result) => {
              const answers =
                result.answers as Record<
                  string,
                  unknown
                >;

              const rawAnswer =
                answers[
                  String(question.id)
                ];

              const userAnswer =
                getAnswerIds(
                  rawAnswer
                );

              // ---------------------------------------
              // ПРОПУЩЕНО
              // ---------------------------------------

              if (
                userAnswer.length === 0
              ) {
                skipped++;
                return;
              }

              // ---------------------------------------
              // MATCHING
              // ---------------------------------------

              if (
                question.type ===
                "matching"
              ) {
                const leftItems =
                  question.options
                    .filter(
                      (option) =>
                        option.text?.startsWith(
                          "L|"
                        )
                    )
                    .map(
                      (option) => {
                        const parts =
                          option.text.split(
                            "|"
                          );

                        return {
                          id: Number(
                            parts[1]
                          ),

                          correctRightId:
                            Number(
                              parts[3]
                            ),
                        };
                      }
                    )
                    .sort(
                      (a, b) =>
                        a.id - b.id
                    );

                if (
                  leftItems.length === 0
                ) {
                  incorrect++;
                  return;
                }

                let correctPairs =
                  0;

                leftItems.forEach(
                  (
                    leftItem,
                    index
                  ) => {
                    const userRightId =
                      userAnswer[
                        index
                      ];

                    if (
                      userRightId ===
                      leftItem.correctRightId
                    ) {
                      correctPairs++;
                    }
                  }
                );

                if (
                  correctPairs ===
                  leftItems.length
                ) {
                  correct++;
                } else {
                  incorrect++;
                }

                return;
              }

              // ---------------------------------------
              // SINGLE / MULTIPLE
              // ---------------------------------------

              if (
                isSameAnswers(
                  userAnswer,
                  correctAnswers
                )
              ) {
                correct++;
              } else {
                incorrect++;
              }
            }
          );

          // -------------------------------------------
          // ВІДСОТКИ
          // -------------------------------------------

          const correctPercent =
            totalParticipants > 0
              ? Math.round(
                  (correct /
                    totalParticipants) *
                    100
                )
              : 0;

          const incorrectPercent =
            totalParticipants > 0
              ? Math.round(
                  (incorrect /
                    totalParticipants) *
                    100
                )
              : 0;

          const skippedPercent =
            totalParticipants > 0
              ? Math.round(
                  (skipped /
                    totalParticipants) *
                    100
                )
              : 0;

          // -------------------------------------------
          // РЕЗУЛЬТАТ ПИТАННЯ
          // -------------------------------------------

          return {
            id: question.id,

            order: question.order,

            text: question.text,

            points: question.points,

            correct,

            incorrect,

            skipped,

            correctPercent,

            incorrectPercent,

            skippedPercent,

            difficulty:
              getDifficulty(
                correctPercent
              ),
          };
        }
      );

    // =================================================
    // ЗАГАЛЬНА СТАТИСТИКА
    // =================================================

    const scores =
      results.map(
        (result) =>
          result.earnedPoints
      );

    // =================================================
    // МАКСИМАЛЬНИЙ ФАКТИЧНИЙ БАЛ
    // =================================================

    const maxScore =
      scores.length > 0
        ? Math.max(...scores)
        : 0;

    // =================================================
    // МІНІМАЛЬНИЙ ФАКТИЧНИЙ БАЛ
    // =================================================

    const minScore =
      scores.length > 0
        ? Math.min(...scores)
        : 0;

    // =================================================
    // СЕРЕДНІЙ БАЛ
    // =================================================

    const averageScore =
      scores.length > 0
        ? Math.round(
            (scores.reduce(
              (sum, score) =>
                sum + score,
              0
            ) /
              scores.length) *
              100
          ) / 100
        : 0;

    // =================================================
    // СЕРЕДНІЙ ВІДСОТОК
    // =================================================

    const averagePercent =
      results.length > 0
        ? Math.round(
            (results.reduce(
              (sum, result) =>
                sum + result.percent,
              0
            ) /
              results.length) *
              100
          ) / 100
        : 0;

    // =================================================
    // РЕЗУЛЬТАТ
    // =================================================

    return NextResponse.json({
      test: {
        id: test.id,

        title: test.title,

        subject: test.subject,

        maxPoints: test.maxPoints,

        questionCount:
          test.questions.length,
      },

      summary: {
        participants:
          totalParticipants,

        maxScore,

        minScore,

        averageScore,

        averagePercent,
      },

      participants:
        participantResults,

      questions:
        questionStatistics,
    });
  } catch (error) {
    console.error(
      "ANALYTICS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Не вдалося сформувати аналітику.",
      },
      {
        status: 500,
      }
    );
  }
}