import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// TYPES
// =====================================================

type BeginBody = {
  sessionId?: unknown;
  testId?: unknown;
};

type SessionResponse = {
  id: number;
  testId: number;
  startedAt: Date | null;
  currentQuestion: number;
  savedAnswers: unknown;
  timeLeft: number;
  extraTime: number;
  finished: boolean;
  blocked: boolean;
  blockReason: string | null;
};

// =====================================================
// HELPERS
// =====================================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function normalizeSeconds(
  value: unknown
): number {
  return Math.max(
    0,
    Math.floor(
      Number(value) || 0
    )
  );
}

// =====================================================
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

    if (!isRecord(body)) {
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
      sessionId:
        rawSessionId,
      testId:
        rawTestId,
    } =
      body as BeginBody;

    // ===================================================
    // IDS
    // ===================================================

    const sessionId =
      Number(rawSessionId);

    const testId =
      Number(rawTestId);

    if (
      !Number.isInteger(
        sessionId
      ) ||
      sessionId <= 0 ||
      !Number.isInteger(
        testId
      ) ||
      testId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректні ідентифікатори.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "TEST BEGIN: REQUEST",
      {
        sessionId,
        testId,
      }
    );

    // ===================================================
    // LOAD SESSION
    // ===================================================

    const session =
      await prisma.testSession.findUnique({
        where: {
          id: sessionId,
        },

        select: {
          id: true,
          testId: true,

          startedAt: true,

          currentQuestion: true,
          savedAnswers: true,

          timeLeft: true,
          extraTime: true,

          finished: true,
          finishedAt: true,

          blocked: true,
          blockReason: true,
          blockedAt: true,

          test: {
            select: {
              duration: true,
            },
          },
        },
      });

    // ===================================================
    // SESSION NOT FOUND
    // ===================================================

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

    // ===================================================
    // TEST ID CHECK
    // ===================================================

    if (
      session.testId !==
      testId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Сесія не належить цьому тесту.",
        },
        {
          status: 403,
        }
      );
    }

    // ===================================================
    // FINISHED
    // ===================================================

    if (session.finished) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Тест уже завершено.",
        },
        {
          status: 409,
        }
      );
    }

    // ===================================================
    // BLOCKED
    // ===================================================

    if (session.blocked) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Сесію тестування заблоковано.",
        },
        {
          status: 409,
        }
      );
    }

    // ===================================================
    // CONSTANTS
    // ===================================================

    const durationSeconds =
      normalizeSeconds(
        session.test.duration *
          60
      );

    const extraTime =
      normalizeSeconds(
        session.extraTime
      );

    const totalDuration =
      durationSeconds +
      extraTime;

    // ===================================================
    // DEBUG
    // ===================================================

    console.log(
      "TEST BEGIN: SESSION STATE",
      {
        sessionId:
          session.id,

        startedAt:
          session.startedAt,

        databaseTimeLeft:
          session.timeLeft,

        durationSeconds,

        extraTime,

        totalDuration,
      }
    );

    // ===================================================
    // FIRST OFFICIAL START
    //
    // Якщо startedAt === null,
    // тест ще НЕ починався.
    //
    // Саме зараз починається
    // офіційний відлік.
    // ===================================================

    if (
      session.startedAt ===
      null
    ) {
      const startedAt =
        new Date();

      // -------------------------------------------------
      // КРИТИЧНО
      //
      // Перший офіційний старт:
      //
      // startedAt = NOW
      // timeLeft = ПОВНИЙ ЧАС
      //
      // Для 60 хв:
      //
      // 3600 секунд
      // -------------------------------------------------

      const updated =
        await prisma.testSession.update({
          where: {
            id: session.id,

            // ДОДАТКОВИЙ ЗАХИСТ:
            //
            // Якщо паралельно інший запит
            // уже встиг почати сесію,
            // цей update нічого не змінить.
            startedAt: null,
          },

          data: {
            startedAt,

            timeLeft:
              totalDuration,

            lastActivityAt:
              startedAt,
          },

          select: {
            id: true,
            testId: true,

            startedAt: true,

            currentQuestion: true,
            savedAnswers: true,

            timeLeft: true,
            extraTime: true,

            finished: true,

            blocked: true,
            blockReason: true,
          },
        });

      console.log(
        "TEST BEGIN: OFFICIAL FIRST START",
        {
          sessionId:
            updated.id,

          testId:
            updated.testId,

          startedAt:
            updated.startedAt,

          timeLeft:
            updated.timeLeft,

          extraTime:
            updated.extraTime,
        }
      );

      const responseSession: SessionResponse =
        {
          id:
            updated.id,

          testId:
            updated.testId,

          startedAt:
            updated.startedAt,

          currentQuestion:
            updated.currentQuestion,

          savedAnswers:
            updated.savedAnswers,

          timeLeft:
            normalizeSeconds(
              updated.timeLeft
            ),

          extraTime:
            normalizeSeconds(
              updated.extraTime
            ),

          finished:
            updated.finished,

          blocked:
            updated.blocked,

          blockReason:
            updated.blockReason,
        };

      return NextResponse.json(
        {
          success: true,

          alreadyStarted:
            false,

          session:
            responseSession,
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",

            Pragma:
              "no-cache",

            Expires:
              "0",
          },
        }
      );
    }

    // ===================================================
    // ALREADY STARTED
    // ===================================================
    //
    // Сюди потрапляємо:
    //
    // - після F5;
    // - повторного відкриття сторінки;
    // - повторного POST /begin;
    // - повернення на сторінку.
    //
    // НОВІ 60 ХВ НЕ ДАЄМО.
    //
    // Рахуємо залишок від справжнього
    // startedAt.
    // ===================================================

    const now =
      new Date();

    const elapsedSeconds =
      Math.max(
        0,
        Math.floor(
          (
            now.getTime() -
            session.startedAt.getTime()
          ) / 1000
        )
      );

    const actualTimeLeft =
      Math.max(
        0,
        totalDuration -
          elapsedSeconds
      );

    console.log(
      "TEST BEGIN: ALREADY STARTED",
      {
        sessionId:
          session.id,

        startedAt:
          session.startedAt,

        now,

        elapsedSeconds,

        totalDuration,

        actualTimeLeft,

        databaseTimeLeft:
          session.timeLeft,
      }
    );

    // ===================================================
    // UPDATE SERVER TIME
    //
    // Зберігаємо актуальний залишок,
    // щоб інші серверні запити бачили
    // той самий стан.
    // ===================================================

    const updated =
      await prisma.testSession.update({
        where: {
          id: session.id,
        },

        data: {
          timeLeft:
            actualTimeLeft,

          lastActivityAt:
            now,
        },

        select: {
          id: true,
          testId: true,

          startedAt: true,

          currentQuestion: true,
          savedAnswers: true,

          timeLeft: true,
          extraTime: true,

          finished: true,

          blocked: true,
          blockReason: true,
        },
      });

    // ===================================================
    // EXPIRED
    // ===================================================

    if (
      actualTimeLeft <= 0
    ) {
      console.log(
        "TEST BEGIN: SESSION EXPIRED",
        {
          sessionId:
            updated.id,
        }
      );

      return NextResponse.json(
        {
          success: true,

          alreadyStarted:
            true,

          session: {
            id:
              updated.id,

            testId:
              updated.testId,

            startedAt:
              updated.startedAt,

            currentQuestion:
              updated.currentQuestion,

            savedAnswers:
              updated.savedAnswers,

            timeLeft: 0,

            extraTime:
              normalizeSeconds(
                updated.extraTime
              ),

            finished:
              updated.finished,

            blocked:
              updated.blocked,

            blockReason:
              updated.blockReason,
          },
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",

            Pragma:
              "no-cache",

            Expires:
              "0",
          },
        }
      );
    }

    // ===================================================
    // RESPONSE
    // ===================================================

    return NextResponse.json(
      {
        success: true,

        alreadyStarted:
          true,

        session: {
          id:
            updated.id,

          testId:
            updated.testId,

          startedAt:
            updated.startedAt,

          currentQuestion:
            updated.currentQuestion,

          savedAnswers:
            updated.savedAnswers,

          timeLeft:
            actualTimeLeft,

          extraTime:
            normalizeSeconds(
              updated.extraTime
            ),

          finished:
            updated.finished,

          blocked:
            updated.blocked,

          blockReason:
            updated.blockReason,
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",

          Pragma:
            "no-cache",

          Expires:
            "0",
        },
      }
    );
  } catch (error) {
    console.error(
      "TEST BEGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося розпочати тестування.",
      },
      {
        status: 500,
      }
    );
  }
}