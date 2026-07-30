import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const test = await prisma.test.create({
      data: {
        title: body.title,
        subject: body.subject,
        description: body.description ?? "",
        schoolYear: body.schoolYear,
        duration: body.duration,
        maxPoints: body.maxPoints,

        questions: {
          create: body.questions.map(
            (question: any, index: number) => ({
              order: index + 1,
              type: question.type,
              text: question.text,
              points: question.points,

              options: {
                create: question.options.map(
                  (option: any, optionIndex: number) => ({
                    order: optionIndex + 1,
                    text: option.text,
                    isCorrect:
                      question.correctAnswers.includes(
                        option.id
                      ) ||
                      question.correctAnswers.includes(
                        optionIndex + 1
                      ),
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
            options: {
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json(test);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Помилка створення тесту",
      },
      {
        status: 500,
      }
    );
  }
}