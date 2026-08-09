import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

// =======================
// POST — створення / оновлення сесії
// =======================

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
      timeLeft,
      finished,
    } = body;

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
    // 1. Якщо передано sessionId —
    //    працюємо саме з цією сесією
    // =====================================================

    if (
      numericSessionId &&
      numericSessionId > 0
    ) {
      const existingSession =
        await prisma.testSession.findUnique({
          where: {
            id: numericSessionId,
          },
        });

      if (!existingSession) {
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

      const updatedSession =
        await prisma.testSession.update({
          where: {
            id: numericSessionId,
          },

          data: {
            currentQuestion:
              Number(
                currentQuestion ?? 0
              ),

            savedAnswers:
              savedAnswers ?? {},

            timeLeft:
              Number(
                timeLeft ?? 0
              ),

            finished:
              Boolean(
                finished ?? false
              ),

            ...(finished
              ? {
                  finishedAt:
                    existingSession.finishedAt ??
                    new Date(),
                }
              : {}),
          },
        });

      return NextResponse.json(
        updatedSession
      );
    }

    // =====================================================
    // 2. Якщо sessionId немає —
    //    використовуємо testId
    // =====================================================

    if (
      !numericTestId ||
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
    // 3. Шукаємо активну сесію цього тесту
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
              Number(
                currentQuestion ?? 0
              ),

            savedAnswers:
              savedAnswers ?? {},

            timeLeft:
              Number(
                timeLeft ?? 0
              ),

            finished:
              Boolean(
                finished ?? false
              ),

            finishedAt:
              finished
                ? new Date()
                : null,
          },
        });

      return NextResponse.json(
        session
      );
    }

    // =====================================================
    // 5. Оновлюємо знайдену сесію
    // =====================================================

    session =
      await prisma.testSession.update({
        where: {
          id: session.id,
        },

        data: {
          currentQuestion:
            Number(
              currentQuestion ?? 0
            ),

          savedAnswers:
            savedAnswers ?? {},

          timeLeft:
            Number(
              timeLeft ?? 0
            ),

          finished:
            Boolean(
              finished ?? false
            ),

          ...(finished
            ? {
                finishedAt:
                  session.finishedAt ??
                  new Date(),
              }
            : {}),
        },
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
          "Помилка збереження сесії",
      },
      {
        status: 500,
      }
    );
  }
}