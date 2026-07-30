export function reorderCorrectAnswers(
  answers: number[],
  oldIndex: number,
  newIndex: number
) {
  return answers.map((answer) => {
    if (answer === oldIndex) return newIndex;

    if (
      oldIndex < newIndex &&
      answer > oldIndex &&
      answer <= newIndex
    ) {
      return answer - 1;
    }

    if (
      oldIndex > newIndex &&
      answer >= newIndex &&
      answer < oldIndex
    ) {
      return answer + 1;
    }

    return answer;
  });
}