"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Archive,
} from "lucide-react";

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
      <div className="max-w-7xl mx-auto py-10 px-8">

        {/* Заголовок + кнопки */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">

          <h1 className="text-5xl font-bold text-[#7A1F2B]">
            Банк тестів
          </h1>

          <div className="flex flex-wrap items-center gap-3">

            {/* ==========================
                АРХІВ
            ========================== */}

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
                border-gray-400
                text-gray-700
                hover:bg-white
                hover:border-[#7A1F2B]
                hover:text-[#7A1F2B]
                px-6
                py-3
                rounded-lg
                font-semibold
                shadow
                transition
                whitespace-nowrap
              "
            >
              <Archive className="w-5 h-5" />
              Архів
            </button>

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

        {/* Розділи та тести */}
        {sections.length === 0 ? (

          <div className="bg-white rounded-xl shadow-lg p-10 text-center mt-8">

            <h2 className="text-2xl font-semibold text-gray-700">
              Розділів ще немає
            </h2>

          </div>

        ) : (

          <div className="space-y-8 mt-8">

            {sections.map(
              ({ subject, tests: subjectTests }) => (

                <SubjectBlock
                  key={subject}
                  subjectId={
                    subjects.find(
                      (item) => item.name === subject
                    )?.id ?? 0
                  }
                  subject={subject}
                  tests={subjectTests}
                />

              )
            )}

          </div>

        )}
        {/* Комбіновані тести */}
        <ComplexTestsBlock />
      </div>
    </main>
  );
}