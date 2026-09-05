"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  KeyRound,
  UserRound,
} from "lucide-react";

type ComplexTestInfo = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  examType: string;
  codeRequired: boolean;
};

export default function ComplexTestStartPage() {
  const router = useRouter();
  const params = useParams();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [complexTest, setComplexTest] =
    useState<ComplexTestInfo | null>(null);

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTest() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/complex-tests/${id}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(
            data.message ||
              "Не вдалося завантажити комбінований тест."
          );
          return;
        }

        setComplexTest(data.complexTest);
      } catch (error) {
        console.error(error);

        setError(
          "Не вдалося завантажити комбінований тест."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadTest();
    }
  }, [id]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!lastName.trim()) {
      setError("Введіть прізвище.");
      return;
    }

    if (!firstName.trim()) {
      setError("Введіть ім’я.");
      return;
    }

    if (complexTest?.codeRequired && !accessCode.trim()) {
      setError("Введіть код доступу.");
      return;
    }

    try {
      setChecking(true);

      const response = await fetch(
        `/api/complex-tests/${id}/check-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessCode: accessCode.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Неправильний код доступу."
        );
        return;
      }

      sessionStorage.setItem(
        `complex-test-participant-${id}`,
        JSON.stringify({
          lastName: lastName.trim(),
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          accessCode: accessCode.trim(),
        })
      );

      router.push(
        `/complex-tests/${id}/instructions`
      );
    } catch (error) {
      console.error(error);

      setError(
        "Не вдалося перевірити код доступу. Спробуйте ще раз."
      );
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-gray-500 text-lg">
          Завантаження...
        </div>
      </main>
    );
  }

  if (error && !complexTest) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">
            Не вдалося завантажити тест
          </h1>

          <p className="mt-4 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/complex-tests")
            }
            className="mt-8 rounded-xl bg-[#7A1F2B] px-7 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Повернутися до комбінованих тестів
          </button>
        </div>
      </main>
    );
  }

  if (!complexTest) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">
      <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
        <button
          type="button"
          onClick={() =>
            router.push(`/complex-tests/${id}`)
          }
          className="mb-8 inline-flex items-center gap-2 text-gray-500 transition hover:text-[#7A1F2B]"
        >
          <ArrowLeft className="h-5 w-5" />
          Назад до опису тесту
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-10 shadow-sm">
          {/* Заголовок */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#7A1F2B] shadow-md">
              <UserRound
                className="h-8 w-8 text-white"
                strokeWidth={2}
              />
            </div>

            <div className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-[#7A1F2B]">
              {complexTest.examType}
            </div>

            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-[#7A1F2B]">
              {complexTest.title}
            </h1>

            <p className="mt-4 text-gray-600">
              Для початку тестування введіть свої
              персональні дані та код доступу.
            </p>
          </div>

          {/* Форма */}
          <form
            onSubmit={handleSubmit}
            className="mt-10 space-y-6"
          >
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-semibold text-gray-700"
              >
                Прізвище
              </label>

              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(event) =>
                  setLastName(event.target.value)
                }
                autoComplete="family-name"
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-[#7A1F2B] focus:ring-2 focus:ring-[#7A1F2B]/10"
                placeholder="Введіть прізвище"
              />
            </div>

            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-semibold text-gray-700"
              >
                Ім’я
              </label>

              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(event) =>
                  setFirstName(event.target.value)
                }
                autoComplete="given-name"
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-[#7A1F2B] focus:ring-2 focus:ring-[#7A1F2B]/10"
                placeholder="Введіть ім’я"
              />
            </div>

            <div>
              <label
                htmlFor="middleName"
                className="block text-sm font-semibold text-gray-700"
              >
                По батькові
                <span className="ml-2 font-normal text-gray-400">
                  (необов’язково)
                </span>
              </label>

              <input
                id="middleName"
                type="text"
                value={middleName}
                onChange={(event) =>
                  setMiddleName(event.target.value)
                }
                autoComplete="additional-name"
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-[#7A1F2B] focus:ring-2 focus:ring-[#7A1F2B]/10"
                placeholder="Введіть по батькові"
              />
            </div>

            {complexTest.codeRequired && (
              <div>
                <label
                  htmlFor="accessCode"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Код доступу
                </label>

                <div className="relative mt-2">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                  <input
                    id="accessCode"
                    type="text"
                    value={accessCode}
                    onChange={(event) =>
                      setAccessCode(event.target.value)
                    }
                    autoComplete="off"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-800 outline-none transition focus:border-[#7A1F2B] focus:ring-2 focus:ring-[#7A1F2B]/10"
                    placeholder="Введіть код доступу"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={checking}
              className="w-full rounded-xl bg-[#7A1F2B] px-6 py-4 text-lg font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checking
                ? "Перевірка коду..."
                : "Продовжити"}
            </button>
          </form>
        </div>
      </div>

      <footer className="mt-12 border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-8 text-center">
          <p className="font-medium text-gray-700">
            © Хорунжий Андрій Володимирович, 2026
          </p>

          <div className="flex items-center gap-2 text-gray-500">
            <Brain
              className="h-5 w-5 text-[#7A1F2B]"
              strokeWidth={2}
            />
            <span>
              Створено за підтримки технологій штучного інтелекту
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}