import Link from "next/link";

import { getCurrentUser } from "@/app/lib/auth/session";

const sections = [
  {
    title: "Головна",
    href: "/cabinet",
    icon: "🏠",
  },
  {
    title: "Тести",
    href: "/cabinet/tests",
    icon: "📚",
  },
  {
    title: "Результати",
    href: "/cabinet/results",
    icon: "📊",
  },
  {
    title: "Аналітика",
    href: "/cabinet/analytics",
    icon: "📈",
  },
  {
    title: "Мій тариф",
    href: "/cabinet/plan",
    icon: "💎",
  },
  {
    title: "Баланс",
    href: "/cabinet/balance",
    icon: "💳",
  },
  {
    title: "Профіль",
    href: "/cabinet/profile",
    icon: "👤",
  },
];

export default async function CabinetPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="space-y-8">

      {/* =====================================================
          ВІТАЛЬНИЙ БЛОК
          ===================================================== */}

      <section className="relative overflow-hidden rounded-xl bg-white p-8 shadow-sm">

        {/* Декоративний бордовий елемент */}

        <div
          className="
            absolute
            -right-16
            -top-16
            h-48
            w-48
            rounded-full
            bg-[#F3E8EA]
          "
        />

        <div
          className="
            absolute
            -bottom-20
            -right-8
            h-36
            w-36
            rounded-full
            border-[18px]
            border-[#F8F0F2]
          "
        />

        <div className="relative z-10">

          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#7A1F2B]">
            ОСОБИСТИЙ КАБІНЕТ
          </p>

          <h1 className="text-4xl font-bold leading-tight text-gray-800 md:text-5xl">

            Вітаємо{" "}

            <span className="font-serif italic text-[#7A1F2B]">
              {fullName}!
            </span>

          </h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-500">
            Раді бачити вас на платформі комп'ютерного тестування.
            Обирайте потрібний розділ та продовжуйте підготовку.
          </p>

        </div>

      </section>


      {/* =====================================================
          РОЗДІЛИ
          ===================================================== */}

      <section>

        <div className="mb-5 flex items-end justify-between">

          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Розділи кабінету
            </h2>

            <p className="mt-1 text-gray-500">
              Усе необхідне для вашого тестування
            </p>
          </div>

        </div>


        {/* ===================================================
            КАРТКИ
            =================================================== */}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {sections.map((section, index) => (
            <Link
              key={section.href}
              href={section.href}
              className={`
                group
                rounded-xl
                border
                p-6
                shadow-sm
                transition-all
                duration-200
                hover:-translate-y-1
                hover:shadow-md

                ${
                  index === 0
                    ? "border-[#7A1F2B] bg-[#7A1F2B] text-white"
                    : "border-gray-200 bg-white hover:border-[#DDBCC3] hover:bg-[#FDF9FA]"
                }
              `}
            >

              <div className="flex items-start justify-between">

                <div
                  className={`
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-xl
                    text-3xl

                    ${
                      index === 0
                        ? "bg-white/15"
                        : "bg-[#F3E8EA]"
                    }
                  `}
                >
                  {section.icon}
                </div>

                <span
                  className={`
                    text-sm
                    font-semibold

                    ${
                      index === 0
                        ? "text-white/50"
                        : "text-gray-300"
                    }
                  `}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

              </div>


              <div className="mt-8 flex items-center justify-between">

                <div>

                  <h3
                    className={`
                      text-xl
                      font-bold

                      ${
                        index === 0
                          ? "text-white"
                          : "text-gray-800"
                      }
                    `}
                  >
                    {section.title}
                  </h3>

                  <p
                    className={`
                      mt-1
                      text-sm

                      ${
                        index === 0
                          ? "text-white/70"
                          : "text-gray-500"
                      }
                    `}
                  >
                    {getSectionDescription(section.title)}
                  </p>

                </div>


                <span
                  className={`
                    text-2xl
                    transition-transform
                    duration-200
                    group-hover:translate-x-1

                    ${
                      index === 0
                        ? "text-white"
                        : "text-[#7A1F2B]"
                    }
                  `}
                >
                  →
                </span>

              </div>

            </Link>
          ))}

        </div>

      </section>

    </div>
  );
}


/* =========================================================
   ОПИСИ РОЗДІЛІВ
   ========================================================= */

function getSectionDescription(title: string) {
  switch (title) {
    case "Головна":
      return "Огляд вашого кабінету";

    case "Тести":
      return "Доступні тестові завдання";

    case "Результати":
      return "Перегляд результатів тестування";

    case "Аналітика":
      return "Аналіз ваших досягнень";

    case "Мій тариф":
      return "Ваш тариф та можливості";

    case "Баланс":
      return "Кошти та історія операцій";

    case "Профіль":
      return "Особисті дані та налаштування";

    default:
      return "";
  }
}