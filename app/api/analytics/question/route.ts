import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// GET
// /api/analytics/question?testId=1&questionId=629
// =====================================================

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const testIdParam =
      searchParams.get("testId");

    const questionIdParam =
      searchParams.get(
        "questionId"
      );

    // =================================================
    // Перевірка TEST ID
    // =================================================

    if (!testIdParam) {
      return NextResponse.json(
        {
          message:
            "Не вказано ID тесту.",
        },
        {
          status: 400,
        }
      );
    }

    const testId =
      Number(testIdParam);

    if (
      !Number.isInteger(testId) ||
      testId <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "Некоректний ID тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // Перевірка QUESTION ID
    // =================================================

    if (!questionIdParam) {
      return NextResponse.json(
        {
          message:
            "Не вказано ID питання.",
        },
        {
          status: 400,
        }
      );
    }

    const questionId =
      Number(questionIdParam);

    if (
      !Number.isInteger(
        questionId
      ) ||
      questionId <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "Некоректний ID питання.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // ЗАВАНТАЖУЄМО ТІЛЬКИ ОДНЕ ПИТАННЯ
    // =================================================

    const question =
      await prisma.question.findFirst({
        where: {
          id: questionId,
          testId,
        },

        select: {
          id: true,
          order: true,
          type: true,
          text: true,
          points: true,

          options: {
            orderBy: {
              order: "asc",
            },

            select: {
              id: true,
              order: true,
              text: true,
              isCorrect: true,
            },
          },
        },
      });

    if (!question) {
      return NextResponse.json(
        {
          message:
            "Питання не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // ПОВЕРТАЄМО ДЕТАЛІ
    // =================================================

    return NextResponse.json({
      question: {
        id: question.id,

        order:
          question.order,

        type:
          question.type,

        text:
          question.text,

        points:
          question.points,

        options:
          question.options,
      },
    });
  } catch (error) {
    console.error(
      "ANALYTICS QUESTION ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Не вдалося завантажити питання.",
      },
      {
        status: 500,
      }
    );
  }
}