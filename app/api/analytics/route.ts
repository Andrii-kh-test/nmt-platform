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
// ПОРІВНЯННЯ ВІДПОВІДЕЙ
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
      userAnswer[index] ===
      leftItem.correctRightId
  );
}

// =====================================================
// ОТРИМАННЯ ВІДПОВІДІ З РЕЗУЛЬТАТУ
// =====================================================
//
// Новий формат:
//
// {
//   "629": [2962]
// }
//
// Старий формат:
//
// {
//   "781": [3671]
// }
//
// Для старого формату визначаємо питання
// за його позицією в тесті.
//
// =====================================================

function getRawAnswer(
  answers: Record<string, unknown>,
  questionId: number,
  questionOrder: number,
  allQuestions: Array<{
    id: number;
    order: number;
  }>
): {
  value: unknown;
  source: "id" | "order" | "position" | "none";
} {
  // ---------------------------------------------------
  // 1. Сучасний формат: ID питання
  // ---------------------------------------------------

  const idKey = String(questionId);

  if (
    Object.prototype.hasOwnProperty.call(
      answers,
      idKey
    )
  ) {
    return {
      value: answers[idKey],
      source: "id",
    };
  }

  // ---------------------------------------------------
  // 2. Формат за order
  // ---------------------------------------------------

  const orderKey = String(questionOrder);

  if (
    Object.prototype.hasOwnProperty.call(
      answers,
      orderKey
    )
  ) {
    return {
      value: answers[orderKey],
      source: "order",
    };
  }

  // ---------------------------------------------------
  // 3. Старий формат
  //
  // Наприклад:
  //
  // 781 -> питання 1
  // 782 -> питання 2
  // 783 -> питання 3
  //
  // Object.keys() зберігає порядок
  // властивостей JSON.
  // ---------------------------------------------------

  const questionIndex =
    allQuestions.findIndex(
      (item) => item.id === questionId
    );

  if (questionIndex >= 0) {
    const answerKeys =
      Object.keys(answers);

    const oldKey =
      answerKeys[questionIndex];

    if (oldKey !== undefined) {
      return {
        value: answers[oldKey],
        source: "position",
      };
    }
  }

  return {
    value: undefined,
    source: "none",
  };
}

// =====================================================
// ПЕРЕТВОРЕННЯ СТАРИХ ID ВАРІАНТІВ
// =====================================================
//
// Якщо результат був створений до зміни ID,
// у ньому можуть бути старі AnswerOption.id.
//
// Ми не можемо математично встановити,
// який саме старий ID відповідає новому.
//
// Тому для старого формату використовуємо
// позицію варіанта.
//
// =====================================================

function convertAnswerIdsByOrder(
  userAnswer: number[],
  options: Array<{
    id: number;
    order: number;
  }>,
  source:
    | "id"
    | "order"
    | "position"
    | "none"
): number[] {
  // Новий формат — ID вже актуальні.
  if (source === "id") {
    return userAnswer;
  }

  // Якщо відповіді відсутні.
  if (userAnswer.length === 0) {
    return [];
  }

  // Для старого формату:
  //
  // Беремо порядковий номер старого
  // варіанта за позицією ID у масиві.
  //
  // Це працює лише тоді, коли порядок
  // варіантів не змінювався.
  const sortedOptions = [...options].sort(
    (a, b) => a.order - b.order
  );

  const result: number[] = [];

  for (const oldId of userAnswer) {
    const numericId = Number(oldId);

    // Якщо ID уже є серед поточних —
    // залишаємо його.
    const existing = sortedOptions.find(
      (option) => option.id === numericId
    );

    if (existing) {
      result.push(existing.id);
      continue;
    }

    // -------------------------------------------------
    // ВАЖЛИВО:
    //
    // Старий ID не дає можливості визначити
    // позицію варіанта без старої структури.
    //
    // Тому нижче залишаємо ID як є.
    //
    // Це дозволяє не вигадувати відповідність.
    // -------------------------------------------------

    result.push(numericId);
  }

  return result;
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
          message:
            "Не вказано ID тесту.",
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
          message:
            "Некоректний ID тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // PARTICIPANTS
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
    // TEST
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
    // RESULTS
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

        orderBy: {
          createdAt: "asc",
        },
      });

    // =================================================
    // PARTICIPANTS
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
    // QUESTION STATISTICS
    // =================================================

    const questionStatistics =
      test.questions.map(
        (question) => {
          let correct = 0;
          let incorrect = 0;
          let skipped = 0;

          // -------------------------------------------
          // CORRECT ANSWERS
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
          // MATCHING
          // -------------------------------------------

          const matchingLeftItems =
            getMatchingLeftItems(
              question.options
            );

          // -------------------------------------------
          // PARTICIPANTS
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
              // ЗНАХОДИМО ВІДПОВІДЬ
              // ---------------------------------------

              const raw =
                getRawAnswer(
                  answers,
                  question.id,
                  question.order,
                  test.questions
                );

              const rawAnswer =
                raw.value;

              // ---------------------------------------
              // ПЕРЕТВОРЮЄМО
              // ---------------------------------------

              let userAnswer =
                getAnswerIds(
                  rawAnswer
                );

              userAnswer =
                convertAnswerIdsByOrder(
                  userAnswer,
                  question.options,
                  raw.source
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
          // PERCENTAGES
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
          // FULL QUESTION DATA
          // -------------------------------------------

          return {
            id: question.id,

            order: question.order,

            type: question.type,

            text: question.text,

            points: question.points,

            options:
              question.options.map(
                (option) => ({
                  id: option.id,
                  order: option.order,
                  text: option.text,
                  isCorrect:
                    option.isCorrect,
                })
              ),

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
    // SCORES
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
    // RESPONSE
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