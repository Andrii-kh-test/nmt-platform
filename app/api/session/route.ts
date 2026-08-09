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
    const body =
      await req.json();

    const {
      testId,
      currentQuestion,
      savedAnswers,
      timeLeft,
      finished,
    } = body;

    // -----------------------
    // Перевірка testId
    // -----------------------

    if (
      !testId ||
      Number(testId) <= 0
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

    const numericTestId =
      Number(testId);

    // -----------------------
    // Шукаємо активну сесію
    // -----------------------

    let session =
      await prisma.testSession.findFirst(
        {
          where: {
            testId:
              numericTestId,

            finished: false,
          },

          orderBy: {
            createdAt: "desc",
          },
        }
      );

    // -----------------------
    // Якщо сесії немає —
    // створюємо
    // -----------------------

    if (!session) {
      session =
        await prisma.testSession.create(
          {
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
          }
        );
    }

    // -----------------------
    // Якщо сесія існує —
    // оновлюємо
    // -----------------------

    else {
      session =
        await prisma.testSession.update(
          {
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

              // Записуємо час завершення
              // тільки під час завершення
              ...(finished
                ? {
                    finishedAt:
                      session.finishedAt ??
                      new Date(),
                  }
                : {}),
            },
          }
        );
    }

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