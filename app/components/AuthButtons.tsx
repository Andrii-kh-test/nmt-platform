import {
  LogIn,
  UserPlus,
  ShieldCheck,
} from "lucide-react";

export default function AuthButtons() {
  return (
    <div className="flex items-center gap-3">

      {/* =====================================================
          УВІЙТИ
      ===================================================== */}

      <a
        href="/login"
        className="
          inline-flex
          items-center
          gap-2
          rounded-lg
          border
          border-white/30
          bg-white/10
          px-4
          py-2.5
          text-sm
          font-semibold
          text-white
          transition-all
          duration-200
          hover:border-white/60
          hover:bg-white/20
          hover:shadow-md
        "
      >
        <LogIn
          className="h-4 w-4"
          strokeWidth={2}
        />

        <span>
          Увійти
        </span>
      </a>

      {/* =====================================================
          РЕЄСТРАЦІЯ
      ===================================================== */}

      <a
        href="/register"
        className="
          inline-flex
          items-center
          gap-2
          rounded-lg
          bg-white
          px-4
          py-2.5
          text-sm
          font-semibold
          text-[#7A1F2B]
          shadow-sm
          transition-all
          duration-200
          hover:bg-gray-100
          hover:shadow-md
        "
      >
        <UserPlus
          className="h-4 w-4"
          strokeWidth={2}
        />

        <span>
          Реєстрація
        </span>
      </a>

      {/* =====================================================
          АДМІНІСТРАТОР
      ===================================================== */}

      <a
        href="/admin/login"
        className="
          group
          inline-flex
          items-center
          gap-2
          rounded-lg
          border
          border-white/40
          bg-[#5F1722]
          px-4
          py-2.5
          text-sm
          font-semibold
          text-white
          shadow-sm
          transition-all
          duration-200
          hover:border-white
          hover:bg-[#4F131D]
          hover:shadow-md
        "
      >
        <ShieldCheck
          className="
            h-4
            w-4
            transition-transform
            duration-200
            group-hover:scale-110
          "
          strokeWidth={2}
        />

        <span>
          Увійти як адміністратор
        </span>
      </a>

    </div>
  );
}