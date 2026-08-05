"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({
  value,
  onChange,
}: Props) {
  return (
    <div className="mb-8">

      <input
        type="text"
        placeholder="🔎 Пошук тесту..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
          rounded-xl
          border
          border-gray-300
          px-5
          py-4
          text-lg
          outline-none
          focus:ring-2
          focus:ring-[#7A1F2B]
          focus:border-[#7A1F2B]
        "
      />

    </div>
  );
}