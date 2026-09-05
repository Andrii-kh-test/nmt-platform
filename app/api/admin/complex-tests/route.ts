import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

/**
 * GET /api/admin/complex-tests
 *
 * Список комбінованих тестів.
 *
 * Без параметра archived:
 * тільки неархівовані.
 *
 * ?archived=true:
 * тільки архівовані.
 */
export async function GET(
  request: NextRequest
) {
  try {
    const archived =
      request.nextUrl.searchParams.get("archived") === "true";

    const complexTests =
      await prisma.complexTest.findMany({
        where: archived
          ? {
              isArchived: true,
            }
          : {
              isArchived: false,
            },

        orderBy: {
          createdAt: "desc",
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
      complexTests,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/complex-tests error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося отримати список комбінованих тестів.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * POST /api/admin/complex-tests
 *
 * Створення комбінованого тесту.
 *
 * Очікуваний body:
 *
 * {
 *   title: string,
 *   description?: string,
 *   duration: number,
 *   codeRequired?: boolean,
 *   accessCode?: string,
 *   isPublished?: boolean,
 *   testIds: number[]
 * }
 *
 * Порядок testIds визначає порядок
 * предметів у комбінованому тесті.
 */
export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

    const duration = Number(body.duration);

    const codeRequired =
      typeof body.codeRequired === "boolean"
        ? body.codeRequired
        : false;

    const accessCode =
      body.accessCode === undefined ||
      body.accessCode === null ||
      body.accessCode === ""
        ? null
        : String(body.accessCode).trim();

    const finalAccessCode = codeRequired
      ? accessCode
      : null;

    const isPublished =
      typeof body.isPublished === "boolean"
        ? body.isPublished
        : false;

    /*
     * Перевірка назви.
     */
    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Вкажіть назву комбінованого тесту.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Перевірка тривалості.
     */
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

    /*
     * Перевірка testIds.
     */
    if (!Array.isArray(body.testIds)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Необхідно вказати тести для комбінованого тесту.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Явно типізуємо список ID як number[].
     */
    const testIds: number[] = body.testIds.map(
      (id: unknown): number => Number(id)
    );

    /*
     * Повинен бути хоча б один тест.
     */
    if (testIds.length === 0) {
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
     * Усі ID повинні бути цілими додатними числами.
     */
    if (
      testIds.some(
        (id: number) =>
          !Number.isInteger(id) ||
          id <= 0
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
     * Не дозволяємо додавати один і той самий
     * тест декілька разів.
     */
    const uniqueTestIds = new Set<number>(
      testIds
    );

    if (
      uniqueTestIds.size !== testIds.length
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
     * Перевіряємо, що всі тести існують.
     */
    const tests =
      await prisma.test.findMany({
        where: {
          id: {
            in: testIds,
          },

          /*
           * Архівні тести не можна включати
           * до нового комбінованого тесту.
           */
          isArchived: false,
        },

        select: {
          id: true,
          title: true,
          subject: true,
          subjectId: true,
          duration: true,
          maxPoints: true,
          isPublished: true,
          isArchived: true,
        },
      });

    /*
     * Якщо кількість знайдених тестів
     * не відповідає кількості переданих ID,
     * хоча б одного тесту немає.
     */
    if (tests.length !== testIds.length) {
      const foundIds = new Set<number>(
        tests.map(
          (test: { id: number }) => test.id
        )
      );

      const missingIds = testIds.filter(
        (id: number) =>
          !foundIds.has(id)
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
     * Створюємо комбінований тест
     * разом із його складовими тестами.
     */
    const complexTest =
      await prisma.complexTest.create({
        data: {
          title,
          description,
          duration,
          codeRequired,
          accessCode: finalAccessCode,
          isPublished,
          isArchived: false,

          tests: {
            create: testIds.map(
              (
                testId: number,
                index: number
              ) => ({
                testId,
                order: index + 1,
              })
            ),
          },
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

    return NextResponse.json(
      {
        success: true,
        message:
          "Комбінований тест успішно створено.",
        complexTest,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/complex-tests error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося створити комбінований тест.",
      },
      {
        status: 500,
      }
    );
  }
}