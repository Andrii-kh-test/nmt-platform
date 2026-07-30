import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export async function DELETE(
  req: NextRequest
) {
  try {

    const { testId } =
      await req.json();

    await prisma.testSession.deleteMany({
      where: {
        testId,
        finished: false,
      },
    });

    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error: "Помилка видалення сесії",
      },
      {
        status: 500,
      }
    );

  }
}