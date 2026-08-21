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
// Повертає актуальний стан сесії учасника.
//
// Використовується:
// - SessionMonitor
// - MonitoringSessionState
// - RestoreSession
// - адміністративний моніторинг
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

    // ===================================================
    // Завантажуємо сесію
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
    // Перевіряємо, що сесія належить цьому тесту
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
    // Якщо сесія завершена
    //
    // Нічого більше не перераховуємо.
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

          timeLeft:
            Math.max(
              0,
              session.timeLeft
            ),

          extraTime:
            Math.max(
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
    // РОЗРАХУНОК АКТУАЛЬНОГО ЧАСУ
    //
    // Час зменшується сервером на основі:
    //
    // timeLeft
    // -
    // кількість секунд від lastActivityAt
    //
    // ВАЖЛИВО:
    //
    // lastActivityAt оновлюється heartbeat-ом.
    //
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
        session.timeLeft -
          elapsedSeconds
      );

    // ===================================================
    // Якщо час вичерпано
    // ===================================================

    if (
      actualTimeLeft <= 0 &&
      !session.blocked
    ) {
      actualTimeLeft = 0;

      // -------------------------------------------------
      // Не створюємо результат безпосередньо тут.
      //
      // Просто фіксуємо timeLeft = 0.
      //
      // Завершення результату має виконувати
      // існуючий механізм завершення тесту.
      // -------------------------------------------------

      const updated =
        await prisma.testSession.update({
          where: {
            id: session.id,
          },

          data: {
            timeLeft: 0,
            lastActivityAt: now,
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

      return NextResponse.json(
        {
          id: updated.id,

          testId: updated.testId,

          participantId:
            updated.participantId,

          currentQuestion:
            updated.currentQuestion,

          savedAnswers:
            updated.savedAnswers,

          timeLeft: 0,

          extraTime:
            Math.max(
              0,
              updated.extraTime
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

          createdAt:
            updated.createdAt,

          updatedAt:
            updated.updatedAt,

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
    // Якщо час ще є
    //
    // Оновлюємо серверне значення.
    // ===================================================

    const updated =
      await prisma.testSession.update({
        where: {
          id: session.id,
        },

        data: {
          timeLeft: actualTimeLeft,
          lastActivityAt: now,
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
    // Відповідь
    // ===================================================

    return NextResponse.json(
      {
        id: updated.id,

        testId: updated.testId,

        participantId:
          updated.participantId,

        currentQuestion:
          updated.currentQuestion,

        savedAnswers:
          updated.savedAnswers,

        timeLeft:
          Math.max(
            0,
            updated.timeLeft
          ),

        extraTime:
          Math.max(
            0,
            updated.extraTime
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

        createdAt:
          updated.createdAt,

        updatedAt:
          updated.updatedAt,

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
// Учасник НЕ може змінювати:
//
// - timeLeft
// - extraTime
// - blocked
// - blockReason
// - blockedAt
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
    // Завантажуємо сесію
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
    // Перевірка testId
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
    // heartbeat НЕ змінює:
    //
    // timeLeft
    // currentQuestion
    // savedAnswers
    // finished
    // blocked
    //
    // Він тільки повідомляє сервер,
    // що учасник активний.
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
              updated.timeLeft
            ),

          extraTime:
            Math.max(
              0,
              updated.extraTime
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
              "no-store",
          },
        }
      );
    }

    // ===================================================
    // ПІДГОТОВКА ДАНИХ ОНОВЛЕННЯ
    // ===================================================

    const updateData: {
      currentQuestion?: number;

      savedAnswers?:
        Prisma.InputJsonValue;

      finished?: boolean;

      finishedAt?: Date | null;

      lastActivityAt: Date;
    } = {
      lastActivityAt: now,
    };

    // ===================================================
    // Поточне питання
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
    // Збережені відповіді
    // ===================================================

    if (
      savedAnswers !==
      undefined
    ) {
      try {
        updateData.savedAnswers =
          savedAnswers as Prisma.InputJsonValue;
      } catch {
        return NextResponse.json(
          {
            error:
              "Некоректний формат збережених відповідей.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // ===================================================
    // ЗАВЕРШЕННЯ СЕСІЇ
    //
    // ВАЖЛИВО:
    //
    // finished = false від клієнта
    // НІКОЛИ не повертає завершену сесію
    // у незавершений стан.
    //
    // finished = true дозволяється тільки
    // для сесії, яка ще не була завершена.
    // ===================================================

    if (finished === true) {
      if (!session.finished) {
        updateData.finished = true;

        updateData.finishedAt =
          session.finishedAt ??
          now;
      }
    }

    // ===================================================
    // КРИТИЧНО
    //
    // Тут НІКОЛИ НЕ повинно бути:
    //
    // timeLeft
    // extraTime
    // blocked
    // blockReason
    // blockedAt
    //
    // Інакше браузер учасника зможе
    // перезаписати рішення адміністратора.
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
    // Відповідь
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
            updated.timeLeft
          ),

        extraTime:
          Math.max(
            0,
            updated.extraTime
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
            "no-store",
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