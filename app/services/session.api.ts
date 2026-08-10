export type SaveSessionDto = {
  sessionId: number;

  currentQuestion: number;

  savedAnswers: Record<number, number[]>;

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
    const error =
      await response.text();

    throw new Error(
      error ||
        "Не вдалося зберегти сесію."
    );
  }

  return response.json();
}

export async function loadSession(
  testId: number
) {
  const response = await fetch(
    `/api/session/${testId}`,
    {
      method: "GET",
      cache: "no-store",
    }
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
    const error =
      await response.text();

    throw new Error(
      error ||
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
  >
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

        finished: true,
      }),
    }
  );

  if (!response.ok) {
    const error =
      await response.text();

    throw new Error(
      error ||
        "Не вдалося завершити сесію."
    );
  }

  return response.json();
}