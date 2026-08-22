import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// POST /api/test/begin
//
// Викликається ОДИН РАЗ кнопкою
// «Розпочати тестування».
//
// Саме тут офіційно починається тестування.
//
// До цього моменту startedAt === null.
//
// Endpoint:
// - перевіряє sessionId;
// - перевіряє існування сесії;
// - перевіряє, що сесія належить тесту;
// - якщо startedAt вже встановлений —
//   повторно його НЕ змінює;
// - якщо startedAt === null —
//   встановлює поточний час;
// - повертає актуальний стан сесії.
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    // ===================================================
    // BODY
    // ===================================================

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректне тіло запиту.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректне тіло запиту.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      sessionId,
      testId,
    } = body as {
      sessionId?: unknown;
      testId?: unknown;
    };

    // ===================================================
    // SESSION ID
    // ===================================================

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
          message:
            "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // TEST ID
    // ===================================================

    const numericTestId =
      Number(testId);

    if (
      !Number.isInteger(
        numericTestId
      ) ||
      numericTestId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // ПОШУК СЕСІЇ
    // ===================================================

    const session =
      await prisma.testSession.findUnique({
        where: {
          id: numericSessionId,
        },

        select: {
          id: true,
          testId: true,

          startedAt: true,

          currentQuestion: true,
          savedAnswers: true,

          timeLeft: true,
          extraTime: true,

          finished: true,
          finishedAt: true,

          blocked: true,
          blockReason: true,
          blockedAt: true,

          lastActivityAt: true,

          result: {
            select: {
              id: true,
            },
          },
        },
      });

    // ===================================================
    // СЕСІЮ НЕ ЗНАЙДЕНО
    // ===================================================

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Сесію тестування не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // ===================================================
    // ПЕРЕВІРКА TEST ID
    // ===================================================

    if (
      session.testId !==
      numericTestId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Сесія не належить цьому тесту.",
        },
        {
          status: 403,
        }
      );
    }

    // ===================================================
    // ПЕРЕВІРКА СТАНУ
    // ===================================================

    if (session.finished) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Тестування вже завершено.",
        },
        {
          status: 409,
        }
      );
    }

    if (session.blocked) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Тестування заблоковано.",
          blockReason:
            session.blockReason,
        },
        {
          status: 409,
        }
      );
    }

    // ===================================================
    // ЯКЩО ТЕСТ ВЖЕ РОЗПОЧАТО
    //
    // Повторне натискання кнопки НЕ повинно
    // змінювати startedAt.
    //
    // Це дуже важливо.
    // ===================================================

    if (session.startedAt) {
      return NextResponse.json(
        {
          success: true,
          alreadyStarted: true,

          session: {
            id: session.id,

            testId:
              session.testId,

            startedAt:
              session.startedAt,

            currentQuestion:
              session.currentQuestion,

            savedAnswers:
              session.savedAnswers,

            timeLeft:
              Math.max(
                0,
                Math.floor(
                  session.timeLeft
                )
              ),

            extraTime:
              Math.max(
                0,
                Math.floor(
                  session.extraTime
                )
              ),

            finished:
              session.finished,

            finishedAt:
              session.finishedAt,

            blocked:
              session.blocked,

            blockReason:
              session.blockReason,

            blockedAt:
              session.blockedAt,

            lastActivityAt:
              session.lastActivityAt,

            resultId:
              session.result?.id ??
              null,
          },
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    // ===================================================
    // ОФІЦІЙНИЙ ПОЧАТОК ТЕСТУВАННЯ
    //
    // Саме тут запускається час.
    // ===================================================

    const now =
      new Date();

    const updated =
      await prisma.testSession.update({
        where: {
          id: session.id,
        },

        data: {
          startedAt: now,

          lastActivityAt: now,
        },

        select: {
          id: true,
          testId: true,

          startedAt: true,

          currentQuestion: true,
          savedAnswers: true,

          timeLeft: true,
          extraTime: true,

          finished: true,
          finishedAt: true,

          blocked: true,
          blockReason: true,
          blockedAt: true,

          lastActivityAt: true,

          result: {
            select: {
              id: true,
            },
          },
        },
      });

    // ===================================================
    // ВІДПОВІДЬ
    // ===================================================

    return NextResponse.json(
      {
        success: true,
        alreadyStarted: false,

        session: {
          id: updated.id,

          testId:
            updated.testId,

          startedAt:
            updated.startedAt,

          currentQuestion:
            updated.currentQuestion,

          savedAnswers:
            updated.savedAnswers,

          timeLeft:
            Math.max(
              0,
              Math.floor(
                updated.timeLeft
              )
            ),

          extraTime:
            Math.max(
              0,
              Math.floor(
                updated.extraTime
              )
            ),

          finished:
            updated.finished,

          finishedAt:
            updated.finishedAt,

          blocked:
            updated.blocked,

          blockReason:
            updated.blockReason,

          blockedAt:
            updated.blockedAt,

          lastActivityAt:
            updated.lastActivityAt,

          resultId:
            updated.result?.id ??
            null,
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "TEST BEGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося розпочати тестування.",
      },
      {
        status: 500,
      }
    );
  }
}