"use client";

import { useEffect } from "react";

import { useTestSession } from "@/app/context/TestSessionContext";
import { saveSession } from "@/app/services/session.api";

export default function AutoSaveSession() {
const {
sessionId,
currentQuestion,
savedAnswers,
} = useTestSession();

useEffect(() => {
if (
sessionId === null ||
sessionId <= 0
) {
return;
}

const currentSessionId = sessionId;

let cancelled = false;

async function performSave() {
  if (cancelled) {
    return;
  }

  try {
    await saveSession({
      sessionId: currentSessionId,
      currentQuestion,
      savedAnswers,
      finished: false,
    });

    console.log(
      "AUTO SAVE:",
      {
        sessionId: currentSessionId,
        currentQuestion,
        savedAnswers,
      }
    );
  } catch (error) {
    console.error(
      "Помилка автозбереження сесії:",
      error
    );
  }
}

// Перше збереження одразу
performSave();

// Подальше автозбереження кожні 30 секунд
const interval = setInterval(
  performSave,
  30000
);

return () => {
  cancelled = true;
  clearInterval(interval);
};

}, [
sessionId,
currentQuestion,
savedAnswers,
]);

return null;
}