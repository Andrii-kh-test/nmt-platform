import {
  NextRequest,
  NextResponse,
} from "next/server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// TYPES
// =====================================================

type Props = {
  params: Promise<{
    testId: string;
  }>;
};

// =====================================================
// GET
//
// GET /api/session/[testId]?sessionId=123
//
// Повертає актуальний стан сесії.
//
// КРИТИЧНО ДЛЯ ТАЙМЕРА:
//
// GET НЕ ПЕРЕРАХОВУЄ timeLeft.
//
// timeLeft береться безпосередньо з БД.
//
// Countdown працює локально через
// TestSessionContext.
//
// КРИТИЧНО ДЛЯ СИНХРОНІЗАЦІЇ:
//
// GET щоразу читає з БД:
//
// - timeLeft;
// - extraTime;
// - blocked;
// - blockReason;
// - blockedAt;
// - finished;
// - currentQuestion;
// - savedAnswers.
//
// Тому адміністративні зміни,
// зроблені через /api/session/manage/[id],
// будуть отримані клієнтом при наступному GET.
// =====================================================

export async function GET(
  request: NextRequest,
  context: Props
) {
  try {
    // ===================================================
    // TEST ID
    // ===================================================

    const { testId } =
      await context.params;

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
          error:
            "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // SESSION ID
    // ===================================================

    const sessionIdParam =
      request.nextUrl.searchParams.get(
        "sessionId"
      );

    if (!sessionIdParam) {
      return NextResponse.json(
        {
          error:
            "Не передано id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    const sessionId =
      Number(sessionIdParam);

    if (
      !Number.isInteger(
        sessionId
      ) ||
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

    // ===================================================
    // SESSION
    // ===================================================

    const session =
      await prisma.testSession.findUnique({
        where: {
          id: sessionId,
        },

        select: {
          id: true,
          testId: true,
          participantId: true,

          currentQuestion:
            true,

          savedAnswers:
            true,

          timeLeft:
            true,

          extraTime:
            true,

          finished:
            true,

          finishedAt:
            true,

          blocked:
            true,

          blockReason:
            true,

          blockedAt:
            true,

          startedAt:
            true,

          createdAt:
            true,

          updatedAt:
            true,

          lastActivityAt:
            true,

          test: {
            select: {
              duration:
                true,
            },
          },

          result: {
            select: {
              id:
                true,
            },
          },
        },
      });

    // ===================================================
    // SESSION NOT FOUND
    // ===================================================

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Сесію тестування не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // ===================================================
    // TEST ID CHECK
    // ===================================================

    if (
      session.testId !==
      numericTestId
    ) {
      return NextResponse.json(
        {
          error:
            "Сесія не належить цьому тесту.",
        },
        {
          status: 403,
        }
      );
    }

    // ===================================================
    // NORMALIZE VALUES
    //
    // НЕ ВІДНІМАЄМО elapsed time.
    //
    // Це принципово для роботи клієнтського
    // countdown у TestSessionContext.
    // ===================================================

    const normalizedTimeLeft =
      Math.max(
        0,
        Math.floor(
          Number(
            session.timeLeft
          ) || 0
        )
      );

    const normalizedExtraTime =
      Math.max(
        0,
        Math.floor(
          Number(
            session.extraTime
          ) || 0
        )
      );

    // ===================================================
    // RESPONSE
    // ===================================================

    return NextResponse.json(
      {
        id:
          session.id,

        testId:
          session.testId,

        participantId:
          session.participantId,

        currentQuestion:
          session.currentQuestion,

        savedAnswers:
          session.savedAnswers,

        // -------------------------------------------------
        // ТАЙМЕР
        //
        // Повертаємо саме значення з БД.
        // -------------------------------------------------

        timeLeft:
          normalizedTimeLeft,

        extraTime:
          normalizedExtraTime,

        // -------------------------------------------------
        // СТАН СЕСІЇ
        // -------------------------------------------------

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

        // -------------------------------------------------
        // ДАТИ
        // -------------------------------------------------

        startedAt:
          session.startedAt,

        createdAt:
          session.createdAt,

        updatedAt:
          session.updatedAt,

        lastActivityAt:
          session.lastActivityAt,

        // -------------------------------------------------
        // RESULT
        // -------------------------------------------------

        resultId:
          session.result?.id ??
          null,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "SESSION GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Не вдалося отримати стан сесії.",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// POST
//
// Використовується для:
//
// 1. heartbeat;
// 2. currentQuestion;
// 3. savedAnswers;
// 4. finished.
//
// УЧАСНИК НЕ МОЖЕ ЗМІНЮВАТИ:
//
// - startedAt;
// - timeLeft;
// - extraTime;
// - blocked;
// - blockReason;
// - blockedAt.
//
// =====================================================

export async function POST(
  request: NextRequest,
  context: Props
) {
  try {
    // ===================================================
    // TEST ID
    // ===================================================

    const { testId } =
      await context.params;

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
          error:
            "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // BODY
    // ===================================================

    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Некоректне тіло запиту.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof body !==
        "object" ||
      body === null
    ) {
      return NextResponse.json(
        {
          error:
            "Некоректне тіло запиту.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      sessionId,
      heartbeat,
      currentQuestion,
      savedAnswers,
      finished,
    } = body as {
      sessionId?: unknown;
      heartbeat?: unknown;
      currentQuestion?: unknown;
      savedAnswers?: unknown;
      finished?: unknown;
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
          error:
            "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // SESSION
    // ===================================================

    const session =
      await prisma.testSession.findFirst({
        where: {
          id:
            numericSessionId,

          testId:
            numericTestId,
        },

        select: {
          id: true,
          testId: true,

          currentQuestion:
            true,

          savedAnswers:
            true,

          timeLeft:
            true,

          extraTime:
            true,

          finished:
            true,

          finishedAt:
            true,

          blocked:
            true,

          blockReason:
            true,

          blockedAt:
            true,

          startedAt:
            true,

          lastActivityAt:
            true,

          updatedAt:
            true,

          result: {
            select: {
              id:
                true,
            },
          },
        },
      });

    // ===================================================
    // SESSION NOT FOUND
    // ===================================================

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

    // ===================================================
    // TEST ID CHECK
    // ===================================================

    if (
      session.testId !==
      numericTestId
    ) {
      return NextResponse.json(
        {
          error:
            "Сесія не належить цьому тесту.",
        },
        {
          status: 403,
        }
      );
    }

    // ===================================================
    // NOW
    // ===================================================

    const now =
      new Date();

    // ===================================================
    // HEARTBEAT
    //
    // КРИТИЧНО:
    //
    // heartbeat НЕ змінює:
    //
    // - timeLeft;
    // - extraTime;
    // - lastActivityAt;
    //
    // Інакше heartbeat кожні кілька секунд
    // пересуватиме точку відліку таймера.
    //
    // Також heartbeat НЕ змінює:
    //
    // - blocked;
    // - blockReason;
    // - blockedAt.
    //
    // Отже адміністративна команда
    // не перезаписується учасником.
    // ===================================================

    if (
      heartbeat === true
    ) {
      const updated =
        await prisma.testSession.update({
          where: {
            id:
              session.id,
          },

          data: {
            // ------------------------------------------------
            // НАВМИСНО НЕ ЗМІНЮЄМО lastActivityAt
            // ------------------------------------------------
          },

          select: {
            id: true,
            testId: true,

            currentQuestion:
              true,

            savedAnswers:
              true,

            timeLeft:
              true,

            extraTime:
              true,

            finished:
              true,

            finishedAt:
              true,

            blocked:
              true,

            blockReason:
              true,

            blockedAt:
              true,

            startedAt:
              true,

            lastActivityAt:
              true,

            updatedAt:
              true,

            result: {
              select: {
                id:
                  true,
              },
            },
          },
        });

      return NextResponse.json(
        {
          success:
            true,

          heartbeat:
            true,

          id:
            updated.id,

          testId:
            updated.testId,

          currentQuestion:
            updated.currentQuestion,

          savedAnswers:
            updated.savedAnswers,

          // -------------------------------------------------
          // НЕ ПЕРЕРАХОВУЄМО TIMER
          // -------------------------------------------------

          timeLeft:
            Math.max(
              0,
              Math.floor(
                Number(
                  updated.timeLeft
                ) || 0
              )
            ),

          extraTime:
            Math.max(
              0,
              Math.floor(
                Number(
                  updated.extraTime
                ) || 0
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

          startedAt:
            updated.startedAt,

          lastActivityAt:
            updated.lastActivityAt,

          resultId:
            updated.result?.id ??
            null,
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }

    // ===================================================
    // UPDATE DATA
    //
    // ЗВИЧАЙНИЙ POST:
    //
    // currentQuestion
    // savedAnswers
    //
    // НЕ чіпаємо:
    //
    // timeLeft
    // extraTime
    // blocked
    // blockReason
    // blockedAt
    //
    // lastActivityAt також НЕ чіпаємо,
    // якщо це не завершення.
    // ===================================================

    const updateData:
      Prisma.TestSessionUpdateInput =
      {};

    // ===================================================
    // CURRENT QUESTION
    // ===================================================

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

    // ===================================================
    // SAVED ANSWERS
    // ===================================================

    if (
      savedAnswers !==
      undefined
    ) {
      if (
        savedAnswers ===
        null
      ) {
        updateData.savedAnswers =
          Prisma.JsonNull;
      } else {
        updateData.savedAnswers =
          savedAnswers as
            Prisma.InputJsonValue;
      }
    }

    // ===================================================
    // FINISHED
    //
    // Завершення дозволене тільки через
    // finished = true.
    //
    // При завершенні:
    //
    // - finished = true
    // - finishedAt = now
    // - timeLeft = 0
    // - lastActivityAt = now
    //
    // Це єдина звичайна операція учасника,
    // яка змінює timeLeft.
    // ===================================================

    if (
      finished === true
    ) {
      updateData.finished =
        true;

      updateData.finishedAt =
        session.finishedAt ??
        now;

      updateData.timeLeft =
        0;

      updateData.lastActivityAt =
        now;
    }

    // ===================================================
    // UPDATE
    // ===================================================

    const updated =
      await prisma.testSession.update({
        where: {
          id:
            session.id,
        },

        data:
          updateData,

        select: {
          id: true,
          testId: true,

          currentQuestion:
            true,

          savedAnswers:
            true,

          timeLeft:
            true,

          extraTime:
            true,

          finished:
            true,

          finishedAt:
            true,

          blocked:
            true,

          blockReason:
            true,

          blockedAt:
            true,

          startedAt:
            true,

          lastActivityAt:
            true,

          updatedAt:
            true,

          result: {
            select: {
              id:
                true,
            },
          },
        },
      });

    // ===================================================
    // RESPONSE
    //
    // НЕ ПЕРЕРАХОВУЄМО timeLeft.
    //
    // Клієнтський TestSessionContext
    // сам керує countdown.
    //
    // Наступний GET отримає нове значення
    // timeLeft, якщо адміністратор його змінив.
    // ===================================================

    return NextResponse.json(
      {
        success:
          true,

        heartbeat:
          false,

        id:
          updated.id,

        testId:
          updated.testId,

        currentQuestion:
          updated.currentQuestion,

        savedAnswers:
          updated.savedAnswers,

        timeLeft:
          Math.max(
            0,
            Math.floor(
              Number(
                updated.timeLeft
              ) || 0
            )
          ),

        extraTime:
          Math.max(
            0,
            Math.floor(
              Number(
                updated.extraTime
              ) || 0
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

        startedAt:
          updated.startedAt,

        lastActivityAt:
          updated.lastActivityAt,

        resultId:
          updated.result?.id ??
          null,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "SESSION POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Не вдалося оновити стан сесії.",
      },
      {
        status: 500,
      }
    );
  }
}