"use client";

type Props = {
  open: boolean;
  violations: number;
  maxViolations: number;
  onContinue: () => void;
};

export default function ViolationModal({
  open,
  violations,
  maxViolations,
  onContinue,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8">

        <h2 className="text-3xl font-bold text-[#7A1F2B] mb-6">
          Порушення правил тестування
        </h2>

        <div className="space-y-5 text-gray-700 leading-7">

          <p>
            Виявлено вихід із повноекранного режиму.
          </p>

          <p>
            Під час проходження тестування заборонено
            залишати повноекранний режим.
          </p>

          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-5">

            <p className="font-semibold text-yellow-800">

              Зафіксовано порушень:

            </p>

            <p className="text-3xl font-bold text-[#7A1F2B] mt-2">

              {violations} із {maxViolations}

            </p>

          </div>

          <p className="text-red-600 font-semibold">

            Після повторного порушення тестування буде
            автоматично завершено.

          </p>

        </div>

        <div className="flex justify-end mt-10">

          <button
            onClick={onContinue}
            className="
              px-8
              py-3
              rounded-xl
              bg-[#7A1F2B]
              hover:bg-[#651824]
              text-white
              transition
            "
          >
            Повернутися до тестування
          </button>

        </div>

      </div>

    </div>
  );
}