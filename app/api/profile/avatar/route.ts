import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/app/lib/auth/session";
import { prisma } from "@/app/lib/prisma";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function detectImageType(buffer: Buffer) {
  // JPEG
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // PNG
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export async function POST(request: Request) {
  try {
    // =====================================================
    // AUTH
    // =====================================================

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Користувач не авторизований.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // FORM DATA
    // =====================================================

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Файл не знайдено.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // FILE SIZE
    // =====================================================

    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Файл порожній.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Розмір файлу не може перевищувати 5 МБ.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // MIME TYPE
    // =====================================================

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Дозволено завантажувати лише зображення у форматі JPEG, PNG або WebP.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // READ FILE
    // =====================================================

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // =====================================================
    // REAL IMAGE TYPE CHECK
    // =====================================================

    const detectedType = detectImageType(buffer);

    if (!detectedType) {
      return NextResponse.json(
        {
          success: false,
          message: "Файл не є коректним зображенням.",
        },
        { status: 400 }
      );
    }

    if (detectedType !== file.type) {
      return NextResponse.json(
        {
          success: false,
          message: "Тип файлу не відповідає його фактичному формату.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // UPLOAD TO VERCEL BLOB
    // =====================================================

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // =====================================================
    // SAVE AVATAR URL
    // =====================================================

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        avatarUrl: blob.url,
      },
    });

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json({
      success: true,
      url: blob.url,
    });
  } catch (error) {
    console.error("AVATAR ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Не вдалося завантажити фотографію.",
      },
      { status: 500 }
    );
  }
}