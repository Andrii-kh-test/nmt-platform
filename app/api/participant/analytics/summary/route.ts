import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Не авторизовано" },
        { status: 401 }
      );
    }

    const results = await prisma.testResult.findMany({
      where: {
        session: {
          participant: {
            userId: user.id,
          },
        },
      },
      select: {
        id: true,
        earnedPoints: true,
        maxPoints: true,
        percent: true,
        timeSpent: true,
        createdAt: true,
        finishedAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (results.length === 0) {
      return NextResponse.json({
        totalTests: 0,
        minPercent: null,
        maxPercent: null,
        averagePercent: null,
        averagePoints: null,
        averageTime: null,
        dynamics: {
          value: null,
          direction: "neutral",
        },
      });
    }

    /*
     * Відсоток використовуємо як основний показник,
     * оскільки різні тести можуть мати різну максимальну
     * кількість балів.
     */

    const percents = results.map((result) => result.percent);

    const minPercent = Math.min(...percents);
    const maxPercent = Math.max(...percents);

    const averagePercent =
      percents.reduce((sum, value) => sum + value, 0) /
      percents.length;

    const averagePoints =
      results.reduce(
        (sum, result) => sum + result.earnedPoints,
        0
      ) / results.length;

    const averageTime =
      results.reduce(
        (sum, result) => sum + result.timeSpent,
        0
      ) / results.length;

    /*
     * Динаміка:
     * порівнюємо останній результат із попереднім.
     *
     * Наприклад:
     * 72% → 75% = +3 в.п.
     * 75% → 71% = -4 в.п.
     */

    let dynamics = {
      value: null as number | null,
      direction: "neutral" as
        | "up"
        | "down"
        | "neutral",
    };

    if (results.length >= 2) {
      const previous = results[results.length - 2];
      const current = results[results.length - 1];

      const difference =
        current.percent - previous.percent;

      dynamics = {
        value: difference,
        direction:
          difference > 0
            ? "up"
            : difference < 0
              ? "down"
              : "neutral",
      };
    }

    return NextResponse.json({
      totalTests: results.length,
      minPercent,
      maxPercent,
      averagePercent: Number(averagePercent.toFixed(1)),
      averagePoints: Number(averagePoints.toFixed(1)),
      averageTime: Math.round(averageTime),
      dynamics,
    });
  } catch (error) {
    console.error(
      "GET /api/participant/analytics/summary error:",
      error
    );

    return NextResponse.json(
      { error: "Не вдалося завантажити аналітику" },
      { status: 500 }
    );
  }
}