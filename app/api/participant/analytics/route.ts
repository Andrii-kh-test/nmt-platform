import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth/session";

// =====================================================
// TYPES
// =====================================================

type AnswersRecord = Record<string, unknown>;

type QuestionResult = {
  earnedPoints: number;
  status:
    | "correct"
    | "partial"
    | "incorrect"
    | "skipped";
  percent: number;
  details: unknown | null;
};

// =====================================================
// HELPERS
// =====================================================

function getAnswersRecord(
  answers: unknown
): AnswersRecord {
  if (
    answers &&
    typeof answers === "object" &&
    !Array.isArray(answers)
  ) {
    return answers as AnswersRecord;
  }

  if (typeof answers === "string") {
    try {
      const parsed = JSON.parse(answers);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed as AnswersRecord;
      }
    } catch {
      return {};
    }
  }

  return {};
}

// =====================================================
// ОТРИМАННЯ ID ВІДПОВІДЕЙ
// =====================================================

function getAnswerIds(
  value: unknown
): number[] {
  let source = value;

  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return [];
    }
  }

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
// =====================================================

function isSameAnswers(
  userAnswer: number[],
  correctAnswers: number[]
): boolean {
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
      normalizedUserAnswer[index] ===
      id
  );
}

// =====================================================
// MATCHING
//
// Формат answerOptions:
// L|leftId|text|correctRightId
//
// Наприклад:
// L|1|Перший лівий елемент|5
// L|2|Другий лівий елемент|7
// L|3|Третій лівий елемент|6
// L|4|Четвертий лівий елемент|8
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
      String(option.text ?? "").startsWith("L|")
    )
    .map((option) => {
      const parts =
        String(option.text).split("|");

      const leftId = Number(parts[1]);
      const correctRightId = Number(parts[3]);

      return {
        id: leftId,
        text: parts[2] ?? "",
        correctRightId,
      };
    })
    .filter(
      (item) =>
        Number.isInteger(item.id) &&
        item.id > 0 &&
        Number.isInteger(
          item.correctRightId
        ) &&
        item.correctRightId > 0
    )
    .sort(
      (a, b) =>
        a.id - b.id
    );
}

// =====================================================
// DIFFICULTY
// =====================================================

function getDifficulty(
  percent: number,
  skipped: boolean
): string {
  if (skipped) {
    return "Пропущено";
  }

  if (percent > 80) {
    return "Дуже легке";
  }

  if (percent >= 60) {
    return "Легке";
  }

  if (percent >= 40) {
    return "Оптимальне";
  }

  if (percent >= 21) {
    return "Складне";
  }

  return "Дуже складне";
}

// =====================================================
// QUESTION RESULT
// =====================================================

