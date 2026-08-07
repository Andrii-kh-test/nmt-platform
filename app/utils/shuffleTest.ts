import { Test } from "@/app/types/test";
import { Question } from "@/app/types/question";
import { AnswerOption } from "@/app/types/answerOption";

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

function shuffleOptions(
  question: Question
): Question {

  // Послідовність не перемішуємо
  if (question.type === "sequence") {
    return question;
  }

  const shuffledOptions = shuffleArray(
    question.options
  ).map(
    (option: AnswerOption, index: number) => ({
      ...option,
      order: index + 1,
    })
  );

  return {
    ...question,
    options: shuffledOptions,
  };
}

export function shuffleTest(
  test: Test
): Test {

  // лише ті, які можна перемішувати
  const movableQuestions = shuffleArray(
    test.questions.filter(
      (q) => q.shuffleQuestion !== false
    )
  );

  let movableIndex = 0;

  // Сортуємо за початковим порядком
  const sortedQuestions = [...test.questions].sort(
    (a, b) => a.order - b.order
  );

  const result: Question[] = [];

  for (const question of sortedQuestions) {

    if (question.shuffleQuestion === false) {

      result.push(
        shuffleOptions(question)
      );

    } else {

      result.push(
        shuffleOptions(
          movableQuestions[movableIndex++]
        )
      );

    }

  }

  return {
    ...test,
    questions: result,
  };

}