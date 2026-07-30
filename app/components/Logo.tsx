export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-white text-[#7A1F2B] flex items-center justify-center font-bold">
        N
      </div>

      <div>
        <h1 className="text-xl font-bold">
          NMT Platform
        </h1>

        <p className="text-xs text-gray-200">
          Комп'ютерне тестування
        </p>
      </div>
    </div>
  );
}