import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// POST — створення / оновлення сесії учасником
// =====================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      sessionId,
      testId,
      currentQuestion,
      savedAnswers,
      finished,
    } = body;

    const numericSessionId =
      sessionId !== undefined && sessionId !== null
        ? Number(sessionId)
        : null;

    const numericTestId =
      testId !== undefined && testId !== null
        ? Number(testId)
        : null;

    // =====================================================
    // 1. Якщо є sessionId — працюємо саме з цією сесією
    // =====================================================

    if (
      numericSessionId &&
      Number.isInteger(numericSessionId) &&
      numericSessionId > 0
    ) {
      const session = await prisma.testSession.findUnique({
        where: {
          id: numericSessionId,
        },
      });

      if (!session) {
        return NextResponse.json(
          {
            error: "Сесію тестування не знайдено.",
          },
          {
            status: 404,
          }
        );
      }

      // ---------------------------------------------------
      // ВАЖЛИВО:
      // учасник НЕ передає timeLeft.
      //
      // timeLeft контролюється сервером та адміністративними
      // командами.
      // ---------------------------------------------------

      const updatedSession =
        await prisma.testSession.update({
          where: {
            id: session.id,
          },

          data: {
            ...(typeof currentQuestion === "number"
              ? {
                  currentQuestion,
                }
              : {}),

            ...(savedAnswers !== undefined
              ? {
                  savedAnswers,
                }
              : {}),

            ...(typeof finished === "boolean"
              ? {
                  finished,
                }
              : {}),

            ...(finished === true
              ? {
                  finishedAt:
                    session.finishedAt ??
                    new Date(),
                }
              : {}),

            lastActivityAt: new Date(),
          },
        });

      return NextResponse.json(updatedSession);
    }

    // =====================================================
    // 2. Якщо sessionId немає — використовуємо testId
    // =====================================================

    if (
      !numericTestId ||
      !Number.isInteger(numericTestId) ||
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
    // 3. Шукаємо активну сесію
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
            testId: numericTestId,

            currentQuestion:
              typeof currentQuestion === "number"
                ? currentQuestion
                : 0,

            savedAnswers:
              savedAnswers ?? {},

            timeLeft: 0,

            finished:
              typeof finished === "boolean"
                ? finished
                : false,

            finishedAt:
              finished === true
                ? new Date()
                : null,

            lastActivityAt: new Date(),
          },
        });

      return NextResponse.json(session);
    }

    // =====================================================
    // 5. Оновлюємо сесію
    // =====================================================

    session =
      await prisma.testSession.update({
        where: {
          id: session.id,
        },

        data: {
          ...(typeof currentQuestion === "number"
            ? {
                currentQuestion,
              }
            : {}),

          ...(savedAnswers !== undefined
            ? {
                savedAnswers,
              }
            : {}),

          ...(typeof finished === "boolean"
            ? {
                finished,
              }
            : {}),

          ...(finished === true
            ? {
                finishedAt:
                  session.finishedAt ??
                  new Date(),
              }
            : {}),

          lastActivityAt: new Date(),
        },
      });

    return NextResponse.json(session);
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