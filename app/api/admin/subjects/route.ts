import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const archived =
      request.nextUrl.searchParams.get("archived") === "true";

    const subjects = await prisma.subject.findMany({
      where: archived
        ? {
            isArchived: true,
          }
        : {
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
      "GET SUBJECTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося отримати розділи.",
      },
      {
        status: 500,
      }
    );
  }
}

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
          message: "Назва розділу не може бути порожньою.",
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
          message: "Розділ із такою назвою вже існує.",
        },
        {
          status: 409,
        }
      );
    }

    const subject =
      await prisma.subject.create({
        data: {
          name,
          description,
          isActive: true,
          isArchived: false,
        },
      });

    return NextResponse.json({
      success: true,
      subject,
    });
  } catch (error) {
    console.error(
      "CREATE SUBJECT ERROR:",
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const id = Number(body.id);

    if (!Number.isInteger(id)) {
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

    if (typeof body.isArchived !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "Не вказано статус архіву.",
        },
        {
          status: 400,
        }
      );
    }

    const isArchived = body.isArchived;

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
      "UPDATE SUBJECT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося змінити статус розділу.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const id = Number(body.id);

    if (!Number.isInteger(id)) {
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
            "Неможливо остаточно видалити розділ, у якому є тести. Спочатку видаліть або перемістіть усі тести.",
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
    });
  } catch (error) {
    console.error(
      "DELETE SUBJECT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося видалити розділ.",
      },
      {
        status: 500,
      }
    );
  }
}