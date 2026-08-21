import {
  NextRequest,
  NextResponse,
} from "next/server";

import { Prisma } from "@prisma/client";

import { prisma } from "@/app/lib/prisma";

type Props = {
  params: Promise<{
    testId: string;
  }>;
};

// =====================================================
// GET — отримання стану конкретної сесії
//
// Учасник отримує:
//
// - id
// - currentQuestion
// - blocked
// - blockReason
// - timeLeft
// - extraTime
// - finished
// - resultId
//
// ВАЖЛИВО:
//
// timeLeft тут тільки ЧИТАЄМО.
//
// GET нічого не змінює.
// =====================================================

export async function GET(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { testId } = await params;

    const sessionIdParam =
      req.nextUrl.searchParams.get(
        "sessionId"
      );

    const testIdNumber =
      Number(testId);

    const sessionId =
      sessionIdParam
        ? Number(sessionIdParam)
        : null;

    // =================================================
    // Перевірка testId
    // =================================================

    if (
      !Number.isInteger(
        testIdNumber
      ) ||
      testIdNumber <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Перевірка sessionId
    // =================================================

    if (
      !sessionId ||
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Знаходимо конкретну сесію
    // =================================================

    const session =
      await prisma.testSession.findFirst({
        where: {
          id: sessionId,

          testId: testIdNumber,
        },

        select: {
          id: true,

          currentQuestion: true,

          blocked: true,

          blockReason: true,

          timeLeft: true,

          extraTime: true,

          finished: true,

          finishedAt: true,
        },
      });

    // =================================================
    // Сесії немає
    // =================================================

    if (!session) {
      return NextResponse.json(
        null
      );
    }

    // =================================================
    // Шукаємо результат
    //
    // У поточній структурі TestResult може бути
    // пов'язаний із testId, але не обов'язково
    // мати sessionId.
    //
    // Тому спочатку намагаємося знайти результат
    // за sessionId через поле, якщо воно існує
    // у Prisma-моделі.
    //
    // Щоб цей GET не падав через відсутність
    // такого поля в старій схемі, основна логіка
    // нижче працює без нього.
    // =================================================

    let resultId: number | null =
      null;

    if (session.finished) {
      // -------------------------------------------------
      // Варіант 1:
      //
      // Якщо TestResult має sessionId, його потрібно
      // використовувати як основний спосіб зв'язку.
      //
      // У поточній схемі цей блок свідомо не виконує
      // Prisma-запит із sessionId, щоб код відповідав
      // схемі, яку ми використовували до цього.
      // -------------------------------------------------

      // -------------------------------------------------
      // Варіант 2:
      //
      // Знаходимо останній результат цього тесту.
      //
      // Це тимчасовий механізм до додавання sessionId
      // у TestResult.
      // -------------------------------------------------

      const result =
        await prisma.testResult.findFirst({
          where: {
            testId: testIdNumber,
          },

          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
          },
        });

      if (result) {
        resultId =
          result.id;
      }
    }

    // =================================================
    // Повертаємо стан
    // =================================================

    return NextResponse.json({
      id: session.id,

      currentQuestion:
        session.currentQuestion,

      blocked:
        session.blocked,

      blockReason:
        session.blockReason,

      timeLeft:
        session.timeLeft,

      extraTime:
        session.extraTime,

      finished:
        session.finished,

      resultId,
    });
  } catch (error) {
    console.error(
      "GET SESSION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Помилка отримання сесії.",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// POST — синхронізація сесії
//
// Учасник може передавати:
//
// - sessionId
// - currentQuestion
// - savedAnswers
// - finished
//
// Учасник НЕ може змінювати:
//
// - timeLeft
// - extraTime
// - blocked
// - blockReason
// - blockedAt
//
// Це критично для роботи адміністративної панелі.
// =====================================================

export async function POST(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { testId } = await params;

    const body =
      await req.json();

    const testIdNumber =
      Number(testId);

    const sessionId =
      Number(body.sessionId);

    // =================================================
    // Перевірка testId
    // =================================================

    if (
      !Number.isInteger(
        testIdNumber
      ) ||
      testIdNumber <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Перевірка sessionId
    // =================================================

    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Знаходимо конкретну сесію
    // =================================================

    const session =
      await prisma.testSession.findFirst({
        where: {
          id: sessionId,

          testId: testIdNumber,
        },
      });

    // =================================================
    // Сесії немає
    // =================================================

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Сесію не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // HEARTBEAT
    //
    // Heartbeat лише повідомляє сервер,
    // що браузер учасника активний.
    //
    // НІЯКОГО timeLeft.
    // =================================================

    if (
      body.heartbeat === true
    ) {
      const updatedSession =
        await prisma.testSession.update({
          where: {
            id: session.id,
          },

          data: {
            lastActivityAt:
              new Date(),
          },

          select: {
            id: true,

            lastActivityAt: true,
          },
        });

      return NextResponse.json(
        updatedSession
      );
    }

    // =================================================
    // ВАЖЛИВО:
    //
    // Якщо сесію вже завершено сервером,
    // учасник не повинен мати можливості
    // знову її "відкрити" через POST.
    // =================================================

    if (session.finished) {
      return NextResponse.json({
        id: session.id,

        currentQuestion:
          session.currentQuestion,

        savedAnswers:
          session.savedAnswers,

        timeLeft:
          session.timeLeft,

        extraTime:
          session.extraTime,

        blocked:
          session.blocked,

        blockReason:
          session.blockReason,

        finished: true,
      });
    }

    // =================================================
    // Формуємо дані для оновлення
    //
    // КРИТИЧНО:
    //
    // Тут НІКОЛИ не повинно бути:
    //
    // timeLeft
    // extraTime
    // blocked
    // blockReason
    // blockedAt
    //
    // Інакше браузер учасника може перезаписати
    // зміни адміністратора.
    // =================================================

    const updateData: Prisma.TestSessionUpdateInput =
      {
        lastActivityAt:
          new Date(),
      };

    // =================================================
    // Поточне питання
    // =================================================

    if (
      typeof body.currentQuestion ===
        "number" &&
      Number.isInteger(
        body.currentQuestion
      ) &&
      body.currentQuestion >= 0
    ) {
      updateData.currentQuestion =
        body.currentQuestion;
    }

    // =================================================
    // Збережені відповіді
    // =================================================

    if (
      body.savedAnswers !==
      undefined
    ) {
      updateData.savedAnswers =
        body.savedAnswers === null
          ? Prisma.JsonNull
          : body.savedAnswers;
    }

    // =================================================
    // Завершення
    //
    // Зазвичай завершення виконується через
    // finishTest().
    //
    // Але якщо учасник передав finished=true,
    // дозволяємо завершити сесію.
    // =================================================

    if (
      typeof body.finished ===
      "boolean"
    ) {
      if (body.finished) {
        updateData.finished =
          true;

        updateData.finishedAt =
          session.finishedAt ??
          new Date();
      }
    }

    // =================================================
    // ОНОВЛЕННЯ
    // =================================================

    const updatedSession =
      await prisma.testSession.update({
        where: {
          id: session.id,
        },

        data: updateData,
      });

    // =================================================
    // Повертаємо актуальний стан
    // =================================================

    return NextResponse.json({
      id: updatedSession.id,

      currentQuestion:
        updatedSession.currentQuestion,

      savedAnswers:
        updatedSession.savedAnswers,

      timeLeft:
        updatedSession.timeLeft,

      extraTime:
        updatedSession.extraTime,

      blocked:
        updatedSession.blocked,

      blockReason:
        updatedSession.blockReason,

      finished:
        updatedSession.finished,

      finishedAt:
        updatedSession.finishedAt,
    });
  } catch (error) {
    console.error(
      "POST SESSION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Помилка збереження сесії.",
      },
      {
        status: 500,
      }
    );
  }
}