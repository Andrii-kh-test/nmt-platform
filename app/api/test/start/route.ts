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

    const test = await prisma.test.findUnique({
      where: {
        id: testId,
      },
    });

    if (!test) {
      return NextResponse.json(
        {
          success: false,
          message: "Тест не знайдено",
        },
        { status: 404 }
      );
    }

    if (!test.isPublished) {
      return NextResponse.json(
        {
          success: false,
          message: "Тест ще не опублікований",
        },
        { status: 403 }
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
        { status: 403 }
      );
    }

    // Створюємо учасника
    const participant =
      await prisma.participant.create({
        data: {
          lastName,
          firstName,
          middleName,
        },
      });

    // Створюємо сесію
    const session =
      await prisma.testSession.create({
        data: {
          participantId: participant.id,

          testId: test.id,

          currentQuestion: 0,

          savedAnswers: {},

          timeLeft: test.duration * 60,

          finished: false,
        },
      });

    return NextResponse.json({
      success: true,
      participant,
      session,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Помилка запуску тесту",
      },
      { status: 500 }
    );
  }
}