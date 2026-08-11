import {
  NextRequest,
  NextResponse,
} from "next/server";

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
          error: "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

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
          test: {
            select: {
              duration: true,
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
    // ДОДАВАННЯ ЧАСУ
    //
    // ВАЖЛИВО:
    //
    // Не використовуємо existingSession.timeLeft,
    // оскільки воно може бути старішим за локальний
    // таймер учасника.
    //
    // Реальний залишок визначаємо через:
    //
    // startedAt
    // + тривалість тесту
    // + уже доданий extraTime
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

      const secondsToAdd = Math.floor(
        minutes * 60
      );

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
      // Тривалість основного тесту
      // duration з БД зберігається у хвилинах.
      // =================================================

      const baseTime =
        Math.max(
          0,
          Math.floor(
            existingSession.test.duration * 60
          )
        );

      // =================================================
      // Уже доданий додатковий час
      // extraTime зберігається у секундах.
      // =================================================

      const previousExtraTime =
        Math.max(
          0,
          Math.floor(
            existingSession.extraTime
          )
        );

      // =================================================
      // Скільки секунд минуло від початку тесту
      // =================================================

      const startedAt =
        existingSession.startedAt.getTime();

      const now = Date.now();

      const elapsedSeconds =
        Math.max(
          0,
          Math.floor(
            (now - startedAt) / 1000
          )
        );

      // =================================================
      // Фактичний час, який мав би залишитися
      // =================================================

      const calculatedTimeLeft =
        Math.max(
          0,
          baseTime +
            previousExtraTime -
            elapsedSeconds
        );

      // =================================================
      // Додаємо новий час
      // =================================================

      const newTimeLeft =
        calculatedTimeLeft +
        secondsToAdd;

      const newExtraTime =
        previousExtraTime +
        secondsToAdd;

      // =================================================
      // Оновлюємо БД
      // =================================================

      const session =
        await prisma.testSession.update({
          where: {
            id: sessionId,
          },

          data: {
            timeLeft: newTimeLeft,

            extraTime: newExtraTime,

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

        action: "addTime",

        addedMinutes: minutes,

        addedSeconds: secondsToAdd,

        calculatedTimeLeft,

        timeLeft: session.timeLeft,

        extraTime: session.extraTime,

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
        error: "Не вдалося змінити сесію.",
      },
      {
        status: 500,
      }
    );
  }
}