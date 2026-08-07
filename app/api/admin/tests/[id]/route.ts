import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/app/lib/prisma";



// =======================
// GET
// =======================

export async function GET(

  request: NextRequest,

  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }

) {


  const {
    id,
  } = await params;



  const test =
    await prisma.test.findUnique({

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

      {
        error:
          "Тест не знайдено",
      },

      {
        status: 404,
      }

    );

  }



  return NextResponse.json(
    test
  );

}



// =======================
// PUT UPDATE TEST
// =======================

export async function PUT(

  request: NextRequest,

  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }

) {


  const {
    id,
  } = await params;


  const testId =
    Number(id);



  if (
    !testId ||
    testId <= 0
  ) {

    return NextResponse.json(

      {
        error:
          "Некоректний id тесту",
      },

      {
        status: 400,
      }

    );

  }



  const existing =
    await prisma.test.findUnique({

      where: {
        id: testId,
      },

    });



  if (!existing) {

    return NextResponse.json(

      {
        error:
          "Тест не знайдено",
      },

      {
        status: 404,
      }

    );

  }



  const body =
    await request.json();



  await prisma.question.deleteMany({

    where: {

      testId,

    },

  });



  const updatedTest =
    await prisma.test.update({

      where: {

        id: testId,

      },


      data: {


        title:
          body.title,


        subject:
          body.subject,


        description:
          body.description,


        duration:
          body.duration,


        schoolYear:
          body.schoolYear,


        maxPoints:
          body.maxPoints,
isPublished:
  body.isPublished,

codeRequired:
  body.codeRequired,

accessCode:
  body.accessCode,


        questions: {

          create:
  (body.questions ?? []).map(
    (question: any, index: number) => ({

      order: index + 1,

      type: question.type,

      text: question.text,

      points: question.points,

      shuffleQuestion:
        question.shuffleQuestion ?? true,

      options: {
        create:
          (question.options ?? []).map(
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



  return NextResponse.json(
    updatedTest
  );

}



// =======================
// DELETE
// =======================

export async function DELETE(

  request: NextRequest,

  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }

) {


  const {
    id,
  } = await params;



  const testId =
    Number(id);



  if (
    !testId ||
    testId <= 0
  ) {

    return NextResponse.json(

      {
        error:
          "Некоректний id",
      },

      {
        status: 400,
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

  });

}