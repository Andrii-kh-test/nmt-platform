import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";

const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET;

// =====================================================
// ADMIN AUTH
// =====================================================

function isAdmin(request: NextRequest) {
  const session =
    request.cookies.get("admin_session")?.value;

  return (
    !!ADMIN_SESSION_SECRET &&
    session === ADMIN_SESSION_SECRET
  );
}

// =====================================================
// PATCH
// Зміна дозволу учаснику переглядати завдання
// =====================================================

export async function PATCH(
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
    // =====================================================
    // ПЕРЕВІРКА АДМІНІСТРАТОРА
    // =====================================================

    if (!isAdmin(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "Доступ заборонено.",
        },
        {
          status: 401,
        }
      );
    }

    // =====================================================
    // ID
    // =====================================================

    const { id } = await params;

    const resultId = Number(id);

    if (!Number.isInteger(resultId) || resultId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний id результату.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // BODY
    // =====================================================

    const body = await request.json();

    if (
      typeof body.allowParticipantDetails !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Поле allowParticipantDetails повинно мати тип boolean.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // ПЕРЕВІРКА РЕЗУЛЬТАТУ
    // =====================================================

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
          message: "Результат не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // ОНОВЛЕННЯ
    // =====================================================

    const updatedResult =
      await prisma.testResult.update({
        where: {
          id: resultId,
        },
        data: {
          allowParticipantDetails:
            body.allowParticipantDetails,
        },
        select: {
          id: true,
          allowParticipantDetails: true,
        },
      });

    return NextResponse.json({
      success: true,
      allowParticipantDetails:
        updatedResult.allowParticipantDetails,
    });
  } catch (error) {
    console.error(
      "PATCH RESULT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося змінити дозвіл на перегляд завдань.",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// DELETE
// =====================================================

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
    // =====================================================
    // ПЕРЕВІРКА АДМІНІСТРАТОРА
    // =====================================================

    if (!isAdmin(request)) {
      return NextResponse.json(
        {
          success: false,
          message: "Доступ заборонено.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    const resultId = Number(id);

    // Перевірка id
    if (
      !Number.isInteger(resultId) ||
      resultId <= 0
    ) {
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