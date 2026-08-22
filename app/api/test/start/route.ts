import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// POST /api/test/start
//
// ЦЕЙ ENDPOINT ВИКЛИКАЄТЬСЯ ПІСЛЯ ВВЕДЕННЯ КОДУ.
//
// Його завдання:
//
// 1. перевірити тест;
// 2. перевірити код доступу;
// 3. створити учасника;
// 4. створити сесію.
//
// ВАЖЛИВО:
//
// Тут ТЕСТУВАННЯ ЩЕ НЕ ПОЧИНАЄТЬСЯ.
//
// startedAt залишається NULL.
//
// Фактичний початок тестування відбувається
// окремим endpoint:
//
// POST /api/test/begin
//
// який викликається кнопкою
// «Розпочати тестування».
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    // ===================================================
    // BODY
    // ===================================================

    let body: unknown;

    try {
      body = await request.json();
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
      testId,
      lastName,
      firstName,
      middleName,
      accessCode,
    } = body as {
      testId?: unknown;
      lastName?: unknown;
      firstName?: unknown;
      middleName?: unknown;
      accessCode?: unknown;
    };

    // ===================================================
    // TEST ID
    // ===================================================

    const numericTestId =
      Number(testId);

    if (
      !Number.isInteger(
        numericTestId
      ) ||
      numericTestId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // ПЕРЕВІРКА ТЕСТУ
    // ===================================================

    const test =
      await prisma.test.findUnique({
        where: {
          id: numericTestId,
        },
      });

    if (!test) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Тест не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // ===================================================
    // ПЕРЕВІРКА ПУБЛІКАЦІЇ
    // ===================================================

    if (!test.isPublished) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Тест ще не опублікований.",
        },
        {
          status: 403,
        }
      );
    }

    // ===================================================
    // ПЕРЕВІРКА КОДУ ДОСТУПУ
    // ===================================================

    if (
      test.codeRequired &&
      test.accessCode !== accessCode
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Невірний код доступу.",
        },
        {
          status: 403,
        }
      );
    }

    // ===================================================
    // ПЕРЕВІРКА ПРІЗВИЩА
    // ===================================================

    if (
      typeof lastName !== "string" ||
      !lastName.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Не вказано прізвище.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // ПЕРЕВІРКА ІМЕНІ
    // ===================================================

    if (
      typeof firstName !== "string" ||
      !firstName.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Не вказано ім'я.",
        },
        {
          status: 400,
        }
      );
    }

    // ===================================================
    // СТВОРЕННЯ УЧАСНИКА
    // ===================================================

    const participant =
      await prisma.participant.create({
        data: {
          lastName:
            lastName.trim(),

          firstName:
            firstName.trim(),

          middleName:
            typeof middleName ===
              "string" &&
            middleName.trim()
              ? middleName.trim()
              : null,

          accessCode:
            typeof accessCode ===
              "string" &&
            accessCode.trim()
              ? accessCode.trim()
              : null,
        },
      });

    // ===================================================
    // ПОЧАТКОВИЙ ЧАС ТЕСТУ
    // ===================================================
    //
    // duration зберігається у хвилинах.
    //
    // timeLeft зберігаємо у секундах.
    //
    // ВАЖЛИВО:
    //
    // startedAt ТУТ НЕ ВСТАНОВЛЮЄМО.
    //
    // Завдяки nullable startedAt у schema.prisma
    // нова сесія матиме:
    //
    // startedAt = NULL
    //
    // Тому час ще НЕ відраховується.
    // =====================================================

    const initialTimeLeft =
      Math.max(
        0,
        Math.floor(
          test.duration * 60
        )
      );

    // ===================================================
    // СТВОРЕННЯ СЕСІЇ
    // =====================================================

    const session =
      await prisma.testSession.create({
        data: {
          participantId:
            participant.id,

          testId:
            test.id,

          currentQuestion: 0,

          savedAnswers: {},

          timeLeft:
            initialTimeLeft,

          extraTime: 0,

          finished: false,

          blocked: false,

          blockReason: null,

          blockedAt: null,

          finishedAt: null,

          // =================================================
          // КРИТИЧНО:
          //
          // startedAt НЕ ЗАДАЄМО.
          //
          // У БД буде NULL.
          //
          // Час почнеться тільки після:
          //
          // POST /api/test/begin
          // =================================================

          lastActivityAt:
            new Date(),
        },
      });

    // ===================================================
    // ВІДПОВІДЬ
    // ===================================================

    return NextResponse.json(
      {
        success: true,

        participant,

        session,
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
      "TEST START ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Помилка запуску тесту.",
      },
      {
        status: 500,
      }
    );
  }
}