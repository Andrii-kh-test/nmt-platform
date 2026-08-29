import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// POST /api/test/start
//
// Створює учасника та сесію.
//
// ВАЖЛИВО:
//
// ЦЕ НЕ ПОЧАТОК ТЕСТУ.
//
// startedAt залишається NULL.
//
// Фактичний старт:
// POST /api/test/begin
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
    // TEST
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
    // PUBLICATION
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
    // ACCESS CODE
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
    // LAST NAME
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
    // FIRST NAME
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
    // PARTICIPANT
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
    // INITIAL TIME
    //
    // duration = хвилини
    // timeLeft = секунди
    //
    // Це лише початковий запас часу.
    // Він НЕ починає відлік.
    // ===================================================

    const initialTimeLeft =
      Math.max(
        0,
        Math.floor(
          test.duration * 60
        )
      );

    // ===================================================
    // SESSION
    // ===================================================

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
          // Prisma створить:
          //
          // startedAt = NULL
          //
          // =================================================

          lastActivityAt:
            new Date(),
        },
      });

    // ===================================================
    // RESPONSE
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