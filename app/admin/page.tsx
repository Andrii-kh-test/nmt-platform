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

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="relative mb-8 overflow-hidden rounded-3xl bg-[#7A1F2B] px-7 py-9 shadow-xl sm:px-10 sm:py-11">

          {/* Декоративні кола */}

          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-24
              h-72
              w-72
              rounded-full
              bg-white/[0.06]
              blur-[1px]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-28
              right-28
              h-64
              w-64
              rounded-full
              bg-white/[0.05]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -left-24
              bottom-[-120px]
              h-72
              w-72
              rounded-full
              bg-black/[0.08]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              left-[38%]
              top-[-100px]
              h-56
              w-56
              rounded-full
              bg-black/[0.06]
            "
          />

          {/* Контент */}

          <div className="relative z-10">

            {/* Основний напис */}

            <h1
              className="
                text-4xl
                font-extrabold
                tracking-tight
                text-white
                sm:text-5xl
              "
            >
              Адміністративна панель
            </h1>

            {/* Другий рівень */}

            <p
              className="
                mt-3
                text-lg
                font-medium
                text-white/80
                sm:text-xl
              "
            >
              Єдиний центр керування платформою тестування
            </p>

          </div>
        </header>

        {/* =====================================================
            РОЗДІЛИ
        ===================================================== */}

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
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-2xl
                  border
                  border-gray-200
                  bg-white
                  p-6
                  shadow-sm
                  transition-all
                  duration-200
                  hover:-translate-y-1
                  hover:border-[#7A1F2B]/30
                  hover:shadow-xl
                "
              >

                {/* Верхня бордова смуга */}

                <div
                  className="
                    absolute
                    left-0
                    right-0
                    top-0
                    h-1
                    bg-[#7A1F2B]
                    opacity-0
                    transition-opacity
                    group-hover:opacity-100
                  "
                />

                <div className="flex items-start justify-between">

                  {/* Іконка */}

                  <div
                    className="
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-xl
                      bg-[#7A1F2B]/10
                      text-2xl
                      transition-all
                      duration-200
                      group-hover:scale-105
                      group-hover:bg-[#7A1F2B]
                    "
                  >
                    <span className="transition-transform group-hover:scale-110">
                      {section.icon}
                    </span>
                  </div>

                  {/* Стрілка */}

                  <span
                    className="
                      text-xl
                      text-gray-300
                      transition-all
                      duration-200
                      group-hover:translate-x-1
                      group-hover:text-[#7A1F2B]
                    "
                  >
                    →
                  </span>

                </div>

                {/* Назва */}

                <h3
                  className="
                    mt-5
                    text-xl
                    font-bold
                    text-gray-900
                    transition-colors
                    group-hover:text-[#7A1F2B]
                  "
                >
                  {section.title}
                </h3>

                {/* Опис */}

                <p className="mt-2 min-h-[72px] text-sm leading-6 text-gray-500">
                  {section.description}
                </p>

                {/* Посилання */}

                <div className="mt-5 text-sm font-semibold text-[#7A1F2B]">
                  Відкрити розділ →
                </div>

              </Link>
            ))}

          </div>
        </section>

        {/* =====================================================
            ШВИДКІ ДІЇ
        ===================================================== */}

        <section
          className="
            mt-8
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-6
            shadow-sm
            sm:p-7
          "
        >

          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Швидкі дії
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Найпоширеніші операції адміністратора.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {/* Створити тест */}

            <Link
              href="/admin/tests/new"
              className="
                inline-flex
                items-center
                justify-center
                rounded-xl
                bg-[#7A1F2B]
                px-5
                py-3.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-[#651923]
                hover:shadow-md
              "
            >
              <span className="mr-2 text-lg">
                +
              </span>

              Створити тест
            </Link>

            {/* Переглянути тести */}

            <Link
              href="/admin/tests"
              className="
                inline-flex
                items-center
                justify-center
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                px-5
                py-3.5
                text-sm
                font-semibold
                text-gray-700
                transition
                hover:border-[#7A1F2B]/30
                hover:bg-[#7A1F2B]/5
                hover:text-[#7A1F2B]
              "
            >
              <span className="text-lg">
                📚
              </span>

              <span className="ml-2">
                Переглянути тести
              </span>
            </Link>

            {/* Переглянути результати */}

            <Link
              href="/admin/results"
              className="
                inline-flex
                items-center
                justify-center
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                px-5
                py-3.5
                text-sm
                font-semibold
                text-gray-700
                transition
                hover:border-[#7A1F2B]/30
                hover:bg-[#7A1F2B]/5
                hover:text-[#7A1F2B]
              "
            >
              <span className="text-lg">
                📊
              </span>

              <span className="ml-2">
                Переглянути результати
              </span>
            </Link>

            {/* Моніторинг */}

            <Link
              href="/admin/monitoring"
              className="
                inline-flex
                items-center
                justify-center
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                px-5
                py-3.5
                text-sm
                font-semibold
                text-gray-700
                transition
                hover:border-[#7A1F2B]/30
                hover:bg-[#7A1F2B]/5
                hover:text-[#7A1F2B]
              "
            >
              <span className="text-lg">
                🖥️
              </span>

              <span className="ml-2">
                Відкрити моніторинг
              </span>
            </Link>

          </div>
        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="py-8 text-center text-xs text-gray-400">
          Платформа тестування
        </footer>

      </div>
    </main>
  );
}