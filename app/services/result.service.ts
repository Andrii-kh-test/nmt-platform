import { Test } from "@/app/types/test";
import { UserAnswers } from "@/app/context/TestSessionContext";

export type TestResult = {
  correct: number;
  incorrect: number;
  skipped: number;

  earnedPoints: number;
  maxPoints: number;

  percent: number;
};

export function calculateResult(
  test: Test,
  answers: UserAnswers
): TestResult {

  let correct = 0;
  let incorrect = 0;
  let skipped = 0;

  let earnedPoints = 0;

  let maxPoints = 0;

  for (const question of test.questions) {

    maxPoints += question.points;

    const userAnswer =
      answers[question.id];

    if (
      !userAnswer ||
      userAnswer.length === 0
    ) {
      skipped++;
      continue;
    }

    const correctAnswers =
      [...question.correctAnswers].sort();

    const selectedAnswers =
      [...userAnswer].sort();

    const isCorrect =
      JSON.stringify(correctAnswers) ===
      JSON.stringify(selectedAnswers);

    if (isCorrect) {

      correct++;

      earnedPoints +=
        question.points;

    } else {

      incorrect++;

    }
  }

  const percent =
    maxPoints === 0
      ? 0
      : Math.round(
          (earnedPoints /
            maxPoints) *
            100
        );

  return {

    correct,

    incorrect,

    skipped,

    earnedPoints,

    maxPoints,

    percent,

  };
}