import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

import {
  calculateQuestionPsychometrics,
  type PsychometricQuestion,
  type PsychometricParticipant,
} from "@/app/lib/analytics/psychometrics";

// =====================================================
// TYPES
// =====================================================

type MatchingLeftItem = {
  leftId: number;
  text: string;
  correctRightId: number;
};

type QuestionType =
  | "SINGLE"
  | "MULTIPLE"
  | "MATCHING"
  | "SEQUENCE"
  | string;

type DifficultyCode =
  | "VERY_EASY"
  | "EASY"
  | "OPTIMAL"
  | "DIFFICULT"
  | "VERY_DIFFICULT";

type DifficultyResult = {
  label: DifficultyCode;
  color: string;
};

// =====================================================
// HELPERS
// =====================================================

/**
 * Визначає код складності за P-value.
 *
 * ВАЖЛИВО:
 * AnalyticsClient.tsx очікує саме коди:
 * VERY_EASY / EASY / OPTIMAL / DIFFICULT / VERY_DIFFICULT
 *
 * P-value у psychometrics.ts уже представлений
 * у відсотках: 0–100.
 */
function getDifficulty(
  correctPercent: number
): DifficultyResult {
  if (correctPercent > 80) {
    return {
      label: "VERY_EASY",
      color: "green",
    };
  }

  if (correctPercent >= 60) {
    return {
      label: "EASY",
      color: "green",
    };
  }

  if (correctPercent >= 40) {
    return {
      label: "OPTIMAL",
      color: "yellow",
    };
  }

  if (correctPercent >= 21) {
    return {
      label: "DIFFICULT",
      color: "orange",
    };
  }

  return {
    label: "VERY_DIFFICULT",
    color: "red",
  };
}

// =====================================================
// JSON / ANSWERS
// =====================================================

function getAnswersRecord(
  value: unknown
): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }

  return {};
}

// =====================================================
// ANSWER IDS
// =====================================================

function getAnswerIds(
  value: unknown
): number[] {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  let parsed: unknown = value;

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => {
      if (typeof item === "number") {
        return item;
      }

      if (typeof item === "string") {
        const number = Number(item);

        return Number.isFinite(number)
          ? number
          : NaN;
      }

      return NaN;
    })
    .filter(
      (item): item is number =>
        Number.isFinite(item) && item > 0
    );
}

// =====================================================
// SINGLE / MULTIPLE
// =====================================================

function isSameAnswers(
  userAnswer: unknown,
  correctAnswers: number[]
): boolean {
  const userIds = getAnswerIds(userAnswer);

  if (userIds.length !== correctAnswers.length) {
    return false;
  }

  const userSet = new Set(userIds);
  const correctSet = new Set(correctAnswers);

  if (userSet.size !== correctSet.size) {
    return false;
  }

  for (const id of correctSet) {
    if (!userSet.has(id)) {
      return false;
    }
  }

  return true;
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
): MatchingLeftItem[] {
  const result: MatchingLeftItem[] = [];

  for (const option of options) {
    const parts = option.text.split("|");

    if (parts.length < 4) {
      continue;
    }

    const prefix = parts[0];

    if (prefix !== "L") {
      continue;
    }

    const leftId = Number(parts[1]);
    const text = parts[2];
    const correctRightId = Number(parts[3]);

    if (
      !Number.isFinite(leftId) ||
      !Number.isFinite(correctRightId)
    ) {
      continue;
    }

    result.push({
      leftId,
      text,
      correctRightId,
    });
  }

  return result.sort(
    (a, b) => a.leftId - b.leftId
  );
}

function isMatchingCorrect(
  userAnswer: unknown,
  leftItems: MatchingLeftItem[]
): boolean {
  const userIds = getAnswerIds(userAnswer);

  if (userIds.length !== leftItems.length) {
    return false;
  }

  for (
    let i = 0;
    i < leftItems.length;
    i++
  ) {
    if (
      userIds[i] !==
      leftItems[i].correctRightId
    ) {
      return false;
    }
  }

  return true;
}

// =====================================================
// GET /api/analytics
// =====================================================

