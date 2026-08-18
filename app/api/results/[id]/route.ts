import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await params;

    const resultId = Number(id);

    // Перевірка id
    if (!resultId || resultId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний id результату",
        },
        {
          status: 400,
        }
      );
    }

    // Перевіряємо, чи існує результат
    const existingResult =
      await prisma.testResult.findUnique({
        where: {
          id: resultId,
        },
      });

    if (!existingResult) {
      return NextResponse.json(
        {
          success: false,
          message: "Результат не знайдено",
        },
        {
          status: 404,
        }
      );
    }

    // Видаляємо результат
    await prisma.testResult.delete({
      where: {
        id: resultId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Результат успішно видалено",
    });
  } catch (error) {
    console.error(
      "DELETE RESULT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося видалити результат",
      },
      {
        status: 500,
      }
    );
  }
}