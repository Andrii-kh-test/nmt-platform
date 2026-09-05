import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

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
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const complexTest =
      await prisma.complexTest.findUnique({
        where: {
          id: complexTestId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          examType: true,
          codeRequired: true,
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
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (!complexTest.isPublished) {
      return NextResponse.json(
        {
          success: false,
          message: "Цей тест ще не опублікований.",
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (complexTest.isArchived) {
      return NextResponse.json(
        {
          success: false,
          message: "Цей тест знаходиться в архіві.",
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        complexTest: {
          id: complexTest.id,
          title: complexTest.title,
          description: complexTest.description,
          duration: complexTest.duration,
          examType: complexTest.examType,
          codeRequired: complexTest.codeRequired,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/complex-tests/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося завантажити комбінований тест.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}