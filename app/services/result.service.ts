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



  test.questions.forEach(
    (question) => {


      const userAnswer =
        answers[question.id];



      // Якщо відповіді немає
      if (
        !userAnswer ||
        userAnswer.length === 0
      ) {

        skipped++;

        return;

      }



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

      } else {

        incorrect++;

      }

    }
  );



  const maxPoints =
    test.maxPoints;



  const earnedPoints =
    correct;



  const percent =
    maxPoints > 0

      ? Math.round(
          (earnedPoints / maxPoints) * 100
        )

      : 0;



  return {

    earnedPoints,

    maxPoints,

    percent,

    correct,

    incorrect,

    skipped,

  };

}