export async function GET(
  request: NextRequest
) {
  try {
    const searchParams =
      request.nextUrl.searchParams;

    // =================================================
    // TEST ID
    // =================================================

    const testIdParam =
      searchParams.get("testId");

    if (!testIdParam) {
      return NextResponse.json(
        {
          error: "Не вказано testId.",
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
          error: "Некоректний testId.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // PARTICIPANT FILTER
    // =================================================

    const participantIdsParam =
      searchParams.get("participantIds");

    let participantIds: number[] = [];

    if (participantIdsParam) {
      let values: string[] = [];

      try {
        if (
          participantIdsParam
            .trim()
            .startsWith("[")
        ) {
          const parsed = JSON.parse(
            participantIdsParam
          );

          if (Array.isArray(parsed)) {
            values = parsed.map(String);
          }
        } else {
          values =
            participantIdsParam.split(",");
        }
      } catch {
        values =
          participantIdsParam.split(",");
      }

      participantIds = values
        .map((id) => Number(id.trim()))
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        );
    }

    // =================================================
    // TEST
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
      });

    if (!test) {
      return NextResponse.json(
        {
          error: "Тест не знайдено.",
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

          ...(participantIds.length > 0
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

          session: {
            select: {
              id: true,
              participantId: true,
            },
          },
        },
      });

    // =================================================
    // PARTICIPANTS
    // =================================================

    const participants =
      results.map((result) => ({
        id: result.id,

        participantId:
          result.session?.participantId ??
          null,

        sessionId:
          result.session?.id ?? null,

        firstName:
          result.firstName,

        lastName:
          result.lastName,

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

    // =================================================
    // PSYCHOMETRIC PARTICIPANTS
    // =================================================

    const psychometricParticipants: PsychometricParticipant[] =
      results.map((result) => ({
        id: result.id,

        earnedPoints:
          result.earnedPoints,

        answers:
          result.answers,
      }));

    // =================================================
    // QUESTIONS
    // =================================================

    const questions =
      test.questions.map(
        (testQuestion) => {
          const question =
            testQuestion.question;

          // ---------------------------------------------
          // BASIC STATISTICS
          // ---------------------------------------------

          let correct = 0;
          let incorrect = 0;
          let skipped = 0;

          const answersRecord =
            results.map((result) => ({
              result,

              answers:
                getAnswersRecord(
                  result.answers
                ),
            }));

          const correctOptions =
            question.answerOptions
              .filter(
                (option) =>
                  option.isCorrect
              )
              .map(
                (option) => option.id
              );

          const matchingLeftItems =
            question.type ===
            "MATCHING"
              ? getMatchingLeftItems(
                  question.answerOptions
                )
              : [];

          // ---------------------------------------------
          // ANALYZE EACH PARTICIPANT
          // ---------------------------------------------

          for (const item of answersRecord) {
            const rawAnswer =
              item.answers[
                String(question.id)
              ] ??
              item.answers[
                question.id
              ];

            const answerIds =
              getAnswerIds(
                rawAnswer
              );

            // -------------------------------------------
            // SKIPPED
            // -------------------------------------------

            if (
              answerIds.length === 0
            ) {
              skipped++;
              continue;
            }

            let isCorrect = false;

            // -------------------------------------------
            // MATCHING
            // -------------------------------------------

            if (
              question.type ===
              "MATCHING"
            ) {
              isCorrect =
                isMatchingCorrect(
                  rawAnswer,
                  matchingLeftItems
                );
            }

            // -------------------------------------------
            // SINGLE / MULTIPLE
            // -------------------------------------------

            else if (
              question.type ===
                "SINGLE" ||
              question.type ===
                "MULTIPLE"
            ) {
              isCorrect =
                isSameAnswers(
                  rawAnswer,
                  correctOptions
                );
            }

            // -------------------------------------------
            // SEQUENCE
            // -------------------------------------------

            else if (
              question.type ===
              "SEQUENCE"
            ) {
              isCorrect =
                answerIds.length ===
                  correctOptions.length &&
                answerIds.every(
                  (id, index) =>
                    id ===
                    correctOptions[
                      index
                    ]
                );
            }

            // -------------------------------------------
            // OTHER
            // -------------------------------------------

            else {
              isCorrect =
                isSameAnswers(
                  rawAnswer,
                  correctOptions
                );
            }

            if (isCorrect) {
              correct++;
            } else {
              incorrect++;
            }
          }

          // ---------------------------------------------
          // PERCENTAGES
          // ---------------------------------------------

          const totalParticipants =
            results.length;

          const correctPercent =
            totalParticipants > 0
              ? (correct /
                  totalParticipants) *
                100
              : 0;

          const incorrectPercent =
            totalParticipants > 0
              ? (incorrect /
                  totalParticipants) *
                100
              : 0;

          const skippedPercent =
            totalParticipants > 0
              ? (skipped /
                  totalParticipants) *
                100
              : 0;

          // ---------------------------------------------
          // PSYCHOMETRICS
          // ---------------------------------------------

          const psychometricQuestion: PsychometricQuestion =
            {
              id: question.id,

              order:
                testQuestion.order,

              type:
                question.type as QuestionType,

              points:
                question.points,

              answerOptions:
                question.answerOptions.map(
                  (option) => ({
                    id: option.id,

                    order:
                      option.order,

                    text:
                      option.text,

                    isCorrect:
                      option.isCorrect,
                  })
                ),
            };

          const psychometrics =
            calculateQuestionPsychometrics(
              psychometricQuestion,
              psychometricParticipants
            );

          // ---------------------------------------------
          // DIFFICULTY
          // ---------------------------------------------

          /**
           * P-value вже є відсотком 0–100.
           *
           * Якщо даних недостатньо, pValue === null.
           * AnalyticsClient наразі не має окремого
           * INSUFFICIENT_DATA enum, тому повертаємо
           * OPTIMAL із сірим кольором.
           *
           * Це не впливає на розрахунок psychometrics.
           */
          const difficulty =
            psychometrics.pValue === null
              ? {
                  label: "OPTIMAL" as DifficultyCode,
                  color: "gray",
                }
              : getDifficulty(
                  psychometrics.pValue
                );

          // ---------------------------------------------
          // QUESTION RESULT
          // ---------------------------------------------

          return {
            id: question.id,

            order:
              testQuestion.order,

            type:
              question.type,

            text:
              question.text,

            points:
              question.points,

            // -------------------------------------------
            // ANSWER OPTIONS
            // -------------------------------------------

            answerOptions:
              question.answerOptions.map(
                (option) => ({
                  id: option.id,

                  order:
                    option.order,

                  text:
                    option.text,

                  isCorrect:
                    option.isCorrect,
                })
              ),

            // -------------------------------------------
            // BASIC STATISTICS
            // -------------------------------------------

            correct,

            incorrect,

            skipped,

            total:
              totalParticipants,

            correctPercent,

            incorrectPercent,

            skippedPercent,

            // -------------------------------------------
            // DIFFICULTY
            // -------------------------------------------

            difficulty:
              difficulty.label,

            difficultyColor:
              difficulty.color,

            // -------------------------------------------
            // PSYCHOMETRICS
            // -------------------------------------------

            psychometrics,
          };
        }
      );

    // =================================================
    // SUMMARY
    // =================================================

    const scores =
      results.map(
        (result) =>
          result.earnedPoints
      );

    const percents =
      results.map(
        (result) =>
          result.percent
      );

    const participantsCount =
      results.length;

    const maxScore =
      participantsCount > 0
        ? Math.max(...scores)
        : 0;

    const minScore =
      participantsCount > 0
        ? Math.min(...scores)
        : 0;

    const averageScore =
      participantsCount > 0
        ? scores.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / participantsCount
        : 0;

    const averagePercent =
      participantsCount > 0
        ? percents.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / participantsCount
        : 0;

    // =================================================
    // RESPONSE
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
          participantsCount,

        maxScore,

        minScore,

        averageScore,

        averagePercent,
      },

      participants,

      questions,
    });
  } catch (error) {
    console.error(
      "[GET /api/analytics] Error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Помилка під час формування аналітики",
      },
      {
        status: 500,
      }
    );
  }
}