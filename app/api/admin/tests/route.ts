import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

/**
 * GET /api/admin/tests
 *
 * Список усіх тестів.
 */
export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      orderBy: {
        createdAt: "desc",
      },

      include: {
        subjectRef: true,

        questions: {
          orderBy: {
            order: "asc",
          },

          include: {
            question: {
              include: {
                answerOptions: {
                  orderBy: {
                    order: "asc",
                  },
                },
              },
            },
          },
        },

        _count: {
          select: {
            questions: true,
            sessions: true,
            results: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      tests,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/tests error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося отримати список тестів.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * POST /api/admin/tests
 *
 * Створення нового тесту.
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

    const subject =
      typeof body.subject === "string"
        ? body.subject.trim()
        : "";

    const duration = Number(body.duration);

    /*
     * subjectId є необов'язковим,
     * щоб зберегти сумісність
     * зі старими тестами.
     */
    const subjectId =
      body.subjectId === undefined ||
      body.subjectId === null ||
      body.subjectId === ""
        ? null
        : Number(body.subjectId);

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: "Вкажіть назву тесту.",
        },
        {
          status: 400,
        }
      );
    }

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          message: "Вкажіть предмет.",
        },
        {
          status: 400,
        }
      );
    }

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

    if (
      subjectId !== null &&
      (!Number.isInteger(subjectId) ||
        subjectId <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний предмет.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Якщо передано subjectId,
     * перевіряємо, що такий предмет існує.
     */
    if (subjectId !== null) {
      const existingSubject =
        await prisma.subject.findUnique({
          where: {
            id: subjectId,
          },
        });

      if (!existingSubject) {
        return NextResponse.json(
          {
            success: false,
            message: "Вказаний предмет не знайдено.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * maxPoints необов'язковий.
     */
    const maxPoints =
      body.maxPoints === undefined
        ? 0
        : Number(body.maxPoints);

    if (
      !Number.isInteger(maxPoints) ||
      maxPoints < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Максимальна кількість балів повинна бути невід’ємним цілим числом.",
        },
        {
          status: 400,
        }
      );
    }

    const schoolYear =
      typeof body.schoolYear === "string" &&
      body.schoolYear.trim()
        ? body.schoolYear.trim()
        : "2026";

    const isPublished =
      typeof body.isPublished === "boolean"
        ? body.isPublished
        : false;

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

    /*
     * Якщо код доступу не потрібен,
     * не зберігаємо його.
     */
    const finalAccessCode = codeRequired
      ? accessCode
      : null;

    /*
     * displayOrder є обов'язковим і унікальним.
     *
     * Визначаємо наступний порядковий номер
     * на основі максимального існуючого.
     */
    const lastTest = await prisma.test.findFirst({
      orderBy: {
        displayOrder: "desc",
      },

      select: {
        displayOrder: true,
      },
    });

    const displayOrder =
      (lastTest?.displayOrder ?? 0) + 1;

    const test = await prisma.test.create({
      data: {
        title,

        /*
         * Зберігаємо старе текстове поле
         * для сумісності.
         */
        subject,

        /*
         * Новий зв'язок із Subject.
         */
        subjectId,

        schoolYear,
        duration,
        maxPoints,
        displayOrder,
        isPublished,
        codeRequired,
        accessCode: finalAccessCode,
      },

      include: {
        subjectRef: true,

        questions: {
          orderBy: {
            order: "asc",
          },

          include: {
            question: {
              include: {
                answerOptions: {
                  orderBy: {
                    order: "asc",
                  },
                },
              },
            },
          },
        },

        _count: {
          select: {
            questions: true,
            sessions: true,
            results: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Тест успішно створено.",
        test,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/tests error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося створити тест.",
      },
      {
        status: 500,
      }
    );
  }
}