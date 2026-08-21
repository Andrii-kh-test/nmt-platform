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
// GET — отримання актуального стану сесії
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
// - finishedAt
// - resultId
//
// ВАЖЛИВО:
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

          testId:
            testIdNumber,
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

          result: {
            select: {
              id: true,
            },
          },
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
    // Результат
    //
    // Завдяки sessionId @unique результат
    // належить саме цій сесії.
    // =================================================

    const resultId =
      session.result?.id ??
      null;

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

      finishedAt:
        session.finishedAt,

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
// - heartbeat
//
// Учасник НЕ може змінювати:
//
// - timeLeft
// - extraTime
// - blocked
// - blockReason
// - blockedAt
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

          testId:
            testIdNumber,
        },

        include: {
          result: true,
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

            currentQuestion: true,

            timeLeft: true,

            extraTime: true,

            blocked: true,

            blockReason: true,

            finished: true,

            finishedAt: true,

            result: {
              select: {
                id: true,
              },
            },
          },
        });

      return NextResponse.json({
        id: updatedSession.id,

        lastActivityAt:
          updatedSession.lastActivityAt,

        currentQuestion:
          updatedSession.currentQuestion,

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

        resultId:
          updatedSession.result?.id ??
          null,
      });
    }

    // =================================================
    // ЗАВЕРШЕНА СЕСІЯ
    //
    // Якщо сесію вже завершено сервером,
    // учасник не може знову її відкрити.
    //
    // Повертаємо також resultId.
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

        finishedAt:
          session.finishedAt,

        resultId:
          session.result?.id ??
          null,
      });
    }

    // =================================================
    // Якщо сесія заблокована
    //
    // Учасник може продовжувати передавати heartbeat,
    // але не повинен змінювати відповіді або питання
    // після блокування.
    // =================================================

    if (session.blocked) {
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

        blocked: true,

        blockReason:
          session.blockReason,

        finished:
          session.finished,

        finishedAt:
          session.finishedAt,

        resultId:
          session.result?.id ??
          null,
      });
    }

    // =================================================
    // Формуємо дані для оновлення
    //
    // КРИТИЧНО:
    //
    // Тут НЕ повинно бути:
    //
    // timeLeft
    // extraTime
    // blocked
    // blockReason
    // blockedAt
    //
    // Інакше браузер учасника може перезаписати
    // адміністративні зміни.
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
    // Зазвичай завершення виконується
    // через finishTest().
    //
    // Якщо finished=true передано напряму,
    // дозволяємо завершення.
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

        include: {
          result: true,
        },
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

      resultId:
        updatedSession.result?.id ??
        null,
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