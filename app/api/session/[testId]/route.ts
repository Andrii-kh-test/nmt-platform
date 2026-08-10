import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

type Props = {
  params: Promise<{
    testId: string;
  }>;
};

// =====================================================
// GET — отримання активної сесії конкретного тесту
// =====================================================

export async function GET(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { testId } = await params;

    const numericTestId = Number(testId);

    if (
      !Number.isInteger(numericTestId) ||
      numericTestId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Некоректний ID тесту.",
        },
        {
          status: 400,
        }
      );
    }

    const session =
      await prisma.testSession.findFirst({
        where: {
          testId: numericTestId,
          finished: false,
        },

        orderBy: {
          updatedAt: "desc",
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

    return NextResponse.json(session);
  } catch (error) {
    console.error(
      "GET SESSION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Помилка отримання сесії.",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// PATCH — керування активною сесією
// =====================================================

export async function PATCH(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { testId } = await params;

    const numericTestId = Number(testId);

    if (
      !Number.isInteger(numericTestId) ||
      numericTestId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Некоректний ID тесту.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await req.json();

    const {
      sessionId,
      action,
      reason,
      minutes,
    } = body;

    // =================================================
    // Перевірка sessionId
    // =================================================

    const numericSessionId =
      Number(sessionId);

    if (
      !Number.isInteger(
        numericSessionId
      ) ||
      numericSessionId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Некоректний ID сесії.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Знаходимо конкретну сесію
    // =================================================

    const session =
      await prisma.testSession.findFirst({
        where: {
          id: numericSessionId,
          testId: numericTestId,
        },
      });

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Сесію не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // ЗАБЛОКУВАТИ
    // =================================================

    if (action === "block") {
      const blockReason =
        typeof reason === "string" &&
        reason.trim().length > 0
          ? reason.trim()
          : "Тестування заблоковано через порушення правил тестування";

      const updatedSession =
        await prisma.testSession.update({
          where: {
            id: numericSessionId,
          },

          data: {
            blocked: true,

            blockReason,

            updatedAt:
              new Date(),
          },
        });

      return NextResponse.json({
        success: true,

        message:
          "Тестування заблоковано.",

        session: updatedSession,
      });
    }

    // =================================================
    // РОЗБЛОКУВАТИ
    // =================================================

    if (action === "unblock") {
      const updatedSession =
        await prisma.testSession.update({
          where: {
            id: numericSessionId,
          },

          data: {
            blocked: false,

            blockReason: null,

            updatedAt:
              new Date(),
          },
        });

      return NextResponse.json({
        success: true,

        message:
          "Тестування розблоковано.",

        session: updatedSession,
      });
    }

    // =================================================
    // ДОДАТИ ЧАС
    // =================================================

    if (action === "addTime") {
      const numericMinutes =
        Number(minutes);

      if (
        !Number.isFinite(
          numericMinutes
        ) ||
        numericMinutes <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Некоректна кількість хвилин.",
          },
          {
            status: 400,
          }
        );
      }

      const secondsToAdd =
        Math.round(
          numericMinutes * 60
        );

      const updatedSession =
        await prisma.testSession.update({
          where: {
            id: numericSessionId,
          },

          data: {
            timeLeft:
              session.timeLeft +
              secondsToAdd,

            extraTime:
              session.extraTime +
              secondsToAdd,

            updatedAt:
              new Date(),
          },
        });

      return NextResponse.json({
        success: true,

        message:
          `Додано ${numericMinutes} хв.`,

        session: updatedSession,
      });
    }

    // =================================================
    // НЕВІДОМА ДІЯ
    // =================================================

    return NextResponse.json(
      {
        error:
          "Невідома дія керування сесією.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "PATCH SESSION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Не вдалося змінити стан сесії.",
      },
      {
        status: 500,
      }
    );
  }
}