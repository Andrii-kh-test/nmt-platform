"use client";

import { useTestSession } from "@/app/context/TestSessionContext";

type Props = {
  open: boolean;
  onClose: () => void;
  onFinish: () => void;
};

export default function TestFinishedModal({
  open,
  onClose,
  onFinish,
}: Props) {
  const {
    test,
    savedAnswers,
    selectedAnswers,
  } = useTestSession();

  if (!open || !test) {
    return null;
  }

  const answeredCount = Object.keys(savedAnswers).length;

  const selectedCount = Object.keys(selectedAnswers).length;

  const unansweredCount =
    test.questions.length - answeredCount;

  const unsavedCount =
    selectedCount - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8">

        <h2 className="text-3xl font-bold text-[#7A1F2B] mb-6">
          Завершення тестування
        </h2>

        <p className="text-gray-700 mb-8">
          Ви дійсно бажаєте завершити проходження тесту?
        </p>

        <div className="space-y-4 mb-8">

          <div className="flex justify-between">

            <span>Усього питань</span>

            <strong>
              {test.questions.length}
            </strong>

          </div>

          <div className="flex justify-between">

            <span>Збережених відповідей</span>

            <strong className="text-green-600">
              {answeredCount}
            </strong>

          </div>

          <div className="flex justify-between">

            <span>Обрано, але не збережено</span>

            <strong className="text-orange-500">
              {unsavedCount > 0 ? unsavedCount : 0}
            </strong>

          </div>

          <div className="flex justify-between">

            <span>Без відповіді</span>

            <strong className="text-red-600">
              {unansweredCount}
            </strong>

          </div>

        </div>

        {(unansweredCount > 0 || unsavedCount > 0) && (

          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 mb-8">

            <p className="text-yellow-800">

              <strong>Увага!</strong>

              {unsavedCount > 0 && (
                <>
                  {" "}
                  Ви маєте{" "}
                  <strong>{unsavedCount}</strong>{" "}
                  відповідей, які були обрані, але ще не збережені.
                </>
              )}

              {unansweredCount > 0 && (
                <>
                  {" "}
                  Також залишилося{" "}
                  <strong>{unansweredCount}</strong>{" "}
                  питань без відповіді.
                </>
              )}

            </p>

          </div>

        )}

        <div className="flex justify-end gap-4">

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
          >
            Продовжити тест
          </button>

          <button
            type="button"
            onClick={onFinish}
            className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
          >
            Завершити тест
          </button>

        </div>

      </div>

    </div>
  );
}