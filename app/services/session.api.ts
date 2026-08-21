// =====================================================
// Тип даних для збереження сесії
// =====================================================

export type SaveSessionDto = {
  sessionId: number;
  currentQuestion: number;
  savedAnswers: Record<number, number[]>;
  finished: boolean;
};

// =====================================================
// Збереження поточного стану сесії
//
// Учасник може зберігати:
// - currentQuestion
// - savedAnswers
// - finished
//
// Учасник НЕ передає:
// - timeLeft
// - extraTime
// - blocked
// - blockReason
//
// Ці поля контролюються сервером.
// =====================================================

export async function saveSession(
  data: SaveSessionDto
) {
  const response = await fetch("/api/session", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      sessionId: data.sessionId,
      currentQuestion:
        data.currentQuestion,
      savedAnswers:
        data.savedAnswers,
      finished:
        data.finished,
    }),
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      error ||
        "Не вдалося зберегти сесію."
    );
  }

  return response.json();
}

// =====================================================
// Завантаження конкретної сесії
// =====================================================

export async function loadSession(
  testId: number,
  sessionId: number
) {
  if (
    !Number.isInteger(testId) ||
    testId <= 0
  ) {
    throw new Error(
      "Некоректний id тесту."
    );
  }

  if (
    !Number.isInteger(sessionId) ||
    sessionId <= 0
  ) {
    throw new Error(
      "Некоректний id сесії."
    );
  }

  const response = await fetch(
    `/api/session/${testId}?sessionId=${sessionId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      error ||
        "Не вдалося отримати сесію."
    );
  }

  return response.json();
}

// =====================================================
// Видалення сесії
//
// Використовується, коли потрібно видалити
// існуючу сесію тесту перед новим проходженням.
// =====================================================

export async function deleteSession(
  testId: number
) {
  if (
    !Number.isInteger(testId) ||
    testId <= 0
  ) {
    throw new Error(
      "Некоректний id тесту."
    );
  }

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
    const error = await response.text();

    throw new Error(
      error ||
        "Не вдалося видалити сесію."
    );
  }

  return response.json().catch(
    () => null
  );
}

// =====================================================
// Завершення сесії учасником
//
// ВАЖЛИВО:
//
// Тут НЕ передаємо timeLeft.
//
// Фактичний час залишається під контролем
// сервера / адміністративної панелі.
//
// Передаємо тільки:
// - sessionId
// - currentQuestion
// - savedAnswers
// - finished
// =====================================================

export async function finishSession(
  sessionId: number,
  currentQuestion: number,
  savedAnswers: Record<
    number,
    number[]
  >
) {
  if (
    !Number.isInteger(sessionId) ||
    sessionId <= 0
  ) {
    throw new Error(
      "Некоректний id сесії."
    );
  }

  if (
    !Number.isInteger(
      currentQuestion
    ) ||
    currentQuestion < 0
  ) {
    throw new Error(
      "Некоректний номер поточного завдання."
    );
  }

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
    const error = await response.text();

    throw new Error(
      error ||
        "Не вдалося завершити сесію."
    );
  }

  return response.json();
}

// =====================================================
// Heartbeat сесії
//
// Використовується для повідомлення серверу,
// що учасник продовжує працювати.
//
// Ця функція НЕ змінює:
// - timeLeft
// - extraTime
// - currentQuestion
// - savedAnswers
// - finished
// =====================================================

export async function sendSessionHeartbeat(
  testId: number,
  sessionId: number
) {
  if (
    !Number.isInteger(testId) ||
    testId <= 0
  ) {
    throw new Error(
      "Некоректний id тесту."
    );
  }

  if (
    !Number.isInteger(sessionId) ||
    sessionId <= 0
  ) {
    throw new Error(
      "Некоректний id сесії."
    );
  }

  const response = await fetch(
    `/api/session/${testId}`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      cache: "no-store",

      body: JSON.stringify({
        sessionId,
        heartbeat: true,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      error ||
        "Не вдалося оновити активність сесії."
    );
  }

  return response.json();
}

// =====================================================
// Завантаження стану сесії
//
// Зручна обгортка для SessionMonitor.
// =====================================================

export async function getSessionState(
  testId: number,
  sessionId: number
) {
  if (
    !Number.isInteger(testId) ||
    testId <= 0
  ) {
    throw new Error(
      "Некоректний id тесту."
    );
  }

  if (
    !Number.isInteger(sessionId) ||
    sessionId <= 0
  ) {
    throw new Error(
      "Некоректний id сесії."
    );
  }

  const response = await fetch(
    `/api/session/${testId}?sessionId=${sessionId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      error ||
        "Не вдалося отримати стан сесії."
    );
  }

  return response.json();
}