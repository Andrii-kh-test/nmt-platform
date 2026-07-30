import { Prisma } from "@prisma/client";

type Props = {
  result: Prisma.TestResultGetPayload<{
    include: {
      test: true;
    };
  }>;
};

export default function ResultTable({
  result,
}: Props) {
  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);

    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    const secs = seconds % 60;

    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }

  const answered =
    result.correct +
    result.incorrect;

  const total =
    answered +
    result.skipped;

  let finishReason = "Вручну";

  switch (result.finishReason) {
    case "timeout":
      finishReason =
        "Закінчився час";
      break;

    case "security":
      finishReason =
        "Порушення правил тестування";
      break;

    default:
      finishReason =
        "Вручну";
  }

  return (
    <div className="space-y-8">

      {/* Повідомлення */}

      <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">

        <h2 className="text-2xl font-semibold text-gray-800">
          Ви завершили роботу над тестом.
        </h2>

      </div>

      {/* Таблиця */}

      <div className="overflow-hidden rounded-lg border-2 border-red-600 bg-white shadow">

        <div className="flex">

          {/* Іконка */}

          <div className="flex w-24 items-start justify-center bg-white pt-8">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-3xl font-bold text-white">

              !

            </div>

          </div>

          {/* Таблиця */}

          <div className="flex-1">

            <table className="w-full border-collapse">

              <thead>

                <tr className="bg-gray-100">

                  <th className="border border-gray-300 px-6 py-5 text-left text-lg font-semibold">

                    Назва тесту

                  </th>

                  <th className="border border-gray-300 px-6 py-5 text-center text-lg font-semibold">

                    Надано та збережено відповідей

                  </th>

                  <th className="border border-gray-300 px-6 py-5 text-center text-lg font-semibold">

                    Тестовий бал

                  </th>

                </tr>

              </thead>

              <tbody>

                <tr>

                  <td className="border border-gray-300 px-6 py-6 text-lg font-medium">

                    {result.test.title}

                  </td>

                  <td className="border border-gray-300 text-center text-xl">

                    {answered} із {total}

                  </td>

                  <td className="border border-gray-300 bg-[#A8E6A3]">

                    <div className="flex items-center justify-center py-5 text-5xl font-bold text-[#1C5D1C]">

                      {result.earnedPoints}

                    </div>

                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* Інформація */}

      <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">

        <table className="w-full border-collapse">

          <tbody>

            <tr>

              <td className="w-1/2 border border-gray-300 bg-gray-50 px-6 py-4 font-semibold">

                Набрано балів

              </td>

              <td className="border border-gray-300 px-6 py-4">

                {result.earnedPoints} із{" "}
                {result.maxPoints}

              </td>

            </tr>

            <tr>

              <td className="border border-gray-300 bg-gray-50 px-6 py-4 font-semibold">

                Правильних відповідей

              </td>

              <td className="border border-gray-300 px-6 py-4">

                {result.correct}

              </td>

            </tr>

            <tr>

              <td className="border border-gray-300 bg-gray-50 px-6 py-4 font-semibold">

                Неправильних відповідей

              </td>

              <td className="border border-gray-300 px-6 py-4">

                {result.incorrect}

              </td>

            </tr>

            <tr>

              <td className="border border-gray-300 bg-gray-50 px-6 py-4 font-semibold">

                Пропущено

              </td>

              <td className="border border-gray-300 px-6 py-4">

                {result.skipped}

              </td>

            </tr>

            <tr>

              <td className="border border-gray-300 bg-gray-50 px-6 py-4 font-semibold">

                Відсоток виконання

              </td>

              <td className="border border-gray-300 px-6 py-4">

                {result.percent} %

              </td>

            </tr>

            <tr>

              <td className="border border-gray-300 bg-gray-50 px-6 py-4 font-semibold">

                Час проходження

              </td>

              <td className="border border-gray-300 px-6 py-4">

                {formatTime(
                  result.timeSpent
                )}

              </td>

            </tr>

            <tr>

              <td className="border border-gray-300 bg-gray-50 px-6 py-4 font-semibold">

                Причина завершення

              </td>

              <td className="border border-gray-300 px-6 py-4">

                {finishReason}

              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>
  );
}