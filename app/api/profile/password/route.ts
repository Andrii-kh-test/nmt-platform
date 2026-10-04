import { NextResponse } from "next/server";

import { getCurrentUser } from "@/app/lib/auth/session";
import {
  hashPassword,
  verifyPassword,
} from "@/app/lib/auth/password";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Користувач не авторизований.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const currentPassword =
      typeof body.currentPassword === "string"
        ? body.currentPassword
        : "";

    const newPassword =
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Заповніть усі поля.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Нові паролі не збігаються.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Новий пароль має містити щонайменше 8 символів.",
        },
        { status: 400 }
      );
    }

    const isCurrentPasswordCorrect = await verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordCorrect) {
      return NextResponse.json(
        {
          success: false,
          message: "Поточний пароль введено неправильно.",
        },
        { status: 400 }
      );
    }

    const isSamePassword = await verifyPassword(
      newPassword,
      user.passwordHash
    );

    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Новий пароль має відрізнятися від поточного.",
        },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Пароль успішно змінено.",
    });
  } catch (error) {
    console.error("PASSWORD CHANGE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося змінити пароль.",
      },
      { status: 500 }
    );
  }
}