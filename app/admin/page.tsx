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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* ============================================================
            HEADER — АДМІНІСТРАТИВНА ПАНЕЛЬ
        ============================================================ */}

        <header
          className="
            relative
            mb-8
            overflow-hidden
            rounded-3xl
            bg-[#7A1F2B]
            shadow-xl
          "
        >
          {/* Декоративні кола */}

          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-28
              h-80
              w-80
              rounded-full
              bg-white/[0.07]
              shadow-[0_0_80px_rgba(255,255,255,0.08)]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-36
              right-20
              h-72
              w-72
              rounded-full
              bg-white/[0.05]
              shadow-[0_0_70px_rgba(0,0,0,0.15)]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -left-24
              bottom-[-170px]
              h-96
              w-96
              rounded-full
              bg-black/[0.06]
              shadow-[0_0_90px_rgba(0,0,0,0.12)]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              left-[42%]
              top-[-110px]
              h-56
              w-56
              rounded-full
              border
              border-white/[0.06]
            "
          />

          {/* Основний вміст */}

          <div
            className="
              relative
              z-10
              px-6
              py-8
              sm:px-8
              sm:py-10
              lg:px-10
              lg:py-12
            "
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

              <div className="max-w-3xl">

                <div
                  className="
                    mb-3
                    text-sm
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    text-white/65
                  "
                >
                  Адміністративна панель
                </div>

                <h1
                  className="
                    text-3xl
                    font-bold
                    leading-tight
                    tracking-tight
                    text-white
                    sm:text-4xl
                    lg:text-5xl
                  "
                >
                  Єдиний центр керування
                  <span className="block">
                    платформою тестування
                  </span>
                </h1>

                <p
                  className="
                    mt-4
                    max-w-2xl
                    text-sm
                    leading-6
                    text-white/75
                    sm:text-base
                    sm:leading-7
                  "
                >
                  Створюйте та редагуйте тести, керуйте банком
                  завдань, переглядайте результати, контролюйте
                  тестові сесії та аналізуйте роботу платформи.
                </p>

              </div>

              {/* Кнопка повернення */}

              <div className="shrink-0">

                <Link
                  href="/"
                  className="
                    inline-flex
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-white/25
                    bg-white/10
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    backdrop-blur-sm
                    transition-all
                    duration-200
                    hover:bg-white
                    hover:text-[#7A1F2B]
                    hover:shadow-lg
                  "
                >
                  <span className="mr-2 text-base">
                    ←
                  </span>

                  На головну
                </Link>

              </div>

            </div>
          </div>
        </header>

        {/* ============================================================
            РОЗДІЛИ
        ============================================================ */}

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
                {/* Верхня смуга */}

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
                    <span
                      className="
                        transition-transform
                        group-hover:scale-110
                      "
                    >
                      {section.icon}
                    </span>
                  </div>

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

                <p
                  className="
                    mt-2
                    min-h-[72px]
                    text-sm
                    leading-6
                    text-gray-500
                  "
                >
                  {section.description}
                </p>

                <div
                  className="
                    mt-5
                    text-sm
                    font-semibold
                    text-[#7A1F2B]
                  "
                >
                  Відкрити розділ →
                </div>

              </Link>
            ))}

          </div>
        </section>

        {/* ============================================================
            ШВИДКІ ДІЇ
        ============================================================ */}

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

        {/* ============================================================
            FOOTER
        ============================================================ */}

        <footer
          className="
            py-8
            text-center
            text-xs
            text-gray-400
          "
        >
          Платформа тестування
        </footer>

      </div>
    </main>
  );
}