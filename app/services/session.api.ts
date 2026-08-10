export type SaveSessionDto = {
  sessionId: number;

  currentQuestion: number;

  savedAnswers: Record<number, number[]>;

  /**
   * Необов'язковий параметр.
   *
   * Не передаємо його під час звичайного
   * автозбереження, щоб не перезаписувати
   * час, змінений адміністратором.
   *
   * Передаємо під час завершення тесту.
   */
  timeLeft?: number;

  finished: boolean;
};

export async function saveSession(
  data: SaveSessionDto
) {
  const response = await fetch(
    "/api/session",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "SAVE SESSION ERROR:",
      errorText
    );

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
  sessionId: number,
  currentQuestion: number,
  savedAnswers: Record<
    number,
    number[]
  >,
  timeLeft: number
) {
  const response = await fetch(
    "/api/session",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        sessionId,

        currentQuestion,

        savedAnswers,

        timeLeft,

        finished: true,
      }),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(
      "FINISH SESSION ERROR:",
      errorText
    );

    throw new Error(
      "Не вдалося завершити сесію."
    );
  }

  return response.json();
}