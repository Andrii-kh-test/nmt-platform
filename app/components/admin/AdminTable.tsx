import { ReactNode } from "react";

type Column = {
  key: string;
  title: string;
  width?: string;
  align?: "left" | "center" | "right";
};

type Props = {
  columns: Column[];
  children: ReactNode;
};

export default function AdminTable({
  columns,
  children,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

      <div className="overflow-x-auto">

        <table className="min-w-full border-collapse">

          <thead>

            <tr className="bg-[#F5F6F8]">

              {columns.map((column) => (

                <th
                  key={column.key}
                  style={{
                    width: column.width,
                  }}
                  className={`
                    border-b
                    border-gray-200
                    px-5
                    py-4
                    text-sm
                    font-semibold
                    uppercase
                    tracking-wide
                    text-gray-700

                    ${
                      column.align === "center"
                        ? "text-center"
                        : column.align === "right"
                        ? "text-right"
                        : "text-left"
                    }
                  `}
                >
                  {column.title}
                </th>

              ))}

            </tr>

          </thead>

          <tbody>

            {children}

          </tbody>

        </table>

      </div>

    </div>
  );
}