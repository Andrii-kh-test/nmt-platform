"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Role = "PARTICIPANT" | "TEACHER";

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("PARTICIPANT");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [institution, setInstitution] = useState("");
  const [position, setPosition] = useState("");
  const [subject, setSubject] = useState("");
  const [locality, setLocality] = useState("");

  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Паролі не збігаються.");
      return;
    }

    if (password.length < 8) {
      setError("Пароль має містити щонайменше 8 символів.");
      return;
    }

    if (!agree) {
      setError("Потрібно погодитися з умовами використання платформи.");
      return;
    }

    if (role === "TEACHER") {
      if (!institution || !position || !subject || !locality) {
        setError("Заповніть усі професійні дані.");
        return;
      }
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          role,
          institution,
          position,
          subject,
          locality,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не вдалося зареєструватися.");
      }

      if (role === "TEACHER") {
        setSuccess(
          "Реєстрацію виконано. Вашу заявку на статус викладача передано адміністратору. Після перевірки ви отримаєте доступ до кабінету викладача."
        );
      } else {
        setSuccess(
          "Реєстрацію успішно завершено. Тепер ви можете увійти до свого кабінету."
        );
      }

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Сталася помилка під час реєстрації."
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

      {/* Маленькі декоративні круги */}
      <div className="pointer-events-none absolute left-[12%] top-[38%] h-8 w-8 rounded-full bg-white/15" />

      <div className="pointer-events-none absolute right-[15%] bottom-[25%] h-12 w-12 rounded-full bg-white/10" />

      {/* =========================================================
          КОНТЕНТ
      ========================================================= */}

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* =======================================================
            ЗАГОЛОВОК
        ======================================================= */}

        <div className="mb-8 text-center text-white">
          {/* Логотип */}
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-extrabold text-[#64152d] shadow-2xl">
            Т
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Реєстрація
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/75 md:text-base">
            Створіть обліковий запис на платформі комп’ютерного тестування
          </p>
        </div>

        {/* =======================================================
            ОСНОВНА КАРТКА
        ======================================================= */}

        <div className="rounded-[30px] bg-white p-6 shadow-2xl md:p-10">
          {/* =====================================================
              ВИБІР РОЛІ
          ===================================================== */}

          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Оберіть тип облікового запису
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Від цього залежатиме доступний функціонал платформи.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Учасник */}
              <button
                type="button"
                onClick={() => setRole("PARTICIPANT")}
                className={`group rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                  role === "PARTICIPANT"
                    ? "border-[#64152d] bg-[#64152d]/5 shadow-md"
                    : "border-gray-200 bg-white hover:border-[#64152d]/40 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition ${
                      role === "PARTICIPANT"
                        ? "bg-[#64152d] text-white"
                        : "bg-gray-100 text-gray-500 group-hover:bg-[#64152d]/10"
                    }`}
                  >
                    <svg
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19a6 6 0 00-12 0M9 11a4 4 0 100-8 4 4 0 000 8z"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 11a4 4 0 100-8M17 13a6 6 0 014 5.65"
                      />
                    </svg>
                  </div>

                  <div>
                    <div className="font-bold text-gray-900">
                      Учасник тестування
                    </div>

                    <div className="mt-1 text-sm leading-5 text-gray-500">
                      Для проходження НМТ, ЄВІ, ЄФВВ та інших тестів
                    </div>
                  </div>
                </div>
              </button>

              {/* Викладач */}
              <button
                type="button"
                onClick={() => setRole("TEACHER")}
                className={`group rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                  role === "TEACHER"
                    ? "border-[#64152d] bg-[#64152d]/5 shadow-md"
                    : "border-gray-200 bg-white hover:border-[#64152d]/40 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition ${
                      role === "TEACHER"
                        ? "bg-[#64152d] text-white"
                        : "bg-gray-100 text-gray-500 group-hover:bg-[#64152d]/10"
                    }`}
                  >
                    <svg
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 14a4 4 0 100-8 4 4 0 000 8z"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 21a8 8 0 0116 0"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 3h4v4M21 3l-4 4"
                      />
                    </svg>
                  </div>

                  <div>
                    <div className="font-bold text-gray-900">
                      Викладач / учитель
                    </div>

                    <div className="mt-1 text-sm leading-5 text-gray-500">
                      Для роботи з тестами, групами та результатами учнів
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* =====================================================
              ПОВІДОМЛЕННЯ ПРО ПЕРЕВІРКУ ВИКЛАДАЧА
          ===================================================== */}

          {role === "TEACHER" && (
            <div className="mb-7 flex gap-3 rounded-2xl border border-[#d8b5c0] bg-[#f8eef1] p-4 text-sm text-[#64152d]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#64152d] font-bold text-white">
                !
              </div>

              <div>
                <div className="font-bold">
                  Потрібне підтвердження адміністратора
                </div>

                <p className="mt-1 leading-5 text-[#64152d]/75">
                  Після реєстрації вашу заявку буде передано адміністратору.
                  Права викладача надаються лише після перевірки.
                </p>
              </div>
            </div>
          )}

          {/* =====================================================
              ФОРМА
          ===================================================== */}

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* ===================================================
                ОСОБИСТІ ДАНІ
            =================================================== */}

            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#64152d]" />

                <h3 className="text-base font-bold text-gray-900">
                  Особисті дані
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Ім'я */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Ім’я
                  </label>

                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#64152d] focus:bg-white focus:ring-4 focus:ring-[#64152d]/10"
                    placeholder="Ваше ім’я"
                  />
                </div>

                {/* Прізвище */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Прізвище
                  </label>

                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#64152d] focus:bg-white focus:ring-4 focus:ring-[#64152d]/10"
                    placeholder="Ваше прізвище"
                  />
                </div>
              </div>
            </section>

            {/* ===================================================
                ДАНІ ДЛЯ ВХОДУ
            =================================================== */}

            <section className="border-t border-gray-100 pt-7">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#64152d]" />

                <h3 className="text-base font-bold text-gray-900">
                  Дані для входу
                </h3>
              </div>

              <div className="space-y-5">
                {/* Email */}
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
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#64152d] focus:bg-white focus:ring-4 focus:ring-[#64152d]/10"
                    placeholder="example@email.com"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Пароль */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Пароль
                    </label>

                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#64152d] focus:bg-white focus:ring-4 focus:ring-[#64152d]/10"
                      placeholder="Мінімум 8 символів"
                    />
                  </div>

                  {/* Підтвердження */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Підтвердження пароля
                    </label>

                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#64152d] focus:bg-white focus:ring-4 focus:ring-[#64152d]/10"
                      placeholder="Повторіть пароль"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ===================================================
                ПРОФЕСІЙНІ ДАНІ ВИКЛАДАЧА
            =================================================== */}

            {role === "TEACHER" && (
              <section className="border-t border-gray-100 pt-7">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#64152d]" />

                  <h3 className="text-base font-bold text-gray-900">
                    Професійні дані
                  </h3>
                </div>

                <div className="space-y-5">
                  {/* Заклад */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Заклад освіти
                    </label>

                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      required
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#64152d] focus:bg-white focus:ring-4 focus:ring-[#64152d]/10"
                      placeholder="Назва закладу освіти"
                    />
                  </div>

                  {/* Посада + предмет */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Посада
                      </label>

                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        required
                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#64152d] focus:bg-white focus:ring-4 focus:ring-[#64152d]/10"
                        placeholder="Учитель української мови"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Предмет
                      </label>

                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#64152d] focus:bg-white focus:ring-4 focus:ring-[#64152d]/10"
                        placeholder="Українська мова"
                      />
                    </div>
                  </div>

                  {/* Населений пункт */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Населений пункт
                    </label>

                    <input
                      type="text"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      required
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#64152d] focus:bg-white focus:ring-4 focus:ring-[#64152d]/10"
                      placeholder="Харків"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* ===================================================
                ЗГОДА
            =================================================== */}

            <section className="border-t border-gray-100 pt-7">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl p-2 transition hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#64152d]"
                />

                <span className="text-sm leading-5 text-gray-600">
                  Погоджуюся з умовами використання платформи та правилами
                  обробки даних.
                </span>
              </label>
            </section>

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
                УСПІХ
            =================================================== */}

            {success && (
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 font-bold">
                  ✓
                </div>

                <div>{success}</div>
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
                {loading ? "Реєстрація..." : "Зареєструватися"}
              </span>

              <span className="absolute -right-5 -top-8 h-20 w-20 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-150" />
            </button>
          </form>

          {/* =====================================================
              ВХІД
          ===================================================== */}

          <div className="mt-8 border-t border-gray-100 pt-6 text-center text-sm text-gray-600">
            Уже маєте обліковий запис?{" "}
            <Link
              href="/login"
              className="font-bold text-[#64152d] transition hover:text-[#501023] hover:underline"
            >
              Увійти
            </Link>
          </div>
        </div>

        {/* =======================================================
            НИЖНІЙ ПІДПИС
        ======================================================= */}

        <div className="mt-6 text-center text-xs text-white/50">
          Платформа комп’ютерного тестування
        </div>
      </div>
    </main>
  );
}