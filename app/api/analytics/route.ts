import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// СКЛАДНІСТЬ
// =====================================================

function getDifficulty(correctPercent: number) {
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

function getAnswerIds(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => Number(item))
          .filter((item) => Number.isInteger(item));
      }
    } catch {
      return [];
    }
  }

  return [];
}

// =====================================================
// ПОРІВНЯННЯ SINGLE / MULTIPLE
// =====================================================

function isSameAnswers(
  userAnswer: number[],
  correctAnswers: number[]
) {
  if (userAnswer.length !== correctAnswers.length) {
    return false;
  }

  return correctAnswers.every((id) =>
    userAnswer.includes(id)
  );
}

// =====================================================
// MATCHING
// =====================================================

function getMatchingLeftItems(
  options: Array<{
    id: number;
    order: number;
    text: string;
    isCorrect: boolean;
  }>
) {
  return options
    .filter((option) =>
      option.text?.startsWith("L|")
    )
    .map((option) => {
      const parts = option.text.split("|");

      return {
        id: Number(parts[1]),
        text: parts[2] ?? "",
        correctRightId: Number(parts[3]),
      };
    })
    .filter(
      (item) =>
        Number.isInteger(item.id) &&
        Number.isInteger(item.correctRightId)
    )
    .sort((a, b) => a.id - b.id);
}

function isMatchingCorrect(
  userAnswer: number[],
  leftItems: Array<{
    id: number;
    text: string;
    correctRightId: number;
  }>
) {
  if (leftItems.length === 0) {
    return false;
  }

  if (userAnswer.length !== leftItems.length) {
    return false;
  }

  return leftItems.every(
    (leftItem, index) =>
      userAnswer[index] === leftItem.correctRightId
  );
}

// =====================================================
// GET
// =====================================================

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    // =================================================
    // TEST ID
    // =================================================

    const testIdParam =
      searchParams.get("testId");

    if (!testIdParam) {
      return NextResponse.json(
        {
          message: "Не вказано ID тесту.",
        },
        {
          status: 400,
        }
      );
    }

    const testId = Number(testIdParam);

    if (
      !Number.isInteger(testId) ||
      testId <= 0
    ) {
      return NextResponse.json(
        {
          message: "Некоректний ID тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // УЧАСНИКИ
    // =================================================

    const participantsParam =
      searchParams.get("participants");

    let participantIds:
      | number[]
      | null = null;

    if (participantsParam) {
      try {
        const parsed =
          JSON.parse(participantsParam);

        if (!Array.isArray(parsed)) {
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

        participantIds = parsed
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
    // ЗАВАНТАЖЕННЯ ТЕСТУ
    //
    // ВАЖЛИВО:
    // варіанти потрібні серверу для розрахунку
    // статистики, але НЕ повертаються клієнту.
    // =================================================

    const test =
      await prisma.test.findUnique({
        where: {
          id: testId,
        },

        select: {
          id: true,
          title: true,
          subject: true,
          maxPoints: true,

          questions: {
            orderBy: {
              order: "asc",
            },

            select: {
              id: true,
              order: true,
              type: true,
              text: true,
              points: true,

              options: {
                orderBy: {
                  order: "asc",
                },

                select: {
                  id: true,
                  order: true,
                  text: true,
                  isCorrect: true,
                },
              },
            },
          },
        },
      });

    if (!test) {
      return NextResponse.json(
        {
          message: "Тест не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // РЕЗУЛЬТАТИ
    //
    // Витягуємо тільки ті поля, які реально потрібні.
    // =================================================

    const results =
      await prisma.testResult.findMany({
        where: {
          testId,

          ...(participantIds &&
          participantIds.length > 0
            ? {
                id: {
                  in: participantIds,
                },
              }
            : {}),
        },

        select: {
          id: true,
          earnedPoints: true,
          percent: true,
          answers: true,
          firstName: true,
          lastName: true,
          middleName: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    // =================================================
    // УЧАСНИКИ
    // =================================================

    const participants =
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
    // СТАТИСТИКА ЗАВДАНЬ
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
          // Matching
          // -------------------------------------------

          const matchingLeftItems =
            getMatchingLeftItems(
              question.options
            );

          // -------------------------------------------
          // Перевіряємо учасників
          // -------------------------------------------

          results.forEach(
            (result) => {
              let answers:
                Record<
                  string,
                  unknown
                > = {};

              if (
                result.answers &&
                typeof result.answers ===
                  "object" &&
                !Array.isArray(
                  result.answers
                )
              ) {
                answers =
                  result.answers as Record<
                    string,
                    unknown
                  >;
              }

              // ---------------------------------------
              // КЛЮЧ ПИТАННЯ
              //
              // Важливо:
              // використовуємо question.id,
              // а НЕ question.order.
              // ---------------------------------------

              const answerKey =
                String(question.id);

              const rawAnswer =
                answers[answerKey];

              const userAnswer =
                getAnswerIds(rawAnswer);

              // ---------------------------------------
              // Пропущене
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
                const matchingCorrect =
                  isMatchingCorrect(
                    userAnswer,
                    matchingLeftItems
                  );

                if (
                  matchingCorrect
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

          return {
            id: question.id,

            order:
              question.order,

            type:
              question.type,

            text:
              question.text,

            points:
              question.points,

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

    const maxScore =
      scores.length > 0
        ? Math.max(...scores)
        : 0;

    const minScore =
      scores.length > 0
        ? Math.min(...scores)
        : 0;

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
    // ВІДПОВІДЬ
    //
    // Тут більше НЕ передаємо options.
    // =================================================

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        subject: test.subject,
        maxPoints:
          test.maxPoints,

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

      participants,

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