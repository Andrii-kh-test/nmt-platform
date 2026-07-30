type ButtonProps = {
  text: string;
  onClick?: () => void;
};

export default function Button({
  text,
  onClick,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-[#7A1F2B] hover:bg-[#651824] text-white px-6 py-3 rounded-lg transition"
    >
      {text}
    </button>
  );
}