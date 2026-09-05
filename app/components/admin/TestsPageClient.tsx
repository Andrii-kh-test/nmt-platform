"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import SubjectBlock from "@/app/components/admin/SubjectBlock";
import SearchBar from "@/app/components/admin/SearchBar";

type Test = {
  id: number;
  title: string;
  subject: string;
  duration: number;
  isPublished: boolean;
  questions: any[];
};

type Props = {
  tests: Test[];
};

export default function TestsPageClient({
  tests,
}: Props) {
  const [search, setSearch] = useState("");

  const groupedTests = useMemo(() => {
    const filtered = tests.filter((test) =>
      test.title
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    return filtered.reduce(
      (acc, test) => {
        if (!acc[test.subject]) {
          acc[test.subject] = [];
        }

        acc[test.subject].push(test);

        return acc;
      },
      {} as Record<string, Test[]>
    );
  }, [tests, search]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto py-10 px-8">

        {/* Заголовок + кнопки створення */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">

          <h1 className="text-5xl font-bold text-[#7A1F2B]">
            Банк тестів
          </h1>

          <div className="flex flex-wrap items-center gap-3">

            {/* ==========================
                СТВОРИТИ РОЗДІЛ
            ========================== */}

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/admin/tests/subjects/new";
              }}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                border
                border-[#7A1F2B]
                text-[#7A1F2B]
                hover:bg-[#7A1F2B]
                hover:text-white
                px-6
                py-3
                rounded-lg
                font-semibold
                shadow
                transition
                whitespace-nowrap
              "
            >
              <Plus className="w-5 h-5" />
              Створити розділ
            </button>

            {/* ==========================
                СТВОРИТИ ТЕСТ
            ========================== */}

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/admin/tests/new";
              }}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                bg-[#7A1F2B]
                hover:bg-[#651923]
                text-white
                px-6
                py-3
                rounded-lg
                font-semibold
                shadow
                transition
                whitespace-nowrap
              "
            >
              <Plus className="w-5 h-5" />
              Створити тест
            </button>

          </div>

        </div>

        {/* Пошук */}
        <SearchBar
          value={search}
          onChange={setSearch}
        />

        {/* Тести */}
        {Object.keys(groupedTests).length === 0 ? (

          <div className="bg-white rounded-xl shadow-lg p-10 text-center mt-8">

            <h2 className="text-2xl font-semibold text-gray-700">
              Нічого не знайдено
            </h2>

          </div>

        ) : (

          <div className="space-y-8 mt-8">

            {Object.entries(groupedTests).map(
              ([subject, subjectTests]) => (

                <SubjectBlock
                  key={subject}
                  subject={subject}
                  tests={subjectTests}
                />

              )
            )}

          </div>

        )}

      </div>
    </main>
  );
}