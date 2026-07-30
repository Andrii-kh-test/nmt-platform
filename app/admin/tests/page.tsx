import Link from "next/link";

import TestCard from "@/app/components/admin/TestCard";

export default function TestsPage() {
  const tests = [
    {
      id: 1,
      title: "Українська мова",
      questions: 30,
      description: "НМТ 2026",
    },
    {
      id: 2,
      title: "Українська література",
      questions: 30,
      description: "Демонстраційний",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-[#7A1F2B]">
            Керування тестами
          </h1>

          <Link
            href="/admin/tests/new"
            className="bg-[#7A1F2B] hover:bg-[#651923] text-white px-6 py-3 rounded-lg transition"
          >
            + Створити тест
          </Link>
        </div>

        {tests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center text-gray-500">
            Тести ще не створені
          </div>
        ) : (
          <div className="grid gap-6">
            {tests.map((test) => (
              <TestCard
                key={test.id}
                id={test.id}
                title={test.title}
                questions={test.questions}
                description={test.description}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}