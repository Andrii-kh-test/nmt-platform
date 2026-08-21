import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const results =
      await prisma.testResult.findMany({
        orderBy: {
          createdAt: "desc",
        },

        include: {
          test: {
            include: {
              questions: {
                orderBy: {
                  order: "asc",
                },

                include: {
                  question: {
                    include: {
                      answerOptions: {
                        orderBy: {
                          order: "asc",
                        },
                      },
                    },
                  },
                },
              },
            },
          },

          session: {
            include: {
              participant: true,
            },
          },
        },
      });

    return NextResponse.json(results);
  } catch (error) {
    console.error(
      "GET RESULTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Не вдалося отримати результати.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const result =
      await prisma.testResult.create({
        data: {
          testId: body.testId,

          earnedPoints:
            body.earnedPoints,

          maxPoints:
            body.maxPoints,

          percent:
            body.percent,

          correct:
            body.correct,

          incorrect:
            body.incorrect,

          skipped:
            body.skipped,

          timeSpent:
            body.timeSpent,

          answers:
            body.answers,

          finishReason:
            body.finishReason ??
            "manual",

          lastName:
            body.lastName ?? null,

          firstName:
            body.firstName ?? null,

          middleName:
            body.middleName ?? null,

          accessCode:
            body.accessCode ?? null,

          startedAt:
            body.startedAt
              ? new Date(body.startedAt)
              : new Date(),

          finishedAt:
            body.finishedAt
              ? new Date(body.finishedAt)
              : new Date(),
        },
      });

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "POST RESULTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Помилка збереження результату.",
      },
      {
        status: 500,
      }
    );
  }
}