import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      testId,
      currentQuestion,
      savedAnswers,
      timeLeft,
      finished,
    } = body;

    let session = await prisma.testSession.findFirst({
      where: {
        testId,
        finished: false,
      },
    });

    if (!session) {
      session = await prisma.testSession.create({
        data: {
          testId,
          currentQuestion,
          savedAnswers,
          timeLeft,
          finished,
        },
      });
    } else {
      session = await prisma.testSession.update({
        where: {
          id: session.id,
        },
        data: {
          currentQuestion,
          savedAnswers,
          timeLeft,
          finished,
        },
      });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Помилка збереження сесії",
      },
      {
        status: 500,
      }
    );
  }
}