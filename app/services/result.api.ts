export type SaveResultDto = {
  testId: number;

  earnedPoints: number;

  maxPoints: number;

  percent: number;

  correct: number;

  incorrect: number;

  skipped: number;

  timeSpent: number;

  answers: Record<number, number[]>;

  finishReason:
    | "manual"
    | "timeout"
    | "security";
};



export async function saveResult(
  result: SaveResultDto
) {

  const response = await fetch(
    "/api/results",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(result),
    }
  );


  if (!response.ok) {

    throw new Error(
      "Не вдалося зберегти результат"
    );

  }


  return response.json();

}