import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

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

    return NextResponse.json(sessions);
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