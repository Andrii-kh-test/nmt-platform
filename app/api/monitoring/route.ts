import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

// =====================================================
// API МОНІТОРИНГУ
//
// Повертає тільки незавершені сесії.
//
// finished = true
// → сесія не повертається.
//
// Це стосується:
// - звичайно завершених тестів;
// - анульованих результатів;
// - автоматично завершених сесій.
// =====================================================

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const sessions =
      await prisma.testSession.findMany({
        where: {
          finished: false,
        },

        orderBy: {
          updatedAt: "desc",
        },

        include: {
          participant: true,

          test: {
            select: {
              id: true,
              title: true,
              subject: true,
              duration: true,
            },
          },
        },
      });

    return NextResponse.json(
      sessions,
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "MONITORING API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Не вдалося отримати активні сесії.",
      },
      {
        status: 500,
      }
    );
  }
}