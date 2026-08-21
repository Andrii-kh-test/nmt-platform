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
    // Перевірка ID
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
    // Отримання сесії
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
    // Сесію не знайдено
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
    // Відповідь
    // =================================================

    return NextResponse.json({
      success: true,

      session,

      resultId:
        session.result?.id ?? null,
    });
  } catch (error) {
    console.error(
      "GET SESSION MANAGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Не вдалося отримати сесію.",
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
    // Перевірка ID
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
    // Body
    // =================================================

    const body = await request.json();

    let action = body.action;

    // =================================================
    // Сумісність:
    //
    // старий MonitoringControls може передавати
    // "invalidate", а API раніше очікував "annul".
    //
    // Приводимо обидва варіанти до annul.
    // =================================================

    if (action === "invalidate") {
      action = "annul";
    }

    // =================================================
    // Отримання сесії
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
    // Сесію не знайдено
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
      const now = new Date();

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

        action: "block",

        session,

        resultId:
          session.result?.id ?? null,
      });
    }

    // =================================================
    // РОЗБЛОКУВАННЯ
    // =================================================

    if (action === "unblock") {
      // -------------------------------------------------
      // Якщо результат уже створений,
      // розблоковувати сесію не можна.
      // -------------------------------------------------

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

        resultId:
          session.result?.id ?? null,
      });
    }

    // =================================================
    // АНУЛЮВАННЯ РЕЗУЛЬТАТУ
    //
    // Підтримує:
    //
    // invalidate
    // annul
    //
    // Обидва варіанти виконують одну операцію.
    // =================================================

    if (action === "annul") {
      // -------------------------------------------------
      // Якщо результат уже існує,
      // повторно його не створюємо.
      // -------------------------------------------------

      if (existingSession.result) {
        return NextResponse.json(
          {
            success: true,

            action: "annul",

            message:
              "Результат цієї сесії вже анульовано.",

            finishReason:
              existingSession.result.finishReason,

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
          },
        );
      }

      const now = new Date();

      // -------------------------------------------------
      // Кількість питань
      // -------------------------------------------------

      const questionsCount =
        existingSession.test.questions.length;

      // -------------------------------------------------
      // Максимальна кількість балів
      // -------------------------------------------------

      const maxPoints =
        existingSession.test.maxPoints;

      // -------------------------------------------------
      // Загальний час
      // -------------------------------------------------

      const totalTime =
        Math.max(
          0,
          Math.floor(
            existingSession.test.duration * 60
          )
        );

      // -------------------------------------------------
      // Витрачений час
      // -------------------------------------------------

      const timeSpent =
        Math.max(
          0,
          totalTime -
            Math.max(
              0,
              existingSession.timeLeft
            )
        );

      // -------------------------------------------------
      // Причина завершення
      // -------------------------------------------------

      const finishReason =
        "security";

      const finishMessage =
        "Порушення правил тестування";

      // =================================================
      // ТРАНЗАКЦІЯ
      // =================================================

      const result =
        await prisma.$transaction(
          async (tx) => {
            // -------------------------------------------
            // Завершуємо сесію
            // -------------------------------------------

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

            // -------------------------------------------
            // Створюємо результат
            //
            // КРИТИЧНО:
            // sessionId зв'язує результат
            // саме з цією сесією.
            // -------------------------------------------

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
                    existingSession.participant
                      ?.firstName ?? null,

                  lastName:
                    existingSession.participant
                      ?.lastName ?? null,

                  middleName:
                    existingSession.participant
                      ?.middleName ?? null,

                  accessCode:
                    existingSession.participant
                      ?.accessCode ?? null,
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

      // =================================================
      // ВІДПОВІДЬ
      // =================================================

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

      // -------------------------------------------------
      // Перевірка хвилин
      // -------------------------------------------------

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

      // -------------------------------------------------
      // Завершену сесію не можна продовжувати
      // -------------------------------------------------

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

      // -------------------------------------------------
      // Заблоковану сесію не продовжуємо
      // -------------------------------------------------

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

      // -------------------------------------------------
      // Перевірка startedAt
      // -------------------------------------------------

      if (
        !existingSession.startedAt
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "У сесії відсутній час початку тестування.",
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------
      // Базовий час тесту
      // -------------------------------------------------

      const baseTime =
        Math.max(
          0,
          Math.floor(
            existingSession.test.duration *
              60
          )
        );

      // -------------------------------------------------
      // Попередній додатковий час
      // -------------------------------------------------

      const previousExtraTime =
        Math.max(
          0,
          Math.floor(
            existingSession.extraTime
          )
        );

      // -------------------------------------------------
      // Час початку
      // -------------------------------------------------

      const startedAt =
        existingSession.startedAt.getTime();

      // -------------------------------------------------
      // Поточний момент
      // -------------------------------------------------

      const nowTimestamp =
        Date.now();

      // -------------------------------------------------
      // Скільки часу минуло
      // -------------------------------------------------

      const elapsedSeconds =
        Math.max(
          0,
          Math.floor(
            (nowTimestamp -
              startedAt) /
              1000
          )
        );

      // -------------------------------------------------
      // Розрахований залишок
      //
      // Базовий час
      // +
      // попередній додатковий час
      // -
      // фактично минулий час
      // -------------------------------------------------

      const calculatedTimeLeft =
        Math.max(
          0,
          baseTime +
            previousExtraTime -
            elapsedSeconds
        );

      // -------------------------------------------------
      // Новий залишок
      // -------------------------------------------------

      const newTimeLeft =
        calculatedTimeLeft +
        secondsToAdd;

      // -------------------------------------------------
      // Новий загальний додатковий час
      // -------------------------------------------------

      const newExtraTime =
        previousExtraTime +
        secondsToAdd;

      // -------------------------------------------------
      // Оновлення
      // -------------------------------------------------

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
              new Date(),
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

      // -------------------------------------------------
      // Відповідь
      // -------------------------------------------------

      return NextResponse.json({
        success: true,

        action: "addTime",

        addedMinutes:
          minutes,

        addedSeconds:
          secondsToAdd,

        calculatedTimeLeft,

        timeLeft:
          session.timeLeft,

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
    console.error(
      "POST SESSION MANAGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Не вдалося змінити сесію.",
      },
      {
        status: 500,
      }
    );
  }
}