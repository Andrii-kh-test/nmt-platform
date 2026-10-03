import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

const SESSION_COOKIE_NAME = "auth_session";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    await prisma.authSession.deleteMany({
      where: {
        tokenHash,
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);

  return NextResponse.json({
    success: true,
  });
}