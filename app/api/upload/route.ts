import { NextRequest, NextResponse } from "next/server";

import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  const data = await request.formData();

  const file = data.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "Файл не знайдено" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName =
    `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(uploadDir, fileName),
    buffer
  );

  return NextResponse.json({
    url: `/uploads/${fileName}`,
  });
}