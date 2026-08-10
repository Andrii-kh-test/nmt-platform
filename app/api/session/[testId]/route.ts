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
// GET — отримання стану конкретної сесії
// =====================================================

export async function GET(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { testId } = await params;

    const sessionIdParam =
      req.nextUrl.searchParams.get(
        "sessionId"
      );

    const testIdNumber = Number(testId);

    const sessionId = sessionIdParam
      ? Number(sessionIdParam)
      : null;

    if (
      !Number.isInteger(testIdNumber) ||
      testIdNumber <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !sessionId ||
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    const session =
      await prisma.testSession.findFirst({
        where: {
          id: sessionId,
          testId: testIdNumber,
        },

        select: {
          id: true,
          blocked: true,
          blockReason: true,
          timeLeft: true,
          extraTime: true,
          finished: true,
        },
      });

    if (!session) {
      return NextResponse.json(
        null
      );
    }

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
// POST — heartbeat конкретної сесії
// =====================================================

export async function POST(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { testId } = await params;

    const body = await req.json();

    const testIdNumber = Number(testId);
    const sessionId = Number(
      body.sessionId
    );

    if (
      !Number.isInteger(testIdNumber) ||
      testIdNumber <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Знаходимо саме цю сесію
    // =================================================

    const session =
      await prisma.testSession.findFirst({
        where: {
          id: sessionId,
          testId: testIdNumber,
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
    // Якщо heartbeat
    // =================================================

    if (body.heartbeat === true) {
      const updatedSession =
        await prisma.testSession.update({
          where: {
            id: session.id,
          },

          data: {
            lastActivityAt:
              new Date(),
          },

          select: {
            id: true,
            lastActivityAt: true,
          },
        });

      return NextResponse.json(
        updatedSession
      );
    }

    // =================================================
    // Якщо потрібно просто оновити сесію
    // =================================================

    const updatedSession =
      await prisma.testSession.update({
        where: {
          id: session.id,
        },

        data: {
          ...(typeof body.currentQuestion ===
          "number"
            ? {
                currentQuestion:
                  body.currentQuestion,
              }
            : {}),

          ...(body.savedAnswers !==
          undefined
            ? {
                savedAnswers:
                  body.savedAnswers,
              }
            : {}),

          ...(typeof body.timeLeft ===
          "number"
            ? {
                timeLeft:
                  body.timeLeft,
              }
            : {}),

          ...(typeof body.finished ===
          "boolean"
            ? {
                finished:
                  body.finished,
              }
            : {}),

          ...(body.finished === true
            ? {
                finishedAt:
                  new Date(),
              }
            : {}),

          lastActivityAt:
            new Date(),
        },
      });

    return NextResponse.json(
      updatedSession
    );
  } catch (error) {
    console.error(
      "POST SESSION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Помилка збереження сесії.",
      },
      {
        status: 500,
      }
    );
  }
}