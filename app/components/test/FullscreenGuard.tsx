"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useTestSession } from "@/app/context/TestSessionContext";
import { finishTest } from "@/app/services/testEngine";

type Props = {
  onViolationFinish?: () => Promise<void>;
};

function WarningCard({
  onReturn,
}: {
  onReturn: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.72)",
        padding: "24px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "620px",
          overflow: "hidden",
          borderRadius: "24px",
          background: "#7A1F2B",
          color: "#ffffff",
          padding: "48px 42px 42px",
          textAlign: "center",
          boxShadow:
            "0 25px 80px rgba(0, 0, 0, 0.45)",
        }}
      >
        {/* =====================================================
            ДЕКОРАТИВНІ КОЛА
        ===================================================== */}

        <div
          style={{
            position: "absolute",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            top: "-80px",
            right: "-60px",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: "130px",
            height: "130px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            bottom: "-55px",
            left: "-45px",
          }}
        />

        {/* =====================================================
            ЗНАК ОКЛИКУ
        ===================================================== */}

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "92px",
            height: "92px",
            margin: "0 auto 26px",
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "58px",
            fontWeight: 800,
            lineHeight: 1,
            background: "rgba(255,255,255,0.08)",
          }}
        >
          !
        </div>

        {/* =====================================================
            ЗАГОЛОВОК
        ===================================================== */}

        <h2
          style={{
            position: "relative",
            zIndex: 1,
            margin: "0 0 18px",
            fontSize: "30px",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          Порушення правила тестування
        </h2>

        {/* =====================================================
            ТЕКСТ
        ===================================================== */}

        <p
          style={{
            position: "relative",
            zIndex: 1,
            margin: "0 auto 32px",
            maxWidth: "500px",
            fontSize: "18px",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.94)",
          }}
        >
          Дотримуйтеся правил проходження
          тестування. Повторне порушення
          автоматично завершить тест
        </p>

        {/* =====================================================
            КНОПКА
        ===================================================== */}

        <button
          type="button"
          onClick={onReturn}
          style={{
            position: "relative",
            zIndex: 1,
            border: "none",
            borderRadius: "12px",
            background: "#ffffff",
            color: "#7A1F2B",
            padding: "14px 28px",
            fontSize: "17px",
            fontWeight: 700,
            cursor: "pointer",
            minWidth: "250px",
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.18)",
          }}
        >
          Повернутися до тестування
        </button>
      </div>
    </div>
  );
}

function OrdinaryFullscreenGuard() {
  const router = useRouter();

  const {
    test,
    savedAnswers,
    timeLeft,
    registerSecurityViolation,
  } = useTestSession();

  const [showWarning, setShowWarning] =
    useState(false);

  useEffect(() => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch(() => {});
    }

    const handleFullscreen = async () => {
      if (document.fullscreenElement) {
        return;
      }

      // =====================================================
      // СПІЛЬНИЙ ЛІЧИЛЬНИК ПОРУШЕНЬ
      //
      // Вихід із fullscreen рахується разом
      // із забороненими клавішами.
      // =====================================================

      const violationNumber =
        registerSecurityViolation();

      // =====================================================
      // ПЕРШЕ ЗАГАЛЬНЕ ПОРУШЕННЯ
      // =====================================================

      if (violationNumber === 1) {
        setShowWarning(true);
        return;
      }

      // =====================================================
      // ДРУГЕ ЗАГАЛЬНЕ ПОРУШЕННЯ
      //
      // Автоматичне завершення тесту.
      // =====================================================

      if (violationNumber >= 2) {
        if (!test) {
          return;
        }

        const storedSessionId =
          localStorage.getItem(
            "testSessionId"
          );

        const sessionId =
          Number(storedSessionId);

        if (!sessionId) {
          console.error(
            "Не знайдено testSessionId"
          );

          return;
        }

        try {
          await finishTest(
            "security",
            test,
            savedAnswers,
            timeLeft,
            sessionId,
            router
          );
        } catch (error) {
          console.error(
            "Помилка завершення тесту після порушення:",
            error
          );
        }
      }
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreen
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreen
      );
    };
  }, [
    registerSecurityViolation,
    test,
    savedAnswers,
    timeLeft,
    router,
  ]);

  async function returnFullscreen() {
    setShowWarning(false);

    try {
      await document.documentElement.requestFullscreen();
    } catch {}
  }

  if (!showWarning) {
    return null;
  }

  return (
    <WarningCard
      onReturn={returnFullscreen}
    />
  );
}

function CombinedFullscreenGuard({
  onViolationFinish,
}: Props) {
  const {
    registerSecurityViolation,
  } = useTestSession();

  const [showWarning, setShowWarning] =
    useState(false);

  useEffect(() => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch(() => {});
    }

    const handleFullscreen = async () => {
      if (document.fullscreenElement) {
        return;
      }

      // =====================================================
      // СПІЛЬНИЙ ЛІЧИЛЬНИК ПОРУШЕНЬ
      // =====================================================

      const violationNumber =
        registerSecurityViolation();

      // =====================================================
      // ПЕРШЕ ЗАГАЛЬНЕ ПОРУШЕННЯ
      // =====================================================

      if (violationNumber === 1) {
        setShowWarning(true);
        return;
      }

      // =====================================================
      // ДРУГЕ ЗАГАЛЬНЕ ПОРУШЕННЯ
      // =====================================================

      if (
        violationNumber >= 2 &&
        onViolationFinish
      ) {
        try {
          await onViolationFinish();
        } catch (error) {
          console.error(
            "Помилка завершення комбінованого тесту:",
            error
          );
        }
      }
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreen
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreen
      );
    };
  }, [
    registerSecurityViolation,
    onViolationFinish,
  ]);

  async function returnFullscreen() {
    setShowWarning(false);

    try {
      await document.documentElement.requestFullscreen();
    } catch {}
  }

  if (!showWarning) {
    return null;
  }

  return (
    <WarningCard
      onReturn={returnFullscreen}
    />
  );
}

export default function FullscreenGuard({
  onViolationFinish,
}: Props) {
  if (onViolationFinish) {
    return (
      <CombinedFullscreenGuard
        onViolationFinish={onViolationFinish}
      />
    );
  }

  return (
    <OrdinaryFullscreenGuard />
  );
}