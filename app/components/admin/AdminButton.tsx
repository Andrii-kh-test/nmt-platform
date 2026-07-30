import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "danger"
  | "success";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
};

export default function AdminButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: Props) {
  const styles = {
    primary:
      "bg-[#7A1F2B] hover:bg-[#611823] text-white",

    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-800",

    danger:
      "bg-red-600 hover:bg-red-700 text-white",

    success:
      "bg-green-600 hover:bg-green-700 text-white",
  };

  return (
    <button
      {...props}
      className={`
        inline-flex
        items-center
        justify-center
        rounded-lg
        px-5
        py-3
        font-semibold
        transition
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${styles[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}