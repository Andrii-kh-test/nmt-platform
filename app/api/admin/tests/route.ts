import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const test = await prisma.test.create({
      data: {
        title: body.title,

        // Тип іспиту
        examType: body.examType ?? "НМТ",

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
            (question: any, index: number) => {
              let options: {
                order: number;
                text: string;
                isCorrect: boolean;
              }[] = [];

              /*
               * Звичайні питання:
               * single / multiple
               */
              if (question.type !== "matching") {
                options = (question.options ?? []).map(
                  (option: any, optionIndex: number) => ({
                    order: optionIndex + 1,
                    text: option.text ?? "",
                    isCorrect: option.isCorrect ?? false,
                  })
                );
              }

              /*
               * Завдання на встановлення відповідності.
               *
               * L|id|текст|correctRightId
               * R|id|текст
               */
              if (question.type === "matching") {
                const leftItems =
                  question.matchingLeftItems ?? [];

                const rightItems =
                  question.matchingRightItems ?? [];

                options = [
                  ...leftItems.map(
                    (
                      item: any,
                      itemIndex: number
                    ) => ({
                      order: itemIndex + 1,

                      text:
                        `L|${item.id}|${item.text ?? ""}|${item.correctRightId}`,

                      isCorrect: false,
                    })
                  ),

                  ...rightItems.map(
                    (
                      item: any,
                      itemIndex: number
                    ) => ({
                      order:
                        leftItems.length +
                        itemIndex +
                        1,

                      text:
                        `R|${item.id}|${item.text ?? ""}`,

                      isCorrect: false,
                    })
                  ),
                ];
              }

              return {
                order: index + 1,

                type: question.type,

                text: question.text ?? "",

                points: question.points ?? 1,

                // Чи дозволено перемішувати питання
                shuffleQuestion:
                  question.shuffleQuestion ?? true,

                options: {
                  create: options,
                },
              };
            }
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

    return NextResponse.json({
      success: true,
      test,
    });
  } catch (error) {
    console.error(
      "CREATE TEST ERROR:",
      error
    );

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