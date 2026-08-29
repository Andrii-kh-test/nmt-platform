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
// GET — отримання конкретної сесії
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;

    const sessionId = Number(id);

    // =================================================
    // ПЕРЕВІРКА ID
    // =================================================

    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // ОТРИМАННЯ СЕСІЇ
    // =================================================

    const session =
      await prisma.testSession.findUnique({
        where: {
          id: sessionId,
        },

        include: {
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
                    },
                  },
                },
              },
            },
          },

          result: true,
        },
      });

    // =================================================
    // СЕСІЮ НЕ ЗНАЙДЕНО
    // =================================================

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Сесію не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // АКТУАЛІЗАЦІЯ ЧАСУ ДЛЯ АДМІНПАНЕЛІ
    //
    // НЕ ЗМІНЮЄМО БД.
    //
    // Для активної сесії:
    //
    // duration + extraTime - elapsed
    //
    // elapsed рахується від startedAt,
    // а не від lastActivityAt.
    // =================================================

    let actualTimeLeft =
      Math.max(
        0,
        Math.floor(
          session.timeLeft
        )
      );

    // -------------------------------------------------
    // Активна сесія
    // -------------------------------------------------

    if (
      !session.finished &&
      !session.blocked &&
      session.startedAt
    ) {
      const now =
        new Date();

      const elapsedSeconds =
        Math.max(
          0,
          Math.floor(
            (
              now.getTime() -
              session.startedAt.getTime()
            ) / 1000
          )
        );

      const durationSeconds =
        Math.max(
          0,
          Math.floor(
            session.test.duration * 60
          )
        );

      const extraTime =
        Math.max(
          0,
          Math.floor(
            Number(
              session.extraTime
            ) || 0
          )
        );

      actualTimeLeft =
        Math.max(
          0,
          durationSeconds +
            extraTime -
            elapsedSeconds
        );
    }

    // =================================================
    // СИНХРОНІЗОВАНА СЕСІЯ
    //
    // Усі інші дані залишаються такими,
    // як вони збережені в БД:
    //
    // currentQuestion
    // savedAnswers
    // extraTime
    // blocked
    // finished
    //
    // Змінюємо тільки timeLeft
    // для актуального відображення
    // в адміністративній панелі.
    // =================================================

    const synchronizedSession = {
      ...session,

      timeLeft:
        actualTimeLeft,

      extraTime:
        Math.max(
          0,
          Math.floor(
            Number(
              session.extraTime
            ) || 0
          )
        ),
    };

    // =================================================
    // ВІДПОВІДЬ
    // =================================================

    return NextResponse.json({
      success: true,

      session:
        synchronizedSession,

      resultId:
        session.result?.id ??
        null,
    });
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
// POST — керування сесією
//
// Підтримуються:
//
// block
// unblock
// addTime
// invalidate
// annul
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;

    const sessionId = Number(id);

    // =================================================
    // ПЕРЕВІРКА ID
    // =================================================

    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // BODY
    // =================================================

    const body = await request.json();

    let action = body.action;

    // =================================================
    // СУМІСНІСТЬ
    //
    // Старий action:
    //
    // invalidate
    //
    // перетворюємо на:
    //
    // annul
    // =================================================

    if (action === "invalidate") {
      action = "annul";
    }

    // =================================================
    // ОТРИМАННЯ СЕСІЇ
    // =================================================

    const existingSession =
      await prisma.testSession.findUnique({
        where: {
          id: sessionId,
        },

        include: {
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
                  order: "asc",
                },

                select: {
                  id: true,
                  order: true,

                  question: {
                    select: {
                      id: true,
                      points: true,
                    },
                  },
                },
              },
            },
          },

          result: true,
        },
      });

    // =================================================
    // СЕСІЮ НЕ ЗНАЙДЕНО
    // =================================================

    if (!existingSession) {
      return NextResponse.json(
        {
          success: false,
          error: "Сесію не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // БЛОКУВАННЯ
    // =================================================

    if (action === "block") {
      if (existingSession.finished) {
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

      if (existingSession.blocked) {
        return NextResponse.json({
          success: true,

          action: "block",

          message:
            "Сесія вже заблокована.",

          session:
            existingSession,

          resultId:
            existingSession.result?.id ??
            null,
        });
      }

      const now = new Date();

      const lastActivity =
        existingSession.lastActivityAt ??
        existingSession.updatedAt ??
        existingSession.startedAt;

      const elapsedSeconds =
        Math.max(
          0,
          Math.floor(
            (
              now.getTime() -
              lastActivity.getTime()
            ) / 1000
          )
        );

      const actualTimeLeft =
        Math.max(
          0,
          Math.floor(
            existingSession.timeLeft -
              elapsedSeconds
          )
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

            blockedAt: now,

            timeLeft:
              actualTimeLeft,

            lastActivityAt:
              now,
          },

          include: {
            participant: true,

            test: {
              select: {
                id: true,
                title: true,
                subject: true,
                duration: true,
                maxPoints: true,
              },
            },

            result: true,
          },
        });

      return NextResponse.json({
        success: true,

        action: "block",

        session,

        timeLeft:
          session.timeLeft,

        resultId:
          session.result?.id ??
          null,
      });
    }

    // =================================================
    // РОЗБЛОКУВАННЯ
    // =================================================

    if (action === "unblock") {
      if (existingSession.finished) {
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

      if (!existingSession.blocked) {
        return NextResponse.json({
          success: true,

          action: "unblock",

          message:
            "Сесія вже розблокована.",

          session:
            existingSession,

          resultId:
            existingSession.result?.id ??
            null,
        });
      }

      const now = new Date();

      const session =
        await prisma.testSession.update({
          where: {
            id: sessionId,
          },

          data: {
            blocked: false,

            blockReason: null,

            blockedAt: null,

            lastActivityAt: now,
          },

          include: {
            participant: true,

            test: {
              select: {
                id: true,
                title: true,
                subject: true,
                duration: true,
                maxPoints: true,
              },
            },

            result: true,
          },
        });

      return NextResponse.json({
        success: true,

        action: "unblock",

        session,

        timeLeft:
          session.timeLeft,

        resultId:
          session.result?.id ??
          null,
      });
    }

    // =================================================
    // АНУЛЮВАННЯ РЕЗУЛЬТАТУ
    // =================================================

    if (action === "annul") {
      if (existingSession.result) {
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
        });
      }

      const now = new Date();

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
        );

      const timeSpent =
        Math.max(
          0,
          totalTime -
            Math.max(
              0,
              existingSession.timeLeft
            )
        );

      const finishReason =
        "security";

      const finishMessage =
        "Порушення правил тестування";

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

                  finishedAt: now,

                  timeLeft: 0,

                  blocked: true,

                  blockReason:
                    finishMessage,

                  blockedAt:
                    existingSession.blockedAt ??
                    now,

                  lastActivityAt: now,
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

                  createdAt: now,

                  finishedAt: now,

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
      });
    }

    // =================================================
    // ДОДАВАННЯ ЧАСУ
    // =================================================

    if (action === "addTime") {
      const minutes = Number(
        body.minutes
      );

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

      if (existingSession.finished) {
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

      if (existingSession.blocked) {
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

      if (secondsToAdd <= 0) {
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

      const now = new Date();

      const lastActivity =
        existingSession.lastActivityAt ??
        existingSession.updatedAt ??
        existingSession.startedAt;

      const elapsedSeconds =
        Math.max(
          0,
          Math.floor(
            (
              now.getTime() -
              lastActivity.getTime()
            ) / 1000
          )
        );

      const currentTimeLeft =
        Math.max(
          0,
          Math.floor(
            existingSession.timeLeft -
              elapsedSeconds
          )
        );

      const currentExtraTime =
        Math.max(
          0,
          Math.floor(
            Number(
              existingSession.extraTime ??
                0
            )
          )
        );

      const newTimeLeft =
        currentTimeLeft +
        secondsToAdd;

      const newExtraTime =
        currentExtraTime +
        secondsToAdd;

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

          include: {
            participant: true,

            test: {
              select: {
                id: true,
                title: true,
                subject: true,
                duration: true,
                maxPoints: true,
              },
            },

            result: true,
          },
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
          session.timeLeft,

        previousExtraTime:
          currentExtraTime,

        extraTime:
          session.extraTime,

        session,

        resultId:
          session.result?.id ??
          null,
      });
    }

    // =================================================
    // НЕВІДОМА ОПЕРАЦІЯ
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
    // =================================================
    // ДЕТАЛЬНА ПОМИЛКА
    // =================================================

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