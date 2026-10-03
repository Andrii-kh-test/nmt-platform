"use client";

import { usePathname, useRouter } from "next/navigation";

type CabinetSidebarProps = {
  firstName: string;
  lastName: string;
};

const menuItems = [
  {
    title: "Головна",
    href: "/cabinet",
    icon: "⌂",
  },
  {
    title: "Тести",
    href: "/cabinet/tests",
    icon: "▣",
  },
  {
    title: "Результати",
    href: "/cabinet/results",
    icon: "✓",
  },
  {
    title: "Аналітика",
    href: "/cabinet/analytics",
    icon: "◒",
  },
  {
    title: "Мій тариф",
    href: "/cabinet/plan",
    icon: "◇",
  },
  {
    title: "Баланс",
    href: "/cabinet/balance",
    icon: "₴",
  },
  {
    title: "Профіль",
    href: "/cabinet/profile",
    icon: "♙",
  },
];

export default function CabinetSidebar({
  firstName,
  lastName,
}: CabinetSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <aside className="cabinet-sidebar">
      <div className="cabinet-brand">
        <div className="cabinet-brand-mark">Н</div>

        <div>
          <div className="cabinet-brand-title">
            Платформа
          </div>

          <div className="cabinet-brand-subtitle">
            комп'ютерного тестування
          </div>
        </div>
      </div>

      <nav className="cabinet-navigation">
        <div className="cabinet-navigation-label">
          КАБІНЕТ
        </div>

        {menuItems.map((item) => {
          const isActive =
            item.href === "/cabinet"
              ? pathname === "/cabinet"
              : pathname.startsWith(item.href);

          return (
            <button
              key={item.href}
              type="button"
              className={`cabinet-nav-item ${
                isActive ? "active" : ""
              }`}
              onClick={() => router.push(item.href)}
            >
              <span className="cabinet-nav-icon">
                {item.icon}
              </span>

              <span>{item.title}</span>
            </button>
          );
        })}
      </nav>

      <div className="cabinet-sidebar-bottom">
        <div className="cabinet-user-card">
          <div className="cabinet-avatar">
            {initials}
          </div>

          <div className="cabinet-user-info">
            <div className="cabinet-user-name">
              {firstName} {lastName}
            </div>

            <div className="cabinet-user-role">
              Учасник тестування
            </div>
          </div>
        </div>

        <button
          type="button"
          className="cabinet-logout"
          onClick={handleLogout}
        >
          <span>↪</span>
          <span>Вийти</span>
        </button>
      </div>
    </aside>
  );
}