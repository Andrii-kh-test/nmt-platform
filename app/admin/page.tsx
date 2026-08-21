import Link from "next/link";

const sections = [
  {
    title: "Тести",
    description:
      "Створення, редагування, публікація та керування тестами.",
    href: "/admin/tests",
    icon: "📚",
  },
  {
    title: "Предмети",
    description:
      "Керування предметами, які використовуються у тестуванні.",
    href: "/admin/subjects",
    icon: "📖",
  },
  {
    title: "Питання",
    description:
      "Банк завдань та керування питаннями для тестів.",
    href: "/admin/questions",
    icon: "❓",
  },
  {
    title: "Результати",
    description:
      "Перегляд результатів тестування та відповідей учасників.",
    href: "/admin/results",
    icon: "📊",
  },
  {
    title: "Аналітика",
    description:
      "Статистика, показники та детальний аналіз результатів.",
    href: "/admin/analytics",
    icon: "📈",
  },
  {
    title: "Моніторинг",
    description:
      "Контроль активних тестових сесій та проходження тестування.",
    href: "/admin/monitoring",
    icon: "🖥️",
  },
  {
    title: "Користувачі",
    description:
      "Керування користувачами та адміністративним доступом.",
    href: "/admin/users",
    icon: "👥",
  },
  {
    title: "Налаштування",
    description:
      "Налаштування параметрів та функцій платформи.",
    href: "/admin/settings",
    icon: "⚙️",
  },
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f6]">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        {/* HEADER */}

        <section className="mb-10">
          <div className="flex items-center gap-5">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7A1F2B] text-3xl shadow-lg">
              ⚙️
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#7A1F2B] sm:text-4xl">
                Адміністративна панель
              </h1>

              <p className="mt-2 text-base text-gray-500 sm:text-lg">
                Єдиний центр керування платформою тестування
              </p>
            </div>

          </div>
        </section>

        {/* РОЗДІЛИ */}

        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-gray-900">
              Розділи платформи
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Оберіть потрібний розділ для продовження роботи.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#7A1F2B]/30 hover:shadow-xl"
              >

                {/* Верхня смуга */}

                <div className="absolute left-0 right-0 top-0 h-1 bg-[#7A1F2B] opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex items-start justify-between">

                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#7A1F2B]/10 text-2xl transition-all duration-200 group-hover:bg-[#7A1F2B] group-hover:scale-105">
                    <span className="transition-transform group-hover:scale-110">
                      {section.icon}
                    </span>
                  </div>

                  <span className="text-xl text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#7A1F2B]">
                    →
                  </span>

                </div>

                <h3 className="mt-5 text-xl font-bold text-gray-900 transition-colors group-hover:text-[#7A1F2B]">
                  {section.title}
                </h3>

                <p className="mt-2 min-h-[72px] text-sm leading-6 text-gray-500">
                  {section.description}
                </p>

                <div className="mt-5 text-sm font-semibold text-[#7A1F2B]">
                  Відкрити розділ →
                </div>

              </Link>
            ))}

          </div>
        </section>

        {/* ШВИДКІ ДІЇ */}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">

          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Швидкі дії
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Найпоширеніші операції адміністратора.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <Link
              href="/admin/tests/new"
              className="inline-flex items-center justify-center rounded-xl bg-[#7A1F2B] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#651923] hover:shadow-md"
            >
              <span className="mr-2 text-lg">+</span>
              Створити тест
            </Link>

            <Link
              href="/admin/tests"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 text-sm font-semibold text-gray-700 transition hover:border-[#7A1F2B]/30 hover:bg-[#7A1F2B]/5 hover:text-[#7A1F2B]"
            >
              <span className="text-lg">📚</span>
              <span className="ml-2">
                Переглянути тести
              </span>
            </Link>

            <Link
              href="/admin/results"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 text-sm font-semibold text-gray-700 transition hover:border-[#7A1F2B]/30 hover:bg-[#7A1F2B]/5 hover:text-[#7A1F2B]"
            >
              <span className="text-lg">📊</span>
              <span className="ml-2">
                Переглянути результати
              </span>
            </Link>

            <Link
              href="/admin/monitoring"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 text-sm font-semibold text-gray-700 transition hover:border-[#7A1F2B]/30 hover:bg-[#7A1F2B]/5 hover:text-[#7A1F2B]"
            >
              <span className="text-lg">🖥️</span>
              <span className="ml-2">
                Відкрити моніторинг
              </span>
            </Link>

          </div>
        </section>

        {/* FOOTER */}

        <footer className="py-8 text-center text-xs text-gray-400">
          Платформа тестування
        </footer>

      </div>
    </main>
  );
}