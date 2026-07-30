import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

type Props = {
  params: Promise<{
    testId: string;
  }>;
};

export async function GET(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { testId } = await params;

    const session =
      await prisma.testSession.findFirst({
        where: {
          testId: Number(testId),
          finished: false,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

    return NextResponse.json(session);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Помилка отримання сесії",
      },
      {
        status: 500,
      }
    );
  }
}