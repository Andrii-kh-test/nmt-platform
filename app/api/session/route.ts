import {
  NextRequest,
  NextResponse,
} from "next/server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/app/lib/prisma";

export async function POST(
  req: NextRequest
) {
  try {
    const body = await req.json();

    const {
      sessionId,
      currentQuestion,
      savedAnswers,
      finished,
      heartbeat,
    } = body;

    // =====================================================
    // SESSION ID
    // =====================================================

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
          success: false,
          error:
            "Не передано коректний sessionId.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // ЗНАХОДИМО КОНКРЕТНУ СЕСІЮ
    // =====================================================

    const session =
      await prisma.testSession.findUnique({
        where: {
          id: numericSessionId,
        },
      });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Сесію тестування не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // HEARTBEAT
    // =====================================================

    if (heartbeat === true) {
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
            currentQuestion: true,
            timeLeft: true,
            extraTime: true,
            blocked: true,
            blockReason: true,
            finished: true,
            finishedAt: true,
            lastActivityAt: true,
          },
        });

      return NextResponse.json({
        success: true,
        session: updatedSession,
      });
    }

    // =====================================================
    // ЯКЩО СЕСІЮ ВЖЕ ЗАВЕРШЕНО
    // =====================================================

    if (session.finished) {
      return NextResponse.json({
        success: true,

        session: {
          id: session.id,

          currentQuestion:
            session.currentQuestion,

          savedAnswers:
            session.savedAnswers,

          timeLeft:
            session.timeLeft,

          extraTime:
            session.extraTime,

          blocked:
            session.blocked,

          blockReason:
            session.blockReason,

          finished:
            session.finished,

          finishedAt:
            session.finishedAt,
        },
      });
    }

    // =====================================================
    // ДАНІ ДЛЯ ОНОВЛЕННЯ
    // =====================================================

    const updateData: Prisma.TestSessionUpdateInput =
      {
        lastActivityAt:
          new Date(),
      };

    // =====================================================
    // CURRENT QUESTION
    // =====================================================

    if (
      typeof currentQuestion ===
        "number" &&
      Number.isInteger(
        currentQuestion
      ) &&
      currentQuestion >= 0
    ) {
      updateData.currentQuestion =
        currentQuestion;
    }

    // =====================================================
    // SAVED ANSWERS
    // =====================================================

    if (
      savedAnswers !== undefined
    ) {
      updateData.savedAnswers =
        savedAnswers === null
          ? Prisma.JsonNull
          : savedAnswers;
    }

    // =====================================================
    // FINISHED
    // =====================================================

    if (
      typeof finished ===
      "boolean"
    ) {
      if (finished) {
        updateData.finished =
          true;

        updateData.finishedAt =
          session.finishedAt ??
          new Date();
      }
    }

    // =====================================================
    // ОНОВЛЕННЯ
    //
    // ВАЖЛИВО:
    //
    // НЕ змінюємо:
    //
    // timeLeft
    // extraTime
    // blocked
    // blockReason
    // blockedAt
    //
    // Ці поля контролює сервер / адміністратор.
    // =====================================================

    const updatedSession =
      await prisma.testSession.update({
        where: {
          id: session.id,
        },

        data: updateData,
      });

    // =====================================================
    // ПОВЕРТАЄМО АКТУАЛЬНИЙ СТАН
    // =====================================================

    return NextResponse.json({
      success: true,

      session: {
        id: updatedSession.id,

        currentQuestion:
          updatedSession.currentQuestion,

        savedAnswers:
          updatedSession.savedAnswers,

        timeLeft:
          updatedSession.timeLeft,

        extraTime:
          updatedSession.extraTime,

        blocked:
          updatedSession.blocked,

        blockReason:
          updatedSession.blockReason,

        finished:
          updatedSession.finished,

        finishedAt:
          updatedSession.finishedAt,

        lastActivityAt:
          updatedSession.lastActivityAt,
      },
    });
  } catch (error) {
    console.error(
      "SESSION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Помилка збереження сесії.",
      },
      {
        status: 500,
      }
    );
  }
}