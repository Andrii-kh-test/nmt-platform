import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/admin/complex-tests/[id]
 *
 * Отримання одного комбінованого тесту.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: idParam } = await context.params;

    const id = Number(idParam);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректний ID комбінованого тесту.",
        },
        {
          status: 400,
        }
      );
    }

    const complexTest =
      await prisma.complexTest.findUnique({
        where: {
          id,
        },

        include: {
          tests: {
            orderBy: {
              order: "asc",
            },

            include: {
              test: {
                include: {
                  subjectRef: true,

                  _count: {
                    select: {
                      questions: true,
                      sessions: true,
                      results: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!complexTest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Комбінований тест не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      complexTest,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/complex-tests/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося отримати комбінований тест.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * PATCH /api/admin/complex-tests/[id]
 *
 * Редагування комбінованого тесту.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: idParam } = await context.params;

    const id = Number(idParam);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректний ID комбінованого тесту.",
        },
        {
          status: 400,
        }
      );
    }

    const existingComplexTest =
      await prisma.complexTest.findUnique({
        where: {
          id,
        },

        include: {
          tests: true,
        },
      });

    if (!existingComplexTest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Комбінований тест не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    const body = await request.json();

    const data: {
      title?: string;
      description?: string | null;
      duration?: number;
      codeRequired?: boolean;
      accessCode?: string | null;
      isPublished?: boolean;
      isArchived?: boolean;
    } = {};

    /*
     * Назва.
     */
    if (body.title !== undefined) {
      if (
        typeof body.title !== "string" ||
        !body.title.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Назва комбінованого тесту не може бути порожньою.",
          },
          {
            status: 400,
          }
        );
      }

      data.title = body.title.trim();
    }

    /*
     * Опис.
     */
    if (body.description !== undefined) {
      if (
        body.description === null ||
        body.description === ""
      ) {
        data.description = null;
      } else if (
        typeof body.description === "string"
      ) {
        data.description =
          body.description.trim() || null;
      } else {
        return NextResponse.json(
          {
            success: false,
            message:
              "Некоректний опис.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * Тривалість.
     */
    if (body.duration !== undefined) {
      const duration =
        Number(body.duration);

      if (
        !Number.isInteger(duration) ||
        duration <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Тривалість повинна бути додатним цілим числом.",
          },
          {
            status: 400,
          }
        );
      }

      data.duration = duration;
    }

    /*
     * Потрібен код доступу.
     */
    if (body.codeRequired !== undefined) {
      if (
        typeof body.codeRequired !== "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Некоректне значення codeRequired.",
          },
          {
            status: 400,
          }
        );
      }

      data.codeRequired =
        body.codeRequired;

      if (!body.codeRequired) {
        data.accessCode = null;
      }
    }

    /*
     * Код доступу.
     */
    if (
      body.accessCode !== undefined &&
      body.codeRequired !== false
    ) {
      if (
        body.accessCode === null ||
        body.accessCode === ""
      ) {
        data.accessCode = null;
      } else {
        data.accessCode = String(
          body.accessCode
        ).trim();
      }
    }

    /*
     * Публікація.
     */
    if (body.isPublished !== undefined) {
      if (
        typeof body.isPublished !== "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Некоректне значення isPublished.",
          },
          {
            status: 400,
          }
        );
      }

      data.isPublished =
        body.isPublished;
    }

    /*
     * Архів.
     */
    if (body.isArchived !== undefined) {
      if (
        typeof body.isArchived !== "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Некоректне значення isArchived.",
          },
          {
            status: 400,
          }
        );
      }

      data.isArchived =
        body.isArchived;

      /*
       * Архівний тест не може бути
       * опублікованим.
       */
      if (body.isArchived === true) {
        data.isPublished = false;
      }
    }

    /*
     * Якщо codeRequired = true,
     * але accessCode не передано,
     * залишаємо старий код.
     */
    if (
      body.codeRequired === true &&
      body.accessCode === undefined &&
      existingComplexTest.accessCode !== null
    ) {
      data.accessCode =
        existingComplexTest.accessCode;
    }

    /*
     * testIds.
     *
     * ВАЖЛИВО:
     * тут використовуємо окремий локальний
     * number[], а не number[] | null.
     */
    let newTestIds: number[] | undefined;

    if (body.testIds !== undefined) {
      if (!Array.isArray(body.testIds)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "testIds повинен бути масивом.",
          },
          {
            status: 400,
          }
        );
      }

      const parsedTestIds: number[] =
        body.testIds.map(
          (testId: unknown): number =>
            Number(testId)
        );

      if (parsedTestIds.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Комбінований тест повинен містити хоча б один тест.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Перевірка ID.
       */
      if (
        parsedTestIds.some(
          (testId: number) =>
            !Number.isInteger(testId) ||
            testId <= 0
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Список тестів містить некоректний ID.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Дублікати.
       */
      const uniqueTestIds =
        new Set<number>(
          parsedTestIds
        );

      if (
        uniqueTestIds.size !==
        parsedTestIds.length
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Один і той самий тест не можна додати кілька разів.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Перевіряємо існування всіх тестів.
       */
      const tests =
        await prisma.test.findMany({
          where: {
            id: {
              in: parsedTestIds,
            },
            isArchived: false,
          },

          select: {
            id: true,
          },
        });

      if (
        tests.length !==
        parsedTestIds.length
      ) {
        const foundIds =
          new Set<number>(
            tests.map(
              (test: { id: number }) =>
                test.id
            )
          );

        const missingIds: number[] =
          parsedTestIds.filter(
            (testId: number) =>
              !foundIds.has(testId)
          );

        return NextResponse.json(
          {
            success: false,
            message:
              "Один або кілька вибраних тестів не знайдено або вони перебувають в архіві.",
            missingIds,
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Тут гарантовано number[].
       */
      newTestIds = parsedTestIds;
    }

    /*
     * Оновлення основного запису
     * та зв'язків.
     */
    const updatedComplexTest =
      await prisma.$transaction(
        async (tx) => {
          const updated =
            await tx.complexTest.update({
              where: {
                id,
              },

              data,
            });

          /*
           * Якщо testIds передано,
           * повністю перебудовуємо порядок.
           */
          if (newTestIds !== undefined) {
            await tx.complexTestItem.deleteMany({
              where: {
                complexTestId: id,
              },
            });

            await tx.complexTestItem.createMany({
              data: newTestIds.map(
                (
                  testId: number,
                  index: number
                ) => ({
                  complexTestId: id,
                  testId,
                  order: index + 1,
                })
              ),
            });
          }

          return updated;
        }
      );

    /*
     * Отримуємо повністю оновлений
     * комбінований тест.
     */
    const result =
      await prisma.complexTest.findUnique({
        where: {
          id: updatedComplexTest.id,
        },

        include: {
          tests: {
            orderBy: {
              order: "asc",
            },

            include: {
              test: {
                include: {
                  subjectRef: true,

                  _count: {
                    select: {
                      questions: true,
                      sessions: true,
                      results: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Комбінований тест успішно оновлено.",
      complexTest: result,
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/complex-tests/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося оновити комбінований тест.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * DELETE /api/admin/complex-tests/[id]
 *
 * Остаточне видалення комбінованого тесту.
 *
 * Звичайні Test НЕ видаляються.
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: idParam } = await context.params;

    const id = Number(idParam);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Некоректний ID комбінованого тесту.",
        },
        {
          status: 400,
        }
      );
    }

    const existingComplexTest =
      await prisma.complexTest.findUnique({
        where: {
          id,
        },
      });

    if (!existingComplexTest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Комбінований тест не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ComplexTestItem видаляться автоматично
     * завдяки onDelete: Cascade.
     *
     * Звичайні Test залишаються.
     */
    await prisma.complexTest.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Комбінований тест остаточно видалено.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/complex-tests/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося видалити комбінований тест.",
      },
      {
        status: 500,
      }
    );
  }
}