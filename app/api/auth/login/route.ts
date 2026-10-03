import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/app/lib/prisma";
import { verifyPassword } from "@/app/lib/auth/password";

const SESSION_DURATION_DAYS = 30;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Введіть email та пароль.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    /*
     * Не розкриваємо, чи існує такий email.
     * Це також не дозволяє використовувати форму
     * для простого переліку зареєстрованих користувачів.
     */
    if (!user) {
      return NextResponse.json(
        {
          error: "Неправильний email або пароль.",
        },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "Ваш обліковий запис заблоковано.",
        },
        { status: 403 }
      );
    }

    const passwordValid = await verifyPassword(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          error: "Неправильний email або пароль.",
        },
        { status: 401 }
      );
    }

    /*
     * Створюємо криптографічно випадковий токен.
     *
     * У БД зберігаємо лише його SHA-256 хеш.
     * Сам токен потрапляє тільки в HttpOnly cookie.
     */
    const sessionToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = hashToken(sessionToken);

    const expiresAt = new Date(
      Date.now() +
        SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
    );

    /*
     * Якщо користувач входить повторно,
     * старі сесії не чіпаємо.
     *
     * Це дозволяє користуватися платформою
     * з кількох пристроїв.
     */
    await prisma.authSession.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const response = NextResponse.json({
      success: true,

      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        teacherStatus: user.teacherStatus,
      },

      redirectTo:
        user.role === "ADMIN"
          ? "/admin"
          : user.role === "TEACHER"
            ? "/teacher"
            : "/cabinet",
    });

    response.cookies.set({
      name: "auth_session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR", error);

    return NextResponse.json(
      {
        error: "Сталася помилка під час входу.",
      },
      { status: 500 }
    );
  }
}