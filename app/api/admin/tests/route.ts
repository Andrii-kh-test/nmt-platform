import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ==========================================
    // НОМЕР РОЗТАШУВАННЯ НА ГОЛОВНІЙ СТОРІНЦІ
    // ==========================================

    const displayOrder = Number(body.displayOrder);

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

    // ==========================================
    // ПЕРЕВІРКА УНІКАЛЬНОСТІ НОМЕРА
    // ==========================================

    const existingTest = await prisma.test.findUnique({
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

    // ==========================================
    // СТВОРЕННЯ ТЕСТУ
    // ==========================================

    const test = await prisma.test.create({
      data: {
        title: body.title,

        // Номер розташування
        displayOrder,

        // Тип іспиту
        examType: body.examType ?? "НМТ",

        subject: body.subject,

        description: body.description,

        schoolYear: body.schoolYear,

        duration: body.duration,

        maxPoints: body.maxPoints,

        // Публікація
        isPublished:
          body.isPublished ?? false,

        // Код доступу
        codeRequired:
          body.codeRequired ?? true,

        accessCode:
          body.accessCode || null,

        // ==========================================
        // ПИТАННЯ
        // ==========================================

        questions: {
          create: (body.questions ?? []).map(
            (
              question: any,
              index: number
            ) => {
              let options: {
                order: number;
                text: string;
                isCorrect: boolean;
              }[] = [];

              // ======================================
              // ЗВИЧАЙНІ ПИТАННЯ
              // ======================================

              if (
                question.type !== "matching"
              ) {
                options =
                  (
                    question.options ?? []
                  ).map(
                    (
                      option: any,
                      optionIndex: number
                    ) => ({
                      order:
                        optionIndex + 1,

                      text:
                        option.text ?? "",

                      isCorrect:
                        option.isCorrect ??
                        false,
                    })
                  );
              }

              // ======================================
              // MATCHING
              // ======================================

              if (
                question.type === "matching"
              ) {
                const leftItems =
                  question.matchingLeftItems ??
                  [];

                const rightItems =
                  question.matchingRightItems ??
                  [];

                // ------------------------------
                // Ліва частина
                // L|id|text|correctRightId
                // ------------------------------

                const leftOptions =
                  leftItems.map(
                    (
                      item: any,
                      itemIndex: number
                    ) => ({
                      order:
                        itemIndex + 1,

                      text:
                        `L|${item.id}|${item.text ?? ""}|${item.correctRightId}`,

                      isCorrect: false,
                    })
                  );

                // ------------------------------
                // Права частина
                // R|id|text
                // ------------------------------

                const rightOptions =
                  rightItems.map(
                    (
                      item: any,
                      itemIndex: number
                    ) => ({
                      order:
                        leftItems.length +
                        itemIndex +
                        1,

                      text:
                        `R|${item.id}|${item.text ?? ""}`,

                      isCorrect: false,
                    })
                  );

                options = [
                  ...leftOptions,
                  ...rightOptions,
                ];
              }

              return {
                order: index + 1,

                type: question.type,

                text:
                  question.text ?? "",

                points:
                  question.points ?? 1,

                shuffleQuestion:
                  question.shuffleQuestion ??
                  true,

                options: {
                  create: options,
                },
              };
            }
          ),
        },
      },

      // ==========================================
      // ПОВЕРТАЄМО СТВОРЕНИЙ ТЕСТ
      // ==========================================

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

    // ==========================================
    // ЗАХИСТ ВІД ДУБЛЮВАННЯ displayOrder
    // ==========================================

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