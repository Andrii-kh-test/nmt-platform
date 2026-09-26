import { NextRequest, NextResponse } from "next/server";
import React from "react";
import {
  renderToBuffer,
  type DocumentProps,
} from "@react-pdf/renderer";

import { prisma } from "@/app/lib/prisma";

import AnalyticsPdfDocument from "@/app/components/pdf/AnalyticsPdfDocument";

import {
  calculateQuestionPsychometrics,
  type PsychometricQuestion,
  type PsychometricParticipant,
} from "@/app/lib/analytics/psychometrics";

// =====================================================
// RUNTIME
// =====================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =====================================================
// TYPES
// =====================================================

type PdfMode = "simple" | "advanced";

type QuestionType =
  | "SINGLE"
  | "MULTIPLE"
  | "MATCHING"
  | "SEQUENCE"
  | string;

type MatchingLeftItem = {
  leftId: number;
  text: string;
  correctRightId: number;
};

// =====================================================
// HELPERS
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
// ANSWERS
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

function getAnswerIds(value: unknown): number[] {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  let parsed = value;

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
        Number.isFinite(item) &&
        item > 0
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

  if (
    userIds.length !==
    correctAnswers.length
  ) {
    return false;
  }

  const userSet = new Set(userIds);
  const correctSet = new Set(correctAnswers);

  if (
    userSet.size !==
    correctSet.size
  ) {
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

    if (parts[0] !== "L") {
      continue;
    }

    const leftId = Number(parts[1]);
    const text = parts[2] ?? "";
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

  if (
    userIds.length !==
    leftItems.length
  ) {
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
// PARTICIPANT FILTER
// =====================================================

function parseParticipantIds(
  value: string | null
): number[] {
  if (!value) {
    return [];
  }

  let values: string[] = [];

  try {
    if (value.trim().startsWith("[")) {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        values = parsed.map(String);
      }
    } else {
      values = value.split(",");
    }
  } catch {
    values = value.split(",");
  }

  return values
    .map((id) => Number(id.trim()))
    .filter(
      (id) =>
        Number.isInteger(id) &&
        id > 0
    );
}

// =====================================================
// FILENAME
// =====================================================

function sanitizeFileName(
  value: string
): string {
  return value
    .replace(
      /[<>:"/\\|?*\u0000-\u001F]/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

// =====================================================
// GET
// =====================================================

export async function GET(
  request: NextRequest
) {
  try {
    const searchParams =
      request.nextUrl.searchParams;

    // =================================================
    // PARAMETERS
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

if (!Number.isInteger(testId) || testId <= 0) {
  return NextResponse.json(
    {
      error: "Некоректний testId.",
    },
    {
      status: 400,
    }
  );
}

    const modeParam =
      searchParams.get("mode");

    const mode: PdfMode =
      modeParam === "advanced"
        ? "advanced"
        : "simple";

    if (!testId) {
      return NextResponse.json(
        {
          error:
            "Не вказано testId.",
        },
        {
          status: 400,
        }
      );
    }

    const participantIds =
      parseParticipantIds(
        searchParams.get(
          "participantIds"
        )
      );

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
          error:
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
    // PARTICIPANTS
    // =================================================

    const participants =
      results.map((result) => ({
        id: result.id,

        participantId:
          result.session?.participantId ??
          null,

        sessionId:
          result.session?.id ??
          null,

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
    // QUESTIONS
    // =================================================

    const questions =
      test.questions.map(
        (testQuestion) => {
          const question =
            testQuestion.question;

          // -------------------------------------------
          // BASIC STATISTICS
          // -------------------------------------------

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
                (option) =>
                  option.id
              );

          const matchingLeftItems =
            question.type === "MATCHING"
              ? getMatchingLeftItems(
                  question.answerOptions
                )
              : [];

          for (
            const item of answersRecord
          ) {
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

            if (
              answerIds.length === 0
            ) {
              skipped++;
              continue;
            }

            let isCorrect = false;

            if (
              question.type ===
              "MATCHING"
            ) {
              isCorrect =
                isMatchingCorrect(
                  rawAnswer,
                  matchingLeftItems
                );
            } else if (
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
            } else if (
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
            } else {
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

          const total =
            results.length;

          const correctPercent =
            total > 0
              ? (correct / total) *
                100
              : 0;

          const incorrectPercent =
            total > 0
              ? (incorrect / total) *
                100
              : 0;

          const skippedPercent =
            total > 0
              ? (skipped / total) *
                100
              : 0;

          // -------------------------------------------
          // PSYCHOMETRICS
          // -------------------------------------------

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

          const difficulty =
            getDifficulty(
              psychometrics.pValue ??
                correctPercent
            );

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

  answerOptions:
    question.answerOptions.map(
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
  total,

  correctPercent,
  incorrectPercent,
  skippedPercent,

  difficulty:
    difficulty.label,

  difficultyColor:
    difficulty.color,

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
          Number(
            result.earnedPoints
          )
      );

    const percents =
      results.map(
        (result) =>
          Number(
            result.percent
          )
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
    // ANALYTICS OBJECT
    // =================================================

    const analytics = {
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
          participantsCount,

        maxScore,
        minScore,
        averageScore,
        averagePercent,
      },

      participants,

      questions,
    };

    // =================================================
    // PDF DOCUMENT
    // =================================================
    //
    // route.ts не підтримує JSX,
    // тому створюємо React-елемент через createElement.
    //
    // ВАЖЛИВО:
    // новий AnalyticsPdfDocument отримує
    // тільки analytics + mode.
    // =================================================

    const document =
  React.createElement(
    AnalyticsPdfDocument,
    {
      analytics,
      mode,
    }
  ) as React.ReactElement<DocumentProps>;

const pdfBuffer =
  await renderToBuffer(
    document
  );

    // =================================================
    // FILE NAME
    // =================================================

    const safeTitle =
      sanitizeFileName(
        test.title ||
          `test-${test.id}`
      );

    const reportName =
      mode === "advanced"
        ? "розширений-звіт"
        : "простий-звіт";

    const fileName =
      `NMT-Platform-${safeTitle}-${reportName}.pdf`;

    const encodedFileName =
      encodeURIComponent(
        fileName
      );

    // =================================================
    // RESPONSE
    // =================================================

    return new NextResponse(
      new Uint8Array(pdfBuffer),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="analytics-${test.id}.pdf"; filename*=UTF-8''${encodedFileName}`,

          "Content-Length":
            String(
              pdfBuffer.length
            ),

          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",

          Pragma:
            "no-cache",

          Expires:
            "0",
        },
      }
    );
  } catch (error) {
    console.error(
      "[GET /api/analytics/pdf] Error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не вдалося сформувати PDF-звіт.",
      },
      {
        status: 500,
      }
    );
  }
}