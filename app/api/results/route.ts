import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const results =
      await prisma.testResult.findMany({
        orderBy: {
          createdAt: "desc",
        },

        include: {
          test: {
            include: {
              questions: {
                orderBy: {
                  order: "asc",
                },

                include: {
                  question: {
                    include: {
                      answerOptions: {
                        orderBy: {
                          order: "asc",
                        },
                      },
                    },
                  },
                },
              },
            },
          },

          session: {
            include: {
              participant: true,
            },
          },
        },
      });

    return NextResponse.json(results);
  } catch (error) {
    console.error(
      "GET RESULTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Не вдалося отримати результати.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    // =================================================
    // ПЕРЕВІРКА SESSION ID
    // =================================================

    const sessionId = Number(
      body.sessionId
    );

    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректний sessionId.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // ПЕРЕВІРЯЄМО, ЩО СЕСІЯ ІСНУЄ
    // =================================================

    const session =
      await prisma.testSession.findUnique({
        where: {
          id: sessionId,
        },
        select: {
          id: true,
          testId: true,
          participantId: true,
        },
      });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Сесію тестування не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // ПЕРЕВІРЯЄМО, ЩО РЕЗУЛЬТАТ НАЛЕЖИТЬ
    // САМЕ ЦІЙ СЕСІЇ
    // =================================================

    const testId = Number(
      body.testId
    );

    if (
      !Number.isInteger(testId) ||
      testId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректний testId.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      session.testId !== testId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Сесія не відповідає тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // СТВОРЮЄМО РЕЗУЛЬТАТ
    // =================================================

    const result =
      await prisma.testResult.create({
        data: {
          // ---------------------------------------------
          // КЛЮЧОВА ЗМІНА:
          //
          // Тепер TestResult пов'язаний
          // із конкретною TestSession.
          // ---------------------------------------------

          sessionId: session.id,

          testId: testId,

          earnedPoints:
            body.earnedPoints,

          maxPoints:
            body.maxPoints,

          percent:
            body.percent,

          correct:
            body.correct,

          incorrect:
            body.incorrect,

          skipped:
            body.skipped,

          timeSpent:
            body.timeSpent,

          answers:
            body.answers,

          finishReason:
            body.finishReason ??
            "manual",

          lastName:
            body.lastName ??
            null,

          firstName:
            body.firstName ??
            null,

          middleName:
            body.middleName ??
            null,

          accessCode:
            body.accessCode ??
            null,

          startedAt:
            body.startedAt
              ? new Date(
                  body.startedAt
                )
              : new Date(),

          finishedAt:
            body.finishedAt
              ? new Date(
                  body.finishedAt
                )
              : new Date(),
        },
      });

    // =================================================
    // RESPONSE
    // =================================================

    return NextResponse.json(
      result
    );
  } catch (error) {
    console.error(
      "POST RESULTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Помилка збереження результату.",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// DELETE — МАСОВЕ ВИДАЛЕННЯ РЕЗУЛЬТАТІВ
//
// DELETE /api/results
//
// Body:
// {
//   "ids": [1, 2, 3]
// }
// =====================================================

export async function DELETE(
  request: Request
) {
  try {
    const body = await request.json();

    const ids = body?.ids;

    // Перевіряємо, що ids є масивом
    // і що в ньому є хоча б один елемент.
    if (
      !Array.isArray(ids) ||
      ids.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Не вибрано жодного результату.",
        },
        {
          status: 400,
        }
      );
    }

    // Перетворюємо отримані значення
    // на числа та залишаємо тільки
    // додатні цілі числа.
    const resultIds = [
      ...new Set(
        ids
          .map((id: unknown) =>
            Number(id)
          )
          .filter(
            (id: number) =>
              Number.isInteger(id) &&
              id > 0
          )
      ),
    ];

    // Якщо після перевірки не залишилося
    // жодного коректного id.
    if (resultIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректні id результатів.",
        },
        {
          status: 400,
        }
      );
    }

    // Масове видалення одним запитом.
    const deleted =
      await prisma.testResult.deleteMany({
        where: {
          id: {
            in: resultIds,
          },
        },
      });

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count,
      message: `Успішно видалено результатів: ${deleted.count}.`,
    });
  } catch (error) {
    console.error(
      "DELETE RESULTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося видалити вибрані результати.",
      },
      {
        status: 500,
      }
    );
  }
}