function getQuestionResult(
  question: {
    id: number;
    type: string;
    text: string;
    points: number;
    answerOptions: Array<{
      id: number;
      order: number;
      text: string;
      isCorrect: boolean;
    }>;
  },
  rawAnswer: unknown
): QuestionResult {
  const points = Number(
    question.points ?? 0
  );

  // ===================================================
  // ВІДПОВІДЬ КОРИСТУВАЧА
  // ===================================================

  const userAnswer =
    getAnswerIds(rawAnswer);

  // ===================================================
  // ПРОПУЩЕНО
  // ===================================================

  if (userAnswer.length === 0) {
    return {
      earnedPoints: 0,
      status: "skipped",
      percent: 0,
      details: null,
    };
  }

  // ===================================================
  // MATCHING
  // ===================================================

  if (
    question.type === "matching"
  ) {
    const matchingLeftItems =
      getMatchingLeftItems(
        question.answerOptions
      );

    const totalPairs =
      matchingLeftItems.length;

    // Некоректна структура matching
    if (totalPairs === 0) {
      return {
        earnedPoints: 0,
        status: "incorrect",
        percent: 0,
        details: {
          type: "matching",
          totalPairs: 0,
          correctPairs: 0,
          userAnswer,
          correctPairsData: [],
        },
      };
    }

    // =================================================
    // ПІДРАХУНОК ПРАВИЛЬНИХ ПАР
    // =================================================

    let correctPairs = 0;

    const correctPairsData =
      matchingLeftItems.map(
        (leftItem, index) => {
          const userRightId =
            userAnswer[index] ?? null;

          const isCorrect =
            userRightId !== null &&
            userRightId ===
              leftItem.correctRightId;

          if (isCorrect) {
            correctPairs++;
          }

          return {
            leftId:
              leftItem.id,

            userRightId,

            correctRightId:
              leftItem.correctRightId,

            isCorrect,
          };
        }
      );

    // =================================================
    // ВІДСОТОК
    // =================================================

    const percent =
      Math.round(
        (correctPairs /
          totalPairs) *
          100
      );

    // =================================================
    // ЧАСТКОВІ БАЛИ
    //
    // 1/4 -> 25% балів
    // 2/4 -> 50% балів
    // 3/4 -> 75% балів
    // 4/4 -> 100% балів
    // =================================================

    const earnedPoints =
      Math.round(
        points *
          (correctPairs /
            totalPairs) *
          100
      ) / 100;

    // =================================================
    // ПОВНІСТЮ ПРАВИЛЬНО
    // =================================================

    if (
      correctPairs ===
      totalPairs
    ) {
      return {
        earnedPoints: points,
        status: "correct",
        percent: 100,

        details: {
          type: "matching",
          totalPairs,
          correctPairs,
          userAnswer,
          correctPairsData,
        },
      };
    }

    // =================================================
    // ЧАСТКОВО ПРАВИЛЬНО
    // =================================================

    if (correctPairs > 0) {
      return {
        earnedPoints,
        status: "partial",
        percent,

        details: {
          type: "matching",
          totalPairs,
          correctPairs,
          userAnswer,
          correctPairsData,
        },
      };
    }

    // =================================================
    // ПОВНІСТЮ НЕПРАВИЛЬНО
    // =================================================

    return {
      earnedPoints: 0,
      status: "incorrect",
      percent: 0,

      details: {
        type: "matching",
        totalPairs,
        correctPairs: 0,
        userAnswer,
        correctPairsData,
      },
    };
  }

  // ===================================================
  // SINGLE / MULTIPLE
  // ===================================================

  const correctAnswers =
    question.answerOptions
      .filter(
        (option) =>
          option.isCorrect === true
      )
      .map(
        (option) => option.id
      );

  const answerIsCorrect =
    isSameAnswers(
      userAnswer,
      correctAnswers
    );

  // ===================================================
  // ПРАВИЛЬНО
  // ===================================================

  if (answerIsCorrect) {
    return {
      earnedPoints: points,
      status: "correct",
      percent: 100,

      details: {
        type: question.type,
        userAnswer,
        correctAnswer:
          correctAnswers,
      },
    };
  }

  // ===================================================
  // НЕПРАВИЛЬНО
  // ===================================================

  return {
    earnedPoints: 0,
    status: "incorrect",
    percent: 0,

    details: {
      type: question.type,
      userAnswer,
      correctAnswer:
        correctAnswers,
    },
  };
}

// =====================================================
// GET
// =====================================================

