import Link from "next/link";

import AnalyticsClient from "./AnalyticsClient";

type Test = {
  id: number;
  title: string;
  subject: string | null;
  examType: string | null;
};

type Props = {
  searchParams: Promise<{
    testId?: string | string[];
  }>;
};

async function getTests(): Promise<Test[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "http://localhost:3000";

    const response = await fetch(
      `${baseUrl}/api/tests`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map((item: unknown) => {
        if (
          !item ||
          typeof item !== "object"
        ) {
          return null;
        }

        const value =
          item as Record<
            string,
            unknown
          >;

        const id = Number(
          value.id
        );

        if (
          !Number.isInteger(id) ||
          id <= 0
        ) {
          return null;
        }

        return {
          id,
          title:
            typeof value.title ===
            "string"
              ? value.title
              : `Тест №${id}`,
          subject:
            typeof value.subject ===
            "string"
              ? value.subject
              : null,
          examType:
            typeof value.examType ===
            "string"
              ? value.examType
              : null,
        };
      })
      .filter(
        (
          item
        ): item is Test =>
          item !== null
      );
  } catch {
    return [];
  }
}

function getTestId(
  value:
    | string
    | string[]
    | undefined
) {
  if (!value) {
    return null;
  }

  const raw = Array.isArray(
    value
  )
    ? value[0]
    : value;

  if (!raw) {
    return null;
  }

  const id = Number(raw);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
}

export default async function AnalyticsPage({
  searchParams,
}: Props) {
  const params =
    await searchParams;

  const testId =
    getTestId(params.testId);

  // =====================================================
  // ЯКЩО TEST ID ВЖЕ Є — ПОКАЗУЄМО АНАЛІТИКУ
  // =====================================================

  if (testId !== null) {
    return (
      <AnalyticsClient
        testId={String(testId)}
      />
    );
  }

  // =====================================================
  // ЯКЩО TEST ID НЕМАЄ — ПОКАЗУЄМО ВИБІР ТЕСТУ
  // =====================================================

  const tests =
    await getTests();

  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-4xl font-bold text-[#7A1F2B]">
            Аналітика
          </h2>

          <p className="mt-2 text-lg text-gray-600">
            Оберіть тест, для якого потрібно переглянути статистику виконання.
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-lg bg-[#7A1F2B] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#641923]"
        >
          ← Повернутися до адміністративної панелі
        </Link>
      </div>

      {/* TEST LIST */}

      <section>
        <div className="mb-5">
          <h3 className="text-2xl font-bold text-gray-800">
            Вибір тесту
          </h3>

          <p className="mt-1 text-gray-500">
            Натисніть на потрібний тест, щоб відкрити його аналітику.
          </p>
        </div>

        {tests.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-700">
              Тестів поки немає
            </p>

            <p className="mt-2 text-gray-500">
              Створіть тест у розділі «Тести», щоб переглянути його аналітику.
            </p>

            <Link
              href="/admin/tests"
              className="mt-5 inline-flex rounded-lg bg-[#7A1F2B] px-5 py-3 font-semibold text-white transition hover:bg-[#641923]"
            >
              Перейти до тестів
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tests.map(
              (test) => (
                <Link
                  key={test.id}
                  href={`/admin/analytics?testId=${test.id}`}
                  className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#7A1F2B] hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F3E8EA] text-2xl">
                      📊
                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      ID: {test.id}
                    </span>
                  </div>

                  <h4 className="mt-5 text-xl font-bold text-[#7A1F2B] transition group-hover:text-[#641923]">
                    {test.title}
                  </h4>

                  {test.subject && (
                    <p className="mt-2 text-gray-600">
                      Предмет:{" "}
                      {test.subject}
                    </p>
                  )}

                  {test.examType && (
                    <p className="mt-1 text-sm text-gray-500">
                      Тип:{" "}
                      {test.examType}
                    </p>
                  )}

                  <div className="mt-5 flex items-center font-semibold text-[#7A1F2B]">
                    Переглянути аналітику
                    <span className="ml-2 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </Link>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}