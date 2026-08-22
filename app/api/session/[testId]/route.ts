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
// Повертає актуальний стан сесії.
//
// ВАЖЛИВО:
//
// GET НЕ ОНОВЛЮЄ БАЗУ ДАНИХ.
//
// Це принципова зміна.
//
// Раніше кожен GET кожні 2 секунди робив UPDATE
// testSession, через що виникало:
// P2024 - Timed out fetching a new connection
//
// Тепер GET тільки читає БД та розраховує
// актуальний timeLeft.
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
    const { testId } = await context.params;

    const numericTestId = Number(testId);

    if (
      !Number.isInteger(numericTestId) ||
      numericTestId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const sessionIdParam =
      searchParams.get("sessionId");

    if (!sessionIdParam) {
      return NextResponse.json(
        {
          error: "Не передано id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    const sessionId =
      Number(sessionIdParam);

    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // ОДНЕ ЧИТАННЯ БД
    //
    // ЖОДНОГО UPDATE.
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
    // ЗАВЕРШЕНА СЕСІЯ
    //
    // Для завершеної сесії нічого не перераховуємо.
    // ===================================================

    if (session.finished) {
      return NextResponse.json(
        {
          id: session.id,

          testId: session.testId,

          participantId:
            session.participantId,

          currentQuestion:
            session.currentQuestion,

          savedAnswers:
            session.savedAnswers,

          timeLeft: Math.max(
            0,
            session.timeLeft
          ),

          extraTime: Math.max(
            0,
            session.extraTime
          ),

          finished: true,

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
    }

    // ===================================================
    // АКТУАЛЬНИЙ ЧАС
    //
    // ВАЖЛИВО:
    //
    // Ми НЕ записуємо його назад у БД.
    //
    // timeLeft у БД залишається базовим серверним
    // значенням.
    //
    // Адміністративне +5 хвилин змінює timeLeft
    // у БД.
    //
    // Наступний GET побачить уже нове значення.
    // ===================================================

    const now = new Date();

    const lastActivity =
      session.lastActivityAt ??
      session.updatedAt ??
      session.startedAt;

    const elapsedSeconds =
      Math.max(
        0,
        Math.floor(
          (now.getTime() -
            lastActivity.getTime()) /
            1000
        )
      );

    let actualTimeLeft =
      Math.max(
        0,
        Math.floor(
          session.timeLeft -
            elapsedSeconds
        )
      );

    // ===================================================
    // ЗАБЛОКОВАНА СЕСІЯ
    //
    // Якщо адміністратор заблокував сесію,
    // не дозволяємо локальному відліку впливати
    // на її стан.
    //
    // Повертаємо поточний серверний timeLeft.
    // ===================================================

    if (session.blocked) {
      actualTimeLeft = Math.max(
        0,
        Math.floor(session.timeLeft)
      );
    }

    // ===================================================
    // ВІДПОВІДЬ
    //
    // НІЯКОГО UPDATE.
    // ===================================================

    return NextResponse.json(
      {
        id: session.id,

        testId: session.testId,

        participantId:
          session.participantId,

        currentQuestion:
          session.currentQuestion,

        savedAnswers:
          session.savedAnswers,

        timeLeft:
          actualTimeLeft,

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
// 1. heartbeat
// 2. збереження currentQuestion
// 3. збереження savedAnswers
// 4. завершення сесії
//
// УЧАСНИК НЕ МОЖЕ ЗМІНЮВАТИ:
//
// - timeLeft
// - extraTime
// - blocked
// - blockReason
// - blockedAt
//
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
    const { testId } = await context.params;

    const numericTestId = Number(testId);

    if (
      !Number.isInteger(numericTestId) ||
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

    const body =
      await request.json();

    const {
      sessionId,
      heartbeat,
      currentQuestion,
      savedAnswers,
      finished,
    } = body;

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
    // ЗНАХОДИМО СЕСІЮ
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

    const now = new Date();

    // ===================================================
    // HEARTBEAT
    //
    // Heartbeat змінює ТІЛЬКИ lastActivityAt.
    //
    // Особливо важливо:
    //
    // timeLeft НЕ змінюємо.
    // blocked НЕ змінюємо.
    // extraTime НЕ змінюємо.
    // ===================================================

    if (heartbeat === true) {
      const updated =
        await prisma.testSession.update({
          where: {
            id: session.id,
          },

          data: {
            lastActivityAt: now,
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

          testId: updated.testId,

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
    // ПІДГОТОВКА ОНОВЛЕННЯ
    // ===================================================

    const updateData:
      Prisma.TestSessionUpdateInput =
      {
        lastActivityAt: now,
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
      if (savedAnswers === null) {
        updateData.savedAnswers =
          Prisma.JsonNull;
      } else {
        updateData.savedAnswers =
          savedAnswers as Prisma.InputJsonValue;
      }
    }

    // ===================================================
    // FINISHED
    //
    // Клієнт може встановити finished = true.
    //
    // finished = false НІКОЛИ не повертає
    // завершену сесію назад.
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
    // У updateData ВІДСУТНІ:
    //
    // timeLeft
    // extraTime
    // blocked
    // blockReason
    // blockedAt
    //
    // Отже, учасник не може своїм POST
    // скасувати рішення адміністратора.
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

        testId: updated.testId,

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