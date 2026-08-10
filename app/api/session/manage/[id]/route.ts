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
        error:
          "Не вдалося отримати сесію.",
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
        action: "unblock",
        session,
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

      const secondsToAdd =
        Math.floor(minutes * 60);

      /*
       * КРИТИЧНО:
       *
       * Не беремо timeLeft із браузера.
       *
       * Зчитуємо актуальний timeLeft
       * із БД і додаємо до нього час
       * безпосередньо на сервері.
       */

      const newTimeLeft =
        Math.max(
          0,
          existingSession.timeLeft
        ) + secondsToAdd;

      const newExtraTime =
        Math.max(
          0,
          existingSession.extraTime
        ) + secondsToAdd;

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

        addedMinutes:
          minutes,

        addedSeconds:
          secondsToAdd,

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