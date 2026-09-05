import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

/**
 * GET /api/admin/subjects
 *
 * Повертає всі активні предмети
 * в алфавітному порядку.
 */
export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      where: {
        isActive: true,
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
        message: "Не вдалося отримати список предметів.",
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
 * Створює новий предмет.
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
          message: "Вкажіть назву предмета.",
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
          message: "Такий предмет уже існує.",
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
        message: "Не вдалося створити предмет.",
      },
      {
        status: 500,
      }
    );
  }
}