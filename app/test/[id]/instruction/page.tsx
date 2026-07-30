"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function InstructionPage({
  params,
}: Props) {
  const { id } = use(params);

  const router = useRouter();

  const [accepted, setAccepted] =
    useState(false);

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex justify-center py-10">

      <div className="bg-white w-full max-w-5xl rounded-xl shadow-lg border border-gray-200 p-10">

        <h1 className="text-4xl font-bold text-[#7A1F2B] mb-8">
          Інструкція щодо проходження тестування
        </h1>

        <div className="space-y-5 text-gray-700 leading-8">

          <p>
            Перед початком тестування уважно ознайомтеся з правилами.
          </p>

          <ul className="list-disc ml-8 space-y-3">

            <li>
              Після початку тестування запускається таймер.
            </li>

            <li>
              Після завершення часу тест буде завершено автоматично.
            </li>

            <li>
              Для зарахування відповіді необхідно натиснути
              <strong> «Зберегти відповідь»</strong>.
            </li>

            <li>
              Незбережені відповіді не враховуються.
            </li>

            <li>
              Ви можете переходити між питаннями у будь-якому порядку.
            </li>

            <li>
              Після завершення тестування змінити відповіді буде неможливо.
            </li>

          </ul>

        </div>

        <div className="mt-10 flex items-center gap-4">

          <input
            id="agree"
            type="checkbox"
            checked={accepted}
            onChange={(e) =>
              setAccepted(e.target.checked)
            }
            className="w-5 h-5"
          />

          <label
            htmlFor="agree"
            className="text-lg"
          >
            Ознайомлений / Ознайомлена з правилами проходження тестування
          </label>

        </div>

        <div className="mt-10 flex justify-end">

          <button
            disabled={!accepted}
            onClick={async () => {
  try {
    await document.documentElement.requestFullscreen();

    router.push(`/test/${id}`);
  } catch {
    alert(
      "Для проходження тесту необхідно дозволити повноекранний режим."
    );
  }
}}
            className="
              px-8
              py-4
              rounded-xl
              text-white
              font-semibold
              transition
              disabled:bg-gray-400
              bg-[#7A1F2B]
              hover:bg-[#641823]
            "
          >
            Розпочати тестування
          </button>

        </div>

      </div>

    </main>
  );
}