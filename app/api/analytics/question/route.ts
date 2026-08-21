import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// GET
// /api/analytics/question?testId=1&questionId=629
// =====================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const testIdParam = searchParams.get("testId");
    const questionIdParam = searchParams.get("questionId");

    // =================================================
    // ПЕРЕВІРКА TEST ID
    // =================================================

    if (!testIdParam) {
      return NextResponse.json(
        {
          message: "Не вказано ID тесту.",
        },
        {
          status: 400,
        }
      );
    }

    const testId = Number(testIdParam);

    if (!Number.isInteger(testId) || testId <= 0) {
      return NextResponse.json(
        {
          message: "Некоректний ID тесту.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // ПЕРЕВІРКА QUESTION ID
    // =================================================

    if (!questionIdParam) {
      return NextResponse.json(
        {
          message: "Не вказано ID питання.",
        },
        {
          status: 400,
        }
      );
    }

    const questionId = Number(questionIdParam);

    if (!Number.isInteger(questionId) || questionId <= 0) {
      return NextResponse.json(
        {
          message: "Некоректний ID питання.",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // ЗАВАНТАЖЕННЯ ПИТАННЯ ЧЕРЕЗ TEST QUESTION
    //
    // Актуальна структура:
    //
    // Test
    //   └── TestQuestion
    //         └── Question
    //               └── AnswerOption
    //
    // TestQuestion містить:
    // - testId
    // - questionId
    // - order
    //
    // Question містить:
    // - id
    // - text
    // - type
    // - points
    //
    // Question НЕ містить testId та order.
    // =================================================

    const testQuestion =
      await prisma.testQuestion.findFirst({
        where: {
          testId,
          questionId,
        },

        select: {
          id: true,
          testId: true,
          questionId: true,
          order: true,

          question: {
            select: {
              id: true,
              text: true,
              type: true,
              points: true,

              answerOptions: {
                orderBy: {
                  order: "asc",
                },

                select: {
                  id: true,
                  questionId: true,
                  text: true,
                  isCorrect: true,
                  order: true,
                },
              },
            },
          },
        },
      });

    // =================================================
    // ПЕРЕВІРКА НАЯВНОСТІ
    // =================================================

    if (!testQuestion) {
      return NextResponse.json(
        {
          message:
            "Питання не знайдено в указаному тесті.",
        },
        {
          status: 404,
        }
      );
    }

    // =================================================
    // ПОВЕРТАЄМО ДЕТАЛІ ПИТАННЯ
    // =================================================

    return NextResponse.json({
      question: {
        id: testQuestion.question.id,

        // Порядок питання належить TestQuestion
        order: testQuestion.order,

        type: testQuestion.question.type,

        text: testQuestion.question.text,

        points: testQuestion.question.points,

        options: testQuestion.question.answerOptions,
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