import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";

type SavedAnswers = Record<
  string,
  Record<string, unknown>
>;

/* =========================================================
   GET
   Отримання поточного стану сесії комбінованого тесту
   ========================================================= */

export async function GET(request: NextRequest) {
  try {
    const sessionIdParam =
      request.nextUrl.searchParams.get("sessionId");

    const sessionId = Number(sessionIdParam);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний ідентифікатор сесії.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       Отримуємо сесію
       ----------------------------------------------------- */

    const session =
      await prisma.complexTestSession.findUnique({
        where: {
          id: sessionId,
        },
        include: {
          complexTest: {
            include: {
              tests: {
                orderBy: {
                  order: "asc",
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

          participant: true,
        },
      });

    /* -----------------------------------------------------
       Перевірка існування сесії
       ----------------------------------------------------- */

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Сесію комбінованого тесту не знайдено.",
        },
        { status: 404 }
      );
    }

    /* -----------------------------------------------------
       Перевірка доступності тесту
       ----------------------------------------------------- */

    if (
      !session.complexTest.isPublished ||
      session.complexTest.isArchived
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Цей комбінований тест більше недоступний.",
        },
        { status: 403 }
      );
    }

    /* -----------------------------------------------------
       Перетворюємо збережені відповіді
       ----------------------------------------------------- */

    const savedAnswers =
      (session.savedAnswers as SavedAnswers | null) ?? {};

    /* -----------------------------------------------------
       Формуємо складові тести
       ----------------------------------------------------- */

    const tests = session.complexTest.tests.map(
      (item) => ({
        id: item.test.id,
        complexTestItemId: item.id,
        order: item.order,

        title: item.test.title,
        subject: item.test.subject,

        duration: item.test.duration,

        questions: item.test.questions.map(
          (testQuestion) => ({
            id: testQuestion.question.id,
            testQuestionId: testQuestion.id,
            order: testQuestion.order,

            type: testQuestion.question.type,
            text: testQuestion.question.text,
            points: testQuestion.question.points,

            shuffleQuestion:
              testQuestion.question.shuffleQuestion,

            answerOptions:
              testQuestion.question.answerOptions.map(
                (option) => ({
                  id: option.id,
                  order: option.order,
                  text: option.text,
                })
              ),

            savedAnswer:
              savedAnswers[String(item.test.id)]?.[
                String(testQuestion.question.id)
              ] ?? null,
          })
        ),
      })
    );

    /* -----------------------------------------------------
       Знаходимо поточний тест
       ----------------------------------------------------- */

    const currentTest =
      tests.find(
        (test) => test.id === session.currentTestId
      ) ?? tests[0];

    /* -----------------------------------------------------
       Відповідь
       ----------------------------------------------------- */

    return NextResponse.json({
      success: true,

      session: {
        id: session.id,

        complexTestId: session.complexTestId,

        participantId: session.participantId,

        currentTestId:
          session.currentTestId,

        currentQuestion:
          session.currentQuestion,

        timeLeft:
          session.timeLeft,

        finished:
          session.finished,

        blocked:
          session.blocked,

        blockReason:
          session.blockReason,

        extraTime:
          session.extraTime,

        startedAt:
          session.startedAt,

        finishedAt:
          session.finishedAt,
      },

      participant: session.participant
        ? {
            id: session.participant.id,
            lastName:
              session.participant.lastName,
            firstName:
              session.participant.firstName,
            middleName:
              session.participant.middleName,
          }
        : null,

      complexTest: {
        id: session.complexTest.id,
        title: session.complexTest.title,
        description:
          session.complexTest.description,
        duration:
          session.complexTest.duration,
        examType:
          session.complexTest.examType,
        section:
          session.complexTest.section,
      },

      tests,

      currentTest,
    });
  } catch (error) {
    console.error(
      "GET /api/complex-tests/session error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося завантажити сесію комбінованого тесту.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH
   Збереження відповіді / поточного питання
   ========================================================= */

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const sessionId = Number(body.sessionId);

    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний ідентифікатор сесії.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       Отримуємо сесію
       ----------------------------------------------------- */

    const session =
      await prisma.complexTestSession.findUnique({
        where: {
          id: sessionId,
        },
      });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Сесію не знайдено.",
        },
        { status: 404 }
      );
    }

    /* -----------------------------------------------------
       Не дозволяємо змінювати завершену сесію
       ----------------------------------------------------- */

    if (session.finished) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Тест уже завершено.",
        },
        { status: 403 }
      );
    }

    /* -----------------------------------------------------
       Не дозволяємо відповідати заблокованому учаснику
       ----------------------------------------------------- */

    if (session.blocked) {
      return NextResponse.json(
        {
          success: false,
          message:
            session.blockReason ||
            "Учасника заблоковано.",
        },
        { status: 403 }
      );
    }

    /* -----------------------------------------------------
       Поточні відповіді
       ----------------------------------------------------- */

    const savedAnswers =
      (session.savedAnswers as SavedAnswers | null) ?? {};

    /* -----------------------------------------------------
       Збереження відповіді
       
       Очікується:
       {
         sessionId: 1,
         testId: 12,
         questionId: 101,
         answer: "A"
       }

       або:

       {
         sessionId: 1,
         testId: 12,
         questionId: 101,
         answer: ["A", "C"]
       }
       ----------------------------------------------------- */

    if (
      body.testId !== undefined &&
      body.questionId !== undefined
    ) {
      const testId = Number(body.testId);
      const questionId = Number(body.questionId);

      if (
        !Number.isInteger(testId) ||
        testId <= 0 ||
        !Number.isInteger(questionId) ||
        questionId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Некоректний ідентифікатор тесту або питання.",
          },
          { status: 400 }
        );
      }

      if (!savedAnswers[String(testId)]) {
        savedAnswers[String(testId)] = {};
      }

      savedAnswers[String(testId)][
        String(questionId)
      ] = body.answer ?? null;
    }

    /* -----------------------------------------------------
       Поточний тест
       ----------------------------------------------------- */

    let currentTestId =
      session.currentTestId;

    if (body.currentTestId !== undefined) {
      const value = Number(body.currentTestId);

      if (
        Number.isInteger(value) &&
        value > 0
      ) {
        currentTestId = value;
      }
    }

    /* -----------------------------------------------------
       Поточне питання
       ----------------------------------------------------- */

    let currentQuestion =
      session.currentQuestion;

    if (body.currentQuestion !== undefined) {
      const value = Number(body.currentQuestion);

      if (
        Number.isInteger(value) &&
        value >= 0
      ) {
        currentQuestion = value;
      }
    }

    /* -----------------------------------------------------
       Оновлення часу активності
       
       ВАЖЛИВО:
       lastActivityAt НЕ використовується для
       перерахунку timeLeft.
       ----------------------------------------------------- */

    const updatedSession =
      await prisma.complexTestSession.update({
        where: {
          id: sessionId,
        },

        data: {
          savedAnswers:
            savedAnswers as Prisma.InputJsonValue,

          currentTestId,

          currentQuestion,

          lastActivityAt:
            new Date(),
        },
      });

    return NextResponse.json({
      success: true,

      session: {
        id: updatedSession.id,

        currentTestId:
          updatedSession.currentTestId,

        currentQuestion:
          updatedSession.currentQuestion,

        timeLeft:
          updatedSession.timeLeft,

        finished:
          updatedSession.finished,

        blocked:
          updatedSession.blocked,
      },
    });
  } catch (error) {
    console.error(
      "PATCH /api/complex-tests/session error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося зберегти дані сесії.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   Завершення комбінованого тесту
   ========================================================= */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const sessionId = Number(body.sessionId);

    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний ідентифікатор сесії.",
        },
        { status: 400 }
      );
    }

    /* -----------------------------------------------------
       Отримуємо сесію
       ----------------------------------------------------- */

    const session =
      await prisma.complexTestSession.findUnique({
        where: {
          id: sessionId,
        },
      });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Сесію не знайдено.",
        },
        { status: 404 }
      );
    }

    /* -----------------------------------------------------
       Якщо вже завершено
       ----------------------------------------------------- */

    if (session.finished) {
      return NextResponse.json({
        success: true,
        alreadyFinished: true,
        sessionId: session.id,
      });
    }

    /* -----------------------------------------------------
       Завершуємо тест
       ----------------------------------------------------- */

    const updatedSession =
      await prisma.complexTestSession.update({
        where: {
          id: sessionId,
        },

        data: {
          finished: true,
          finishedAt: new Date(),
          lastActivityAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,

      sessionId:
        updatedSession.id,

      finished:
        updatedSession.finished,

      finishedAt:
        updatedSession.finishedAt,
    });
  } catch (error) {
    console.error(
      "POST /api/complex-tests/session error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося завершити комбінований тест.",
      },
      { status: 500 }
    );
  }
}