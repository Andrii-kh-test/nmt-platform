"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/admin/login",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              login,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Неправильний логін або пароль."
        );

        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError(
        "Не вдалося виконати вхід. Спробуйте ще раз."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#4A111A] via-[#7A1F2B] to-[#B44A5A] px-4 py-10">
      {/* Декоративні елементи */}

      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

      <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />

      <div className="absolute inset-0 bg-black/10" />

      {/* ===================================================== */}
      {/* КАРТКА ВХОДУ */}
      {/* ===================================================== */}

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-white/30 bg-white/95 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          {/* Логотип / символ */}

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#F3E8EA] shadow-sm">
            <span className="text-4xl">
              🔐
            </span>
          </div>

          {/* Заголовок */}

          <div className="mt-7 text-center">
            <h1 className="text-3xl font-bold text-[#7A1F2B]">
              Вхід адміністратора
            </h1>

            <p className="mt-3 text-gray-500">
              Панель керування
              платформою тестування
            </p>
          </div>

          {/* ================================================= */}
          {/* ФОРМА */}
          {/* ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            {/* Логін */}

            <div>
              <label
                htmlFor="login"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Логін
              </label>

              <input
                id="login"
                type="text"
                value={login}
                onChange={(event) =>
                  setLogin(
                    event.target.value
                  )
                }
                placeholder="Введіть логін"
                autoComplete="username"
                required
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-3.5
                  text-gray-800
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-[#7A1F2B]
                  focus:ring-4
                  focus:ring-[#7A1F2B]/10
                "
              />
            </div>

            {/* Пароль */}

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Пароль
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Введіть пароль"
                autoComplete="current-password"
                required
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-3.5
                  text-gray-800
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-[#7A1F2B]
                  focus:ring-4
                  focus:ring-[#7A1F2B]/10
                "
              />
            </div>

            {/* Помилка */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Кнопка */}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                rounded-xl
                bg-[#7A1F2B]
                px-5
                py-3.5
                font-semibold
                text-white
                shadow-lg
                shadow-[#7A1F2B]/20
                transition
                hover:bg-[#641923]
                hover:shadow-xl
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading
                ? "Виконується вхід..."
                : "Увійти"}
            </button>
          </form>

          {/* Нижній напис */}

          <div className="mt-8 border-t border-gray-200 pt-6 text-center">
            <p className="text-xs text-gray-400">
              Доступ дозволено лише
              адміністраторам платформи
            </p>
          </div>
        </div>

        {/* Підпис поза карткою */}

        <p className="relative mt-6 text-center text-sm text-white/70">
          Платформа тестування
        </p>
      </div>
    </main>
  );
}