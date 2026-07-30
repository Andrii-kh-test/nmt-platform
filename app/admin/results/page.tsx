import Link from "next/link";

import { prisma } from "@/app/lib/prisma";

export default async function AdminResultsPage() {
  const results = await prisma.testResult.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-[#7A1F2B] mb-8">
          Результати тестування
        </h1>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#7A1F2B] text-white">
              <tr>
                <th className="p-4 text-left">№</th>
                <th className="p-4 text-left">Бали</th>
                <th className="p-4 text-left">%</th>
                <th className="p-4 text-left">Правильних</th>
                <th className="p-4 text-left">Дата</th>
                <th className="p-4 text-center">Деталі</th>
              </tr>
            </thead>

            <tbody>
              {results.map((result, index) => (
                <tr
                  key={result.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-4">
                    {index + 1}
                  </td>

                  <td className="p-4 font-semibold">
                    {result.earnedPoints} / {result.maxPoints}
                  </td>

                  <td className="p-4">
                    {result.percent}%
                  </td>

                  <td className="p-4">
                    {result.correct}
                  </td>

                  <td className="p-4">
                    {new Date(result.createdAt).toLocaleString("uk-UA")}
                  </td>

                  <td className="p-4 text-center">
                    <Link
                      href={`/result/${result.id}`}
                      className="bg-[#7A1F2B] text-white px-4 py-2 rounded-lg hover:bg-[#651923]"
                    >
                      Переглянути
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}