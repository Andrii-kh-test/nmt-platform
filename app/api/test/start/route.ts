import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth/session";

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
//
// Для авторизованого користувача:
// використовується його існуючий Participant.
//
// Для неавторизованого користувача:
// створюється окремий Participant, як і раніше.
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    // =================================================
    // BODY
    // =================================================

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректне тіло запиту.",
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
          message: "Некоректне тіло запиту.",
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

    // =================================================
    // TEST ID
    // =================================================

    const numericTestId = Number(testId);

    if (
      !Number.isInteger(numericTestId) ||
      numericTestId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // TEST
    // =================================================

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
          message: "Тест не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

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

    // =================================================
    // ACCESS CODE
    // =================================================

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

    // =================================================
    // NAME VALIDATION
    //
    // Залишаємо перевірку для сумісності
    // з поточним запуском тестування.
    // =================================================

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

    if (
      typeof firstName !== "string" ||
      !firstName.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Не вказано ім'я.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // CURRENT USER
    //
    // Якщо користувач авторизований,
    // намагаємося знайти його Participant.
    // =================================================

    const currentUser =
      await getCurrentUser();

    let participant;

    if (currentUser) {
      // -----------------------------------------------
      // АВТОРИЗОВАНИЙ КОРИСТУВАЧ
      //
      // Використовуємо вже існуючого Participant.
      // -----------------------------------------------

      participant =
        await prisma.participant.findUnique({
          where: {
            userId: currentUser.id,
          },
        });

      // -----------------------------------------------
      // Якщо Participant з якоїсь причини ще немає,
      // створюємо його та одразу прив'язуємо до User.
      // -----------------------------------------------

      if (!participant) {
        participant =
          await prisma.participant.create({
            data: {
              userId: currentUser.id,

              lastName:
                currentUser.lastName.trim(),

              firstName:
                currentUser.firstName.trim(),

              middleName:
                currentUser.middleName?.trim() ||
                null,

              accessCode:
                typeof accessCode === "string" &&
                accessCode.trim()
                  ? accessCode.trim()
                  : null,
            },
          });
      }
    } else {
      // -----------------------------------------------
      // НЕАВТОРИЗОВАНИЙ КОРИСТУВАЧ
      //
      // Повністю зберігаємо стару поведінку.
      // -----------------------------------------------

      participant =
        await prisma.participant.create({
          data: {
            lastName: lastName.trim(),

            firstName:
              firstName.trim(),

            middleName:
              typeof middleName === "string" &&
              middleName.trim()
                ? middleName.trim()
                : null,

            accessCode:
              typeof accessCode === "string" &&
              accessCode.trim()
                ? accessCode.trim()
                : null,
          },
        });
    }

    // =================================================
    // INITIAL TIME
    // =================================================

    const initialTimeLeft =
      Math.max(
        0,
        Math.floor(
          test.duration * 60
        )
      );

    // =================================================
    // CREATE SESSION
    // =================================================

    const session =
      await prisma.testSession.create({
        data: {
          participantId:
            participant.id,

          testId: test.id,

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

          lastActivityAt:
            new Date(),

          // startedAt навмисно НЕ передаємо.
          // Фактичний старт відбувається
          // через POST /api/test/begin.
        },
      });

    // =================================================
    // RESPONSE
    // =================================================

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