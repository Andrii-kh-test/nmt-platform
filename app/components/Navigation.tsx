import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="flex gap-8">

      <Link href="/">Головна</Link>

      <Link href="/about">Про платформу</Link>

      <Link href="/login">Увійти</Link>

      <Link href="/register">Реєстрація</Link>

    </nav>
  );
}