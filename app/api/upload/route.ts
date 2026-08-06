import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log("UPLOAD: request received");

    const formData = await request.formData();
    console.log("UPLOAD: formData parsed");

    const file = formData.get("file");

    if (!(file instanceof File)) {
      console.log("UPLOAD: file is missing");

      return NextResponse.json(
        {
          success: false,
          message: "Файл не знайдено",
        },
        { status: 400 }
      );
    }

    console.log("UPLOAD: file =", file.name, file.size);

    console.log("UPLOAD: before put()");

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    console.log("UPLOAD: after put()", blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:");
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}