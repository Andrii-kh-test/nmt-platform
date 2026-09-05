import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

/**
 * GET /api/complex-tests
 *
 * Учнівський список комбінованих тестів.
 *
 * За замовчуванням:
 * тільки опубліковані та неархівовані.
 *
 * ?examType=НМТ
 * ?examType=ЄВІ
 * ?examType=ЄФВВ
 *
 * Якщо examType не передано —
 * повертаються комбіновані тести всіх типів.
 */
export async function GET(
  request: NextRequest
) {
  try {
    const examType =
      request.nextUrl.searchParams.get("examType");

    const complexTests =
      await prisma.complexTest.findMany({
        where: {
          isPublished: true,
          isArchived: false,

          ...(examType
            ? {
                examType,
              }
            : {}),
        },

        orderBy: [
          {
            section: "asc",
          },
          {
            createdAt: "desc",
          },
        ],

        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          examType: true,
          section: true,
          codeRequired: true,

          tests: {
            orderBy: {
              order: "asc",
            },

            select: {
              id: true,
              order: true,

              test: {
                select: {
                  id: true,
                  title: true,
                  subject: true,
                  duration: true,

                  _count: {
                    select: {
                      questions: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      complexTests,
    });
  } catch (error) {
    console.error(
      "GET /api/complex-tests error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося отримати список комбінованих тестів.",
      },
      {
        status: 500,
      }
    );
  }
}