import { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  className?: string;
};

export default function AdminCard({
  title,
  children,
  className = "",
}: Props) {
  return (
    <div
      className={`
        rounded-xl
        border
        border-gray-200
        bg-white
        shadow-sm
        ${className}
      `}
    >
      <div className="border-b border-gray-200 px-6 py-4">

        <h2 className="text-2xl font-semibold text-[#7A1F2B]">

          {title}

        </h2>

      </div>

      <div className="p-6">

        {children}

      </div>

    </div>
  );
}