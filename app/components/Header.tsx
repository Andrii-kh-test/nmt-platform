import Logo from "./Logo";
import Navigation from "./Navigation";
import AuthButtons from "./AuthButtons";

export default function Header() {
  return (
    <header className="bg-[#7A1F2B] text-white shadow-lg">

      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        <Logo />

        <Navigation />

        <AuthButtons />

      </div>

    </header>
  );
}