import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

/**
 * Одноразове прив'язування всіх існуючих тестів
 * до розділу "Українська мова".
 *
 * Після успішного виконання цей маршрут потрібно видалити.
 */
export async function GET() {
  try {
    // 1. Знаходимо або створюємо розділ
    const subject = await prisma.subject.upsert({
      where: {
        name: "Українська мова",
      },

      update: {
        isActive: true,
      },

      create: {
        name: "Українська мова",
        isActive: true,
      },
    });

    // 2. Прив'язуємо всі існуючі тести
    // до цього розділу.
    //
    // Одночасно оновлюємо старе текстове поле subject,
    // щоб поточний "Банк тестів" також показував
    // правильну назву розділу.
    const result = await prisma.test.updateMany({
      data: {
        subjectId: subject.id,
        subject: subject.name,
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "Існуючі тести успішно прив'язано до розділу «Українська мова».",

      subject: {
        id: subject.id,
        name: subject.name,
      },

      updatedTests: result.count,
    });
  } catch (error) {
    console.error(
      "MIGRATE EXISTING TESTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Не вдалося прив'язати існуючі тести.",
      },
      {
        status: 500,
      }
    );
  }
}