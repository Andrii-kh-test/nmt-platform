import type { ReactNode } from "react";
import Link from "next/link";

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
  return (
    <div className="min-h-screen bg-[#F5F6F8]">

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

        </div>

      </header>

      <div className="mx-auto flex max-w-7xl">

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

                    {item.title}
                  </Link>

                </li>
              ))}

            </ul>

          </nav>

        </aside>

        <main className="flex-1 p-8">

          {children}

        </main>

      </div>

    </div>
  );
}