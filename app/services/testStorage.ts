import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ========================================
    // НОМЕР РОЗТАШУВАННЯ ТЕСТУ
    // ========================================

    const displayOrder = Number(
      body.displayOrder
    );

    if (
      !Number.isInteger(displayOrder) ||
      displayOrder < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Номер розташування тесту повинен бути цілим числом більше 0.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================
    // ПЕРЕВІРКА УНІКАЛЬНОСТІ
    // ========================================

    const existingTest =
      await prisma.test.findUnique({
        where: {
          displayOrder,
        },

        select: {
          id: true,
          title: true,
        },
      });

    if (existingTest) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Номер ${displayOrder} уже використовується тестом "${existingTest.title}".`,
        },
        {
          status: 409,
        }
      );
    }

    // ========================================
    // СТВОРЕННЯ ТЕСТУ
    // ========================================

    const test =
      await prisma.test.create({
        data: {
          title: body.title,

          // Обов'язковий номер тесту
          displayOrder,

          subject:
            body.subject,

          description:
            body.description ?? "",

          schoolYear:
            body.schoolYear,

          duration:
            body.duration,

          maxPoints:
            body.maxPoints,

          examType:
            body.examType ?? "НМТ",

          isPublished:
            body.isPublished ?? false,

          codeRequired:
            body.codeRequired ?? true,

          accessCode:
            body.accessCode || null,

          // ====================================
          // ПИТАННЯ
          // ====================================

          questions: {
            create:
              (
                body.questions ?? []
              ).map(
                (
                  question: any,
                  index: number
                ) => ({
                  order:
                    index + 1,

                  type:
                    question.type,

                  text:
                    question.text,

                  points:
                    question.points,

                  shuffleQuestion:
                    question.shuffleQuestion ??
                    true,

                  options: {
                    create:
                      (
                        question.options ??
                        []
                      ).map(
                        (
                          option: any,
                          optionIndex: number
                        ) => ({
                          order:
                            optionIndex + 1,

                          text:
                            option.text,

                          isCorrect:
  question.correctAnswers?.includes(
    option.id
  ) ||
  question.correctAnswers?.includes(
    optionIndex + 1
  ) ||
  option.isCorrect === true,
                        })
                      ),
                  },
                })
              ),
          },
        },

        include: {
          questions: {
            include: {
              options: {
                orderBy: {
                  order: "asc",
                },
              },
            },

            orderBy: {
              order: "asc",
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      test,
    });
  } catch (error: any) {
    console.error(
      "TEST STORAGE CREATE ERROR:",
      error
    );

    // ========================================
    // ПОМИЛКА УНІКАЛЬНОСТІ
    // ========================================

    if (
      error?.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Такий номер розташування вже використовується іншим тестом.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Помилка створення тесту",
      },
      {
        status: 500,
      }
    );
  }
}