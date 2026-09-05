"use client";

import { useState } from "react";

export default function NewSubjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      alert("Введіть назву розділу.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/admin/subjects",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            description:
              description.trim() || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(
          result.message ||
            "Не вдалося створити розділ."
        );
        return;
      }

      alert("Розділ успішно створено!");

      window.location.href = "/admin/tests";
    } catch (error) {
      console.error(
        "CREATE SUBJECT ERROR:",
        error
      );

      alert(
        "Сталася помилка під час створення розділу."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-3xl mx-auto py-10 px-8">

        {/* ==========================
            ЗАГОЛОВОК
        ========================== */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#7A1F2B]">
            Створення розділу
          </h1>

          <p className="text-gray-600 mt-2">
            Створіть новий розділ для групування
            тестів у банку тестів.
          </p>
        </div>

        {/* ==========================
            ФОРМА
        ========================== */}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8 space-y-6"
        >

          {/* НАЗВА */}

          <div>
            <label
              htmlFor="subject-name"
              className="block font-medium mb-2"
            >
              Назва розділу
            </label>

            <input
              id="subject-name"
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Наприклад: Українська мова"
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#7A1F2B]"
              autoFocus
            />

            <p className="text-sm text-gray-500 mt-2">
              Ця назва відображатиметься в банку
              тестів і в конструкторі тесту.
            </p>
          </div>

          {/* ОПИС */}

          <div>
            <label
              htmlFor="subject-description"
              className="block font-medium mb-2"
            >
              Опис розділу
              <span className="text-gray-400 font-normal">
                {" "}
                (необов'язково)
              </span>
            </label>

            <textarea
              id="subject-description"
              rows={4}
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Короткий опис розділу..."
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#7A1F2B]"
            />
          </div>

          {/* КНОПКИ */}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">

            <button
              type="submit"
              disabled={saving}
              className="
                flex-1
                bg-[#7A1F2B]
                hover:bg-[#651923]
                disabled:opacity-50
                disabled:cursor-not-allowed
                text-white
                rounded-lg
                py-3
                font-semibold
                transition
              "
            >
              {saving
                ? "Створення..."
                : "Створити розділ"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => {
                window.location.href =
                  "/admin/tests";
              }}
              className="
                flex-1
                border
                border-gray-300
                hover:bg-gray-100
                disabled:opacity-50
                text-gray-700
                rounded-lg
                py-3
                font-semibold
                transition
              "
            >
              Скасувати
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}