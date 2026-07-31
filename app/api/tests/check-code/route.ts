import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { testId, code } = await req.json();

    const test = await prisma.test.findUnique({
      where: {
        id: Number(testId),
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

    if (!test.isPublished) {
      return NextResponse.json(
        {
          success: false,
          message: "Тест ще не опублікований.",
        },
        {
          status: 403,
        }
      );
    }

    if (test.codeRequired) {
      if (test.accessCode !== code) {
        return NextResponse.json(
          {
            success: false,
            message: "Неправильний код доступу.",
          },
          {
            status: 401,
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Помилка сервера.",
      },
      {
        status: 500,
      }
    );
  }
}