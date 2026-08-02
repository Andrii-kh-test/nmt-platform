"use client";

import { useRouter } from "next/navigation";

import ParticipantForm, {
  ParticipantData,
} from "./ParticipantForm";

type Props = {
  testId: number;
  title: string;
};

export default function StartTestClient({
  testId,
  title,
}: Props) {
  const router = useRouter();

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

      if (!response.ok || !result.success) {
        alert(
          result.message ??
            "Не вдалося розпочати тест."
        );

        return;
      }

      // Збережемо ПІБ локально
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

      // Збережемо session
      localStorage.setItem(
        "testSessionId",
        String(result.session.id)
      );

      router.push(`/test/${testId}`);
    } catch (error) {
      console.error(error);

      alert(
        "Помилка з'єднання із сервером."
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">

      <div className="w-full max-w-2xl">

        <h1 className="text-4xl font-bold text-center text-[#7A1F2B] mb-8">
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