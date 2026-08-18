import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

// =======================
// GET
// =======================

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } = await params;

  const testId = Number(id);

  if (!testId || testId <= 0) {
    return NextResponse.json(
      {
        error: "Некоректний id тесту",
      },
      {
        status: 400,
      }
    );
  }

  const test = await prisma.test.findUnique({
    where: {
      id: testId,
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

  if (!test) {
    return NextResponse.json(
      {
        error: "Тест не знайдено",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(test);
}

// =======================
// PUT UPDATE TEST
// =======================

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await params;

    const testId = Number(id);

    if (!testId || testId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Некоректний id тесту",
        },
        {
          status: 400,
        }
      );
    }

    // =======================
    // ПЕРЕВІРКА ІСНУВАННЯ
    // =======================

    const existing = await prisma.test.findUnique({
      where: {
        id: testId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Тест не знайдено",
        },
        {
          status: 404,
        }
      );
    }

    const body = await request.json();

    // =======================
    // НОМЕР РОЗТАШУВАННЯ
    // =======================

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
          error:
            "Номер розташування тесту повинен бути цілим числом більше 0",
        },
        {
          status: 400,
        }
      );
    }

    // =======================
    // ПЕРЕВІРКА УНІКАЛЬНОСТІ
    // =======================

    const existingOrder =
      await prisma.test.findFirst({
        where: {
          displayOrder,
          NOT: {
            id: testId,
          },
        },

        select: {
          id: true,
          title: true,
        },
      });

    if (existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Номер ${displayOrder} уже використовується тестом "${existingOrder.title}"`,
        },
        {
          status: 409,
        }
      );
    }

    // =======================
    // ВИДАЛЕННЯ СТАРИХ ПИТАНЬ
    // =======================

    /*
     * У schema.prisma для Question -> AnswerOption
     * встановлено onDelete: Cascade.
     *
     * Тому старі AnswerOption також будуть
     * автоматично видалені.
     */

    await prisma.question.deleteMany({
      where: {
        testId,
      },
    });

    // =======================
    // ОНОВЛЕННЯ ТЕСТУ
    // =======================

    const updatedTest =
      await prisma.test.update({
        where: {
          id: testId,
        },

        data: {
          title: body.title,

          // ==========================
          // НОМЕР РОЗТАШУВАННЯ
          // ==========================

          displayOrder,

          // ==========================
          // ТИП ІСПИТУ
          // ==========================

          examType:
            body.examType ?? "НМТ",

          subject:
            body.subject,

          description:
            body.description,

          duration:
            body.duration,

          schoolYear:
            body.schoolYear,

          maxPoints:
            body.maxPoints,

          // ==========================
          // ПУБЛІКАЦІЯ
          // ==========================

          isPublished:
            body.isPublished ?? false,

          // ==========================
          // КОД ДОСТУПУ
          // ==========================

          codeRequired:
            body.codeRequired ?? true,

          accessCode:
            body.accessCode || null,

          // ==========================
          // ПИТАННЯ
          // ==========================

          questions: {
            create:
              (
                body.questions ?? []
              ).map(
                (
                  question: any,
                  index: number
                ) => {
                  let options: {
                    order: number;
                    text: string;
                    isCorrect: boolean;
                  }[] = [];

                  // ==========================
                  // ЗВИЧАЙНІ ПИТАННЯ
                  // ==========================

                  if (
                    question.type !==
                    "matching"
                  ) {
                    options = (
                      question.options ??
                      []
                    ).map(
                      (
                        option: any,
                        optionIndex: number
                      ) => ({
                        order:
                          optionIndex +
                          1,

                        text:
                          option.text ??
                          "",

                        isCorrect:
                          option.isCorrect ??
                          false,
                      })
                    );
                  }

                  // ==========================
                  // MATCHING
                  // ==========================

                  if (
                    question.type ===
                    "matching"
                  ) {
                    const leftItems =
                      question.matchingLeftItems ??
                      [];

                    const rightItems =
                      question.matchingRightItems ??
                      [];

                    /*
                     * Ліва частина:
                     *
                     * L|id|text|correctRightId
                     */

                    const leftOptions =
                      leftItems.map(
                        (
                          item: any,
                          itemIndex: number
                        ) => ({
                          order:
                            itemIndex +
                            1,

                          text:
                            `L|${item.id}|${item.text ?? ""}|${item.correctRightId}`,

                          isCorrect:
                            false,
                        })
                      );

                    /*
                     * Права частина:
                     *
                     * R|id|text
                     */

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

                          isCorrect:
                            false,
                        })
                      );

                    options = [
                      ...leftOptions,
                      ...rightOptions,
                    ];
                  }

                  return {
                    order:
                      index + 1,

                    type:
                      question.type,

                    text:
                      question.text ??
                      "",

                    points:
                      question.points ??
                      1,

                    shuffleQuestion:
                      question.shuffleQuestion ??
                      true,

                    options: {
                      create:
                        options,
                    },
                  };
                }
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

    return NextResponse.json(
      {
        success: true,
        test: updatedTest,
      }
    );
  } catch (error: any) {
    console.error(
      "UPDATE TEST ERROR:",
      error
    );

    /*
     * Додатково обробляємо помилку
     * унікальності Prisma.
     */
    if (
      error?.code ===
      "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Такий номер розташування вже використовується іншим тестом",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Не вдалося оновити тест",
      },
      {
        status: 500,
      }
    );
  }
}

// =======================
// DELETE
// =======================

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await params;

    const testId = Number(id);

    if (!testId || testId <= 0) {
      return NextResponse.json(
        {
          error: "Некоректний id",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.test.findUnique({
        where: {
          id: testId,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Тест не знайдено",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.test.delete({
      where: {
        id: testId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE TEST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Не вдалося видалити тест",
      },
      {
        status: 500,
      }
    );
  }
}