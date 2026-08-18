import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// ==========================================
// GET — отримати тести
// ==========================================

export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      orderBy: {
        displayOrder: "asc",
      },

      include: {
        questions: {
          orderBy: {
            order: "asc",
          },

          include: {
            options: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error(
      "GET TESTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося отримати список тестів.",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// POST — створення тесту
// ==========================================

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    // ========================================
    // НОМЕР РОЗТАШУВАННЯ
    // ========================================

    const displayOrder =
      Number(body.displayOrder);

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

          // Номер на головній сторінці
          displayOrder,

          subject: body.subject,

          description:
            body.description,

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
                  questionIndex: number
                ) => ({
                  order:
                    question.order ??
                    questionIndex + 1,

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
                            option.order ??
                            optionIndex + 1,

                          text:
                            option.text,

                          isCorrect:
                            option.isCorrect ??
                            false,
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
      "CREATE TEST ERROR:",
      error
    );

    // ========================================
    // ДУБЛІК НОМЕРА
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
          "Не вдалося створити тест.",
      },
      {
        status: 500,
      }
    );
  }
}