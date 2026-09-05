import {
  NextRequest,
  NextResponse,
} from "next/server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/app/lib/prisma";

/*
 * ============================================================
 * GET
 *
 * GET /api/complex-tests/[id]/session?sessionId=123
 *
 * Повертає поточний стан комбінованої сесії
 * та повну структуру комбінованого тесту.
 *
 * КРИТИЧНО:
 *
 * GET НЕ перераховує timeLeft.
 * GET НЕ змінює БД.
 *
 * timeLeft береться безпосередньо з
 * ComplexTestSession.
 * ============================================================
 */

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /*
     * ========================================================
     * COMPLEX TEST ID
     * ========================================================
     */

    const { id } = await context.params;

    const complexTestId = Number(id);

    if (
      !Number.isInteger(complexTestId) ||
      complexTestId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректний id комбінованого тесту.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * SESSION ID
     * ========================================================
     */

    const { searchParams } =
      new URL(request.url);

    const sessionIdParam =
      searchParams.get("sessionId");

    if (!sessionIdParam) {
      return NextResponse.json(
        {
          success: false,
          message:
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
          success: false,
          message:
            "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * ОТРИМАННЯ СЕСІЇ
     *
     * Тільки SELECT.
     *
     * ЖОДНОГО UPDATE.
     *
     * timeLeft береться безпосередньо
     * з ComplexTestSession.
     * ========================================================
     */

    const session =
      await prisma.complexTestSession.findFirst({
        where: {
          id: sessionId,
          complexTestId,
        },

        select: {
          id: true,
          complexTestId: true,
          participantId: true,

          currentTestId: true,
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

          complexTest: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,

              /*
               * accessCode навмисно не повертаємо
               * учаснику.
               */

              codeRequired: true,
              isPublished: true,
              isArchived: true,

              examType: true,
              section: true,

              createdAt: true,
              updatedAt: true,

              tests: {
                orderBy: {
                  order: "asc",
                },

                select: {
                  id: true,
                  order: true,

                  test: {
                    select: {
                      id: true,
                      title: true,
                      subject: true,
                      duration: true,

                      questions: {
                        orderBy: {
                          order: "asc",
                        },

                        select: {
                          id: true,
                          order: true,

                          question: {
                            select: {
                              id: true,
                              type: true,
                              text: true,
                              points: true,

                              answerOptions: {
                                orderBy: {
                                  order: "asc",
                                },

                                select: {
                                  id: true,
                                  order: true,
                                  text: true,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

    /*
     * ========================================================
     * СЕСІЮ НЕ ЗНАЙДЕНО
     * ========================================================
     */

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Сесію комбінованого тестування не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ========================================================
     * ПІДГОТОВКА COMPLЕX TEST
     *
     * ВАЖЛИВО:
     *
     * complexTest буде повернений
     * НА ВЕРХНЬОМУ РІВНІ response.
     *
     * Тобто клієнт отримає:
     *
     * {
     *   success: true,
     *   session: {...},
     *   complexTest: {...}
     * }
     *
     * ========================================================
     */

    const complexTest = {
      id:
        session.complexTest.id,

      title:
        session.complexTest.title,

      description:
        session.complexTest.description,

      duration:
        session.complexTest.duration,

      examType:
        session.complexTest.examType,

      section:
        session.complexTest.section,

      tests:
        session.complexTest.tests.map(
          (item) => ({
            id:
              item.id,

            order:
              item.order,

            test: {
              id:
                item.test.id,

              title:
                item.test.title,

              subject:
                item.test.subject,

              duration:
                item.test.duration,

              questions:
                item.test.questions.map(
                  (
                    testQuestion
                  ) => ({
                    id:
                      testQuestion
                        .question
                        .id,

                    order:
                      testQuestion
                        .order,

                    text:
                      testQuestion
                        .question
                        .text,

                    type:
                      testQuestion
                        .question
                        .type,

                    points:
                      testQuestion
                        .question
                        .points,

                    answerOptions:
                      testQuestion
                        .question
                        .answerOptions.map(
                          (
                            option
                          ) => ({
                            id:
                              option.id,

                            order:
                              option.order,

                            text:
                              option.text,
                          })
                        ),
                  })
                ),
            },
          })
        ),
    };

    /*
     * ========================================================
     * ПІДГОТОВКА SESSION
     *
     * Тут complexTest НЕ буде.
     *
     * Він повертається окремо.
     * ========================================================
     */

    const responseSession = {
      id:
        session.id,

      complexTestId:
        session.complexTestId,

      participantId:
        session.participantId,

      currentTestId:
        session.currentTestId,

      currentQuestion:
        session.currentQuestion,

      savedAnswers:
        session.savedAnswers,

      /*
       * Авторитетне значення
       * безпосередньо з БД.
       */

      timeLeft:
        Math.max(
          0,
          Math.floor(
            session.timeLeft
          )
        ),

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
    };

    /*
     * ========================================================
     * ВІДПОВІДЬ
     *
     * СТРУКТУРА:
     *
     * {
     *   success,
     *   session,
     *   complexTest
     * }
     *
     * ========================================================
     */

    return NextResponse.json(
      {
        success: true,

        session:
          responseSession,

        complexTest,
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
      "COMPLEX SESSION GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося отримати стан комбінованої сесії.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * POST
 *
 * Використовується для:
 *
 * 1. heartbeat;
 * 2. збереження currentTestId;
 * 3. збереження currentQuestion;
 * 4. збереження savedAnswers;
 * 5. завершення сесії.
 *
 * УЧАСНИК НЕ МОЖЕ НАПРЯМУ ЗМІНЮВАТИ:
 *
 * - timeLeft;
 * - extraTime;
 * - blocked;
 * - blockReason;
 * - blockedAt;
 * - startedAt.
 *
 * ЄДИНИЙ виняток:
 *
 * finished = true
 *
 * Під час завершення сервер сам встановлює:
 *
 * finished = true
 * finishedAt = now
 * timeLeft = 0
 * ============================================================
 */

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /*
     * ========================================================
     * COMPLEX TEST ID
     * ========================================================
     */

    const { id } = await context.params;

    const complexTestId = Number(id);

    if (
      !Number.isInteger(complexTestId) ||
      complexTestId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректний id комбінованого тесту.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * BODY
     * ========================================================
     */

    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректне тіло запиту.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
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
      currentTestId,
      currentQuestion,
      savedAnswers,
      finished,
    } = body as {
      sessionId?: unknown;
      heartbeat?: unknown;

      currentTestId?: unknown;
      currentQuestion?: unknown;

      savedAnswers?: unknown;

      finished?: unknown;
    };

    /*
     * ========================================================
     * SESSION ID
     * ========================================================
     */

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
          success: false,
          message:
            "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * ЗНАХОДИМО СЕСІЮ
     * ========================================================
     */

    const session =
      await prisma.complexTestSession.findFirst({
        where: {
          id: numericSessionId,
          complexTestId,
        },

        select: {
          id: true,
          complexTestId: true,

          currentTestId: true,
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
        },
      });

    /*
     * ========================================================
     * СЕСІЮ НЕ ЗНАЙДЕНО
     * ========================================================
     */

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Сесію комбінованого тестування не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ========================================================
     * ВЖЕ ЗАВЕРШЕНА
     * ========================================================
     */

    if (session.finished) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Сесія вже завершена.",

          session: {
            id:
              session.id,

            complexTestId:
              session.complexTestId,

            currentTestId:
              session.currentTestId,

            currentQuestion:
              session.currentQuestion,

            savedAnswers:
              session.savedAnswers,

            timeLeft:
              Math.max(
                0,
                Math.floor(
                  session.timeLeft
                )
              ),

            extraTime:
              Math.max(
                0,
                Math.floor(
                  session.extraTime
                )
              ),

            finished:
              true,

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

            lastActivityAt:
              session.lastActivityAt,
          },
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    /*
     * ========================================================
     * ЗАБЛОКОВАНА СЕСІЯ
     * ========================================================
     */

    if (session.blocked) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Тестування заблоковано адміністратором.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ========================================================
     * HEARTBEAT
     *
     * НІЧОГО НЕ ЗМІНЮЄМО В БД.
     *
     * Особливо:
     *
     * timeLeft
     * extraTime
     * startedAt
     *
     * ========================================================
     */

    if (heartbeat === true) {
      return NextResponse.json(
        {
          success: true,
          heartbeat: true,

          session: {
            id:
              session.id,

            complexTestId:
              session.complexTestId,

            currentTestId:
              session.currentTestId,

            currentQuestion:
              session.currentQuestion,

            savedAnswers:
              session.savedAnswers,

            timeLeft:
              Math.max(
                0,
                Math.floor(
                  session.timeLeft
                )
              ),

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

            lastActivityAt:
              session.lastActivityAt,
          },
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    /*
     * ========================================================
     * UPDATE DATA
     *
     * Дозволені тільки:
     *
     * - currentTestId
     * - currentQuestion
     * - savedAnswers
     * - finished
     *
     * ========================================================
     */

    const updateData: Prisma.ComplexTestSessionUpdateInput =
      {};

    /*
     * ========================================================
     * CURRENT TEST
     * ========================================================
     */

    if (
      typeof currentTestId ===
        "number" &&
      Number.isInteger(
        currentTestId
      ) &&
      currentTestId > 0
    ) {
      const complexTestItem =
        await prisma.complexTestItem.findFirst({
          where: {
            complexTestId,
            testId:
              currentTestId,
          },

          select: {
            id: true,
          },
        });

      if (!complexTestItem) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Вказаний предмет не належить цьому комбінованому тесту.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.currentTestId =
        currentTestId;
    }

    /*
     * ========================================================
     * CURRENT QUESTION
     * ========================================================
     */

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

    /*
     * ========================================================
     * SAVED ANSWERS
     * ========================================================
     */

    if (
      savedAnswers !==
      undefined
    ) {
      if (
        savedAnswers ===
        null
      ) {
        updateData.savedAnswers =
          Prisma.JsonNull;
      } else {
        updateData.savedAnswers =
          savedAnswers as Prisma.InputJsonValue;
      }
    }

    /*
     * ========================================================
     * FINISHED
     * ========================================================
     */

    if (finished === true) {
      const now =
        new Date();

      updateData.finished =
        true;

      updateData.finishedAt =
        session.finishedAt ??
        now;

      /*
       * Сервер сам встановлює
       * timeLeft = 0.
       *
       * Клієнт не може передати
       * власне значення timeLeft.
       */

      updateData.timeLeft =
        0;
    }

    /*
     * ========================================================
     * UPDATE
     * ========================================================
     */

    const updated =
      await prisma.complexTestSession.update({
        where: {
          id: session.id,
        },

        data: updateData,

        select: {
          id: true,
          complexTestId: true,

          currentTestId: true,
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
        },
      });

    /*
     * ========================================================
     * ВІДПОВІДЬ
     * ========================================================
     */

    return NextResponse.json(
      {
        success: true,

        session: {
          id:
            updated.id,

          complexTestId:
            updated.complexTestId,

          currentTestId:
            updated.currentTestId,

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
        },
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
      "COMPLEX SESSION POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося зберегти стан комбінованої сесії.",
      },
      {
        status: 500,
      }
    );
  }
}