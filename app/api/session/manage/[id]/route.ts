import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

// =======================
// POST — керування сесією
// =======================

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
          error: "Некоректний ID сесії.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const action = body.action;

    // =======================
    // Перевіряємо сесію
    // =======================

    const session =
      await prisma.testSession.findUnique({
        where: {
          id: sessionId,
        },
      });

    if (!session) {
      return NextResponse.json(
        {
          error: "Сесію не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // =======================
    // Блокування
    // =======================

    if (action === "block") {
      const reason =
        typeof body.reason === "string" &&
        body.reason.trim()
          ? body.reason.trim()
          : "Порушення правил тестування";

      const updatedSession =
        await prisma.testSession.update({
          where: {
            id: sessionId,
          },

          data: {
            blocked: true,
            blockReason: reason,
          },
        });

      return NextResponse.json({
        success: true,
        action: "block",
        session: updatedSession,
      });
    }

    // =======================
    // Розблокування
    // =======================

    if (action === "unblock") {
      const updatedSession =
        await prisma.testSession.update({
          where: {
            id: sessionId,
          },

          data: {
            blocked: false,
            blockReason: null,
          },
        });

      return NextResponse.json({
        success: true,
        action: "unblock",
        session: updatedSession,
      });
    }

    // =======================
    // Додавання часу
    // =======================

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
            error:
              "Некоректна кількість хвилин.",
          },
          {
            status: 400,
          }
        );
      }

      const secondsToAdd =
        Math.floor(minutes * 60);

      const updatedSession =
        await prisma.testSession.update({
          where: {
            id: sessionId,
          },

          data: {
            timeLeft: {
              increment: secondsToAdd,
            },

            extraTime: {
              increment: secondsToAdd,
            },
          },
        });

      return NextResponse.json({
        success: true,
        action: "addTime",
        addedMinutes: minutes,
        addedSeconds: secondsToAdd,
        session: updatedSession,
      });
    }

    // =======================
    // Невідома дія
    // =======================

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
      "SESSION MANAGEMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Помилка керування сесією.",
      },
      {
        status: 500,
      }
    );
  }
}