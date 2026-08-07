import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

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

        // Публікація
        isPublished: body.isPublished ?? false,

        // Код доступу
        codeRequired: body.codeRequired ?? true,
        accessCode: body.accessCode || null,

        questions: {
          create: (body.questions ?? []).map(
            (question: any, index: number) => ({
              order: index + 1,

              type: question.type,

              text: question.text,

              points: question.points,

              // Чи дозволено перемішувати це питання
              shuffleQuestion:
                question.shuffleQuestion ?? true,

              options: {
                create: (question.options ?? []).map(
                  (option: any, optionIndex: number) => ({
                    order: optionIndex + 1,

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
        message: "Не вдалося створити тест",
      },
      {
        status: 500,
      }
    );
  }
}