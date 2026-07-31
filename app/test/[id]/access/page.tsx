"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function AccessPage() {
  const router = useRouter();
  const params = useParams();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function checkCode() {
    if (code.trim() === "") {
      setError("Введіть код доступу.");
      return;
    }

    // Поки що просто переходимо далі.
    // Перевірку з базою реалізуємо наступним уроком.

    router.push(`/test/${params.id}/participant`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">

      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-lg">

        <h1 className="text-3xl font-bold text-[#7A1F2B] mb-8 text-center">
          Код доступу
        </h1>

        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError("");
          }}
          placeholder="Введіть код"
          className="w-full border rounded-lg p-4 text-lg"
        />

        {error && (
          <p className="text-red-600 mt-3">
            {error}
          </p>
        )}

        <button
          onClick={checkCode}
          className="mt-8 w-full bg-[#7A1F2B] hover:bg-[#641823] text-white py-4 rounded-lg text-lg font-semibold transition"
        >
          Продовжити
        </button>

      </div>

    </main>
  );
}