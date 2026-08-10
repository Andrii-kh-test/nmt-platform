import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// POST — створення / оновлення сесії учасником
//
// ВАЖЛИВО:
//
// Учасник може змінювати:
// - currentQuestion
// - savedAnswers
// - finished
//
// Учасник НЕ може через цей маршрут змінювати:
// - timeLeft
// - extraTime
// - blocked
// - blockReason
//
// Ці поля контролюються сервером та
// адміністративною панеллю.
// =====================================================

export async function POST(
  req: NextRequest
) {
  try {
    const body = await req.json();

    const {
      sessionId,
      testId,
      currentQuestion,
      savedAnswers,
      finished,
    } = body;

    // =====================================================
    // Перетворення ID
    // =====================================================

    const numericSessionId =
      sessionId !== undefined &&
      sessionId !== null
        ? Number(sessionId)
        : null;

    const numericTestId =
      testId !== undefined &&
      testId !== null
        ? Number(testId)
        : null;

    // =====================================================
    // 1. Якщо передано sessionId
    // =====================================================

    if (
      numericSessionId !== null &&
      Number.isInteger(
        numericSessionId
      ) &&
      numericSessionId > 0
    ) {
      const session =
        await prisma.testSession.findUnique({
          where: {
            id: numericSessionId,
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
      // Дані, які дозволено змінювати учаснику
      // ===================================================

      const updateData: {
        currentQuestion?: number;
        savedAnswers?: any;
        finished?: boolean;
        finishedAt?: Date | null;
        lastActivityAt: Date;
      } = {
        lastActivityAt: new Date(),
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
        savedAnswers !== undefined
      ) {
        updateData.savedAnswers =
          savedAnswers;
      }

      // ===================================================
      // Завершення тестування
      // ===================================================

      if (
        typeof finished === "boolean"
      ) {
        updateData.finished =
          finished;

        if (finished) {
          updateData.finishedAt =
            session.finishedAt ??
            new Date();
        }
      }

      // ===================================================
      // Оновлення сесії
      //
      // КРИТИЧНО:
      //
      // тут НЕ змінюються:
      //
      // timeLeft
      // extraTime
      // blocked
      // blockReason
      //
      // тому адміністративні зміни не
      // перезаписуються браузером.
      // ===================================================

      const updatedSession =
        await prisma.testSession.update({
          where: {
            id: session.id,
          },

          data: updateData,
        });

      return NextResponse.json(
        updatedSession
      );
    }

    // =====================================================
    // 2. Якщо sessionId немає — працюємо через testId
    // =====================================================

    if (
      numericTestId === null ||
      !Number.isInteger(
        numericTestId
      ) ||
      numericTestId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Не передано коректний sessionId або testId.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // 3. Шукаємо активну сесію тесту
    // =====================================================

    let session =
      await prisma.testSession.findFirst({
        where: {
          testId: numericTestId,
          finished: false,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    // =====================================================
    // 4. Якщо сесії немає — створюємо
    // =====================================================

    if (!session) {
      session =
        await prisma.testSession.create({
          data: {
            testId:
              numericTestId,

            currentQuestion:
              typeof currentQuestion ===
                "number" &&
              Number.isInteger(
                currentQuestion
              )
                ? currentQuestion
                : 0,

            savedAnswers:
              savedAnswers ?? {},

            // Початковий час повинен
            // встановлюватися під час
            // запуску тесту.
            timeLeft: 0,

            finished:
              typeof finished ===
              "boolean"
                ? finished
                : false,

            finishedAt:
              finished === true
                ? new Date()
                : null,

            lastActivityAt:
              new Date(),
          },
        });

      return NextResponse.json(
        session
      );
    }

    // =====================================================
    // 5. Оновлюємо існуючу сесію
    // =====================================================

    const updateData: {
      currentQuestion?: number;
      savedAnswers?: any;
      finished?: boolean;
      finishedAt?: Date | null;
      lastActivityAt: Date;
    } = {
      lastActivityAt: new Date(),
    };

    // =====================================================
    // Поточне питання
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
    // Збережені відповіді
    // =====================================================

    if (
      savedAnswers !== undefined
    ) {
      updateData.savedAnswers =
        savedAnswers;
    }

    // =====================================================
    // Завершення
    // =====================================================

    if (
      typeof finished === "boolean"
    ) {
      updateData.finished =
        finished;

      if (finished) {
        updateData.finishedAt =
          session.finishedAt ??
          new Date();
      }
    }

    // =====================================================
    // КРИТИЧНО:
    //
    // Тут НЕ повинно бути:
    //
    // timeLeft: ...
    // extraTime: ...
    // blocked: ...
    // blockReason: ...
    //
    // Інакше автозбереження може
    // скасувати адміністративні зміни.
    // =====================================================

    session =
      await prisma.testSession.update({
        where: {
          id: session.id,
        },

        data: updateData,
      });

    return NextResponse.json(
      session
    );
  } catch (error) {
    console.error(
      "SESSION API ERROR:",
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