import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        questions: {
          orderBy: {
            order: "asc",
          },
          include: {
            options: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося отримати список тестів.",
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

    const test = await prisma.test.create({
      data: {
        title: body.title,
        subject: body.subject,
        description: body.description,
        schoolYear: body.schoolYear,
        duration: body.duration,
        maxPoints: body.maxPoints,

        questions: {
          create: body.questions.map(
            (question: any, questionIndex: number) => ({
              order: question.order ?? questionIndex + 1,
              type: question.type,
              text: question.text,
              points: question.points,

              options: {
                create: question.options.map(
                  (option: any, optionIndex: number) => ({
                    order: option.order ?? optionIndex + 1,
                    text: option.text,
                    isCorrect: option.isCorrect,
                  })
                ),
              },
            })
          ),
        },
      },

      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      test,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося створити тест.",
      },
      {
        status: 500,
      }
    );
  }
}