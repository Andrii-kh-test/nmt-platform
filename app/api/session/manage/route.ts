import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";


// ========================================
// GET — отримати конкретну сесію
// ========================================

export async function GET(
  request: NextRequest
) {
  try {
    const sessionId = Number(
      request.nextUrl.searchParams.get(
        "sessionId"
      )
    );

    if (!sessionId || sessionId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    const session =
      await prisma.testSession.findUnique({
        where: {
          id: sessionId,
        },

        include: {
          participant: true,
          test: true,
        },
      });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Сесію не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error(
      "GET SESSION MANAGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося отримати сесію.",
      },
      {
        status: 500,
      }
    );
  }
}


// ========================================
// PUT — керування сесією
// ========================================

export async function PUT(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const sessionId = Number(
      body.sessionId
    );

    if (!sessionId || sessionId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний id сесії.",
        },
        {
          status: 400,
        }
      );
    }

    const existingSession =
      await prisma.testSession.findUnique({
        where: {
          id: sessionId,
        },
      });

    if (!existingSession) {
      return NextResponse.json(
        {
          success: false,
          message: "Сесію не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    const data: {
      blocked?: boolean;
      blockReason?: string | null;
      extraTime?: number;
      timeLeft?: number;
      finished?: boolean;
      finishedAt?: Date | null;
    } = {};

    // ------------------------------------
    // Блокування
    // ------------------------------------

    if (
      typeof body.blocked ===
      "boolean"
    ) {
      data.blocked = body.blocked;

      if (body.blocked) {
        data.blockReason =
          body.blockReason ??
          "Порушення правил";
      } else {
        data.blockReason = null;
      }
    }

    // ------------------------------------
    // Додатковий час
    // ------------------------------------

    if (
      typeof body.extraTime ===
      "number"
    ) {
      data.extraTime =
        Math.max(
          0,
          body.extraTime
        );
    }

    // ------------------------------------
    // Поточний час
    // ------------------------------------

    if (
      typeof body.timeLeft ===
      "number"
    ) {
      data.timeLeft =
        Math.max(
          0,
          body.timeLeft
        );
    }

    // ------------------------------------
    // Завершення
    // ------------------------------------

    if (
      typeof body.finished ===
      "boolean"
    ) {
      data.finished =
        body.finished;

      if (body.finished) {
        data.finishedAt =
          new Date();
      } else {
        data.finishedAt = null;
      }
    }

    const session =
      await prisma.testSession.update({
        where: {
          id: sessionId,
        },

        data,

        include: {
          participant: true,
          test: true,
        },
      });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error(
      "PUT SESSION MANAGE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося змінити сесію.",
      },
      {
        status: 500,
      }
    );
  }
}