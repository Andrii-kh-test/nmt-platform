import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Файл не вибрано",
        },
        {
          status: 400,
        }
      );
    }

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
    });
  } catch (error) {
    console.error("========== UPLOAD ERROR ==========");
    console.error(error);
    console.error("==================================");

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Невідома помилка",
        stack:
          error instanceof Error
            ? error.stack
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}