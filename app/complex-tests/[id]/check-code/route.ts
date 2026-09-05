import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const complexTestId = Number(id);

    if (
      !Number.isInteger(complexTestId) ||
      complexTestId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний ідентифікатор тесту.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const accessCode =
      typeof body.accessCode === "string"
        ? body.accessCode.trim()
        : "";

    const complexTest =
      await prisma.complexTest.findUnique({
        where: {
          id: complexTestId,
        },
        select: {
          id: true,
          codeRequired: true,
          accessCode: true,
          isPublished: true,
          isArchived: true,
        },
      });

    if (!complexTest) {
      return NextResponse.json(
        {
          success: false,
          message: "Комбінований тест не знайдено.",
        },
        { status: 404 }
      );
    }

    if (
      !complexTest.isPublished ||
      complexTest.isArchived
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Цей тест наразі недоступний.",
        },
        { status: 403 }
      );
    }

    // Якщо код для тесту не потрібен,
    // перевірка автоматично успішна.
    if (!complexTest.codeRequired) {
      return NextResponse.json({
        success: true,
        message: "Код доступу не потрібен.",
      });
    }

    if (!accessCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Введіть код доступу.",
        },
        { status: 400 }
      );
    }

    if (!complexTest.accessCode) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Для цього тесту не налаштовано код доступу.",
        },
        { status: 500 }
      );
    }

    if (accessCode !== complexTest.accessCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Неправильний код доступу.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Код доступу перевірено успішно.",
    });
  } catch (error) {
    console.error(
      "POST /api/complex-tests/[id]/check-code error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося перевірити код доступу.",
      },
      { status: 500 }
    );
  }
}