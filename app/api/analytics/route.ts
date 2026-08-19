import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// СКЛАДНІСТЬ
// =====================================================
//
// > 80 %   — 🟢 Дуже легке
// 60–79 %  — 🟢 Легке
// 40–59 %  — 🟡 Оптимальне
// 21–39 %  — 🟠 Складне
// ≤ 20 %   — 🔴 Дуже складне
//
// =====================================================

function getDifficulty(
  correctPercent: number
) {
  if (correctPercent > 80) {
    return {
      label: "🟢 Дуже легке",
      color: "green",
    };
  }

  if (correctPercent >= 60) {
    return {
      label: "🟢 Легке",
      color: "green",
    };
  }

  if (correctPercent >= 40) {
    return {
      label: "🟡 Оптимальне",
      color: "yellow",
    };
  }

  if (correctPercent >= 21) {
    return {
      label: "🟠 Складне",
      color: "orange",
    };
  }

  return {
    label: "🔴 Дуже складне",
    color: "red",
  };
}

// =====================================================
// ОТРИМАННЯ ID ВІДПОВІДЕЙ
// =====================================================
//
// Підтримує:
//
// [3671]
// [4, 3, 1, 5]
//
// а також JSON-рядок:
// "[3671]"
// =====================================================

function getAnswerIds(
  value: unknown
): number[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) =>
        Number.isInteger(item)
      );
  }

  if (typeof value === "string") {
    try {
      const parsed =
        JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => Number(item))
          .filter((item) =>
            Number.isInteger(item)
          );
      }
    } catch {
      return [];
    }
  }

  return [];
}

// =====================================================
// ПОРІВНЯННЯ ЗВИЧАЙНИХ ВІДПОВІДЕЙ
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

  return correctAnswers.every(
    (id) =>
      userAnswer.includes(id)
  );
}

// =====================================================
// ОТРИМАННЯ MATCHING-ПАР
// =====================================================
//
// У поточній структурі matching-дані
// зберігаються у text AnswerOption
// у форматі:
//
// L|1|текст|5
//
// де:
// 1 — ID лівого елемента
// 5 — правильний ID правого елемента
//
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
        correctRightId: Number(
          parts[3]
        ),
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
// =====================================================
//
// userAnswer:
//
// [2, 1, 4, 3]
//
// означає:
//
// перший left → right 2
// другий left → right 1
// третій left → right 4
// четвертий left → right 3
//
// =====================================================

function isMatchingCorrect(
  userAnswer: number[],
  leftItems: Array<{
    id: number;
    text: string;
    correctRightId: number;
  }>
) {
  if (
    leftItems.length === 0
  ) {
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
    // ВИБРАНІ УЧАСНИКИ
    // =================================================
    //
    // participantIds — це ID TestResult.
    //
    // Наприклад:
    //
    // ?participants=[15,16,17]
    //
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

        if (
          !Array.isArray(parsed)
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

        participantIds =
          parsed
            .map((id) =>
              Number(id)
            )
            .filter(
              (id) =>
                Number.isInteger(
                  id
                ) && id > 0
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
    // СТАТИСТИКА ЗАВДАНЬ
    // =================================================

    const questionStatistics =
      test.questions.map(
        (question) => {
          let correct = 0;

          let incorrect = 0;

          let skipped = 0;

          // ---------------------------------------------
          // Правильні відповіді для SINGLE / MULTIPLE
          // ---------------------------------------------

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

          // ---------------------------------------------
          // Matching
          // ---------------------------------------------

          const matchingLeftItems =
            getMatchingLeftItems(
              question.options
            );

          // ---------------------------------------------
          // Перевіряємо кожного учасника
          // ---------------------------------------------

          results.forEach(
            (result) => {
              // -----------------------------------------
              // Відповіді результату
              // -----------------------------------------

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

              // -----------------------------------------
              // Ключ питання
              // -----------------------------------------

              // -----------------------------------------
// Визначаємо відповідь учасника
//
// Основний ключ:
//   ID питання.
//
// Для старих результатів, де відповіді
// могли бути збережені за порядковим
// номером питання, використовуємо
// question.order як резервний ключ.
// -----------------------------------------

const questionIdKey =
  String(question.id);

const questionOrderKey =
  String(question.order);

let rawAnswer: unknown;

if (
  Object.prototype.hasOwnProperty.call(
    answers,
    questionIdKey
  )
) {
  rawAnswer =
    answers[questionIdKey];
} else if (
  Object.prototype.hasOwnProperty.call(
    answers,
    questionOrderKey
  )
) {
  rawAnswer =
    answers[questionOrderKey];
} else {
  rawAnswer =
    undefined;
}

              // -----------------------------------------
              // Перетворюємо відповідь
              // -----------------------------------------

              const userAnswer =
                getAnswerIds(
                  rawAnswer
                );

              // -----------------------------------------
              // Немає відповіді
              // -----------------------------------------

              if (
                userAnswer.length ===
                0
              ) {
                skipped++;
                return;
              }

              // -----------------------------------------
              // MATCHING
              // -----------------------------------------

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

              // -----------------------------------------
              // SINGLE / MULTIPLE
              // -----------------------------------------

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

          // =================================================
          // ВІДСОТКИ
          // =================================================

          const correctPercent =
            totalParticipants >
            0
              ? Math.round(
                  (correct /
                    totalParticipants) *
                    100
                )
              : 0;

          const incorrectPercent =
            totalParticipants >
            0
              ? Math.round(
                  (incorrect /
                    totalParticipants) *
                    100
                )
              : 0;

          const skippedPercent =
            totalParticipants >
            0
              ? Math.round(
                  (skipped /
                    totalParticipants) *
                    100
                )
              : 0;

          // =================================================
          // ПОВНА ІНФОРМАЦІЯ ПРО ВАРІАНТИ
          // =================================================

          const options =
            question.options.map(
              (option) => ({
                id: option.id,

                order:
                  option.order,

                text:
                  option.text,

                isCorrect:
                  option.isCorrect,
              })
            );

          // =================================================
          // ПОВЕРТАЄМО ПИТАННЯ
          // =================================================

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

            options,

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

    // =====================================================
    // ЗАГАЛЬНА СТАТИСТИКА
    // =====================================================

    const scores =
      results.map(
        (result) =>
          result.earnedPoints
      );

    // =====================================================
    // НАЙВИЩИЙ ФАКТИЧНИЙ РЕЗУЛЬТАТ
    // =====================================================

    const maxScore =
      scores.length > 0
        ? Math.max(...scores)
        : 0;

    // =====================================================
    // НАЙНИЖЧИЙ ФАКТИЧНИЙ РЕЗУЛЬТАТ
    // =====================================================

    const minScore =
      scores.length > 0
        ? Math.min(...scores)
        : 0;

    // =====================================================
    // СЕРЕДНІЙ РЕЗУЛЬТАТ
    // =====================================================

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

    // =====================================================
    // СЕРЕДНІЙ ВІДСОТОК
    // =====================================================

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

    // =====================================================
    // ВІДПОВІДЬ API
    // =====================================================

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

        // Максимум, який реально
        // набрав один із учасників
        maxScore,

        // Мінімум, який реально
        // набрав один із учасників
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