import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      select: {
        id: true,
        title: true,
        isPublished: true,
        codeRequired: true,
        accessCode: true,
      },
    });

    return NextResponse.json({
      success: true,
      tests,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}