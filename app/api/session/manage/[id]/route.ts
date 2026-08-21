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
            },
          },
        },
      });

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

    return NextResponse.json({
      success: true,
      session,
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
// Доступні операції:
//
// block
// unblock
// addTime
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
    // Перевірка ID сесії
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
    // Отримуємо body
    // =================================================

    const body = await request.json();

    const action = body.action;

    // =================================================
    // Перевіряємо сесію
    // =================================================

    const existingSession =
      await prisma.testSession.findUnique({
        where: {
          id: sessionId,
        },

        include: {
          participant: true,

          test: {
            include: {
              questions: {
                select: {
                  id: true,
                  points: true,
                },
              },
            },
          },
        },
      });

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

            blockedAt: new Date(),

            lastActivityAt: new Date(),
          },

          include: {
            participant: true,

            test: {
              select: {
                id: true,
                title: true,
                subject: true,
                duration: true,
              },
            },
          },
        });

      return NextResponse.json({
        success: true,
        action: "block",
        session,
      });
    }

    // =================================================
    // РОЗБЛОКУВАННЯ
    // =================================================

    if (action === "unblock") {
      const session =
        await prisma.testSession.update({
          where: {
            id: sessionId,
          },

          data: {
            blocked: false,

            blockReason: null,

            blockedAt: null,

            lastActivityAt: new Date(),
          },

          include: {
            participant: true,

            test: {
              select: {
                id: true,
                title: true,
                subject: true,
                duration: true,
              },
            },
          },
        });

      return NextResponse.json({
        success: true,
        action: "unblock",
        session,
      });
    }

    // =================================================
    // АНУЛЮВАННЯ РЕЗУЛЬТАТУ
    //
    // Після цієї операції:
    //
    // - тестування завершується;
    // - результат = 0;
    // - відсоток = 0;
    // - правильних = 0;
    // - неправильних = 0;
    // - усі питання вважаються пропущеними;
    // - причина = security;
    // - причина завершення:
    //   "Порушення правил тестування"
    // =================================================

    if (action === "annul") {
      // -------------------------------------------------
      // Якщо сесію вже завершено
      // -------------------------------------------------

      if (existingSession.finished) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Ця сесія вже завершена.",
          },
          {
            status: 400,
          }
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
      //
      // Беремо значення безпосередньо з Test.maxPoints.
      // -------------------------------------------------

      const maxPoints =
        existingSession.test.maxPoints;

      // -------------------------------------------------
      // Витрачений час
      //
      // duration зберігається у хвилинах,
      // timeLeft — у секундах.
      // -------------------------------------------------

      const totalTime =
        Math.max(
          0,
          existingSession.test.duration * 60
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

      // -------------------------------------------------
      // Причина завершення
      // -------------------------------------------------

      const finishReason =
        "security";

      const finishMessage =
        "Порушення правил тестування";

      // -------------------------------------------------
      // Створюємо результат і завершуємо сесію
      // атомарно в одній транзакції.
      // -------------------------------------------------

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
            // Створюємо анульований результат
            // -------------------------------------------

            const createdResult =
              await tx.testResult.create({
                data: {
                  testId:
                    existingSession.testId,

                  earnedPoints: 0,

                  maxPoints,

                  percent: 0,

                  correct: 0,

                  incorrect: 0,

                  skipped:
                    questionsCount,

                  timeSpent,

                  answers:
  existingSession.savedAnswers === null
    ? Prisma.JsonNull
    : (existingSession.savedAnswers as Prisma.InputJsonValue),

                  finishReason,

                  createdAt: now,

                  finishedAt: now,

                  startedAt:
                    existingSession.startedAt,

                  firstName:
                    existingSession.participant
                      ?.firstName ??
                    null,

                  lastName:
                    existingSession.participant
                      ?.lastName ??
                    null,

                  middleName:
                    existingSession.participant
                      ?.middleName ??
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

      // -------------------------------------------------
      // Повертаємо адміністратору інформацію
      // -------------------------------------------------

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
          skipped: questionsCount,
          timeSpent,
        },

        session:
          result.session,
      });
    }

    // =================================================
    // ДОДАВАННЯ ЧАСУ
    //
    // Реальний залишок часу визначаємо через:
    //
    // startedAt
    // + duration
    // + extraTime
    // - час, що минув
    //
    // Після цього додаємо нові хвилини.
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

      const secondsToAdd =
        Math.floor(minutes * 60);

      // =================================================
      // Перевіряємо дату початку тестування
      // =================================================

      if (!existingSession.startedAt) {
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

      // =================================================
      // Основний час тесту
      //
      // duration з БД — хвилини.
      // =================================================

      const baseTime =
        Math.max(
          0,
          Math.floor(
            existingSession.test
              .duration * 60
          )
        );

      // =================================================
      // Уже доданий додатковий час
      //
      // extraTime — секунди.
      // =================================================

      const previousExtraTime =
        Math.max(
          0,
          Math.floor(
            existingSession.extraTime
          )
        );

      // =================================================
      // Час від початку тесту
      // =================================================

      const startedAt =
        existingSession.startedAt.getTime();

      const now =
        Date.now();

      const elapsedSeconds =
        Math.max(
          0,
          Math.floor(
            (now - startedAt) /
              1000
          )
        );

      // =================================================
      // Фактичний залишок часу
      // =================================================

      const calculatedTimeLeft =
        Math.max(
          0,
          baseTime +
            previousExtraTime -
            elapsedSeconds
        );

      // =================================================
      // Новий залишок
      // =================================================

      const newTimeLeft =
        calculatedTimeLeft +
        secondsToAdd;

      // =================================================
      // Новий додатковий час
      // =================================================

      const newExtraTime =
        previousExtraTime +
        secondsToAdd;

      // =================================================
      // Оновлюємо сесію
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
              },
            },
          },
        });

      return NextResponse.json({
        success: true,

        action: "addTime",

        addedMinutes: minutes,

        addedSeconds:
          secondsToAdd,

        calculatedTimeLeft,

        timeLeft:
          session.timeLeft,

        extraTime:
          session.extraTime,

        session,
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