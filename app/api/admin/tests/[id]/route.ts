import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   СПІЛЬНИЙ INCLUDE ДЛЯ ТЕСТУ
========================================================= */

const testInclude = {
  subjectRef: true,

  questions: {
    orderBy: {
      order: "asc" as const,
    },

    include: {
      question: {
        include: {
          answerOptions: {
            orderBy: {
              order: "asc" as const,
            },
          },
        },
      },
    },
  },
};

/* =========================================================
   GET /api/admin/tests/:id
========================================================= */

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const testId = Number(id);

    if (!Number.isInteger(testId) || testId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    const test = await prisma.test.findUnique({
      where: {
        id: testId,
      },

      include: {
        subjectRef: true,

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

        sessions: {
          orderBy: {
            createdAt: "desc",
          },

          include: {
            participant: true,
            result: true,
          },
        },

        results: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        {
          success: false,
          message: "Тест не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      test,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/tests/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Не вдалося отримати тест.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH /api/admin/tests/:id
========================================================= */

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const testId = Number(id);

    if (!Number.isInteger(testId) || testId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    const existingTest =
      await prisma.test.findUnique({
        where: {
          id: testId,
        },

        include: {
          questions: {
            include: {
              question: {
                include: {
                  answerOptions: true,
                },
              },
            },
          },
        },
      });

    if (!existingTest) {
      return NextResponse.json(
        {
          success: false,
          message: "Тест не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    const body = await request.json();

    /* =====================================================
       ПЕРЕВІРКА ОСНОВНИХ ПОЛІВ
    ===================================================== */

    const data: {
      title?: string;
      subject?: string;
      subjectId?: number | null;
      description?: string | null;
      schoolYear?: string;
      duration?: number;
      maxPoints?: number;
      displayOrder?: number;
      isPublished?: boolean;
      codeRequired?: boolean;
      accessCode?: string | null;
      isArchived?: boolean;
    } = {};

    /* =====================================================
       НАЗВА
    ===================================================== */

    if (typeof body.title === "string") {
      const title = body.title.trim();

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Назва тесту не може бути порожньою.",
          },
          {
            status: 400,
          }
        );
      }

      data.title = title;
    }

    /* =====================================================
       SUBJECT
    ===================================================== */

    if (typeof body.subject === "string") {
      const subject = body.subject.trim();

      if (!subject) {
        return NextResponse.json(
          {
            success: false,
            message: "Вкажіть предмет.",
          },
          {
            status: 400,
          }
        );
      }

      data.subject = subject;
    }

    /* =====================================================
       SUBJECT ID
    ===================================================== */

    if (body.subjectId !== undefined) {
      if (
        body.subjectId === null ||
        body.subjectId === ""
      ) {
        data.subjectId = null;
      } else {
        const subjectId = Number(
          body.subjectId
        );

        if (
          !Number.isInteger(subjectId) ||
          subjectId <= 0
        ) {
          return NextResponse.json(
            {
              success: false,
              message: "Некоректний предмет.",
            },
            {
              status: 400,
            }
          );
        }

        const existingSubject =
          await prisma.subject.findUnique({
            where: {
              id: subjectId,
            },
          });

        if (!existingSubject) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Вказаний предмет не знайдено.",
            },
            {
              status: 400,
            }
          );
        }

        data.subjectId = subjectId;
      }
    }

    /* =====================================================
       ОПИС
    ===================================================== */

    if (body.description !== undefined) {
      data.description =
        body.description === null
          ? null
          : String(body.description);
    }

    /* =====================================================
       НАВЧАЛЬНИЙ РІК
    ===================================================== */

    if (body.schoolYear !== undefined) {
      data.schoolYear = String(
        body.schoolYear
      ).trim();
    }

    /* =====================================================
       ТРИВАЛІСТЬ
    ===================================================== */

    if (body.duration !== undefined) {
      const duration = Number(
        body.duration
      );

      if (
        !Number.isInteger(duration) ||
        duration <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Тривалість тесту повинна бути додатним цілим числом.",
          },
          {
            status: 400,
          }
        );
      }

      data.duration = duration;
    }

    /* =====================================================
       МАКСИМАЛЬНІ БАЛИ
    ===================================================== */

    if (body.maxPoints !== undefined) {
      const maxPoints = Number(
        body.maxPoints
      );

      if (
        !Number.isInteger(maxPoints) ||
        maxPoints < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Максимальна кількість балів повинна бути невід’ємним цілим числом.",
          },
          {
            status: 400,
          }
        );
      }

      data.maxPoints = maxPoints;
    }

    /* =====================================================
       DISPLAY ORDER
    ===================================================== */

    if (body.displayOrder !== undefined) {
      const displayOrder = Number(
        body.displayOrder
      );

      if (
        !Number.isInteger(displayOrder) ||
        displayOrder < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Порядок на головній сторінці повинен бути додатним цілим числом.",
          },
          {
            status: 400,
          }
        );
      }

      const anotherTest =
        await prisma.test.findFirst({
          where: {
            displayOrder,
            NOT: {
              id: testId,
            },
          },

          select: {
            id: true,
            title: true,
          },
        });

      if (anotherTest) {
        return NextResponse.json(
          {
            success: false,
            message:
              `Номер ${displayOrder} вже використовується тестом «${anotherTest.title}».`,
          },
          {
            status: 400,
          }
        );
      }

      data.displayOrder = displayOrder;
    }

    /* =====================================================
       ПУБЛІКАЦІЯ
    ===================================================== */

    if (
      typeof body.isPublished === "boolean"
    ) {
      data.isPublished =
        body.isPublished;
    }

    /* =====================================================
       КОД
    ===================================================== */

    if (
      typeof body.codeRequired === "boolean"
    ) {
      data.codeRequired =
        body.codeRequired;
    }

    /* =====================================================
       ACCESS CODE
    ===================================================== */

    if (body.accessCode !== undefined) {
      data.accessCode =
        body.accessCode === null ||
        body.accessCode === ""
          ? null
          : String(
              body.accessCode
            ).trim();
    }

    /* =====================================================
       АРХІВУВАННЯ
    ===================================================== */

    if (
      typeof body.isArchived === "boolean"
    ) {
      data.isArchived =
        body.isArchived;

      if (body.isArchived === true) {
        data.isPublished = false;
      }
    }

    /* =====================================================
       ПИТАННЯ
       
       Тут відбувається головне виправлення.

       PATCH тепер:
       1. оновлює існуючі питання;
       2. створює нові питання;
       3. оновлює варіанти відповідей;
       4. видаляє питання, які прибрали з редактора;
       5. зберігає порядок.
    ===================================================== */

    const incomingQuestions =
      Array.isArray(body.questions)
        ? body.questions
        : null;

    const updatedTest =
      await prisma.$transaction(
        async (tx) => {
          /* ===============================================
             ОНОВЛЕННЯ САМОГО ТЕСТУ
          =============================================== */

          await tx.test.update({
            where: {
              id: testId,
            },

            data,
          });

          /* ===============================================
             ЯКЩО QUESTIONS НЕ ПЕРЕДАНІ —
             ЗАЛИШАЄМО ЇХ БЕЗ ЗМІН
          =============================================== */

          if (incomingQuestions === null) {
            return tx.test.findUniqueOrThrow({
              where: {
                id: testId,
              },

              include: testInclude,
            });
          }

          /* ===============================================
             ІСНУЮЧІ QUESTION ID
          =============================================== */

          const existingQuestionIds =
            existingTest.questions.map(
              (item) => item.questionId
            );

          const incomingQuestionIds =
            incomingQuestions
              .map((question: unknown) => {
                if (
                  !question ||
                  typeof question !==
                    "object"
                ) {
                  return null;
                }

                const q =
                  question as {
                    id?: unknown;
                  };

                const id = Number(q.id);

                return Number.isInteger(id) &&
                  id > 0
                  ? id
                  : null;
              })
              .filter((id: number): id is number => id !== null);

          /* ===============================================
             СТВОРЕННЯ / ОНОВЛЕННЯ ПИТАНЬ
          =============================================== */

          for (
            let index = 0;
            index < incomingQuestions.length;
            index++
          ) {
            const rawQuestion =
              incomingQuestions[index];

            if (
              !rawQuestion ||
              typeof rawQuestion !==
                "object"
            ) {
              continue;
            }

            const question =
              rawQuestion as {
                id?: unknown;
                order?: unknown;
                type?: unknown;
                text?: unknown;
                points?: unknown;
                shuffleQuestion?: unknown;
                options?: unknown;
              };

            const questionId =
              Number(question.id);

            const order =
              Number(question.order);

            const type =
              typeof question.type ===
              "string"
                ? question.type
                : "single";

            const text =
              typeof question.text ===
              "string"
                ? question.text
                : "";

            const points =
              Number(question.points);

            const shuffleQuestion =
              typeof question.shuffleQuestion ===
              "boolean"
                ? question.shuffleQuestion
                : true;

            const normalizedOrder =
              Number.isInteger(order) &&
              order > 0
                ? order
                : index + 1;

            const normalizedPoints =
              Number.isInteger(points) &&
              points > 0
                ? points
                : 1;

            /* =============================================
               ВАРІАНТИ ВІДПОВІДЕЙ
            ============================================= */

            const options =
              Array.isArray(
                question.options
              )
                ? question.options
                : [];

            const normalizedOptions =
              options.map(
                (
                  rawOption: unknown,
                  optionIndex: number
                ) => {
                  if (
                    !rawOption ||
                    typeof rawOption !==
                      "object"
                  ) {
                    return {
                      id: null,
                      order:
                        optionIndex + 1,
                      text: "",
                      isCorrect: false,
                    };
                  }

                  const option =
                    rawOption as {
                      id?: unknown;
                      order?: unknown;
                      text?: unknown;
                      isCorrect?: unknown;
                    };

                  const optionId =
                    Number(option.id);

                  const optionOrder =
                    Number(option.order);

                  return {
                    id:
                      Number.isInteger(
                        optionId
                      ) &&
                      optionId > 0
                        ? optionId
                        : null,

                    order:
                      Number.isInteger(
                        optionOrder
                      ) &&
                      optionOrder > 0
                        ? optionOrder
                        : optionIndex + 1,

                    text:
                      typeof option.text ===
                      "string"
                        ? option.text
                        : "",

                    isCorrect:
                      Boolean(
                        option.isCorrect
                      ),
                  };
                }
              );

            /* =============================================
               ІСНУЮЧЕ ПИТАННЯ
            ============================================= */

            const isExistingQuestion =
              Number.isInteger(
                questionId
              ) &&
              questionId > 0 &&
              existingQuestionIds.includes(
                questionId
              );

            if (isExistingQuestion) {
              await tx.question.update({
                where: {
                  id: questionId,
                },

                data: {
                  type,
                  text,
                  points:
                    normalizedPoints,
                  shuffleQuestion,
                },
              });

              /* =========================================
                 ВАРІАНТИ ВІДПОВІДЕЙ

                 Для надійності видаляємо старі
                 та створюємо актуальний набір.
              ========================================= */

              await tx.answerOption.deleteMany({
                where: {
                  questionId,
                },
              });

              if (
                normalizedOptions.length >
                0
              ) {
                await tx.answerOption.createMany(
                  {
                    data:
                      normalizedOptions.map(
                        (
                          option,
                          optionIndex
                        ) => ({
                          order:
                            option.order ||
                            optionIndex +
                              1,

                          text:
                            option.text,

                          isCorrect:
                            option.isCorrect,

                          questionId,
                        })
                      ),
                  }
                );
              }

              /* =========================================
                 ОНОВЛЕННЯ ПОРЯДКУ В TESTQUESTION
              ========================================= */

              await tx.testQuestion.update({
                where: {
                  testId_questionId: {
                    testId,
                    questionId,
                  },
                },

                data: {
                  order:
                    normalizedOrder,
                },
              });
            } else {
              /* =========================================
                 НОВЕ ПИТАННЯ

                 ID із браузера НЕ використовуємо.
                 Prisma сама створює коректний ID.
              ========================================= */

              const createdQuestion =
                await tx.question.create({
                  data: {
                    type,
                    text,
                    points:
                      normalizedPoints,
                    shuffleQuestion,
                  },
                });

              /* =========================================
                 ВАРІАНТИ НОВОГО ПИТАННЯ
              ========================================= */

              if (
                normalizedOptions.length >
                0
              ) {
                await tx.answerOption.createMany(
                  {
                    data:
                      normalizedOptions.map(
                        (
                          option,
                          optionIndex
                        ) => ({
                          order:
                            option.order ||
                            optionIndex +
                              1,

                          text:
                            option.text,

                          isCorrect:
                            option.isCorrect,

                          questionId:
                            createdQuestion.id,
                        })
                      ),
                  }
                );
              }

              /* =========================================
                 ПРИВ'ЯЗКА ПИТАННЯ ДО ТЕСТУ
              ========================================= */

              await tx.testQuestion.create({
                data: {
                  testId,
                  questionId:
                    createdQuestion.id,
                  order:
                    normalizedOrder,
                },
              });
            }
          }

          /* ===============================================
             ВИДАЛЕННЯ ПИТАНЬ, ЯКІ ПРИБРАЛИ В РЕДАКТОРІ

             Важливо:
             Question може теоретично бути використане
             в іншому тесті, тому спочатку видаляємо
             тільки зв'язок TestQuestion.

             Сам Question видаляємо лише тоді,
             коли він більше ніде не використовується.
          =============================================== */

          for (
            const existingQuestionId of
              existingQuestionIds
          ) {
            if (
              incomingQuestionIds.includes(
                existingQuestionId
              )
            ) {
              continue;
            }

            await tx.testQuestion.deleteMany({
              where: {
                testId,
                questionId:
                  existingQuestionId,
              },
            });

            const remainingLinks =
              await tx.testQuestion.count({
                where: {
                  questionId:
                    existingQuestionId,
                },
              });

            if (remainingLinks === 0) {
              await tx.question.delete({
                where: {
                  id:
                    existingQuestionId,
                },
              });
            }
          }

          /* ===============================================
             ПОВЕРТАЄМО ОНОВЛЕНИЙ ТЕСТ
          =============================================== */

          return tx.test.findUniqueOrThrow({
            where: {
              id: testId,
            },

            include: testInclude,
          });
        }
      );

    return NextResponse.json({
      success: true,
      test: updatedTest,
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/tests/[id] error:",
      error
    );

    if (
      error &&
      typeof error === "object" &&
      "code" in error
    ) {
      console.error(
        "PRISMA ERROR CODE:",
        (error as { code?: unknown })
          .code
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Не вдалося оновити тест.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE /api/admin/tests/:id
========================================================= */

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const testId = Number(id);

    if (!Number.isInteger(testId) || testId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний id тесту.",
        },
        {
          status: 400,
        }
      );
    }

    const existingTest =
      await prisma.test.findUnique({
        where: {
          id: testId,
        },

        select: {
          id: true,
          title: true,
        },
      });

    if (!existingTest) {
      return NextResponse.json(
        {
          success: false,
          message: "Тест не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.test.delete({
      where: {
        id: testId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Тест успішно видалено.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/tests/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося видалити тест.",
      },
      {
        status: 500,
      }
    );
  }
}