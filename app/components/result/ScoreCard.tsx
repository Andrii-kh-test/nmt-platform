type Props = {
  result: {
    earnedPoints: number;
    maxPoints: number;
    percent: number;
  };
};

export default function ScoreCard({
  result,
}: Props) {
  return (
    <div className="border-4 border-green-600 bg-green-50 rounded-xl p-10 text-center">

      <h2 className="text-2xl font-semibold text-[#1F2937]">
        Результат тестування
      </h2>

      <div className="mt-8">

        <p className="text-6xl font-bold text-green-700">
          {result.earnedPoints}
        </p>

        <p className="mt-2 text-xl text-gray-600">
          із {result.maxPoints} балів
        </p>

      </div>

      <div className="mt-8 inline-flex items-center justify-center rounded-full bg-[#7A1F2B] px-8 py-4">

        <span className="text-3xl font-bold text-white">
          {result.percent}%
        </span>

      </div>

    </div>
  );
}