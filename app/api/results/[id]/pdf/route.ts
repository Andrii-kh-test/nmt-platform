import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { prisma } from "@/app/lib/prisma";
import ResultPdfDocument from "@/app/lib/pdf/ResultPdfDocument";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type ExportMode =
  | "summary"
  | "answers"
  | "full";

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;

    const resultId = Number(id);

    if (
      !Number.isInteger(resultId) ||
      resultId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Некоректний id результату.",
        },
        {
          status: 400,
        }
      );
    }

    const modeParam =
      request.nextUrl.searchParams.get("mode");

    const mode: ExportMode =
      modeParam === "answers" ||
      modeParam === "full"
        ? modeParam
        : "summary";

    const result =
      await prisma.testResult.findUnique({
        where: {
          id: resultId,
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
        },
      });

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Результат не знайдено.",
        },
        {
          status: 404,
        }
      );
    }

    const pdfElement = React.createElement(
      ResultPdfDocument,
      {
        result,
        mode,
      }
    ) as React.ReactElement<
      import("@react-pdf/renderer").DocumentProps
    >;

    const pdfBuffer =
      await renderToBuffer(pdfElement);

    const participantName = [
      result.lastName,
      result.firstName,
      result.middleName,
    ]
      .filter(Boolean)
      .join("_")
      .replace(
        /[^a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9_-]+/g,
        "_"
      );

    const filename =
      `result-${result.id}-${participantName || "participant"}.pdf`;

    return new NextResponse(
      new Uint8Array(pdfBuffer),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="${encodeURIComponent(
              filename
            )}"`,

          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error(
      "EXPORT RESULT PDF ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося сформувати PDF-файл.",
      },
      {
        status: 500,
      }
    );
  }
}