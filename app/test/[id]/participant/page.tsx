"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ParticipantPage() {
  const router = useRouter();
  const params = useParams();

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");

  const [error, setError] = useState("");

  function continueToInstruction() {
    if (
      !lastName.trim() ||
      !firstName.trim() ||
      !middleName.trim()
    ) {
      setError("Заповніть усі поля.");
      return;
    }

    sessionStorage.setItem(
      "participant",
      JSON.stringify({
        lastName,
        firstName,
        middleName,
      })
    );

    router.push(`/test/${params.id}/instruction`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">

      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-xl">

        <h1 className="text-3xl font-bold text-[#7A1F2B] mb-8 text-center">
          Дані учасника
        </h1>

        <div className="space-y-5">

          <input
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setError("");
            }}
            placeholder="Прізвище"
            className="w-full border rounded-lg p-4"
          />

          <input
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setError("");
            }}
            placeholder="Ім'я"
            className="w-full border rounded-lg p-4"
          />

          <input
            value={middleName}
            onChange={(e) => {
              setMiddleName(e.target.value);
              setError("");
            }}
            placeholder="По батькові"
            className="w-full border rounded-lg p-4"
          />

        </div>

        {error && (
          <p className="text-red-600 mt-4">
            {error}
          </p>
        )}

        <button
          onClick={continueToInstruction}
          className="mt-8 w-full bg-[#7A1F2B] hover:bg-[#641823] text-white py-4 rounded-lg font-semibold transition"
        >
          Продовжити
        </button>

      </div>

    </main>
  );
}