import type { Test } from "@/app/types/test";
import type { UserAnswers } from "@/app/context/TestSessionContext";

export type TestResult = {
  earnedPoints: number;
  maxPoints: number;
  percent: number;

  correct: number;
  incorrect: number;
  skipped: number;
};

export function calculateResult(
  test: Test,
  answers: UserAnswers
): TestResult {
  let correct = 0;
  let incorrect = 0;
  let skipped = 0;

  let earnedPoints = 0;

  test.questions.forEach((question) => {
    const userAnswer = answers[question.id];

    // ==========================================
    // Немає відповіді
    // ==========================================

    if (
      !userAnswer ||
      userAnswer.length === 0
    ) {
      skipped++;
      return;
    }

    // ==========================================
    // MATCHING
    // ==========================================

    if (question.type === "matching") {
      const leftItems =
        question.matchingLeftItems ?? [];

      // Якщо з якихось причин Matching
      // не має лівих елементів
      if (leftItems.length === 0) {
        incorrect++;
        return;
      }

      /*
       * userAnswer для Matching:
       *
       * [
       *   rightId1,
       *   rightId2,
       *   rightId3,
       *   rightId4
       * ]
       *
       * Позиція відповіді відповідає
       * порядку лівих елементів.
       *
       * Наприклад:
       *
       * left 1 → right 2
       * left 2 → right 1
       * left 3 → right 4
       * left 4 → right 3
       *
       * userAnswer:
       *
       * [2, 1, 4, 3]
       */

      let correctPairs = 0;

      leftItems.forEach(
        (leftItem, index) => {
          const userRightId =
            userAnswer[index];

          if (
            userRightId ===
            leftItem.correctRightId
          ) {
            correctPairs++;
          }
        }
      );

      const totalPairs =
        leftItems.length;

      /*
       * Якщо всі відповідності правильні
       */
      if (
        correctPairs === totalPairs
      ) {
        correct++;

        earnedPoints +=
          question.points;
      }

      /*
       * Якщо правильна хоча б одна,
       * але не всі
       */
      else if (
        correctPairs > 0
      ) {
        /*
         * Часткова оцінка:
         *
         * 1/4 × points
         * 2/4 × points
         * 3/4 × points
         * 4/4 × points
         */

        earnedPoints +=
          question.points *
          (
            correctPairs /
            totalPairs
          );

        /*
         * Питання не вважаємо
         * повністю правильним.
         */
        incorrect++;
      }

      /*
       * Жодної правильної
       * відповідності
       */
      else {
        incorrect++;
      }

      return;
    }

    // ==========================================
    // SINGLE / MULTIPLE
    // ==========================================

    const correctAnswers =
      question.options
        .filter(
          (option) =>
            option.isCorrect === true
        )
        .map(
          (option) =>
            option.id
        );

    const isCorrect =
      correctAnswers.length ===
        userAnswer.length &&
      correctAnswers.every(
        (id) =>
          userAnswer.includes(id)
      );

    if (isCorrect) {
      correct++;

      earnedPoints +=
        question.points;
    } else {
      incorrect++;
    }
  });

  // ==========================================
  // MAX POINTS
  // ==========================================

  const maxPoints =
    test.maxPoints;

  // ==========================================
  // PERCENT
  // ==========================================

  const percent =
    maxPoints > 0
      ? Math.round(
          (earnedPoints /
            maxPoints) *
            100
        )
      : 0;

  /*
   * Прибираємо можливі дробові похибки
   * JavaScript, наприклад:
   *
   * 1.9999999999999998
   *
   * Для результату зберігаємо
   * максимум 2 знаки після коми.
   */
  earnedPoints =
    Math.round(
      earnedPoints * 100
    ) / 100;

  return {
    earnedPoints,

    maxPoints,

    percent,

    correct,

    incorrect,

    skipped,
  };
}