import {
  NextRequest,
  NextResponse,
} from "next/server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// GET
//
// GET /api/session/[testId]?sessionId=123
//
// Повертає поточний стан сесії.
//
// ВАЖЛИВО:
//
// GET НЕ ЗМІНЮЄ БАЗУ ДАНИХ.
//
// timeLeft повертається саме зі сесії.
//
// Фактичний countdown запускається на клієнті
// через TestSessionContext.
//
// Адміністративні зміни (+5 хв, -5 хв) записуються
// у timeLeft через /api/session/manage/[id]
// і тому будуть отримані наступним GET.
// =====================================================

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      testId: string;
    }>;
  }
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

    const { searchParams } =
      new URL(request.url);

    const sessionIdParam =
      searchParams.get(
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
    // ОТРИМУЄМО СЕСІЮ
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

          currentQuestion: true,
          savedAnswers: true,

          timeLeft: true,
          extraTime: true,

          finished: true,
          finishedAt: true,

          blocked: true,
          blockReason: true,
          blockedAt: true,

          startedAt: true,
          createdAt: true,
          updatedAt: true,
          lastActivityAt: true,

          test: {
            select: {
              duration: true,
            },
          },

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
          error:
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
          error:
            "Сесія не належить цьому тесту.",
        },
        {
          status: 403,
        }
      );
    }

    // ===================================================
    // TIME LEFT
    //
    // КЛЮЧОВА ЗМІНА:
    //
    // НЕ перераховуємо:
    //
    // duration + extraTime - elapsed
    //
    // через startedAt.
    //
    // Повертаємо timeLeft із БД.
    //
    // Countdown працює локально в
    // TestSessionContext.
    //
    // Адміністративні зміни часу записуються
    // безпосередньо в timeLeft.
    // =====================================================

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
    // ВІДПОВІДЬ
    // ===================================================

    return NextResponse.json(
      {
        id: session.id,

        testId:
          session.testId,

        participantId:
          session.participantId,

        currentQuestion:
          session.currentQuestion,

        savedAnswers:
          session.savedAnswers,

        timeLeft:
          normalizedTimeLeft,

        extraTime:
          normalizedExtraTime,

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

        startedAt:
          session.startedAt,

        createdAt:
          session.createdAt,

        updatedAt:
          session.updatedAt,

        lastActivityAt:
          session.lastActivityAt,

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
// 2. збереження currentQuestion;
// 3. збереження savedAnswers;
// 4. завершення сесії.
//
// УЧАСНИК НЕ МОЖЕ ЗМІНЮВАТИ:
//
// - startedAt;
// - timeLeft;
// - extraTime;
// - blocked;
// - blockReason;
// - blockedAt.
// =====================================================

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      testId: string;
    }>;
  }
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
    // ОТРИМУЄМО СЕСІЮ
    // ===================================================

    const session =
      await prisma.testSession.findUnique({
        where: {
          id: numericSessionId,
        },

        select: {
          id: true,
          testId: true,

          currentQuestion: true,
          savedAnswers: true,

          timeLeft: true,
          extraTime: true,

          finished: true,
          finishedAt: true,

          blocked: true,
          blockReason: true,
          blockedAt: true,

          startedAt: true,
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
          error:
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
          error:
            "Сесія не належить цьому тесту.",
        },
        {
          status: 403,
        }
      );
    }

    const now =
      new Date();

    // ===================================================
    // HEARTBEAT
    //
    // Heartbeat змінює ТІЛЬКИ
    // lastActivityAt.
    // ===================================================

    if (heartbeat === true) {
      const updated =
        await prisma.testSession.update({
          where: {
            id: session.id,
          },

          data: {
            lastActivityAt:
              now,
          },

          select: {
            id: true,
            testId: true,

            currentQuestion: true,
            savedAnswers: true,

            timeLeft: true,
            extraTime: true,

            finished: true,
            finishedAt: true,

            blocked: true,
            blockReason: true,
            blockedAt: true,

            startedAt: true,
            lastActivityAt: true,

            result: {
              select: {
                id: true,
              },
            },
          },
        });

      return NextResponse.json(
        {
          id: updated.id,

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
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    // ===================================================
    // ПІДГОТОВКА UPDATE
    // ===================================================

    const updateData:
      Prisma.TestSessionUpdateInput =
      {
        lastActivityAt:
          now,
      };

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
        savedAnswers === null
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
    // Дозволяємо тільки:
    //
    // finished = true
    //
    // finished = false НЕ МОЖЕ
    // скасувати завершення.
    // ===================================================

    if (finished === true) {
      if (!session.finished) {
        updateData.finished =
          true;

        updateData.finishedAt =
          session.finishedAt ??
          now;
      }
    }

    // ===================================================
    // КРИТИЧНО
    //
    // Тут НЕМАЄ:
    //
    // startedAt
    // timeLeft
    // extraTime
    // blocked
    // blockReason
    // blockedAt
    //
    // Тому учасник не може
    // перезаписати адміністративні зміни.
    // ===================================================

    const updated =
      await prisma.testSession.update({
        where: {
          id: session.id,
        },

        data: updateData,

        select: {
          id: true,
          testId: true,

          currentQuestion: true,
          savedAnswers: true,

          timeLeft: true,
          extraTime: true,

          finished: true,
          finishedAt: true,

          blocked: true,
          blockReason: true,
          blockedAt: true,

          startedAt: true,
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
        id: updated.id,

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
            "no-store, no-cache, must-revalidate",
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
          "Не вдалося оновити сесію.",
      },
      {
        status: 500,
      }
    );
  }
}