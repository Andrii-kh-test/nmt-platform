export type SaveResultDto = {
  sessionId: number;

  testId: number;

  earnedPoints: number;

  maxPoints: number;

  percent: number;

  correct: number;

  incorrect: number;

  skipped: number;

  timeSpent: number;

  answers: Record<
    number,
    number[]
  >;

  finishReason:
    | "manual"
    | "timeout"
    | "security";

  lastName?: string | null;

  firstName?: string | null;

  middleName?: string | null;

  accessCode?: string | null;
};

export async function saveResult(
  result: SaveResultDto
) {
  const response = await fetch(
    "/api/results",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(result),
    }
  );

  if (!response.ok) {
    const error =
      await response.text();

    console.error(
      "SAVE RESULT ERROR:",
      error
    );

    throw new Error(
      error ||
        "Не вдалося зберегти результат"
    );
  }

  return response.json();
}