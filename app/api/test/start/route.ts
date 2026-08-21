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

    // =====================================================
    // ПЕРЕВІРКА TEST ID
    // =====================================================

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

    // =====================================================
    // ПЕРЕВІРКА ТЕСТУ
    // =====================================================

    const test = await prisma.test.findUnique({
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

    // =====================================================
    // ПЕРЕВІРКА ПУБЛІКАЦІЇ
    // =====================================================

    if (!test.isPublished) {
      return NextResponse.json(
        {
          success: false,
          message: "Тест ще не опублікований.",
        },
        {
          status: 403,
        }
      );
    }

    // =====================================================
    // ПЕРЕВІРКА КОДУ ДОСТУПУ
    // =====================================================

    if (
      test.codeRequired &&
      test.accessCode !== accessCode
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Невірний код доступу.",
        },
        {
          status: 403,
        }
      );
    }

    // =====================================================
    // ПЕРЕВІРКА ДАНИХ УЧАСНИКА
    // =====================================================

    if (
      typeof lastName !== "string" ||
      !lastName.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Не вказано прізвище.",
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

    // =====================================================
    // СТВОРЕННЯ УЧАСНИКА
    // =====================================================

    const participant =
      await prisma.participant.create({
        data: {
          lastName: lastName.trim(),

          firstName: firstName.trim(),

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

    // =====================================================
    // СТВОРЕННЯ ЄДИНОЇ СЕСІЇ
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
            Math.max(
              0,
              Math.floor(
                test.duration * 60
              )
            ),

          extraTime: 0,

          finished: false,

          blocked: false,

          blockReason: null,

          blockedAt: null,

          finishedAt: null,

          lastActivityAt:
            new Date(),
        },
      });

    // =====================================================
    // ВІДПОВІДЬ
    // =====================================================

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
        message:
          "Помилка запуску тесту.",
      },
      {
        status: 500,
      }
    );
  }
}