import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// =======================
// GET
// =======================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const test = await prisma.test.findUnique({
    where: {
      id: Number(id),
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

  if (!test) {
    return NextResponse.json(
      { error: "Тест не знайдено" },
      { status: 404 }
    );
  }

  return NextResponse.json(test);
}

// =======================
// PUT
// =======================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await request.json();

  await prisma.question.deleteMany({
    where: {
      testId: Number(id),
    },
  });

  const updatedTest = await prisma.test.update({
    where: {
      id: Number(id),
    },

    data: {
      title: body.title,
      subject: body.subject,
      description: body.description,
      duration: body.duration,
      schoolYear: body.schoolYear,
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
                      optionIndex
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
          options: true,
        },
      },
    },
  });

  return NextResponse.json(updatedTest);
}

// =======================
// DELETE
// =======================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.test.delete({
    where: {
      id: Number(id),
    },
  });

  return NextResponse.json({
    success: true,
  });
}