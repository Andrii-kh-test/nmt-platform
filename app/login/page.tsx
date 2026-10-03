"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Введіть email та пароль.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Не вдалося виконати вхід."
        );
      }

      /*
       * API вже встановив auth_session cookie.
       * Після цього переходимо до відповідного кабінету.
       */
      router.push(data.redirectTo || "/cabinet");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Сталася помилка під час входу."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#64152d] px-4 py-10 md:py-16">
      {/* =========================================================
          ДЕКОРАТИВНІ КРУГИ
      ========================================================= */}

      <div className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full border-[70px] border-white/10" />

      <div className="pointer-events-none absolute -right-48 -top-20 h-[38rem] w-[38rem] rounded-full bg-white/10" />

      <div className="pointer-events-none absolute -bottom-56 -left-20 h-[30rem] w-[30rem] rounded-full bg-white/5" />

      <div className="pointer-events-none absolute bottom-10 right-[-100px] h-72 w-72 rounded-full border-[45px] border-white/10" />

      <div className="pointer-events-none absolute left-[12%] top-[38%] h-8 w-8 rounded-full bg-white/15" />

      <div className="pointer-events-none absolute right-[15%] bottom-[25%] h-12 w-12 rounded-full bg-white/10" />

      {/* =========================================================
          КОНТЕНТ
      ========================================================= */}

      <div className="relative z-10 mx-auto max-w-lg">
        {/* =======================================================
            ЗАГОЛОВОК
        ======================================================= */}

        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-extrabold text-[#64152d] shadow-2xl">
            Т
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Вхід
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/75 md:text-base">
            Увійдіть до свого облікового запису
          </p>
        </div>

        {/* =======================================================
            КАРТКА
        ======================================================= */}

        <div className="rounded-[30px] bg-white p-6 shadow-2xl md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ===================================================
                EMAIL
            =================================================== */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#64152d] focus:bg-white focus:ring-4 focus:ring-[#64152d]/10"
                placeholder="example@email.com"
              />
            </div>

            {/* ===================================================
                ПАРОЛЬ
            =================================================== */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">
                  Пароль
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#64152d] hover:underline"
                >
                  Забули пароль?
                </Link>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#64152d] focus:bg-white focus:ring-4 focus:ring-[#64152d]/10"
                placeholder="Введіть пароль"
              />
            </div>

            {/* ===================================================
                ПОМИЛКА
            =================================================== */}

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
                  !
                </div>

                <div>{error}</div>
              </div>
            )}

            {/* ===================================================
                КНОПКА
            =================================================== */}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-[#64152d] px-6 py-3.5 font-bold text-white shadow-lg transition-all duration-200 hover:bg-[#501023] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="relative z-10">
                {loading ? "Вхід..." : "Увійти"}
              </span>

              <span className="absolute -right-5 -top-8 h-20 w-20 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-150" />
            </button>
          </form>

          {/* =====================================================
              РЕЄСТРАЦІЯ
          ===================================================== */}

          <div className="mt-8 border-t border-gray-100 pt-6 text-center text-sm text-gray-600">
            Ще не маєте облікового запису?{" "}
            <Link
              href="/register"
              className="font-bold text-[#64152d] transition hover:text-[#501023] hover:underline"
            >
              Зареєструватися
            </Link>
          </div>
        </div>

        {/* =======================================================
            ПІДПИС
        ======================================================= */}

        <div className="mt-6 text-center text-xs text-white/50">
          Платформа комп’ютерного тестування
        </div>
      </div>
    </main>
  );
}