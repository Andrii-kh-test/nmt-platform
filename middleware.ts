import { NextRequest, NextResponse } from "next/server";

export function middleware(
  request: NextRequest
) {
  const { pathname } = request.nextUrl;

  // =====================================================
  // ДОЗВОЛЯЄМО СТОРІНКУ ВХОДУ
  // =====================================================

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // =====================================================
  // ПЕРЕВІРЯЄМО ADMIN SESSION COOKIE
  // =====================================================

  const adminSession =
    request.cookies.get("admin_session");

  // =====================================================
  // ЯКЩО НЕ АВТОРИЗОВАНИЙ
  // =====================================================

  if (
    pathname.startsWith("/admin") &&
    !adminSession
  ) {
    const loginUrl =
      new URL(
        "/admin/login",
        request.url
      );

    return NextResponse.redirect(
      loginUrl
    );
  }

  // =====================================================
  // АВТОРИЗОВАНИЙ
  // =====================================================

  return NextResponse.next();
}

// =====================================================
// ДЕ ПРАЦЮЄ MIDDLEWARE
// =====================================================

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};