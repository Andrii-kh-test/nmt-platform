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
     * ПІДГОТОВКА COMPLEX TEST
     *
     * ВАЖЛИВО:
     *
     * Для matching AnswerOption зберігає дані
     * у форматі:
     *
     * L|id|text|correctRightId
     * R|id|text
     *
     * Тут ми розділяємо їх на:
     *
     * matchingLeftItems
     * matchingRightItems
     *
     * Точна логіка відповідає mapPrismaTest.ts.
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
                  ) => {
                    /*
                     * ==================================================
                     * ANSWER OPTIONS
                     * ==================================================
                     */

                    const answerOptions =
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
                        );

                    /*
                     * ==================================================
                     * MATCHING
                     * ==================================================
                     */

                    const isMatching =
                      testQuestion
                        .question
                        .type ===
                      "matching";

                    const matchingLeftItems =
                      isMatching
                        ? answerOptions
                            .filter(
                              (
                                option
                              ) =>
                                option.text.startsWith(
                                  "L|"
                                )
                            )
                            .map(
                              (
                                option
                              ) => {
                                const parts =
                                  option.text.split(
                                    "|"
                                  );

                                return {
                                  id:
                                    Number(
                                      parts[1]
                                    ),

                                  text:
                                    parts[2] ??
                                    "",

                                  correctRightId:
                                    Number(
                                      parts[3]
                                    ),
                                };
                              }
                            )
                            .sort(
                              (
                                a,
                                b
                              ) =>
                                a.id -
                                b.id
                            )
                        : [];

                    const matchingRightItems =
                      isMatching
                        ? answerOptions
                            .filter(
                              (
                                option
                              ) =>
                                option.text.startsWith(
                                  "R|"
                                )
                            )
                            .map(
                              (
                                option
                              ) => {
                                const parts =
                                  option.text.split(
                                    "|"
                                  );

                                return {
                                  id:
                                    Number(
                                      parts[1]
                                    ),

                                  text:
                                    parts
                                      .slice(
                                        2
                                      )
                                      .join(
                                        "|"
                                      ),
                                };
                              }
                            )
                            .sort(
                              (
                                a,
                                b
                              ) =>
                                a.id -
                                b.id
                            )
                        : [];

                    /*
                     * ==================================================
                     * QUESTION
                     * ==================================================
                     */

                    return {
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

                      /*
                       * Для matching звичайні
                       * answerOptions не потрібні.
                       *
                       * Для інших типів залишаємо
                       * їх без змін.
                       */

                      answerOptions:
                        isMatching
                          ? []
                          : answerOptions,

                      matchingLeftItems,

                      matchingRightItems,
                    };
                  }
                ),
            },
          })
        ),
    };

    /*
     * ========================================================
     * ПІДГОТОВКА SESSION
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
 * 5. звичайного завершення;
 * 6. завершення через порушення правил.
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
 * ЄДИНИЙ штатний виняток:
 *
 * finished = true
 *
 * Під час звичайного завершення сервер сам встановлює:
 *
 * finished = true
 * finishedAt = now
 * timeLeft = 0
 *
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
      finishReason,
    } = body as {
      sessionId?: unknown;
      heartbeat?: unknown;

      currentTestId?: unknown;
      currentQuestion?: unknown;

      savedAnswers?: unknown;

      finished?: unknown;

      finishReason?: unknown;
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
     * FINISH REASON
     * ========================================================
     *
     * Дозволені значення:
     *
     * undefined
     * "manual"
     * "timeout"
     * "security"
     *
     * Для сумісності зі старими запитами
     * відсутність finishReason означає
     * звичайне завершення.
     * ========================================================
     */

    const normalizedFinishReason =
      finishReason === "security"
        ? "security"
        : finishReason === "timeout"
        ? "timeout"
        : finishReason === "manual"
        ? "manual"
        : null;

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
     *
     * ВАЖЛИВО:
     *
     * Перевірка стоїть ПІСЛЯ finished.
     *
     * Тому вже завершену через security сесію
     * можна нормально отримати.
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
     * SECURITY FINISH
     *
     * Це спеціальний серверний сценарій.
     *
     * Якщо друге порушення зафіксовано
     * FullscreenGuard або VisibilityGuard,
     * клієнт передає:
     *
     * finished: true
     * finishReason: "security"
     *
     * Сервер сам встановлює:
     *
     * finished = true
     * finishedAt = now
     * timeLeft = 0
     * blocked = true
     * blockReason = "Порушення правил тестування"
     * blockedAt = now
     *
     * Відповіді користувача при цьому
     * зберігаються такими, якими вони були
     * на момент порушення.
     *
     * ========================================================
     */

    if (
      finished === true &&
      normalizedFinishReason ===
        "security"
    ) {
      const now =
        new Date();

      const securitySavedAnswers =
        savedAnswers !==
        undefined
          ? savedAnswers === null
            ? Prisma.JsonNull
            : (savedAnswers as Prisma.InputJsonValue)
          : undefined;

      const updated =
        await prisma.complexTestSession.update({
          where: {
            id: session.id,
          },

          data: {
            ...(securitySavedAnswers !==
            undefined
              ? {
                  savedAnswers:
                    securitySavedAnswers,
                }
              : {}),

            ...(typeof currentTestId ===
                "number" &&
              Number.isInteger(
                currentTestId
              ) &&
              currentTestId > 0
              ? {
                  currentTestId:
                    currentTestId,
                }
              : {}),

            ...(typeof currentQuestion ===
                "number" &&
              Number.isInteger(
                currentQuestion
              ) &&
              currentQuestion >= 0
              ? {
                  currentQuestion:
                    currentQuestion,
                }
              : {}),

            finished: true,

            finishedAt:
              session.finishedAt ??
              now,

            timeLeft: 0,

            blocked: true,

            blockReason:
              "Порушення правил тестування",

            blockedAt:
              session.blockedAt ??
              now,

            lastActivityAt:
              now,
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

      return NextResponse.json(
        {
          success: true,

          securityViolation: true,

          message:
            "Тестування автоматично завершено через повторне порушення правил.",

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

            timeLeft: 0,

            extraTime:
              Math.max(
                0,
                Math.floor(
                  updated.extraTime
                )
              ),

            finished:
              true,

            finishedAt:
              updated.finishedAt,

            blocked:
              true,

            blockReason:
              "Порушення правил тестування",

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
    }

    /*
     * ========================================================
     * UPDATE DATA
     *
     * Дозволені:
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
     *
     * ЗВИЧАЙНЕ завершення.
     *
     * Тут нічого не змінюємо порівняно
     * з попередньою логікою.
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