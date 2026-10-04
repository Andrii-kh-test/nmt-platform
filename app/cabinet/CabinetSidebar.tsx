"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type CabinetSidebarProps = {
  firstName: string;
  lastName: string;
};

const menu = [
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

export default function CabinetSidebar({
  firstName,
  lastName,
}: CabinetSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="min-h-[calc(100vh-80px)] w-72 border-r bg-white">

      {/* =====================================================
          КОРИСТУВАЧ
          ===================================================== */}

      <div className="border-b px-5 py-5">

        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Учасник тестування
        </p>

        <p className="mt-1 truncate text-lg font-bold text-[#7A1F2B]">
          {firstName} {lastName}
        </p>

      </div>


      {/* =====================================================
          МЕНЮ
          ===================================================== */}

      <nav className="p-5">

        <ul className="space-y-2">

          {menu.map((item) => {

            const isActive =
              item.href === "/cabinet"
                ? pathname === "/cabinet"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>

                <Link
                  href={item.href}
                  className={`
                    flex
                    items-center
                    gap-3
                    rounded-lg
                    px-4
                    py-3
                    text-lg
                    transition

                    ${
                      isActive
                        ? "bg-[#F3E8EA] font-semibold text-[#7A1F2B]"
                        : "text-gray-700 hover:bg-[#F3E8EA] hover:text-[#7A1F2B]"
                    }
                  `}
                >

                  <span className="text-2xl">
                    {item.icon}
                  </span>

                  <span>
                    {item.title}
                  </span>

                </Link>

              </li>
            );
          })}

        </ul>

      </nav>

    </aside>
  );
}