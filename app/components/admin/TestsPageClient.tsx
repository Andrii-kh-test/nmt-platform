"use client";

import { useMemo, useState } from "react";
import { Plus, Archive, FileText } from "lucide-react";
import SubjectBlock from "@/app/components/admin/SubjectBlock";
import SearchBar from "@/app/components/admin/SearchBar";
import ComplexTestsBlock from "@/app/components/admin/ComplexTestsBlock";

type Test = {
  id: number;
  title: string;
  subject: string;
  duration: number;
  isPublished: boolean;
  questions: any[];
};

type Subject = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
};

type Props = {
  tests: Test[];
  subjects: Subject[];
};

export default function TestsPageClient({
  tests,
  subjects,
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

  const sections = useMemo(() => {
    return subjects.map((subject) => ({
      subject: subject.name,
      tests: groupedTests[subject.name] ?? [],
    }));
  }, [subjects, groupedTests]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-[1600px] mx-auto px-5 sm:px-6 lg:px-8 py-8 lg:py-10">

        {/* =================================================
            ВЕРХНЯ ПАНЕЛЬ
        ================================================= */}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-6 lg:px-8 lg:py-7">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

            {/* Заголовок */}

            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#7A1F2B]/10 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-[#7A1F2B]" />
                </div>

                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-[#7A1F2B] tracking-tight">
                    Банк тестів
                  </h1>

                  <p className="text-sm lg:text-base text-slate-500 mt-1">
                    Створення, редагування та керування тестами
                  </p>
                </div>
              </div>
            </div>

            {/* Кнопки */}

            <div className="flex flex-wrap items-center gap-2.5">

              {/* Архів */}

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/admin/tests/archive";
                }}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  border
                  border-slate-300
                  bg-white
                  text-slate-700
                  hover:bg-slate-50
                  hover:border-[#7A1F2B]
                  hover:text-[#7A1F2B]
                  px-4
                  py-2.5
                  rounded-lg
                  font-semibold
                  text-sm
                  transition
                  whitespace-nowrap
                "
              >
                <Archive className="w-4 h-4" />
                Архів
              </button>

              {/* Створити розділ */}

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
                  bg-white
                  text-[#7A1F2B]
                  hover:bg-[#7A1F2B]
                  hover:text-white
                  px-4
                  py-2.5
                  rounded-lg
                  font-semibold
                  text-sm
                  transition
                  whitespace-nowrap
                "
              >
                <Plus className="w-4 h-4" />
                Створити розділ
              </button>

              {/* Створити тест */}

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
                  px-5
                  py-2.5
                  rounded-lg
                  font-semibold
                  text-sm
                  shadow-sm
                  hover:shadow
                  transition
                  whitespace-nowrap
                "
              >
                <Plus className="w-4 h-4" />
                Створити тест
              </button>

            </div>
          </div>
        </div>

        {/* =================================================
            ПОШУК
        ================================================= */}

        <div className="mt-6">
          <SearchBar
            value={search}
            onChange={setSearch}
          />
        </div>

        {/* =================================================
            ОСНОВНА СІТКА
        ================================================= */}

        <div
          className="
            mt-7
            grid
            grid-cols-1
            xl:grid-cols-[minmax(0,1fr)_420px]
            gap-7
            xl:gap-8
            items-start
          "
        >

          {/* =================================================
              ЛІВА КОЛОНКА — ЗВИЧАЙНІ ТЕСТИ
          ================================================= */}

          <section className="min-w-0">

            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Звичайні тести
                </h2>

                <p className="text-sm text-slate-500 mt-0.5">
                  Тести, організовані за розділами
                </p>
              </div>

              <div className="hidden sm:flex items-center justify-center min-w-9 h-9 px-3 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-600">
                {tests.length}
              </div>
            </div>

            {sections.length === 0 ? (

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">

                <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-slate-400" />
                </div>

                <h2 className="text-xl font-semibold text-slate-700">
                  Розділів ще немає
                </h2>

                <p className="text-sm text-slate-400 mt-2">
                  Створіть перший розділ, щоб додати до нього тести.
                </p>

              </div>

            ) : (

              <div className="space-y-6">

                {sections.map(
                  ({
                    subject,
                    tests: subjectTests,
                  }) => (

                    <div
                      key={subject}
                      className="
                        min-w-0
                        [&>section]:mt-0
                      "
                    >
                      <SubjectBlock
                        subjectId={
                          subjects.find(
                            (item) =>
                              item.name === subject
                          )?.id ?? 0
                        }
                        subject={subject}
                        tests={subjectTests}
                      />
                    </div>

                  )
                )}

              </div>

            )}

          </section>

          {/* =================================================
              ПРАВА КОЛОНКА — КОМБІНОВАНІ ТЕСТИ
          ================================================= */}

          <aside className="min-w-0">

            <div className="xl:sticky xl:top-6">

              <div className="[&>section]:mt-0">

                <ComplexTestsBlock />

              </div>

            </div>

          </aside>

        </div>

      </div>
    </main>
  );
}