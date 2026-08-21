import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/admin/tests/:id
 *
 * Повертає тест разом із:
 *
 * Test
 *  └── questions
 *       └── question
 *            └── answerOptions
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const testId = Number(id);

    if (!Number.isInteger(testId) || testId <= 0) {
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

    const test = await prisma.test.findUnique({
      where: {
        id: testId,
      },

      include: {
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

        sessions: {
          orderBy: {
            createdAt: "desc",
          },

          include: {
            participant: true,
            result: true,
          },
        },

        results: {
          orderBy: {
            createdAt: "desc",
          },
        },
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

    return NextResponse.json({
      success: true,
      test,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/tests/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося отримати тест.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * PATCH /api/admin/tests/:id
 *
 * Оновлення основної інформації тесту.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const testId = Number(id);

    if (!Number.isInteger(testId) || testId <= 0) {
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

    const existingTest =
      await prisma.test.findUnique({
        where: {
          id: testId,
        },
      });

    if (!existingTest) {
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

    const body = await request.json();

    const data: {
      title?: string;
      subject?: string;
      duration?: number;
      maxPoints?: number;
      isPublished?: boolean;
      codeRequired?: boolean;
      accessCode?: string | null;
    } = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            message: "Назва тесту не може бути порожньою.",
          },
          {
            status: 400,
          }
        );
      }

      data.title = title;
    }

    if (typeof body.subject === "string") {
      data.subject = body.subject.trim();
    }

    if (body.duration !== undefined) {
      const duration = Number(body.duration);

      if (
        !Number.isInteger(duration) ||
        duration <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Тривалість тесту повинна бути додатним цілим числом.",
          },
          {
            status: 400,
          }
        );
      }

      data.duration = duration;
    }

    if (body.maxPoints !== undefined) {
      const maxPoints = Number(body.maxPoints);

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

      data.maxPoints = maxPoints;
    }

    if (typeof body.isPublished === "boolean") {
      data.isPublished = body.isPublished;
    }

    if (typeof body.codeRequired === "boolean") {
      data.codeRequired = body.codeRequired;
    }

    if (body.accessCode !== undefined) {
      data.accessCode =
        body.accessCode === null ||
        body.accessCode === ""
          ? null
          : String(body.accessCode).trim();
    }

    const updatedTest =
      await prisma.test.update({
        where: {
          id: testId,
        },

        data,

        include: {
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
        },
      });

    return NextResponse.json({
      success: true,
      test: updatedTest,
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/tests/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося оновити тест.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * DELETE /api/admin/tests/:id
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const testId = Number(id);

    if (!Number.isInteger(testId) || testId <= 0) {
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

    const existingTest =
      await prisma.test.findUnique({
        where: {
          id: testId,
        },

        select: {
          id: true,
          title: true,
        },
      });

    if (!existingTest) {
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

    await prisma.test.delete({
      where: {
        id: testId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Тест успішно видалено.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/tests/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося видалити тест.",
      },
      {
        status: 500,
      }
    );
  }
}