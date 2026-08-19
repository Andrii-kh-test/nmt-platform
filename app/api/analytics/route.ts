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
  let source = value;

  // Якщо JSON збережений як рядок
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return [];
    }
  }

  // Очікуємо масив ID
  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map((item) => Number(item))
    .filter(
      (item) =>
        Number.isInteger(item) &&
        item > 0
    );
}

// =====================================================
// ПОРІВНЯННЯ SINGLE / MULTIPLE
//
// Порядок вибраних відповідей не має значення.
// Наприклад:
//
// [1, 3, 5]
// [5, 1, 3]
//
// вважаються однаковою відповіддю.
// =====================================================

function isSameAnswers(
  userAnswer: number[],
  correctAnswers: number[]
) {
  const normalizedUserAnswer =
    [...userAnswer].sort(
      (a, b) => a - b
    );

  const normalizedCorrectAnswers =
    [...correctAnswers].sort(
      (a, b) => a - b
    );

  if (
    normalizedUserAnswer.length !==
    normalizedCorrectAnswers.length
  ) {
    return false;
  }

  return normalizedCorrectAnswers.every(
    (id, index) =>
      normalizedUserAnswer[index] === id
  );
}

// =====================================================
// MATCHING
//
// Формат спеціальних options для matching:
//
// L|1|Текст лівого елемента|25
//
// де:
// 1  — ID лівого елемента
// 25 — ID правильної правої відповіді
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
      const parts =
        option.text.split("|");

      return {
        id: Number(parts[1]),
        text: parts[2] ?? "",
        correctRightId: Number(parts[3]),
      };
    })
    .filter(
      (item) =>
        Number.isInteger(item.id) &&
        Number.isInteger(
          item.correctRightId
        )
    )
    .sort(
      (a, b) => a.id - b.id
    );
}

// =====================================================
// ПЕРЕВІРКА MATCHING
//
// Для matching порядок масиву має значення:
//
// userAnswer[0] → відповідь для leftItems[0]
// userAnswer[1] → відповідь для leftItems[1]
// і т. д.
// =====================================================

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

  if (
    userAnswer.length !==
    leftItems.length
  ) {
    return false;
  }

  return leftItems.every(
    (leftItem, index) =>
      userAnswer[index] ===
      leftItem.correctRightId
  );
}

// =====================================================
// GET
//
// /api/analytics?testId=1
// /api/analytics?testId=1&participantIds=1,2,3
// =====================================================

export async function GET(
  request: Request
) {
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
    // СПИСОК УЧАСНИКІВ
    //
    // Підтримуються:
    //
    // ?participantIds=1,2,3
    //
    // та
    //
    // ?participantIds=[1,2,3]
    // =================================================

    const participantIdsParam =
      searchParams.get(
        "participantIds"
      );

    let participantIds:
      | number[]
      | undefined;

    if (participantIdsParam) {
      try {
        let parsed: unknown;

        // JSON-масив
        if (
          participantIdsParam.startsWith(
            "["
          )
        ) {
          parsed =
            JSON.parse(
              participantIdsParam
            );
        } else {
          // Список через кому
          parsed =
            participantIdsParam
              .split(",")
              .map(
                (id) =>
                  Number(
                    id.trim()
                  )
              );
        }

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

        participantIds =
          parsed
            .map((id) =>
              Number(id)
            )
            .filter(
              (id) =>
                Number.isInteger(id) &&
                id > 0
            );

        if (
          participantIds.length === 0
        ) {
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
          maxPoints: true,
          percent: true,

          correct: true,
          incorrect: true,
          skipped: true,

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

        lastName:
          result.lastName,

        firstName:
          result.firstName,

        middleName:
          result.middleName,

        earnedPoints:
          result.earnedPoints,

        maxPoints:
          result.maxPoints,

        percent:
          result.percent,

        correct:
          result.correct,

        incorrect:
          result.incorrect,

        skipped:
          result.skipped,

        createdAt:
          result.createdAt,
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
          // ПРАВИЛЬНІ ВІДПОВІДІ
          // -------------------------------------------

          const correctAnswers =
            question.options
              .filter(
                (option) =>
                  option.isCorrect ===
                  true
              )
              .map(
                (option) =>
                  option.id
              );

          // -------------------------------------------
          // MATCHING
          // -------------------------------------------

          const matchingLeftItems =
            getMatchingLeftItems(
              question.options
            );

          // -------------------------------------------
          // ПЕРЕВІРЯЄМО КОЖНОГО УЧАСНИКА
          // -------------------------------------------

          results.forEach(
            (result) => {
              let answers:
                Record<
                  string,
                  unknown
                > = {};

              // ---------------------------------------
              // Отримуємо answers
              // ---------------------------------------

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
              // ВАЖЛИВО:
              //
              // Використовуємо QUESTION.ID,
              // а НЕ QUESTION.ORDER.
              // ---------------------------------------

              const answerKey =
                String(
                  question.id
                );

              const rawAnswer =
                answers[answerKey];

              const userAnswer =
                getAnswerIds(
                  rawAnswer
                );

              // ---------------------------------------
              // ПРОПУЩЕНЕ
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
              //
              // Порядок відповідей
              // НЕ має значення.
              // ---------------------------------------

              const answerIsCorrect =
                isSameAnswers(
                  userAnswer,
                  correctAnswers
                );

              if (
                answerIsCorrect
              ) {
                correct++;
              } else {
                incorrect++;
              }
            }
          );

          // -------------------------------------------
          // ВІДСОТОК ПРАВИЛЬНИХ
          //
          // Саме ця величина визначає складність
          // завдання в аналітиці.
          // -------------------------------------------

          const correctPercent =
            totalParticipants > 0
              ? Math.round(
                  (correct /
                    totalParticipants) *
                    10000
                ) / 100
              : 0;

          const difficulty =
            getDifficulty(
              correctPercent
            );

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

            total:
              totalParticipants,

            correctPercent,

            difficulty:
              difficulty.label,

            difficultyColor:
              difficulty.color,
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
                sum +
                result.percent,
              0
            ) /
              results.length) *
              100
          ) / 100
        : 0;

    // =================================================
    // ВІДПОВІДЬ
    // =================================================

    return NextResponse.json({
      test: {
        id: test.id,

        title:
          test.title,

        subject:
          test.subject,

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