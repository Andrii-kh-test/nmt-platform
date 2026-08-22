"use client";

type Props = {
  totalQuestions: number;

  questionIds: number[];

  currentQuestion: number;

  savedAnswers: Record<
    number,
    number[]
  >;
};

export default function MonitoringQuestions({
  totalQuestions,
  questionIds,
  currentQuestion,
  savedAnswers,
}: Props) {
  // =====================================================
  // КІЛЬКІСТЬ ПИТАНЬ
  // =====================================================

  const questionsCount = Math.max(
    0,
    Math.floor(totalQuestions)
  );

  // =====================================================
  // ПЕРЕВІРКА:
  // ЧИ ЗБЕРЕЖЕНО ВІДПОВІДЬ НА ПИТАННЯ
  //
  // ВАЖЛИВО:
  //
  // index — це порядковий номер питання:
  //
  // 0 = питання №1
  // 1 = питання №2
  // 2 = питання №3
  //
  // questionIds[index] — це реальний ID Question
  // у базі даних.
  // =====================================================

  function isQuestionSaved(
    index: number
  ): boolean {
    const questionId =
      questionIds[index];

    if (
      typeof questionId !==
      "number"
    ) {
      return false;
    }

    return (
      savedAnswers[
        questionId
      ] !== undefined
    );
  }

  // =====================================================
  // ЯКЩО ПИТАНЬ НЕМАЄ
  // =====================================================

  if (questionsCount === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 text-center text-gray-500">
        Питання відсутні.
      </div>
    );
  }

  // =====================================================
  // СПИСОК ПИТАНЬ
  // =====================================================

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from(
        {
          length:
            questionsCount,
        },
        (_, index) => {
          // =============================================
          // ЧИ Є ЦЕ ПОТОЧНЕ ПИТАННЯ
          // =============================================

          const current =
            index ===
            currentQuestion;

          // =============================================
          // РЕАЛЬНИЙ ID ПИТАННЯ
          // =============================================

          const questionId =
            questionIds[index];

          // =============================================
          // ЧИ ЗБЕРЕЖЕНО ВІДПОВІДЬ
          // =============================================

          const saved =
            isQuestionSaved(
              index
            );

          return (
            <div
              key={
                questionId ??
                index
              }
              className={`
                rounded-lg
                border
                p-4
                transition
                ${
                  current
                    ? "border-[#7A1F2B] bg-[#fff1f3]"
                    : "border-gray-200 bg-white"
                }
              `}
            >
              {/* =======================================
                  ЗАГОЛОВОК ПИТАННЯ
              ======================================= */}

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div
                    className={`
                      font-semibold
                      ${
                        current
                          ? "text-[#7A1F2B]"
                          : "text-gray-700"
                      }
                    `}
                  >
                    Питання №{" "}
                    {index + 1}
                  </div>

                  {current && (
                    <div className="mt-1 text-xs font-semibold text-[#7A1F2B]">
                      Поточне
                    </div>
                  )}
                </div>

                {/* =======================================
                    СТАН ВІДПОВІДІ
                ======================================= */}

                <div
                  className={`
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    text-sm
                    font-bold
                    ${
                      saved
                        ? "border-green-500 bg-green-100 text-green-700"
                        : "border-gray-300 bg-gray-50 text-gray-400"
                    }
                  `}
                  aria-label={
                    saved
                      ? "Відповідь збережено"
                      : "Відповідь не збережено"
                  }
                >
                  {saved
                    ? "✓"
                    : "—"}
                </div>
              </div>

              {/* =======================================
                  ТЕКСТ СТАНУ
              ======================================= */}

              <div className="mt-3 text-xs text-gray-500">
                {saved
                  ? "Відповідь збережено"
                  : "Відповідь ще не збережено"}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}