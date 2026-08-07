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

  // Для послідовності не перемішуємо
  if (question.type === "sequence") {
    return question;
  }

  const shuffledOptions = shuffleArray(question.options).map(
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

  const movableQuestions = shuffleArray(
    test.questions.filter(
      (q) => q.shuffleQuestion !== false
    )
  );

  let movableIndex = 0;

  const questions = test.questions.map((question) => {

    if (question.shuffleQuestion === false) {
      return shuffleOptions(question);
    }

    const shuffledQuestion =
      movableQuestions[movableIndex++];

    return shuffleOptions(shuffledQuestion);

  });

  // Перенумеровуємо порядок питань
  const normalizedQuestions = questions.map(
    (question, index) => ({
      ...question,
      order: index + 1,
    })
  );

  return {
    ...test,
    questions: normalizedQuestions,
  };
}