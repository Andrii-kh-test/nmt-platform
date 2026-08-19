import { NextResponse } from "next/server";

const ADMIN_LOGIN =
  process.env.ADMIN_LOGIN;

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD;

const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET;

export async function POST(
  request: Request
) {
  try {
    // =====================================================
    // ПЕРЕВІРКА НАЛАШТУВАНЬ
    // =====================================================

    if (
      !ADMIN_LOGIN ||
      !ADMIN_PASSWORD ||
      !ADMIN_SESSION_SECRET
    ) {
      console.error(
        "ADMIN AUTH: Не налаштовані змінні середовища."
      );

      return NextResponse.json(
        {
          message:
            "Авторизацію адміністратора не налаштовано.",
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // ОТРИМАННЯ ДАНИХ
    // =====================================================

    const body =
      await request.json();

    const login =
      typeof body.login === "string"
        ? body.login.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // =====================================================
    // ПЕРЕВІРКА ПОЛІВ
    // =====================================================

    if (!login || !password) {
      return NextResponse.json(
        {
          message:
            "Введіть логін і пароль.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // ПЕРЕВІРКА ЛОГІНУ ТА ПАРОЛЯ
    // =====================================================

    if (
      login !== ADMIN_LOGIN ||
      password !== ADMIN_PASSWORD
    ) {
      return NextResponse.json(
        {
          message:
            "Неправильний логін або пароль.",
        },
        {
          status: 401,
        }
      );
    }

    // =====================================================
    // СТВОРЕННЯ СЕСІЇ
    // =====================================================

    const response =
      NextResponse.json({
        success: true,
      });

    response.cookies.set(
      "admin_session",
      ADMIN_SESSION_SECRET,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge:
          60 * 60 * 8,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "ADMIN LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Не вдалося виконати вхід.",
      },
      {
        status: 500,
      }
    );
  }
}