import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
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

    const complexTest = await prisma.complexTest.findUnique({
      where: {
        id: complexTestId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        examType: true,
        section: true,
        codeRequired: true,
        isPublished: true,
        isArchived: true,

        tests: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            order: true,

            test: {
              select: {
                id: true,
                title: true,
                subject: true,
                _count: {
                  select: {
                    questions: true,
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
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      complexTest,
    });
  } catch (error) {
    console.error(
      "GET /api/complex-tests/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося отримати інформацію про комбінований тест.",
      },
      { status: 500 }
    );
  }
}