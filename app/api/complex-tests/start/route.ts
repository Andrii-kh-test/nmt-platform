import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const complexTestId = Number(body.complexTestId);
    const lastName = String(body.lastName ?? "").trim();
    const firstName = String(body.firstName ?? "").trim();
    const middleName = String(body.middleName ?? "").trim();
    const accessCode = String(body.accessCode ?? "").trim();

    // ---------------------------------------------------------
    // Перевірка ID комбінованого тесту
    // ---------------------------------------------------------

    if (!Number.isInteger(complexTestId) || complexTestId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний ідентифікатор комбінованого тесту.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Перевірка ПІБ
    // ---------------------------------------------------------

    if (!lastName || !firstName) {
      return NextResponse.json(
        {
          success: false,
          message: "Введіть прізвище та ім'я.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Отримуємо комбінований тест
    // ---------------------------------------------------------

    const complexTest = await prisma.complexTest.findUnique({
      where: {
        id: complexTestId,
      },
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
                    question: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // ---------------------------------------------------------
    // Перевірка існування
    // ---------------------------------------------------------

    if (!complexTest) {
      return NextResponse.json(
        {
          success: false,
          message: "Комбінований тест не знайдено.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // Перевірка доступності
    // ---------------------------------------------------------

    if (!complexTest.isPublished || complexTest.isArchived) {
      return NextResponse.json(
        {
          success: false,
          message: "Цей комбінований тест зараз недоступний.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // Перевірка наявності складових тестів
    // ---------------------------------------------------------

    if (complexTest.tests.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "У комбінованому тесті немає складових тестів.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Перевірка коду доступу
    // ---------------------------------------------------------

    if (complexTest.codeRequired) {
      if (!accessCode) {
        return NextResponse.json(
          {
            success: false,
            message: "Введіть код доступу до тесту.",
          },
          { status: 400 }
        );
      }

      if (accessCode !== (complexTest.accessCode ?? "").trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Неправильний код доступу.",
          },
          { status: 403 }
        );
      }
    }

    // ---------------------------------------------------------
    // Створюємо учасника
    // ---------------------------------------------------------

    const participant = await prisma.participant.create({
      data: {
        lastName,
        firstName,
        middleName: middleName || null,
        accessCode: accessCode || null,
      },
    });

    // ---------------------------------------------------------
    // Початкові відповіді
    //
    // Структура:
    // {
    //   "testId": {
    //     "questionId": answer
    //   }
    // }
    //
    // Наприклад:
    // {
    //   "12": {
    //     "101": "A",
    //     "102": ["B", "D"]
    //   },
    //   "15": {
    //     "201": "C"
    //   }
    // }
    // ---------------------------------------------------------

    const savedAnswers: Record<
      string,
      Record<string, unknown>
    > = {};

    for (const item of complexTest.tests) {
      savedAnswers[String(item.testId)] = {};

      for (const testQuestion of item.test.questions) {
        savedAnswers[String(item.testId)][
          String(testQuestion.questionId)
        ] = null;
      }
    }

    // ---------------------------------------------------------
    // Час комбінованого тесту
    //
    // duration зберігається у хвилинах.
    // timeLeft — у секундах.
    // ---------------------------------------------------------

    const timeLeft = Math.max(
      0,
      Math.floor(complexTest.duration * 60)
    );

    // ---------------------------------------------------------
    // Перший складовий тест
    // ---------------------------------------------------------

    const firstTest = complexTest.tests[0];

    // ---------------------------------------------------------
    // Створюємо окрему сесію комбінованого тесту
    // ---------------------------------------------------------

    const session = await prisma.complexTestSession.create({
      data: {
        complexTestId: complexTest.id,
        participantId: participant.id,

        currentTestId: firstTest.testId,
        currentQuestion: 0,

        savedAnswers: savedAnswers as Prisma.InputJsonValue,
        timeLeft,

        finished: false,

        startedAt: new Date(),
        lastActivityAt: new Date(),

        blocked: false,
        blockReason: null,
        extraTime: 0,
        blockedAt: null,
        finishedAt: null,
      },
    });

    // ---------------------------------------------------------
    // Відповідь клієнту
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,

      sessionId: session.id,

      participantId: participant.id,

      complexTestId: complexTest.id,

      complexTest: {
        id: complexTest.id,
        title: complexTest.title,
        description: complexTest.description,
        duration: complexTest.duration,
        examType: complexTest.examType,
        section: complexTest.section,
      },

      timeLeft: session.timeLeft,

      currentTestId: session.currentTestId,

      currentQuestion: session.currentQuestion,
    });
  } catch (error) {
    console.error(
      "POST /api/complex-tests/start error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося розпочати комбінований тест.",
      },
      { status: 500 }
    );
  }
}