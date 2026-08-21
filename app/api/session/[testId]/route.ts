import {
  NextRequest,
  NextResponse,
} from "next/server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";

type Props = {
  params: Promise<{
    testId: string;
  }>;
};

// =====================================================
// GET — отримання стану конкретної сесії
//
// Використовується SessionMonitor.
//
// Повертаємо:
// - id
// - currentQuestion
// - blocked
// - blockReason
// - timeLeft
// - extraTime
// - finished
// - resultId
//
// ВАЖЛИВО:
//
// GET нічого не змінює в БД.
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

    const sessionId =
      sessionIdParam !== null
        ? Number(sessionIdParam)
        : null;

    // =================================================
    // Перевірка testId
    // =================================================

    if (
      !Number.isInteger(testIdNumber) ||
      testIdNumber <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Перевірка sessionId
    // =================================================

    if (
      sessionId === null ||
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Шукаємо саме цю сесію
    // =================================================

    const session =
      await prisma.testSession.findFirst({
        where: {
          id: sessionId,
          testId: testIdNumber,
        },

        select: {
          id: true,

          currentQuestion: true,

          blocked: true,

          blockReason: true,

          timeLeft: true,

          extraTime: true,

          finished: true,

          finishedAt: true,

          startedAt: true,

          lastActivityAt: true,

          // -------------------------------------------
          // Якщо результат вже створений,
          // отримуємо його ID.
          //
          // Це особливо важливо після "Анулювати
          // результат" в адміністративній панелі.
          // -------------------------------------------

          test: {
            select: {
              id: true,
            },
          },
        },
      });

    // =================================================
    // Сесії немає
    // =================================================

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Сесію не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // Шукаємо останній результат цієї сесії
    //
    // У TestResult немає sessionId,
    // тому зв'язок визначаємо через:
    //
    // testId + startedAt / finishedAt
    //
    // Для анулювання результат створюється
    // безпосередньо під час завершення сесії.
    // =================================================

    let resultId: number | null = null;

    if (session.finished) {
      const result =
        await prisma.testResult.findFirst({
          where: {
            testId: testIdNumber,

            finishedAt:
              session.finishedAt ?? undefined,
          },

          orderBy: {
            id: "desc",
          },

          select: {
            id: true,
          },
        });

      resultId =
        result?.id ?? null;
    }

    // =================================================
    // Повертаємо стан
    // =================================================

    return NextResponse.json({
      success: true,

      id: session.id,

      currentQuestion:
        session.currentQuestion,

      blocked:
        session.blocked,

      blockReason:
        session.blockReason,

      timeLeft:
        session.timeLeft,

      extraTime:
        session.extraTime,

      finished:
        session.finished,

      finishedAt:
        session.finishedAt,

      startedAt:
        session.startedAt,

      lastActivityAt:
        session.lastActivityAt,

      resultId,
    });
  } catch (error) {
    console.error(
      "GET SESSION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
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
// POST — синхронізація сесії учасником
//
// Дозволено змінювати:
//
// - currentQuestion
// - savedAnswers
// - finished
//
// НЕ дозволено змінювати:
//
// - timeLeft
// - extraTime
// - blocked
// - blockReason
// - blockedAt
//
// Час контролюється сервером.
// =====================================================

export async function POST(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { testId } = await params;

    const body = await req.json();

    const testIdNumber = Number(testId);

    const sessionId =
      body.sessionId !== undefined &&
      body.sessionId !== null
        ? Number(body.sessionId)
        : null;

    // =================================================
    // Перевірка testId
    // =================================================

    if (
      !Number.isInteger(testIdNumber) ||
      testIdNumber <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Перевірка sessionId
    // =================================================

    if (
      sessionId === null ||
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Знаходимо сесію
    // =================================================

    const session =
      await prisma.testSession.findFirst({
        where: {
          id: sessionId,
          testId: testIdNumber,
        },
      });

    // =================================================
    // Сесію не знайдено
    // =================================================

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Сесію не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // HEARTBEAT
    //
    // Heartbeat не змінює жодного іншого поля.
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

      return NextResponse.json({
        success: true,
        heartbeat: true,
        session:
          updatedSession,
      });
    }

    // =================================================
    // Якщо сесія вже завершена
    //
    // Учасник не повинен мати можливості
    // змінювати завершену сесію.
    //
    // Але дозволяємо повторний POST,
    // якщо він просто повідомляє finished=true.
    // =================================================

    if (
      session.finished &&
      body.finished !== true
    ) {
      return NextResponse.json(
        {
          success: true,
          finished: true,
          session,
        }
      );
    }

    // =================================================
    // Формуємо дані для оновлення
    //
    // КРИТИЧНО:
    //
    // Тут НЕМАЄ:
    //
    // timeLeft
    // extraTime
    // blocked
    // blockReason
    // blockedAt
    //
    // Це захищає адміністративні зміни.
    // =================================================

    const updateData: Prisma.TestSessionUpdateInput = {
  lastActivityAt: new Date(),
};

    // =================================================
    // Поточне питання
    // =================================================

    if (
      typeof body.currentQuestion ===
        "number" &&
      Number.isInteger(
        body.currentQuestion
      ) &&
      body.currentQuestion >= 0
    ) {
      updateData.currentQuestion =
        body.currentQuestion;
    }

    // =================================================
    // Збережені відповіді
    // =================================================

    if (body.savedAnswers !== undefined) {
  updateData.savedAnswers =
    body.savedAnswers === null
      ? Prisma.JsonNull
      : (body.savedAnswers as Prisma.InputJsonValue);
}

    // =================================================
    // Завершення сесії
    // =================================================

    if (
      typeof body.finished ===
      "boolean"
    ) {
      updateData.finished =
        body.finished;

      if (body.finished) {
        updateData.finishedAt =
          session.finishedAt ??
          new Date();
      }
    }

    // =================================================
    // Оновлення
    // =================================================

    const updatedSession =
      await prisma.testSession.update({
        where: {
          id: session.id,
        },

        data: updateData,
      });

    // =================================================
    // Якщо після POST сесію завершено,
    // шукаємо результат.
    // =================================================

    let resultId: number | null =
      null;

    if (
      updatedSession.finished
    ) {
      const result =
        await prisma.testResult.findFirst(
          {
            where: {
              testId:
                updatedSession.testId,

              finishedAt:
                updatedSession.finishedAt ??
                undefined,
            },

            orderBy: {
              id: "desc",
            },

            select: {
              id: true,
            },
          }
        );

      resultId =
        result?.id ?? null;
    }

    // =================================================
    // Повертаємо актуальний стан
    // =================================================

    return NextResponse.json({
      success: true,

      session:
        updatedSession,

      resultId,
    });
  } catch (error) {
    console.error(
      "POST SESSION ERROR:",
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