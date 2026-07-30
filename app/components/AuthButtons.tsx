export default function AuthButtons() {
  return (
    <div className="flex gap-3">

      <button className="px-4 py-2 rounded-lg hover:bg-[#651923] transition">
        Увійти
      </button>

      <button className="bg-white text-[#7A1F2B] px-4 py-2 rounded-lg font-semibold">
        Реєстрація
      </button>

    </div>
  );
}