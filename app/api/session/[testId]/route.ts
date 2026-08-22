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
// GET НЕ ЗМІНЮЄ БАЗУ ДАНИХ.
//
// Якщо startedAt === null:
// - тест ще офіційно не розпочато;
// - час НЕ відраховується;
// - повертається збережений timeLeft.
//
// Якщо startedAt !== null:
// - час розраховується від startedAt.
//
// НІЯКОГО UPDATE.
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
          status: 400
        }
      );
    }

    // ===================================================
    // ОТРИМУЄМО СЕСІЮ
    //
    // ТІЛЬКИ SELECT.
    //
    // GET НІКОЛИ НЕ РОБИТЬ UPDATE.
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
    // БАЗОВА ВІДПОВІДЬ
    // ===================================================

    const baseResponse = {
      id: session.id,

      testId:
        session.testId,

      participantId:
        session.participantId,

      currentQuestion:
        session.currentQuestion,

      savedAnswers:
        session.savedAnswers,

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
    };

    // ===================================================
    // ЗАВЕРШЕНА СЕСІЯ
    //
    // Після завершення таймер більше
    // не перераховується.
    // ===================================================

    if (session.finished) {
      return NextResponse.json(
        {
          ...baseResponse,

          timeLeft:
            Math.max(
              0,
              Math.floor(
                session.timeLeft
              )
            ),
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
    // ЗАБЛОКОВАНА СЕСІЯ
    //
    // Під час блокування час НЕ зменшується.
    //
    // Повертаємо timeLeft, який збережений
    // у БД.
    // ===================================================

    if (session.blocked) {
      return NextResponse.json(
        {
          ...baseResponse,

          timeLeft:
            Math.max(
              0,
              Math.floor(
                session.timeLeft
              )
            ),
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
    // ТЕСТ ЩЕ НЕ РОЗПОЧАТО
    //
    // startedAt === null означає:
    //
    // учасник створив сесію,
    // але ще НЕ натиснув
    // «Розпочати тестування».
    //
    // У цей момент час НЕ МОЖНА відраховувати.
    // ===================================================

    if (
      session.startedAt === null
    ) {
      return NextResponse.json(
        {
          ...baseResponse,

          timeLeft:
            Math.max(
              0,
              Math.floor(
                session.timeLeft
              )
            ),
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
    // АКТИВНА СЕСІЯ
    //
    // ВАЖЛИВО:
    //
    // НЕ використовуємо lastActivityAt.
    //
    // Heartbeat оновлює lastActivityAt,
    // тому він НЕ повинен використовуватися
    // для розрахунку часу тестування.
    //
    // Для активної сесії використовуємо
    // startedAt.
    // ===================================================

    const now =
      new Date();

    // Тут TypeScript уже знає,
    // що startedAt НЕ null,
    // оскільки вище була перевірка:
    //
    // if (session.startedAt === null) return ...

    const startedAt =
      session.startedAt;

    const elapsedSeconds =
      Math.max(
        0,
        Math.floor(
          (
            now.getTime() -
            startedAt.getTime()
          ) / 1000
        )
      );

    // ===================================================
    // БАЗОВИЙ ЧАС ТЕСТУ
    //
    // duration у Test зберігається
    // у хвилинах.
    //
    // Перетворюємо у секунди.
    // ===================================================

    const baseDurationSeconds =
      Math.max(
        0,
        Math.floor(
          session.test.duration *
            60
        )
      );

    // ===================================================
    // ДОДАТКОВИЙ ЧАС
    //
    // extraTime зберігається
    // у секундах.
    // ===================================================

    const extraTime =
      Math.max(
        0,
        Math.floor(
          session.extraTime
        )
      );

    // ===================================================
    // АКТУАЛЬНИЙ ЗАЛИШОК
    //
    // duration
    // + extraTime
    // - elapsed
    //
    // НІЧОГО НЕ ЗАПИСУЄМО В БД.
    // ===================================================

    const actualTimeLeft =
      Math.max(
        0,
        baseDurationSeconds +
          extraTime -
          elapsedSeconds
      );

    // ===================================================
    // ВІДПОВІДЬ
    // ===================================================

    return NextResponse.json(
      {
        ...baseResponse,

        timeLeft:
          actualTimeLeft,
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
//
// Це захищає адміністративні дії
// та офіційний час початку тестування.
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
    //
    // НЕ змінює:
    // - startedAt;
    // - timeLeft;
    // - extraTime;
    // - blocked;
    // - blockReason;
    // - blockedAt.
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
    // скасувати завершення сесії.
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
    // Тому POST учасника не може
    // перезаписати адміністративні
    // зміни або офіційний час старту.
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