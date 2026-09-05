import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

/**
 * GET /api/admin/subjects
 *
 * Повертає всі активні та неархівовані розділи
 * в алфавітному порядку.
 */
export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      where: {
        isActive: true,
        isArchived: false,
      },

      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      subjects,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/subjects error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося отримати список розділів.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * POST /api/admin/subjects
 *
 * Створює новий розділ.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Вкажіть назву розділу.",
        },
        {
          status: 400,
        }
      );
    }

    const existingSubject =
      await prisma.subject.findUnique({
        where: {
          name,
        },
      });

    if (existingSubject) {
      return NextResponse.json(
        {
          success: false,
          message: "Такий розділ уже існує.",
        },
        {
          status: 409,
        }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        description,
        isActive: true,
        isArchived: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        subject,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/subjects error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося створити розділ.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * PATCH /api/admin/subjects
 *
 * Архівує або відновлює розділ.
 *
 * Body:
 * {
 *   id: number,
 *   isArchived: boolean
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const id =
      typeof body.id === "number"
        ? body.id
        : Number(body.id);

    const isArchived =
      typeof body.isArchived === "boolean"
        ? body.isArchived
        : null;

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний ID розділу.",
        },
        {
          status: 400,
        }
      );
    }

    if (isArchived === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Не вказано стан архівування розділу.",
        },
        {
          status: 400,
        }
      );
    }

    const existingSubject =
      await prisma.subject.findUnique({
        where: {
          id,
        },
      });

    if (!existingSubject) {
      return NextResponse.json(
        {
          success: false,
          message: "Розділ не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    const subject =
      await prisma.subject.update({
        where: {
          id,
        },
        data: {
          isArchived,
          isActive: !isArchived,
        },
      });

    return NextResponse.json({
      success: true,
      subject,
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/subjects error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося змінити статус розділу.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * DELETE /api/admin/subjects
 *
 * Остаточно видаляє розділ.
 *
 * Перед видаленням перевіряємо,
 * чи не містить розділ тестів.
 */
export async function DELETE(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const id =
      typeof body.id === "number"
        ? body.id
        : Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний ID розділу.",
        },
        {
          status: 400,
        }
      );
    }

    const subject =
      await prisma.subject.findUnique({
        where: {
          id,
        },
        include: {
          tests: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          message: "Розділ не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    if (subject.tests.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Неможливо видалити розділ, у якому є тести. Спочатку перемістіть або видаліть ці тести.",
        },
        {
          status: 409,
        }
      );
    }

    await prisma.subject.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Розділ остаточно видалено.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/subjects error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося видалити розділ.",
      },
      {
        status: 500,
      }
    );
  }
}