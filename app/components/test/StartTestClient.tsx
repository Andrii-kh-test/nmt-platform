"use client";

import { useRouter } from "next/navigation";

import ParticipantForm, {
  ParticipantData,
} from "./ParticipantForm";

import { useTestSession } from "@/app/context/TestSessionContext";

type Props = {
  testId: number;
  title: string;
};

export default function StartTestClient({
  testId,
  title,
}: Props) {
  const router = useRouter();

  const { setSessionId } =
    useTestSession();

  async function handleStart(
    participant: ParticipantData
  ) {
    try {
      const response = await fetch(
        "/api/test/start",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            testId,

            lastName:
              participant.lastName,

            firstName:
              participant.firstName,

            middleName:
              participant.middleName,

            accessCode:
              participant.accessCode,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.message ??
            "Не вдалося розпочати тест."
        );

        return;
      }

      // --------------------------------
      // Перевіряємо отриману сесію
      // --------------------------------

      if (
        !result.session ||
        !result.session.id
      ) {
        alert(
          "Сервер не повернув ідентифікатор сесії."
        );

        return;
      }

      const sessionId =
        Number(result.session.id);

      if (
        !Number.isInteger(sessionId) ||
        sessionId <= 0
      ) {
        alert(
          "Отримано некоректний ідентифікатор сесії."
        );

        return;
      }

      // --------------------------------
      // Зберігаємо sessionId у Context
      // --------------------------------

      setSessionId(sessionId);

      // --------------------------------
      // Зберігаємо ПІБ локально
      // --------------------------------

      localStorage.setItem(
        "participant",
        JSON.stringify({
          lastName:
            participant.lastName,

          firstName:
            participant.firstName,

          middleName:
            participant.middleName,
        })
      );

      // --------------------------------
      // Додатково зберігаємо sessionId
      // у localStorage
      // --------------------------------

      localStorage.setItem(
        "testSessionId",
        String(sessionId)
      );

      // --------------------------------
      // Переходимо до інструкції
      // --------------------------------

      router.push(
        `/test/${testId}/instruction`
      );
    } catch (error) {
      console.error(
        "Помилка запуску тесту:",
        error
      );

      alert(
        "Помилка з'єднання із сервером."
      );
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <h1
          className="
            text-4xl
            font-bold
            text-center
            text-[#7A1F2B]
            mb-8
          "
        >
          {title}
        </h1>

        <ParticipantForm
          testId={testId}
          onSubmit={handleStart}
        />
      </div>
    </main>
  );
}