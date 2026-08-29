import {
  NextRequest,
  NextResponse,
} from "next/server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/app/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

// =====================================================
// HELPERS
// =====================================================

function normalizeSeconds(value: unknown): number {
  return Math.max(
    0,
    Math.floor(Number(value) || 0)
  );
}

// =====================================================
// РЕАЛЬНИЙ ЗАЛИШОК ЧАСУ АКТИВНОЇ СЕСІЇ
//
// ЄДИНА ФОРМУЛА:
//
// duration + extraTime - elapsed
//
// elapsed рахується ВІД startedAt.
//
// lastActivityAt НЕ використовується
// для розрахунку таймера.
// =====================================================

function calculateActiveTimeLeft(
  startedAt: Date | null,
  durationMinutes: number,
  extraTime: number,
  now: Date
): number {
  if (!startedAt) {
    return 0;
  }

  const elapsedSeconds =
    Math.max(
      0,
      Math.floor(
        (
          now.getTime() -
          startedAt.getTime()
        ) / 1000
      )
    );

  const durationSeconds =
    normalizeSeconds(
      durationMinutes * 60
    );

  const normalizedExtraTime =
    normalizeSeconds(
      extraTime
    );

  return Math.max(
    0,
    durationSeconds +
      normalizedExtraTime -
      elapsedSeconds
  );
}

// =====================================================
// SESSION INCLUDE
// =====================================================

const sessionInclude = {
  participant: true,

  test: {
    select: {
      id: true,
      title: true,
      subject: true,
      duration: true,
      maxPoints: true,

      questions: {
        orderBy: {
          order: "asc" as const,
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
            },
          },
        },
      },
    },
  },

  result: true,
} as const;

