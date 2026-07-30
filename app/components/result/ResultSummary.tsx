type Props = {
  result: {
    earnedPoints: number;
    maxPoints: number;
    percent: number;
  };
};

export default function ResultSummary({
  result,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">

      <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
        Підсумок тестування
      </h2>

      <div className="space-y-4">

        <div className="flex justify-between">
          <span>Набрано балів</span>
          <span className="font-bold">
            {result.earnedPoints} / {result.maxPoints}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Відсоток виконання</span>
          <span className="font-bold">
            {result.percent}%
          </span>
        </div>

      </div>

    </div>
  );
}