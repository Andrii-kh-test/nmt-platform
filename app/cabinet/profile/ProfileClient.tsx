"use client";

import {
  ChangeEvent,
  useRef,
  useState,
} from "react";

type ProfileClientProps = {
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  avatarUrl: string | null;
};

function getInitials(
  firstName: string,
  lastName: string
) {
  const firstInitial = firstName.trim().charAt(0);
  const lastInitial = lastName.trim().charAt(0);

  return `${lastInitial}${firstInitial}`.toUpperCase();
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function ProfileClient({
  firstName,
  lastName,
  middleName,
  email,
  avatarUrl,
}: ProfileClientProps) {
  const initials = getInitials(
    firstName,
    lastName
  );

  const fullName = [
    lastName,
    firstName,
    middleName,
  ]
    .filter(Boolean)
    .join(" ");

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [currentAvatarUrl, setCurrentAvatarUrl] =
    useState<string | null>(avatarUrl);

  const [isUploading, setIsUploading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState<string | null>(null);

  const [uploadSuccess, setUploadSuccess] =
    useState<string | null>(null);

  const openFilePicker = () => {
    if (isUploading) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    // Дозволяємо повторно вибрати той самий файл
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);

    // =====================================================
    // КЛІЄНТСЬКА ПЕРЕВІРКА
    // =====================================================

    if (
      !ALLOWED_TYPES.includes(file.type)
    ) {
      setUploadError(
        "Підтримуються лише фотографії JPG, PNG або WebP."
      );

      return;
    }

    if (file.size === 0) {
      setUploadError(
        "Вибраний файл порожній."
      );

      return;
    }

    if (
      file.size > MAX_FILE_SIZE
    ) {
      setUploadError(
        "Розмір фотографії не повинен перевищувати 5 МБ."
      );

      return;
    }

    // =====================================================
    // ЗАВАНТАЖЕННЯ
    // =====================================================

    setIsUploading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/profile/avatar",
          {
            method: "POST",
            body: formData,
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.reason ||
            result.message ||
            "Не вдалося завантажити фотографію."
        );
      }

      if (!result.url) {
        throw new Error(
          "Сервер не повернув адресу фотографії."
        );
      }

      setCurrentAvatarUrl(
        result.url
      );

      setUploadSuccess(
        "Фото профілю успішно додано."
      );
    } catch (error) {
      console.error(
        "PROFILE AVATAR ERROR:",
        error
      );

      setUploadError(
        error instanceof Error
          ? error.message
          : "Не вдалося завантажити фотографію."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative overflow-hidden">

      {/* =====================================================
          ДЕКОРАТИВНІ КОЛА СТОРІНКИ
          ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -right-24
          -top-24
          h-72
          w-72
          rounded-full
          bg-[#7A1F2B]/5
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -left-32
          top-[420px]
          h-80
          w-80
          rounded-full
          bg-[#7A1F2B]/5
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          right-20
          top-[520px]
          h-24
          w-24
          rounded-full
          bg-[#7A1F2B]/10
        "
      />

      {/* =====================================================
          ЗАГОЛОВОК
          ===================================================== */}

      <section className="relative mb-8">

        <div
          className="
            mb-3
            inline-flex
            items-center
            gap-2
            rounded-full
            bg-[#F3E5E8]
            px-4
            py-2
            text-sm
            font-semibold
            text-[#7A1F2B]
          "
        >
          <span className="h-2 w-2 rounded-full bg-[#7A1F2B]" />
          Кабінет учасника
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-[#7A1F2B]">
          Профіль
        </h1>

        <p className="mt-2 max-w-2xl text-base leading-7 text-gray-600">
          Переглядайте та керуйте основними даними свого
          облікового запису.
        </p>

      </section>

      {/* =====================================================
          ОСНОВНА КАРТКА ПРОФІЛЮ
          ===================================================== */}

      <section
        className="
          relative
          overflow-hidden
          rounded-3xl
          border
          border-[#E8D9DC]
          bg-white
          shadow-sm
        "
      >

        <div className="h-2 bg-[#7A1F2B]" />

        <div className="p-8 md:p-10">

          <div className="grid gap-10 lg:grid-cols-[280px_1fr]">

            {/* =================================================
                АВАТАР
                ================================================= */}

            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                rounded-3xl
                bg-[#FBF7F8]
                px-6
                py-10
              "
            >

              <div className="relative">

                {/* Зовнішнє коло */}

                <div
                  className="
                    absolute
                    -inset-8
                    rounded-full
                    border
                    border-[#7A1F2B]/5
                  "
                />

                {/* Середнє коло */}

                <div
                  className="
                    absolute
                    -inset-4
                    rounded-full
                    border
                    border-[#7A1F2B]/10
                  "
                />

                {/* =================================================
                    АВАТАР
                    ================================================= */}

                <div
                  className="
                    relative
                    h-40
                    w-40
                    overflow-hidden
                    rounded-full
                    bg-[#7A1F2B]
                    shadow-lg
                  "
                >

                  {currentAvatarUrl ? (
                    <img
                      src={currentAvatarUrl}
                      alt={`Фото профілю ${fullName}`}
                      className="
                        h-full
                        w-full
                        object-cover
                      "
                    />
                  ) : (
                    <div
                      className="
                        flex
                        h-full
                        w-full
                        items-center
                        justify-center
                        text-4xl
                        font-bold
                        text-white
                      "
                    >
                      {initials}
                    </div>
                  )}

                  {/* =================================================
                      ІНДИКАТОР ЗАВАНТАЖЕННЯ
                      ================================================= */}

                  {isUploading && (
                    <div
                      className="
                        absolute
                        inset-0
                        flex
                        flex-col
                        items-center
                        justify-center
                        bg-[#7A1F2B]/90
                        text-center
                        text-white
                      "
                    >
                      <div
                        className="
                          mb-2
                          h-8
                          w-8
                          animate-spin
                          rounded-full
                          border-2
                          border-white/30
                          border-t-white
                        "
                      />

                      <span className="px-3 text-xs font-semibold">
                        Перевіряємо...
                      </span>
                    </div>
                  )}

                </div>

              </div>

              {/* =================================================
                  КНОПКА АВАТАРА
                  ================================================= */}

              <button
                type="button"
                onClick={openFilePicker}
                disabled={isUploading}
                className="
                  relative
                  z-10
                  mt-10
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#7A1F2B]
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-[#641923]
                  hover:shadow-md
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {isUploading
                  ? "Перевіряємо фото..."
                  : currentAvatarUrl
                    ? "Змінити фото"
                    : "Додати фото"}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <p className="mt-3 max-w-[220px] text-center text-xs leading-5 text-gray-500">
                JPG, PNG або WebP · до 5 МБ
              </p>

              {/* =================================================
                  ПОМИЛКА
                  ================================================= */}

              {uploadError && (
                <div
                  className="
                    mt-4
                    max-w-[240px]
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-center
                    text-xs
                    leading-5
                    text-red-700
                  "
                >
                  {uploadError}
                </div>
              )}

              {/* =================================================
                  УСПІХ
                  ================================================= */}

              {uploadSuccess && (
                <div
                  className="
                    mt-4
                    max-w-[240px]
                    rounded-xl
                    border
                    border-green-200
                    bg-green-50
                    px-4
                    py-3
                    text-center
                    text-xs
                    leading-5
                    text-green-700
                  "
                >
                  {uploadSuccess}
                </div>
              )}

              <h2 className="mt-6 text-center text-xl font-bold text-gray-900">
                {fullName}
              </h2>

              <p className="mt-1 text-center text-sm text-gray-500">
                Учасник тестування
              </p>

            </div>

            {/* =================================================
                ОСОБИСТІ ДАНІ
                ================================================= */}

            <div>

              <div className="mb-6">

                <div className="flex items-center gap-3">

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-full
                      bg-[#F3E5E8]
                      text-[#7A1F2B]
                    "
                  >
                    👤
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Особисті дані
                    </h2>

                    <p className="text-sm text-gray-500">
                      Основна інформація облікового запису
                    </p>
                  </div>

                </div>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                {/* Прізвище */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-[#E8D9DC]
                    bg-[#FCFAFA]
                    p-5
                  "
                >
                  <p className="text-sm font-medium text-gray-500">
                    Прізвище
                  </p>

                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {lastName}
                  </p>
                </div>

                {/* Ім'я */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-[#E8D9DC]
                    bg-[#FCFAFA]
                    p-5
                  "
                >
                  <p className="text-sm font-medium text-gray-500">
                    Ім’я
                  </p>

                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {firstName}
                  </p>
                </div>

                {/* По батькові */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-[#E8D9DC]
                    bg-[#FCFAFA]
                    p-5
                  "
                >
                  <p className="text-sm font-medium text-gray-500">
                    По батькові
                  </p>

                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {middleName || "—"}
                  </p>
                </div>

                {/* Email */}

                <div
                  className="
                    rounded-2xl
                    border
                    border-[#E8D9DC]
                    bg-[#FCFAFA]
                    p-5
                  "
                >
                  <p className="text-sm font-medium text-gray-500">
                    Електронна пошта
                  </p>

                  <p className="mt-2 break-all text-lg font-semibold text-gray-900">
                    {email}
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          БЕЗПЕКА
          ===================================================== */}

      <section
        className="
          relative
          mt-8
          overflow-hidden
          rounded-3xl
          border
          border-[#E8D9DC]
          bg-white
          shadow-sm
        "
      >

        <div className="p-8 md:p-10">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-4">

              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#F3E5E8]
                  text-xl
                "
              >
                🔐
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Безпека
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Керуйте паролем та безпекою свого облікового запису.
                </p>
              </div>

            </div>

            <button
              type="button"
              className="
                inline-flex
                items-center
                justify-center
                rounded-xl
                bg-[#7A1F2B]
                px-6
                py-3
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-[#641923]
                hover:shadow-md
              "
            >
              Змінити пароль
            </button>

          </div>

        </div>

      </section>

      {/* =====================================================
          СТАТИ СПОНСОРОМ
          ===================================================== */}

      <section
        className="
          relative
          mt-8
          overflow-hidden
          rounded-3xl
          bg-[#7A1F2B]
          shadow-sm
        "
      >

        {/* =================================================
            АНІМОВАНІ КОЛА
            ================================================= */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div
            className="
              absolute
              -right-16
              -top-16
              h-64
              w-64
              rounded-full
              border
              border-white/10
              animate-[sponsorCircleOne_12s_ease-in-out_infinite]
            "
          />

          <div
            className="
              absolute
              -bottom-24
              left-1/3
              h-72
              w-72
              rounded-full
              border
              border-white/10
              animate-[sponsorCircleTwo_16s_ease-in-out_infinite]
            "
          />

          <div
            className="
              absolute
              right-1/4
              top-12
              h-16
              w-16
              rounded-full
              bg-white/5
              animate-[sponsorCircleThree_8s_ease-in-out_infinite]
            "
          />

        </div>

        {/* =================================================
            ВМІСТ
            ================================================= */}

        <div className="relative p-8 md:p-10">

          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-5">

              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-white/10
                  text-2xl
                  text-white
                "
              >
                ♥
              </div>

              <div className="max-w-2xl">

                <div
                  className="
                    mb-2
                    inline-flex
                    items-center
                    rounded-full
                    bg-white/10
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-white/90
                  "
                >
                  Добровільна підтримка
                </div>

                <h2 className="text-2xl font-bold text-white">
                  Стати спонсором
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/75 md:text-base">
                  Якщо вам подобається наша платформа та ви хочете
                  допомогти нам розвивати її надалі, ви можете
                  підтримати проєкт добровільним донатом.
                </p>

              </div>

            </div>

            <button
              type="button"
              className="
                inline-flex
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-white
                px-6
                py-3
                font-semibold
                text-[#7A1F2B]
                shadow-sm
                transition
                hover:bg-[#F8EEF0]
                hover:shadow-md
              "
            >
              Підтримати платформу
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}