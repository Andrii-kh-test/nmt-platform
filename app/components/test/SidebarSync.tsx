"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Sidebar from "./Sidebar";

/*
 * =====================================================
 * НАЛАШТУВАННЯ МЕЖІ SIDEBAR
 * =====================================================
 *
 * Відстань між нижньою межею TestHeader
 * та верхньою межею Sidebar.
 *
 * ЗГОРНУТИЙ HEADER
 * ----------------
 *
 * Коли верхня панель згорнута.
 *
 * Наприклад:
 *
 * 24  → Sidebar ближче до header
 * 40  → невеликий відступ
 * 60  → більший відступ
 */

const COLLAPSED_HEADER_GAP = 100;

/*
 * РОЗГОРНУТИЙ HEADER
 * ------------------
 *
 * Коли верхня панель розгорнута.
 *
 * Тут можна задати окрему межу,
 * незалежну від згорнутого стану.
 *
 * Наприклад:
 *
 * 60  → Sidebar ближче
 * 100 → нормальний відступ
 * 140 → Sidebar ще нижче
 */

const EXPANDED_HEADER_GAP = 360;

export default function SidebarSync() {
  const wrapperRef =
    useRef<HTMLDivElement | null>(null);

  const sidebarRef =
    useRef<HTMLDivElement | null>(null);

  const [offset, setOffset] =
    useState(0);

  useEffect(() => {
    const wrapper =
      wrapperRef.current;

    const sidebar =
      sidebarRef.current;

    if (!wrapper || !sidebar) {
      return;
    }

    let frameId:
      | number
      | null = null;

    // =====================================================
    // UPDATE POSITION
    // =====================================================

    const updatePosition = () => {
      if (frameId !== null) {
        return;
      }

      frameId =
        window.requestAnimationFrame(() => {
          frameId = null;

          // =================================================
          // GRID
          // =================================================

          const grid =
            wrapper.parentElement
              ?.parentElement;

          if (!grid) {
            return;
          }

          const gridRect =
            grid.getBoundingClientRect();

          // =================================================
          // ФАКТИЧНА ВИСОТА HEADER
          // =================================================
          //
          // TestHeader сам записує її
          // у --test-header-height.
          //

          const headerHeight =
            Number(
              getComputedStyle(
                document.documentElement
              )
                .getPropertyValue(
                  "--test-header-height"
                )
                .replace("px", "")
            ) || 0;

          // =================================================
          // РЕАЛЬНИЙ СТАН HEADER
          // =================================================
          //
          // TestHeader записує:
          //
          // --test-header-collapsed: 1
          //     → згорнутий
          //
          // --test-header-collapsed: 0
          //     → розгорнутий
          //
          // Тут ми більше НЕ визначаємо стан
          // за висотою header.
          //

          const collapsed =
            getComputedStyle(
              document.documentElement
            )
              .getPropertyValue(
                "--test-header-collapsed"
              )
              .trim() === "1";

          const isExpanded =
            !collapsed;

          // =================================================
          // ВИБИРАЄМО ВІДПОВІДНИЙ GAP
          // =================================================

          const headerGap =
            isExpanded
              ? EXPANDED_HEADER_GAP
              : COLLAPSED_HEADER_GAP;

          // =================================================
          // ВЕРХНЯ МЕЖА SIDEBAR
          // =================================================
          //
          // Sidebar не повинен заходити під header.
          //

          const visibleTop =
            headerHeight +
            headerGap;

          // =================================================
          // ПОЗИЦІЯ GRID У ДОКУМЕНТІ
          // =================================================

          const gridTop =
            gridRect.top +
            window.scrollY;

          // =================================================
          // ТОЧКА ПОЧАТКУ РУХУ SIDEBAR
          // =================================================
          //
          // Поки сторінка не дійшла до цієї точки,
          // Sidebar залишається у своїй початковій
          // позиції.
          //

          const startScroll =
            gridTop -
            visibleTop;

          // =================================================
          // ПОТОЧНЕ ЗМІЩЕННЯ
          // =================================================

          const rawOffset =
            window.scrollY -
            startScroll;

          // =================================================
          // ВИСОТА SIDEBAR
          // =================================================

          const sidebarHeight =
            sidebar.offsetHeight;

          // =================================================
          // МАКСИМАЛЬНЕ ЗМІЩЕННЯ
          // =================================================
          //
          // Sidebar не повинен рухатися нижче
          // кінця grid.
          //

          const maxOffset =
            Math.max(
              0,
              gridRect.height -
                sidebarHeight
            );

          // =================================================
          // ФІНАЛЬНЕ ЗМІЩЕННЯ
          // =================================================

          const nextOffset =
            Math.min(
              Math.max(
                0,
                rawOffset
              ),
              maxOffset
            );

          setOffset(
            nextOffset
          );
        });
    };

    // =====================================================
    // INITIAL POSITION
    // =====================================================

    updatePosition();

    // =====================================================
    // SCROLL
    // =====================================================

    window.addEventListener(
      "scroll",
      updatePosition,
      {
        passive: true,
      }
    );

    // =====================================================
    // RESIZE
    // =====================================================

    window.addEventListener(
      "resize",
      updatePosition
    );

    // =====================================================
    // RESIZE OBSERVER
    // =====================================================

    const resizeObserver =
      new ResizeObserver(() => {
        updatePosition();
      });

    resizeObserver.observe(
      wrapper
    );

    resizeObserver.observe(
      sidebar
    );

    // =====================================================
    // HEADER
    // =====================================================
    //
    // Коли TestHeader розгортається / згортається,
    // змінюється його висота.
    //
    // ResizeObserver запускає updatePosition(),
    // тому Sidebar одразу перераховує своє положення.
    //

    const header =
      document.querySelector(
        "header"
      );

    if (header) {
      resizeObserver.observe(
        header
      );
    }

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      window.removeEventListener(
        "scroll",
        updatePosition
      );

      window.removeEventListener(
        "resize",
        updatePosition
      );

      resizeObserver.disconnect();

      if (frameId !== null) {
        window.cancelAnimationFrame(
          frameId
        );
      }
    };
  }, []);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      ref={wrapperRef}
      className="
        min-w-0
        w-full
        h-full
      "
    >
      <div
        ref={sidebarRef}
        style={{
          transform:
            `translate3d(0, ${offset}px, 0)`,

          willChange:
            "transform",
        }}
      >
        <Sidebar />
      </div>
    </div>
  );
}