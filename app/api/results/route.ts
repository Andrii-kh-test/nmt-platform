import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const results = await prisma.testResult.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Не вдалося отримати результати.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await prisma.testResult.create({
      data: {
        testId: body.testId,

        earnedPoints: body.earnedPoints,
        maxPoints: body.maxPoints,
        percent: body.percent,

        correct: body.correct,
        incorrect: body.incorrect,
        skipped: body.skipped,

        timeSpent: body.timeSpent,

        answers: body.answers,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Помилка збереження результату.",
      },
      {
        status: 500,
      }
    );
  }
}