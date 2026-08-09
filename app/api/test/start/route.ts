import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      testId,
      lastName,
      firstName,
      middleName,
      accessCode,
    } = body;

    const numericTestId = Number(testId);

    if (!numericTestId || numericTestId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний id тесту",
        },
        {
          status: 400,
        }
      );
    }

    const test = await prisma.test.findUnique({
      where: {
        id: numericTestId,
      },
    });

    if (!test) {
      return NextResponse.json(
        {
          success: false,
          message: "Тест не знайдено",
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
          message: "Тест ще не опублікований",
        },
        {
          status: 403,
        }
      );
    }

    if (
      test.codeRequired &&
      test.accessCode !== accessCode
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Невірний код доступу",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================
    // Створюємо учасника
    // ==========================

    const participant =
      await prisma.participant.create({
        data: {
          lastName,
          firstName,
          middleName:
            middleName || null,
        },
      });

    // ==========================
    // Створюємо сесію
    // ==========================

    const session =
      await prisma.testSession.create({
        data: {
          participantId:
            participant.id,

          testId: test.id,

          currentQuestion: 0,

          savedAnswers: {},

          timeLeft:
            test.duration * 60,

          extraTime: 0,

          finished: false,

          blocked: false,

          blockReason: null,

          // startedAt встановлюється
          // автоматично через
          // @default(now())

          // finishedAt залишається null
          // до моменту завершення тесту.
        },
      });

    return NextResponse.json({
      success: true,
      participant,
      session,
    });
  } catch (error) {
    console.error(
      "TEST START ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Помилка запуску тесту",
      },
      {
        status: 500,
      }
    );
  }
}