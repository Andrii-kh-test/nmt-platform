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
    // ВІДПОВІДЬ
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
      // -------------------------------------------------
      // Завершену сесію не потрібно блокувати повторно
      // -------------------------------------------------

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

      // -------------------------------------------------
      // Якщо вже заблокована
      // -------------------------------------------------

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

      // -------------------------------------------------
      // КРИТИЧНО:
      //
      // При блокуванні потрібно зафіксувати
      // актуальний залишок часу.
      //
      // timeLeft у БД є останнім серверним
      // значенням.
      //
      // lastActivityAt показує момент,
      // від якого GET відраховує час.
      //
      // Тому перед блокуванням обчислюємо,
      // скільки часу реально минуло.
      // -------------------------------------------------

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

      // -------------------------------------------------
      // БЛОКУЄМО СЕСІЮ
      // -------------------------------------------------

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

            // Фіксуємо актуальний час
            timeLeft: actualTimeLeft,

            // Після фіксації часу
            // починаємо нову точку відліку
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
      // -------------------------------------------------
      // Завершену сесію не можна розблокувати
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

      // -------------------------------------------------
      // Якщо вже розблокована
      // -------------------------------------------------

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

      // -------------------------------------------------
      // РОЗБЛОКОВУЄМО
      //
      // timeLeft НЕ змінюємо.
      //
      // lastActivityAt = now
      //
      // Отже після розблокування відлік
      // починається саме з моменту розблокування.
      // -------------------------------------------------

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
    //
    // Підтримує:
    //
    // annul
    // invalidate
    // =================================================

    if (action === "annul") {
      // -------------------------------------------------
      // Якщо результат уже існує
      // -------------------------------------------------

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

      // -------------------------------------------------
      // КІЛЬКІСТЬ ПИТАНЬ
      // -------------------------------------------------

      const questionsCount =
        existingSession.test.questions.length;

      // -------------------------------------------------
      // МАКСИМАЛЬНА КІЛЬКІСТЬ БАЛІВ
      // -------------------------------------------------

      const maxPoints =
        existingSession.test.maxPoints;

      // -------------------------------------------------
      // ЗАГАЛЬНИЙ ЧАС ТЕСТУ
      // -------------------------------------------------

      const totalTime =
        Math.max(
          0,
          Math.floor(
            existingSession.test.duration *
              60
          )
        );

      // -------------------------------------------------
      // ВИТРАЧЕНИЙ ЧАС
      //
      // Якщо timeLeft ще не був актуалізований,
      // беремо значення з БД.
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
      // ПРИЧИНА ЗАВЕРШЕННЯ
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
            // ЗАВЕРШУЄМО СЕСІЮ
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
            // СТВОРЮЄМО РЕЗУЛЬТАТ
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
      // ПЕРЕВІРКА ХВИЛИН
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

      // -------------------------------------------------
      // ПЕРЕТВОРЕННЯ ХВИЛИН У СЕКУНДИ
      // -------------------------------------------------

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

      // -------------------------------------------------
      // АКТУАЛЬНИЙ TIME LEFT
      //
      // ВАЖЛИВО:
      //
      // Оскільки GET не записує timeLeft,
      // значення в БД може бути старшим на кілька
      // секунд.
      //
      // Тому тут самостійно обчислюємо актуальний
      // залишок перед додаванням часу.
      // -------------------------------------------------

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

      // -------------------------------------------------
      // ПОТОЧНИЙ EXTRA TIME
      // -------------------------------------------------

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

      // -------------------------------------------------
      // НОВИЙ TIME LEFT
      // -------------------------------------------------

      const newTimeLeft =
        currentTimeLeft +
        secondsToAdd;

      // -------------------------------------------------
      // НОВИЙ EXTRA TIME
      // -------------------------------------------------

      const newExtraTime =
        currentExtraTime +
        secondsToAdd;

      // -------------------------------------------------
      // ОНОВЛЕННЯ
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

      // -------------------------------------------------
      // ВІДПОВІДЬ
      // -------------------------------------------------

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