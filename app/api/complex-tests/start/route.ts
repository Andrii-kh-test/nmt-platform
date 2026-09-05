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
    //
    // {
    //   "testId": {
    //     "questionId": answer
    //   }
    // }
    //
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
    // ЗАГАЛЬНИЙ ЧАС КОМБІНОВАНОГО ТЕСТУ
    //
    // duration кожного складового Test зберігається у хвилинах.
    // timeLeft у ComplexTestSession зберігається у секундах.
    //
    // Наприклад:
    //
    // Тест 1 = 60 хв
    // Тест 2 = 60 хв
    // Тест 3 = 60 хв
    //
    // Разом = 180 хв = 10800 секунд
    //
    // ВАЖЛИВО:
    // complexTest.duration тут НЕ використовується.
    // Час береться безпосередньо з налаштувань
    // кожного складового тесту.
    // ---------------------------------------------------------

    const totalDurationMinutes = complexTest.tests.reduce(
      (total, item) => {
        const duration = Number(item.test.duration);

        if (!Number.isFinite(duration) || duration < 0) {
          return total;
        }

        return total + Math.floor(duration);
      },
      0
    );

    const timeLeft = Math.max(
      0,
      totalDurationMinutes * 60
    );

    // ---------------------------------------------------------
    // Перший складовий тест
    // ---------------------------------------------------------

    const firstTest = complexTest.tests[0];

    // ---------------------------------------------------------
    // Створюємо окрему сесію комбінованого тесту
    // ---------------------------------------------------------

    const startedAt = new Date();

    const session = await prisma.complexTestSession.create({
      data: {
        complexTestId: complexTest.id,
        participantId: participant.id,

        currentTestId: firstTest.testId,
        currentQuestion: 0,

        savedAnswers: savedAnswers as Prisma.InputJsonValue,

        // ЄДИНИЙ глобальний таймер усього комбінованого тесту
        timeLeft,

        finished: false,

        // Комбінований тест починається одразу після
        // створення сесії.
        startedAt,

        lastActivityAt: startedAt,

        blocked: false,
        blockReason: null,

        // Додатковий час адміністратора
        // також має застосовуватися до цього
        // глобального таймера.
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

        // Тут залишаємо значення ComplexTest для інформаційних
        // цілей, але таймер використовує НЕ його.
        duration: complexTest.duration,

        examType: complexTest.examType,
        section: complexTest.section,
      },

      // Фактичний глобальний час сесії
      timeLeft: session.timeLeft,

      // Додатково повертаємо загальну тривалість,
      // розраховану із складових тестів.
      totalDurationMinutes,

      totalDurationSeconds: timeLeft,

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