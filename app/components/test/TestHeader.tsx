"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useTestSession } from "@/app/context/TestSessionContext";

import Timer from "./Timer";
import TestFinishedModal from "./TestFinishedModal";

import { finishTest } from "@/app/services/testEngine";

import PdfMaterialViewer from "@/app/components/PdfMaterialViewer";

type Participant = {
  lastName: string;
  firstName: string;
  middleName: string;
};

export default function TestHeader() {
  const router = useRouter();

  const {
    test,
    savedAnswers,
    timeLeft,
  } = useTestSession();

  const headerRef =
    useRef<HTMLElement | null>(null);

  const [participant, setParticipant] =
    useState<Participant | null>(null);

  const [finishOpen, setFinishOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [timerVisible, setTimerVisible] =
    useState(true);

  const [panelCollapsed, setPanelCollapsed] =
    useState(false);

  const [pdfMaterial, setPdfMaterial] =
    useState<{
      title: string;
      src: string;
    } | null>(null);

  const [pdfMinimized, setPdfMinimized] =
    useState(false);

  // =====================================================
  // HEADER HEIGHT
  // =====================================================

  useEffect(() => {
    const header =
      headerRef.current;

    if (!header) {
      return;
    }

    const updateHeaderHeight = () => {
      const height =
        header.getBoundingClientRect().height;

      document.documentElement.style.setProperty(
        "--test-header-height",
        `${height}px`
      );
    };

    updateHeaderHeight();

    const observer =
      new ResizeObserver(() => {
        updateHeaderHeight();
      });

    observer.observe(header);

    window.addEventListener(
      "resize",
      updateHeaderHeight
    );

    return () => {
      observer.disconnect();

      window.removeEventListener(
        "resize",
        updateHeaderHeight
      );

      document.documentElement.style.removeProperty(
        "--test-header-height"
      );
    };
  }, []);

  // =====================================================
  // HEADER COLLAPSED / EXPANDED STATE
  // =====================================================
  //
  // Передаємо SidebarSync реальний стан
  // верхньої панелі.
  //
  // 1 = панель згорнута
  // 0 = панель розгорнута
  //
  // SidebarSync більше не буде визначати стан
  // за висотою header.
  // =====================================================

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--test-header-collapsed",
      panelCollapsed ? "1" : "0"
    );

    return () => {
      document.documentElement.style.removeProperty(
        "--test-header-collapsed"
      );
    };
  }, [panelCollapsed]);

  // =====================================================
  // PDF MATERIALS
  // =====================================================

  function openPdfMaterial(
    title: string,
    src: string
  ) {
    setPdfMaterial({
      title,
      src,
    });

    setPdfMinimized(false);
  }

  function closePdfMaterial() {
    setPdfMaterial(null);
    setPdfMinimized(false);
  }

  function minimizePdfMaterial() {
    setPdfMinimized(true);
  }

  function restorePdfMaterial() {
    setPdfMinimized(false);
  }

  // =====================================================
  // PARTICIPANT
  // =====================================================

  useEffect(() => {
    const saved =
      localStorage.getItem("participant");

    if (saved) {
      try {
        setParticipant(
          JSON.parse(saved)
        );
      } catch {
        setParticipant(null);
      }
    }
  }, []);

  // =====================================================
  // FINISH TEST
  // =====================================================

  async function handleFinishTest() {
    if (!test) {
      return;
    }

    try {
      setLoading(true);

      const storedSessionId =
        localStorage.getItem(
          "testSessionId"
        );

      const sessionId =
        Number(storedSessionId);

      if (!sessionId) {
        throw new Error(
          "Не знайдено sessionId тестування"
        );
      }

      await finishTest(
        "manual",
        test,
        savedAnswers,
        timeLeft,
        sessionId,
        router
      );
    } catch (error) {
      console.error(error);

      alert(
        "Не вдалося зберегти результат."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  if (!test) {
    return null;
  }

  return (
    <>
      {/* =================================================
          PDF VIEWER
      ================================================= */}

      {pdfMaterial && (
        <PdfMaterialViewer
          title={pdfMaterial.title}
          src={pdfMaterial.src}
          isOpen={true}
          isMinimized={
            pdfMinimized
          }
          onMinimize={
            minimizePdfMaterial
          }
          onClose={
            closePdfMaterial
          }
          onRestore={
            restorePdfMaterial
          }
        />
      )}

      {/* =================================================
          HEADER
      ================================================= */}

      <header
        ref={headerRef}
        className="
          bg-white
          border-b
          shadow-sm
          sticky
          top-0
          z-50
        "
      >
        <div className="max-w-7xl mx-auto px-6 py-5">

          {/* =================================================
              COLLAPSED HEADER
          ================================================= */}

          {panelCollapsed ? (

            <div className="flex items-center justify-between">

              <h1 className="text-2xl font-bold text-[#7A1F2B]">
                {test.title}
              </h1>

              <button
                type="button"
                onClick={() =>
                  setPanelCollapsed(false)
                }
                aria-label="Розгорнути панель"
                title="Розгорнути панель"
                className="
                  p-1
                  text-gray-400
                  hover:text-gray-700
                  transition
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 3H3v5"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3l6 6"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 3h5v5"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 3l-6 6"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16v5h5"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 21l6-6"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 16v5h-5"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6"
                  />
                </svg>
              </button>

            </div>

          ) : (

            <>

              {/* =================================================
                  TEST TITLE
              ================================================= */}

              <div>

                <h1 className="text-3xl font-bold text-[#7A1F2B]">
                  {test.title}
                </h1>

                <div className="flex flex-wrap gap-6 mt-3 text-gray-700">

                  <span>
                    <strong>Предмет:</strong>{" "}
                    {test.subject}
                  </span>

                  <span>
                    <strong>Питань:</strong>{" "}
                    {test.questions.length}
                  </span>

                  <span>
                    <strong>Максимум:</strong>{" "}
                    {test.maxPoints} б.
                  </span>

                </div>

              </div>

              {/* =================================================
                  MATERIALS + PARTICIPANT
              ================================================= */}

              <div className="mt-4 flex items-center justify-between gap-8">

                <div className="min-w-0">

                  <div
                    className="
                      inline-flex
                      items-center
                      gap-1
                      bg-gray-50
                      border
                      border-gray-100
                      rounded-xl
                      p-2
                    "
                  >

                    <button
                      type="button"
                      onClick={() =>
                        openPdfMaterial(
                          "Математика: довідкові матеріали",
                          "/pdf/mathematics.pdf"
                        )
                      }
                      disabled={loading}
                      className="
                        rounded-lg
                        px-4
                        py-2.5
                        text-sm
                        font-medium
                        text-gray-700
                        hover:bg-white
                        hover:text-[#7A1F2B]
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        transition
                        whitespace-nowrap
                      "
                    >
                      Математика: довідкові матеріали
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openPdfMaterial(
                          "Фізика: довідкові матеріали",
                          "/pdf/physics.pdf"
                        )
                      }
                      disabled={loading}
                      className="
                        rounded-lg
                        px-4
                        py-2.5
                        text-sm
                        font-medium
                        text-gray-700
                        hover:bg-white
                        hover:text-[#7A1F2B]
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        transition
                        whitespace-nowrap
                      "
                    >
                      Фізика: довідкові матеріали
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openPdfMaterial(
                          "Хімія: довідкові матеріали",
                          "/pdf/chemistry.pdf"
                        )
                      }
                      disabled={loading}
                      className="
                        rounded-lg
                        px-4
                        py-2.5
                        text-sm
                        font-medium
                        text-gray-700
                        hover:bg-white
                        hover:text-[#7A1F2B]
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        transition
                        whitespace-nowrap
                      "
                    >
                      Хімія: довідкові матеріали
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openPdfMaterial(
                          "Інструкція",
                          "/pdf/instruction.pdf"
                        )
                      }
                      disabled={loading}
                      className="
                        rounded-lg
                        px-4
                        py-2.5
                        text-sm
                        font-medium
                        text-gray-700
                        hover:bg-white
                        hover:text-[#7A1F2B]
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        transition
                        whitespace-nowrap
                      "
                    >
                      Інструкція
                    </button>

                  </div>

                </div>

                {participant && (
                  <div className="shrink-0 text-right">

                    <div className="text-sm text-gray-500">
                      Учасник тестування
                    </div>

                    <div className="font-semibold text-lg text-[#7A1F2B]">
                      {participant.lastName}{" "}
                      {participant.firstName}{" "}
                      {participant.middleName}
                    </div>

                  </div>
                )}

              </div>

              {/* =================================================
                  INFORMATION + TIMER
              ================================================= */}

              <div
                className="
                  mt-4
                  flex
                  items-start
                  justify-between
                  gap-8
                "
              >

                <div
                  className="
                    flex-1
                    min-w-0
                    text-sm
                    leading-6
                    text-gray-500
                    pt-1
                  "
                >
                  <span className="font-semibold text-[#7A1F2B]">
                    {test.title}
                  </span>{" "}
                  обмежений у часі. Таймер праворуч
                  показує, скільки хвилин залишилося
                  до завершення роботи. Вибравши
                  відповідь, не забудьте натиснути{" "}
                  <span className="font-medium text-gray-600">
                    "Зберегти відповідь"
                  </span>.
                </div>

                <div
                  className="
                    shrink-0
                    flex
                    flex-col
                    items-end
                    min-w-[250px]
                  "
                >

                  <div className="flex items-center">

                    <button
                      type="button"
                      onClick={() =>
                        setTimerVisible(
                          (prev) => !prev
                        )
                      }
                      aria-label={
                        timerVisible
                          ? "Приховати таймер"
                          : "Показати таймер"
                      }
                      title={
                        timerVisible
                          ? "Приховати таймер"
                          : "Показати таймер"
                      }
                      className="
                        p-2
                        rounded-lg
                        text-gray-600
                        hover:text-gray-900
                        hover:bg-gray-100
                        transition
                      "
                    >

                      {timerVisible ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.01 9.964 7.178.062.183.062.383 0 .566C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.01-9.964-7.178z"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.038 7.19 19.5 12 19.5c4.81 0 8.774-3.462 10.066-7.5a10.523 10.523 0 01-4.132 5.411M6.228 6.228A10.45 10.45 0 0112 4.5c4.81 0 8.774 3.462 10.066 7.5a10.523 10.523 0 01-4.132 5.411M6.228 6.228L3 3m3.228 3.228l3.15 3.15m0 0a3 3 0 104.243 4.243m-4.243-4.243l4.243 4.243m0 0L21 21"
                          />
                        </svg>
                      )}

                    </button>

                    {timerVisible && (
                      <div className="ml-1">
                        <Timer />
                      </div>
                    )}

                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      setFinishOpen(true)
                    }
                    className="
                      mt-2
                      w-full
                      bg-[#7A1F2B]
                      hover:bg-[#641923]
                      disabled:bg-gray-400
                      text-white
                      font-semibold
                      py-3
                      px-5
                      rounded-lg
                      transition
                      shadow-sm
                    "
                  >
                    {loading
                      ? "Збереження..."
                      : "Завершити роботу над тестом"}
                  </button>

                </div>

              </div>

              {/* =================================================
                  COLLAPSE BUTTON
              ================================================= */}

              <div className="flex justify-end mt-1">

                <button
                  type="button"
                  onClick={() =>
                    setPanelCollapsed(true)
                  }
                  aria-label="Згорнути панель"
                  title="Згорнути панель"
                  className="
                    p-1
                    text-gray-400
                    hover:text-gray-700
                    transition
                  "
                >

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="w-5 h-5"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 3H3v5"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3l6 6"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 3h5v5"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 3l-6 6"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16v5h5"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 21l6-6"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 16v5h-5"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6"
                    />

                  </svg>

                </button>

              </div>

            </>

          )}

        </div>
      </header>

      {/* =================================================
          FINISH MODAL
      ================================================= */}

      <TestFinishedModal
        open={finishOpen}
        onClose={() =>
          setFinishOpen(false)
        }
        onFinish={
          handleFinishTest
        }
      />
    </>
  );
}