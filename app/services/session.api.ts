export type SaveSessionDto = {
  testId: number;

  currentQuestion: number;

  savedAnswers: Record<number, number[]>;

  timeLeft: number;

  finished: boolean;
};

export async function saveSession(
  data: SaveSessionDto
) {
  const response = await fetch("/api/session", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      "Не вдалося зберегти сесію."
    );
  }

  return response.json();
}
export async function loadSession(
  testId: number
) {
  const response = await fetch(
    `/api/session/${testId}`
  );

  if (!response.ok) {
    throw new Error(
      "Не вдалося отримати сесію."
    );
  }

  return response.json();
}
export async function deleteSession(
  testId: number
) {

  const response = await fetch(
    "/api/session/delete",
    {
      method: "DELETE",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        testId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Не вдалося видалити сесію."
    );
  }

}
export async function finishSession(
  testId: number,
  currentQuestion: number,
  savedAnswers: Record<number, number[]>,
  timeLeft: number
) {
  const response = await fetch("/api/session", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      testId,
      currentQuestion,
      savedAnswers,
      timeLeft,
      finished: true,
    }),
  });

  if (!response.ok) {
    throw new Error(
      "Не вдалося завершити сесію."
    );
  }

  return response.json();
}