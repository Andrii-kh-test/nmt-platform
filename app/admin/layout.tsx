"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  children: ReactNode;
};

const menu = [
  {
    title: "Головна",
    href: "/admin",
    icon: "🏠",
  },
  {
    title: "Тести",
    href: "/admin/tests",
    icon: "📚",
  },
  {
    title: "Предмети",
    href: "/admin/subjects",
    icon: "📖",
  },
  {
    title: "Питання",
    href: "/admin/questions",
    icon: "❓",
  },
  {
    title: "Результати",
    href: "/admin/results",
    icon: "📊",
  },
  {
    title: "Аналітика",
    href: "/admin/analytics",
    icon: "📈",
  },
  {
    title: "Моніторинг",
    href: "/admin/monitoring",
    icon: "🖥️",
  },
  {
    title: "Користувачі",
    href: "/admin/users",
    icon: "👥",
  },
  {
    title: "Налаштування",
    href: "/admin/settings",
    icon: "⚙️",
  },
];

export default function AdminLayout({
  children,
}: Props) {
  const pathname = usePathname();

  // Сторінка входу має власний дизайн
  if (pathname === "/admin/login") {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ===================================================== */}
      {/* Верхня панель */}
      {/* ===================================================== */}

      <header className="h-20 border-b bg-white shadow-sm">
  <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8">
    <div>
      <h1 className="text-3xl font-bold text-[#7A1F2B]">
        Адміністративна панель
      </h1>

      <p className="text-gray-500">
        Платформа тестування
      </p>
    </div>

    <a
      href="/admin/logout"
      className="
        inline-flex
        items-center
        gap-2
        rounded-lg
        border
        border-gray-200
        bg-white
        px-4
        py-2
        font-semibold
        text-gray-700
        shadow-sm
        transition
        hover:border-red-200
        hover:bg-red-50
        hover:text-red-700
      "
    >
      <span>🚪</span>
      <span>Вийти</span>
    </a>
  </div>
</header>

      {/* ===================================================== */}
      {/* Основна область */}
      {/* ===================================================== */}

      <div className="mx-auto flex max-w-7xl">
        {/* =================================================== */}
        {/* Бічне меню */}
        {/* =================================================== */}

        <aside className="min-h-[calc(100vh-80px)] w-72 border-r bg-white">
          <nav className="p-5">
            <ul className="space-y-2">
              {menu.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-lg
                      px-4
                      py-3
                      text-lg
                      text-gray-700
                      transition
                      hover:bg-[#F3E8EA]
                      hover:text-[#7A1F2B]
                    "
                  >
                    <span className="text-2xl">
                      {item.icon}
                    </span>

                    <span>
                      {item.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* =================================================== */}
        {/* Вміст сторінки */}
        {/* =================================================== */}

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}