// =====================================================
// GET
//
// GET /api/session/manage/[id]
//
// Для активної сесії повертає реальний залишок.
//
// ВАЖЛИВО:
// БД при звичайному GET НЕ змінюємо.
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;

    const sessionId = Number(id);

    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    const session =
      await prisma.testSession.findUnique({
        where: {
          id: sessionId,
        },

        include: sessionInclude,
      });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Сесію не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    const now = new Date();

    let actualTimeLeft =
      normalizeSeconds(
        session.timeLeft
      );

    const normalizedExtraTime =
      normalizeSeconds(
        session.extraTime
      );

    // =================================================
    // АКТИВНА СЕСІЯ
    // =================================================

    if (
      !session.finished &&
      !session.blocked &&
      session.startedAt
    ) {
      actualTimeLeft =
        calculateActiveTimeLeft(
          session.startedAt,
          session.test.duration,
          normalizedExtraTime,
          now
        );
    }

    // =================================================
    // СИНХРОНІЗОВАНА ВІДПОВІДЬ
    // =================================================

    const synchronizedSession = {
      ...session,

      timeLeft:
        actualTimeLeft,

      extraTime:
        normalizedExtraTime,
    };

    return NextResponse.json(
      {
        success: true,

        session:
          synchronizedSession,

        timeLeft:
          actualTimeLeft,

        extraTime:
          normalizedExtraTime,

        blocked:
          session.blocked,

        blockReason:
          session.blockReason,

        finished:
          session.finished,

        finishedAt:
          session.finishedAt,

        resultId:
          session.result?.id ??
          null,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET SESSION MANAGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Не вдалося отримати сесію.",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// POST
//
// Підтримує:
//
// block
// unblock
// addTime
// annul
// invalidate
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;

    const sessionId = Number(id);

    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();

    let action = body.action;

    // -------------------------------------------------
    // Сумісність зі старим action
    // -------------------------------------------------

    if (
      action === "invalidate"
    ) {
      action = "annul";
    }

    // =================================================
    // ОТРИМУЄМО СЕСІЮ
    // =================================================

    const existingSession =
      await prisma.testSession.findUnique({
        where: {
          id: sessionId,
        },

        include: sessionInclude,
      });

    if (!existingSession) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Сесію не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    const now = new Date();

    // =================================================
    // BLOCK
    // =================================================

    if (action === "block") {
      if (
        existingSession.finished
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Завершену сесію неможливо заблокувати.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        existingSession.blocked
      ) {
        return NextResponse.json({
          success: true,
          action: "block",

          message:
            "Сесія вже заблокована.",

          session:
            existingSession,

          timeLeft:
            normalizeSeconds(
              existingSession.timeLeft
            ),

          extraTime:
            normalizeSeconds(
              existingSession.extraTime
            ),

          blocked: true,

          blockReason:
            existingSession.blockReason,

          finished:
            existingSession.finished,

          resultId:
            existingSession.result?.id ??
            null,
        });
      }

      // =================================================
      // ФІКСУЄМО РЕАЛЬНИЙ ЗАЛИШОК
      //
      // НЕ через lastActivityAt.
      //
      // А через:
      //
      // startedAt
      // duration
      // extraTime
      // =================================================

      const actualTimeLeft =
        calculateActiveTimeLeft(
          existingSession.startedAt,
          existingSession.test.duration,
          normalizeSeconds(
            existingSession.extraTime
          ),
          now
        );

      const session =
        await prisma.testSession.update({
          where: {
            id: sessionId,
          },

          data: {
            blocked: true,

            blockReason:
              body.reason ??
              "Тестування заблоковано через порушення правил тестування.",

            blockedAt:
              now,

            timeLeft:
              actualTimeLeft,

            lastActivityAt:
              now,
          },

          include: sessionInclude,
        });

      return NextResponse.json({
        success: true,

        action: "block",

        session,

        timeLeft:
          actualTimeLeft,

        extraTime:
          normalizeSeconds(
            session.extraTime
          ),

        blocked: true,

        blockReason:
          session.blockReason,

        finished:
          session.finished,

        resultId:
          session.result?.id ??
          null,
      });
    }

    // =================================================
    // UNBLOCK
    // =================================================

    if (action === "unblock") {
      if (
        existingSession.finished
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Завершену сесію неможливо розблокувати.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !existingSession.blocked
      ) {
        return NextResponse.json({
          success: true,

          action: "unblock",

          message:
            "Сесія вже розблокована.",

          session:
            existingSession,

          timeLeft:
            normalizeSeconds(
              existingSession.timeLeft
            ),

          extraTime:
            normalizeSeconds(
              existingSession.extraTime
            ),

          blocked: false,

          blockReason: null,

          finished:
            existingSession.finished,

          resultId:
            existingSession.result?.id ??
            null,
        });
      }

      // =================================================
      // РОЗБЛОКУВАННЯ
      //
      // timeLeft НЕ ПЕРЕРАХОВУЄМО.
      //
      // Час, який залишився на момент
      // блокування, зберігається.
      // =================================================

      const preservedTimeLeft =
        normalizeSeconds(
          existingSession.timeLeft
        );

      const session =
        await prisma.testSession.update({
          where: {
            id: sessionId,
          },

          data: {
            blocked: false,

            blockReason: null,

            blockedAt: null,

            timeLeft:
              preservedTimeLeft,

            lastActivityAt:
              now,
          },

          include: sessionInclude,
        });

      return NextResponse.json({
        success: true,

        action: "unblock",

        session,

        timeLeft:
          preservedTimeLeft,

        extraTime:
          normalizeSeconds(
            session.extraTime
          ),

        blocked: false,

        blockReason: null,

        finished:
          session.finished,

        resultId:
          session.result?.id ??
          null,
      });
    }

    // =================================================
    // ADD TIME
    // =================================================

    if (action === "addTime") {
      const minutes =
        Number(body.minutes);

      if (
        !Number.isFinite(minutes) ||
        minutes <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Некоректна кількість додаткових хвилин.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        existingSession.finished
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Завершену сесію неможливо продовжити.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        existingSession.blocked
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Неможливо додати час заблокованій сесії.",
          },
          {
            status: 400,
          }
        );
      }

      const secondsToAdd =
        Math.floor(
          minutes * 60
        );

      if (
        secondsToAdd <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Кількість доданого часу повинна бути більшою за 0.",
          },
          {
            status: 400,
          }
        );
      }

      // =================================================
      // КЛЮЧОВИЙ МОМЕНТ
      //
      // Спочатку отримуємо ЧАС, ЯКИЙ РЕАЛЬНО
      // ЗАЛИШИВСЯ В УЧАСНИКА.
      //
      // НЕ використовуємо lastActivityAt.
      // =================================================

      const currentTimeLeft =
        calculateActiveTimeLeft(
          existingSession.startedAt,
          existingSession.test.duration,
          normalizeSeconds(
            existingSession.extraTime
          ),
          now
        );

      const currentExtraTime =
        normalizeSeconds(
          existingSession.extraTime
        );

      // =================================================
      // НОВИЙ ЧАС
      // =================================================

      const newTimeLeft =
        currentTimeLeft +
        secondsToAdd;

      const newExtraTime =
        currentExtraTime +
        secondsToAdd;

      // =================================================
      // ЗБЕРІГАЄМО
      // =================================================

      const session =
        await prisma.testSession.update({
          where: {
            id: sessionId,
          },

          data: {
            timeLeft:
              newTimeLeft,

            extraTime:
              newExtraTime,

            lastActivityAt:
              now,
          },

          include: sessionInclude,
        });

      return NextResponse.json({
        success: true,

        action: "addTime",

        addedMinutes:
          minutes,

        addedSeconds:
          secondsToAdd,

        previousTimeLeft:
          currentTimeLeft,

        timeLeft:
          newTimeLeft,

        previousExtraTime:
          currentExtraTime,

        extraTime:
          newExtraTime,

        blocked:
          session.blocked,

        blockReason:
          session.blockReason,

        finished:
          session.finished,

        session,

        resultId:
          session.result?.id ??
          null,
      });
    }

    // =================================================
    // ANNUL
    // =================================================

    if (action === "annul") {
      if (
        existingSession.result
      ) {
        return NextResponse.json({
          success: true,

          action: "annul",

          message:
            "Результат цієї сесії вже анульовано.",

          finishReason:
            existingSession.result
              .finishReason,

          finishMessage:
            "Порушення правил тестування",

          sessionId,

          resultId:
            existingSession.result.id,

          result: {
            earnedPoints:
              existingSession.result
                .earnedPoints,

            maxPoints:
              existingSession.result
                .maxPoints,

            percent:
              existingSession.result
                .percent,

            correct:
              existingSession.result
                .correct,

            incorrect:
              existingSession.result
                .incorrect,

            skipped:
              existingSession.result
                .skipped,

            timeSpent:
              existingSession.result
                .timeSpent,
          },

          session:
            existingSession,

          blocked: true,

          finished: true,

          timeLeft: 0,
        });
      }

      // =================================================
      // АКТУАЛЬНИЙ ЧАС ДО АНУЛЮВАННЯ
      // =================================================

      const actualTimeLeft =
        existingSession.blocked
          ? normalizeSeconds(
              existingSession.timeLeft
            )
          : calculateActiveTimeLeft(
              existingSession.startedAt,
              existingSession.test.duration,
              normalizeSeconds(
                existingSession.extraTime
              ),
              now
            );

      const questionsCount =
        existingSession.test.questions.length;

      const maxPoints =
        existingSession.test.maxPoints;

      const totalTime =
        Math.max(
          0,
          Math.floor(
            existingSession.test.duration *
              60
          )
        ) +
        normalizeSeconds(
          existingSession.extraTime
        );

      const timeSpent =
        Math.max(
          0,
          totalTime -
            actualTimeLeft
        );

      const finishReason =
        "security";

      const finishMessage =
        "Порушення правил тестування";

      // =================================================
      // TRANSACTION
      // =================================================

      const result =
        await prisma.$transaction(
          async (tx) => {
            const finishedSession =
              await tx.testSession.update({
                where: {
                  id: sessionId,
                },

                data: {
                  finished: true,

                  finishedAt:
                    now,

                  timeLeft: 0,

                  blocked: true,

                  blockReason:
                    finishMessage,

                  blockedAt:
                    existingSession.blockedAt ??
                    now,

                  lastActivityAt:
                    now,
                },
              });

            const createdResult =
              await tx.testResult.create({
                data: {
                  testId:
                    existingSession.testId,

                  sessionId:
                    existingSession.id,

                  earnedPoints: 0,

                  maxPoints,

                  percent: 0,

                  correct: 0,

                  incorrect: 0,

                  skipped:
                    questionsCount,

                  timeSpent,

                  answers:
                    existingSession.savedAnswers ===
                    null
                      ? Prisma.JsonNull
                      : (existingSession.savedAnswers as Prisma.InputJsonValue),

                  finishReason,

                  createdAt:
                    now,

                  finishedAt:
                    now,

                  startedAt:
                    existingSession.startedAt,

                  firstName:
                    existingSession
                      .participant
                      ?.firstName ??
                    null,

                  lastName:
                    existingSession
                      .participant
                      ?.lastName ??
                    null,

                  middleName:
                    existingSession
                      .participant
                      ?.middleName ??
                    null,

                  accessCode:
                    existingSession
                      .participant
                      ?.accessCode ??
                    null,
                },
              });

            return {
              session:
                finishedSession,

              result:
                createdResult,
            };
          }
        );

      return NextResponse.json({
        success: true,

        action: "annul",

        message:
          "Результат тестування анульовано.",

        finishReason,

        finishMessage,

        sessionId,

        resultId:
          result.result.id,

        result: {
          earnedPoints: 0,

          maxPoints,

          percent: 0,

          correct: 0,

          incorrect: 0,

          skipped:
            questionsCount,

          timeSpent,
        },

        session:
          result.session,

        // =================================================
        // КРИТИЧНО ДЛЯ УЧАСНИКА
        // =================================================

        blocked: true,

        finished: true,

        timeLeft: 0,

        
      });
    }

    // =================================================
    // UNKNOWN ACTION
    // =================================================

    return NextResponse.json(
      {
        success: false,

        error:
          "Невідома операція керування сесією.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "POST SESSION MANAGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Не вдалося змінити сесію.",
      },
      {
        status: 500,
      }
    );
  }
}