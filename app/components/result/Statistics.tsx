type Props = {
  result: {
    correct: number;
    incorrect: number;
    skipped: number;
  };
};

export default function Statistics({
  result,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">

      <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
        Статистика
      </h2>

      <div className="space-y-4 text-lg">

        <div className="flex justify-between">
          <span>Правильних</span>
          <span className="font-bold text-green-600">
            {result.correct}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Неправильних</span>
          <span className="font-bold text-red-600">
            {result.incorrect}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Без відповіді</span>
          <span className="font-bold text-gray-600">
            {result.skipped}
          </span>
        </div>

      </div>

    </div>
  );
}