"use client";

import { useState } from "react";

export type ParticipantData = {
  lastName: string;
  firstName: string;
  middleName: string;
  accessCode: string;
};

type Props = {
  onSubmit: (data: ParticipantData) => void;

  testId?: number;
};

export default function ParticipantForm({
  onSubmit,
  testId,
}: Props) {
  const [form, setForm] = useState<ParticipantData>({
    lastName: "",
    firstName: "",
    middleName: "",
    accessCode: "",
  });

  const [loading, setLoading] = useState(false);

  function updateField(
    field: keyof ParticipantData,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }
if (!testId) {
  alert("Не вдалося визначити тест.");
  return;
}
  async function handleStart() {
    if (
      !form.lastName.trim() ||
      !form.firstName.trim() ||
      !form.middleName.trim()
    ) {
      alert("Заповніть прізвище, ім'я та по батькові.");

      return;
    }

    if (!form.accessCode.trim()) {
      alert("Введіть код доступу.");

      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/test/start", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          testId,

          lastName: form.lastName,

          firstName: form.firstName,

          middleName: form.middleName,

          accessCode: form.accessCode,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message ?? "Помилка запуску тесту.");

        return;
      }

      onSubmit(form);
    } catch (error) {
      console.error(error);

      alert("Помилка з'єднання із сервером.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8">

      <h1 className="text-3xl font-bold text-[#7A1F2B] mb-8 text-center">
        Допуск до тестування
      </h1>

      <div className="space-y-5">

        <input
          type="text"
          placeholder="Прізвище"
          value={form.lastName}
          onChange={(e) =>
            updateField("lastName", e.target.value)
          }
          className="w-full border rounded-lg p-3"
        />

        <input
          type="text"
          placeholder="Ім'я"
          value={form.firstName}
          onChange={(e) =>
            updateField("firstName", e.target.value)
          }
          className="w-full border rounded-lg p-3"
        />

        <input
          type="text"
          placeholder="По батькові"
          value={form.middleName}
          onChange={(e) =>
            updateField("middleName", e.target.value)
          }
          className="w-full border rounded-lg p-3"
        />

        <input
          type="text"
          placeholder="Код доступу"
          value={form.accessCode}
          onChange={(e) =>
            updateField("accessCode", e.target.value)
          }
          className="w-full border rounded-lg p-3"
        />

        <button
          type="button"
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-[#7A1F2B] hover:bg-[#651923] disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
        >
          {loading
            ? "Перевірка..."
            : "Розпочати тестування"}
        </button>

      </div>

    </div>
  );
}