export async function GET(
  request: NextRequest
) {
  try {
    // =================================================
    // USER
    // =================================================

    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Не авторизовано",
        },
        {
          status: 401,
        }
      );
    }

    // =================================================
    // RESULT ID
    // =================================================

    const {
      searchParams,
    } = new URL(request.url);

    const resultIdParam =
      searchParams.get(
        "resultId"
      );

    const resultId = Number(
      resultIdParam
    );

    if (
      !Number.isInteger(resultId) ||
      resultId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Некоректний resultId",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // RESULT
    // =================================================

    const result =
      await prisma.testResult.findFirst(
        {
          where: {
            id: resultId,

            session: {
              participant: {
                userId: user.id,
              },
            },
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

            startedAt: true,
            finishedAt: true,
            createdAt: true,

            session: {
              select: {
                startedAt: true,

                participant: {
                  select: {
                    userId: true,
                  },
                },
              },
            },

            test: {
              select: {
                id: true,
                title: true,
                subject: true,

                questions: {
                  orderBy: {
                    order: "asc",
                  },

                  select: {
                    id: true,
                    order: true,

                    question: {
                      select: {
                        id: true,
                        type: true,
                        text: true,
                        points: true,

                        answerOptions: {
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
                },
              },
            },

            // Налаштування перегляду результату,
            // яке зберігається разом із результатом.
            allowParticipantDetails:
              true,
          },
        }
      );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Результат не знайдено",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // TIME SPENT
    //
    // Беремо вже збережений час виконання
    // окремо, не змінюючи основний Prisma select.
    // =================================================

    const resultTime =
      await prisma.testResult.findUnique(
        {
          where: {
            id: result.id,
          },
          select: {
            timeSpent: true,
          },
        }
      );

    // =================================================
    // ANSWERS
    // =================================================

    const answers =
      getAnswersRecord(
        result.answers
      );

    // =================================================
    // GROUP STATISTICS
    // =================================================

    const allResults =
      await prisma.testResult.findMany(
        {
          where: {
            testId:
              result.test.id,
          },

          select: {
            earnedPoints: true,
            maxPoints: true,
            percent: true,
          },
        }
      );

    const participants =
      allResults.length;

    const scores =
      allResults.map(
        (item) =>
          Number(
            item.earnedPoints ?? 0
          )
      );

    const percentages =
      allResults.map(
        (item) =>
          Number(
            item.percent ?? 0
          )
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
        ? scores.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / scores.length
        : 0;

    const averagePercent =
      percentages.length > 0
        ? percentages.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / percentages.length
        : 0;

    // =================================================
    // PERCENTILE
    // =================================================

    const participantScore =
      Number(
        result.earnedPoints ?? 0
      );

    const belowCount =
      scores.filter(
        (score) =>
          score <
          participantScore
      ).length;

    const percentile =
      participants > 0
        ? Math.round(
            (belowCount /
              participants) *
              100
          )
        : 0;

    const differenceFromAverage =
      participantScore -
      averageScore;

    // =================================================
    // QUESTIONS
    // =================================================

    const questions =
      result.test.questions.map(
        (
          testQuestion,
          index
        ) => {
          const question =
            testQuestion.question;

          // ВАЖЛИВО:
          // answers зберігаються за question.id
          const rawAnswer =
            answers[
              String(
                question.id
              )
            ];

          const questionResult =
            getQuestionResult(
              question,
              rawAnswer
            );

          const skipped =
            questionResult.status ===
            "skipped";

          const difficulty =
            getDifficulty(
              questionResult.percent,
              skipped
            );

          // =================================================
          // ПОВНІ ДЕТАЛІ ЗАВДАННЯ
          //
          // Вони формуються ОКРЕМО від результату
          // виконання, тому будуть доступні навіть
          // для пропущеного завдання.
          // =================================================

          const questionDetails =
            result.allowParticipantDetails
              ? {
                  id:
                    question.id,

                  order:
                    testQuestion.order,

                  type:
                    question.type,

                  text:
                    question.text,

                  points:
                    Number(
                      question.points ?? 0
                    ),

                  options:
                    question.answerOptions,

                  participantAnswer:
                    rawAnswer ?? null,
                }
              : null;

          return {
            id:
              question.id,

            testQuestionId:
              testQuestion.id,

            number:
              index + 1,

            order:
              testQuestion.order,

            text:
              question.text,

            type:
              question.type,

            points:
              Number(
                question.points ?? 0
              ),

            earnedPoints:
              questionResult.earnedPoints,

            status:
              questionResult.status,

            percent:
              questionResult.percent,

            difficulty,

            // Якщо адміністратор дозволив —
            // повертаємо ПОВНЕ завдання.
            //
            // Якщо заборонив —
            // details = null.
            details:
              questionDetails,
          };
        }
      );

    // =================================================
    // RESPONSE
    // =================================================

    return NextResponse.json({
      success: true,

      test: {
        id:
          result.test.id,

        title:
          result.test.title,

        subject:
          result.test.subject,

        maxPoints:
          Number(
            result.maxPoints ?? 0
          ),
      },

      groupStatistics: {
        participants,

        maxScore,

        minScore,

        averageScore:
          Math.round(
            averageScore * 100
          ) / 100,

        averagePercent:
          Math.round(
            averagePercent * 100
          ) / 100,
      },

      participant: {
        resultId:
          result.id,

        earnedPoints:
          Number(
            result.earnedPoints ?? 0
          ),

        maxPoints:
          Number(
            result.maxPoints ?? 0
          ),

        percent:
          Number(
            result.percent ?? 0
          ),

        correct:
          Number(
            result.correct ?? 0
          ),

        incorrect:
          Number(
            result.incorrect ?? 0
          ),

        skipped:
          Number(
            result.skipped ?? 0
          ),

        timeSpent:
          resultTime?.timeSpent ??
          null,

        createdAt:
          result.createdAt,

        finishedAt:
          result.finishedAt,

        startedAt:
          result.startedAt,

        differenceFromAverage:
          Math.round(
            differenceFromAverage *
              100
          ) / 100,

        percentile,
      },

      allowParticipantDetails:
        result.allowParticipantDetails,

      questions,
    });
  } catch (error) {
    console.error(
      "Participant analytics error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Не вдалося завантажити аналітику",
      },
      {
        status: 500,
      }
    );
  }
}