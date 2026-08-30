"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useTestSession } from "@/app/context/TestSessionContext";

// =====================================================
// SERVER SESSION
// =====================================================

type ServerSession = {
  id: number;

  testId: number;

  currentQuestion: number;

  savedAnswers: unknown;

  timeLeft: number;

  extraTime: number;

  finished: boolean;

  blocked: boolean;

  blockReason: string | null;

  startedAt: string | null;

  resultId: number | null;
};

// =====================================================
// PROPS
// =====================================================

type SessionMonitorProps = {
  testId: number;

  pollInterval?: number;

  heartbeatInterval?: number;
};

// =====================================================
// NORMALIZE ANSWERS
// =====================================================

function normalizeSavedAnswers(
  value: unknown
): Record<number, number[]> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return {};
  }

  const result: Record<number, number[]> = {};

  for (const [
    key,
    valueForQuestion,
  ] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (!Array.isArray(valueForQuestion)) {
      continue;
    }

    const questionId = Number(key);

    if (!Number.isInteger(questionId)) {
      continue;
    }

    result[questionId] =
      valueForQuestion.filter(
        (item): item is number =>
          typeof item === "number" &&
          Number.isInteger(item)
      );
  }

  return result;
}

// =====================================================
// COMPONENT
// =====================================================

export default function SessionMonitor({
  testId,
  pollInterval = 5000,
  heartbeatInterval = 10000,
}: SessionMonitorProps) {
  const router = useRouter();

  const {
    sessionId,
    setSessionId,
    restoreSession,
    setCurrentQuestion,
  } = useTestSession();

  // =====================================================
  // BLOCK UI
  // =====================================================

  const [
    blockedUI,
    setBlockedUI,
  ] = useState(false);

  const [
    blockReasonUI,
    setBlockReasonUI,
  ] = useState<string | null>(null);

  // =====================================================
  // REFS
  // =====================================================

  const mountedRef =
    useRef(false);

  const initialSyncDoneRef =
    useRef(false);

  const pollingRef =
    useRef(false);

  const heartbeatRef =
    useRef(false);

  const lastServerTimeRef =
    useRef<number | null>(null);

  // =====================================================
  // BLOCK STATE REF
  //
  // Дозволяє чітко визначати момент:
  //
  // BLOCKED -> UNBLOCKED
  //
  // і примусово синхронізувати Context.
  // =====================================================

  const lastBlockedRef =
    useRef<boolean | null>(null);

  // =====================================================
  // RESULT REDIRECT REF
  // =====================================================

  const resultRedirectedRef =
    useRef(false);

  // =====================================================
  // MOUNT
  // =====================================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // =====================================================
  // FIND SESSION ID
  // =====================================================

  useEffect(() => {
    if (!testId || sessionId) {
      return;
    }

    const sessionStorageId =
      sessionStorage.getItem(
        "testSessionId"
      );

    const localStorageId =
      localStorage.getItem(
        "testSessionId"
      );

    const storedSessionId =
      sessionStorageId ??
      localStorageId;

    if (!storedSessionId) {
      console.error(
        "SESSION MONITOR: sessionId не знайдено."
      );

      return;
    }

    const numericSessionId =
      Number(storedSessionId);

    if (
      !Number.isInteger(
        numericSessionId
      ) ||
      numericSessionId <= 0
    ) {
      console.error(
        "SESSION MONITOR: некоректний sessionId."
      );

      return;
    }

    setSessionId(
      numericSessionId
    );
  }, [
    testId,
    sessionId,
    setSessionId,
  ]);

  // =====================================================
  // APPLY SERVER SESSION
  // =====================================================

  const applySession =
    useCallback(
      (
        session: ServerSession
      ) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        const normalizedTime =
          Math.max(
            0,
            Math.floor(
              Number(
                session.timeLeft
              ) || 0
            )
          );

        const answers =
          normalizeSavedAnswers(
            session.savedAnswers
          );

        const wasBlocked =
          lastBlockedRef.current;

        const isNowBlocked =
          session.blocked;

        const wasUnblocked =
          wasBlocked === true &&
          isNowBlocked === false;

        console.log(
          "SESSION MONITOR: APPLY SESSION",
          {
            sessionId:
              session.id,

            timeLeft:
              normalizedTime,

            startedAt:
              session.startedAt,

            finished:
              session.finished,

            blocked:
              session.blocked,

            wasBlocked,

            wasUnblocked,

            resultId:
              session.resultId,
          }
        );

        // =================================================
        // ЗБЕРІГАЄМО ОСТАННІЙ СТАН BLOCKED
        // =================================================

        lastBlockedRef.current =
          isNowBlocked;

        lastServerTimeRef.current =
          normalizedTime;

        // =================================================
        // BLOCK UI
        // =================================================

        setBlockedUI(
          session.blocked
        );

        setBlockReasonUI(
          session.blocked
            ? session.blockReason ??
                "Тестування заблоковано адміністратором."
            : null
        );

        // =================================================
        // FINISHED
        // =================================================

        if (
          session.finished
        ) {
          restoreSession(
            session.currentQuestion,
            answers,
            normalizedTime,
            session.startedAt,
            true,
            session.blocked
          );

          if (
            !resultRedirectedRef.current &&
            typeof session.resultId ===
              "number" &&
            session.resultId > 0
          ) {
            resultRedirectedRef.current =
              true;

            console.log(
              "SESSION MONITOR: TEST FINISHED, REDIRECTING TO RESULT",
              {
                resultId:
                  session.resultId,
              }
            );

            router.replace(
              `/result/${session.resultId}`
            );
          }

          return;
        }

        // =================================================
        // BLOCKED
        // =================================================

        if (
          session.blocked
        ) {
          restoreSession(
            session.currentQuestion,
            answers,
            normalizedTime,
            session.startedAt,
            false,
            true
          );

          return;
        }

        // =================================================
        // NOT STARTED
        // =================================================

        if (
          !session.startedAt
        ) {
          console.warn(
            "SESSION MONITOR: TEST NOT STARTED"
          );

          return;
        }

        // =================================================
        // EXPIRED
        // =================================================

        if (
          normalizedTime <= 0
        ) {
          restoreSession(
            session.currentQuestion,
            answers,
            0,
            session.startedAt,
            false,
            false
          );

          return;
        }

        // =================================================
        // UNBLOCKED
        //
        // ОСОБЛИВО ВАЖЛИВО:
        //
        // після:
        //
        // blocked = true
        //
        // адміністратор робить:
        //
        // blocked = false
        //
        // ми ПОВТОРНО передаємо в Context:
        //
        // blocked = false
        //
        // і збережений timeLeft.
        //
        // Це прибирає модальне вікно та повертає
        // активний стан таймера.
        // =================================================

        if (
          wasUnblocked
        ) {
          console.log(
            "SESSION MONITOR: SESSION UNBLOCKED — RESTORING ACTIVE TIMER",
            {
              timeLeft:
                normalizedTime,

              startedAt:
                session.startedAt,
            }
          );

          restoreSession(
            session.currentQuestion,
            answers,
            normalizedTime,
            session.startedAt,
            false,
            false
          );

          setBlockedUI(false);

          setBlockReasonUI(null);

          return;
        }

        // =================================================
        // ACTIVE
        // =================================================

        restoreSession(
          session.currentQuestion,
          answers,
          normalizedTime,
          session.startedAt,
          false,
          false
        );
      },
      [
        restoreSession,
        router,
      ]
    );

  // =====================================================
  // FETCH SESSION
  // =====================================================

  const fetchSession =
    useCallback(
      async (
        forceSync = false
      ) => {
        if (
          !sessionId ||
          !testId
        ) {
          return;
        }

        if (
          pollingRef.current
        ) {
          return;
        }

        pollingRef.current =
          true;

        try {
          const response =
            await fetch(
              `/api/session/${testId}?sessionId=${sessionId}`,
              {
                method: "GET",

                cache: "no-store",

                headers: {
                  "Cache-Control":
                    "no-cache",
                },
              }
            );

          if (
            !response.ok
          ) {
            console.error(
              "SESSION MONITOR GET ERROR:",
              response.status
            );

            return;
          }

          const data =
            (await response.json()) as
              | ServerSession
              | {
                  error?: string;
                };

          if (
            !mountedRef.current
          ) {
            return;
          }

          if (
            !("id" in data) ||
            typeof data.id !==
              "number"
          ) {
            console.error(
              "SESSION MONITOR: некоректна відповідь сервера",
              data
            );

            return;
          }

          const serverSession =
            data as ServerSession;

          const serverTime =
            Math.max(
              0,
              Math.floor(
                Number(
                  serverSession.timeLeft
                ) || 0
              )
            );

          // =================================================
          // INITIAL SYNC
          // =================================================

          if (
            !initialSyncDoneRef.current
          ) {
            console.log(
              "SESSION MONITOR: INITIAL SYNC",
              {
                sessionId,

                serverTime,

                startedAt:
                  serverSession.startedAt,

                finished:
                  serverSession.finished,

                blocked:
                  serverSession.blocked,

                resultId:
                  serverSession.resultId,
              }
            );

            initialSyncDoneRef.current =
              true;

            applySession(
              serverSession
            );

            return;
          }

          // =================================================
          // BLOCK STATE CHANGE
          //
          // Це головна перевірка для розблокування.
          //
          // Якщо сервер повернув:
          //
          // true -> false
          //
          // applySession() викликається НЕЗАЛЕЖНО
          // від зміни часу.
          // =================================================

          const previousBlocked =
            lastBlockedRef.current;

          if (
            previousBlocked === true &&
            serverSession.blocked === false
          ) {
            console.log(
              "SESSION MONITOR: BLOCK -> UNBLOCK DETECTED",
              {
                timeLeft:
                  serverTime,
              }
            );

            applySession(
              serverSession
            );

            return;
          }

          // =================================================
          // BLOCKED
          // =================================================

          if (
            serverSession.blocked
          ) {
            applySession(
              serverSession
            );

            return;
          }

          // =================================================
          // FINISHED
          // =================================================

          if (
            serverSession.finished
          ) {
            applySession(
              serverSession
            );

            return;
          }

          // =================================================
          // EXPIRED
          // =================================================

          if (
            serverTime <= 0
          ) {
            applySession(
              serverSession
            );

            return;
          }

          // =================================================
          // FORCE SYNC
          // =================================================

          if (
            forceSync
          ) {
            console.log(
              "SESSION MONITOR: FORCE SYNC",
              {
                serverTime,
              }
            );

            applySession(
              serverSession
            );

            return;
          }

          // =================================================
          // SERVER TIME CHANGE
          //
          // Адміністратор:
          //
          // +5
          // +10
          // +30
          // =================================================

          const previousServerTime =
            lastServerTimeRef.current;

          if (
            previousServerTime !==
              null &&
            Math.abs(
              serverTime -
                previousServerTime
            ) >= 2
          ) {
            console.log(
              "SESSION MONITOR: SERVER TIME CHANGED",
              {
                previous:
                  previousServerTime,

                current:
                  serverTime,
              }
            );

            applySession(
              serverSession
            );

            return;
          }

          lastServerTimeRef.current =
            serverTime;

          // =================================================
          // QUESTION
          // =================================================

          setCurrentQuestion(
            Number.isInteger(
              serverSession.currentQuestion
            )
              ? serverSession.currentQuestion
              : 0
          );
        } catch (error) {
          console.error(
            "SESSION MONITOR GET ERROR:",
            error
          );
        } finally {
          pollingRef.current =
            false;
        }
      },
      [
        sessionId,
        testId,
        applySession,
        setCurrentQuestion,
      ]
    );

  // =====================================================
  // INITIAL FETCH
  // =====================================================

  useEffect(() => {
    if (
      !sessionId ||
      !testId
    ) {
      return;
    }

    void fetchSession(
      true
    );
  }, [
    sessionId,
    testId,
    fetchSession,
  ]);

  // =====================================================
  // POLLING
  // =====================================================

  useEffect(() => {
    if (
      !sessionId ||
      !testId
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          void fetchSession(
            false
          );
        },
        pollInterval
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    sessionId,
    testId,
    pollInterval,
    fetchSession,
  ]);

  // =====================================================
  // HEARTBEAT
  // =====================================================

  const sendHeartbeat =
    useCallback(
      async () => {
        if (
          !sessionId ||
          !testId
        ) {
          return;
        }

        if (
          heartbeatRef.current
        ) {
          return;
        }

        heartbeatRef.current =
          true;

        try {
          await fetch(
            `/api/session/${testId}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "Cache-Control":
                  "no-cache",
              },

              cache: "no-store",

              body: JSON.stringify({
                sessionId,

                heartbeat:
                  true,
              }),
            }
          );
        } catch (error) {
          console.error(
            "SESSION HEARTBEAT ERROR:",
            error
          );
        } finally {
          heartbeatRef.current =
            false;
        }
      },
      [
        sessionId,
        testId,
      ]
    );

  // =====================================================
  // HEARTBEAT INTERVAL
  // =====================================================

  useEffect(() => {
    if (
      !sessionId ||
      !testId
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          void sendHeartbeat();
        },
        heartbeatInterval
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    sessionId,
    testId,
    heartbeatInterval,
    sendHeartbeat,
  ]);

  // =====================================================
  // VISIBILITY
  // =====================================================

  useEffect(() => {
    if (
      !sessionId ||
      !testId
    ) {
      return;
    }

    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          console.log(
            "SESSION MONITOR: TAB VISIBLE"
          );

          void fetchSession(
            true
          );
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [
    sessionId,
    testId,
    fetchSession,
  ]);

  // =====================================================
  // ONLINE
  // =====================================================

  useEffect(() => {
    if (
      !sessionId ||
      !testId
    ) {
      return;
    }

    const handleOnline =
      () => {
        console.log(
          "SESSION MONITOR: ONLINE"
        );

        void fetchSession(
          true
        );

        void sendHeartbeat();
      };

    window.addEventListener(
      "online",
      handleOnline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );
    };
  }, [
    sessionId,
    testId,
    fetchSession,
    sendHeartbeat,
  ]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      {blockedUI && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/60
            px-4
            py-6
            backdrop-blur-[2px]
          "
        >
          <div
            className="
              relative
              w-full
              max-w-xl
              overflow-hidden
              rounded-[28px]
              bg-white
              px-6
              py-8
              shadow-[0_25px_70px_rgba(0,0,0,0.25)]
              sm:px-10
              sm:py-10
            "
          >
            {/* =================================================
                DECORATIVE BACKGROUND
            ================================================= */}

            <div
              className="
                pointer-events-none
                absolute
                left-1/2
                top-[-90px]
                h-[260px]
                w-[260px]
                -translate-x-1/2
                rounded-full
                border
                border-[#7A1F2B]/10
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                left-1/2
                top-[-65px]
                h-[210px]
                w-[210px]
                -translate-x-1/2
                rounded-full
                border
                border-[#7A1F2B]/10
              "
            />

            {/* =================================================
                LOCK ICON
            ================================================= */}

            <div className="relative mx-auto mb-7 flex h-32 w-32 items-center justify-center">
              <div
                className="
                  absolute
                  inset-0
                  rounded-full
                  bg-[#7A1F2B]/[0.035]
                "
              />

              <div
                className="
                  absolute
                  inset-2
                  rounded-full
                  border
                  border-[#7A1F2B]/10
                  bg-[#7A1F2B]/[0.025]
                "
              />

              <div
                className="
                  relative
                  flex
                  h-24
                  w-24
                  items-center
                  justify-center
                  rounded-full
                  border-2
                  border-[#7A1F2B]
                  bg-white
                  shadow-[0_8px_30px_rgba(122,31,43,0.10)]
                "
              >
                <svg
                  viewBox="0 0 64 64"
                  className="
                    h-14
                    w-14
                    text-[#7A1F2B]
                  "
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="
                      M20 29V21
                      C20 14.925 24.925 10 31 10
                      H33
                      C39.075 10 44 14.925 44 21
                      V29
                    "
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />

                  <rect
                    x="13"
                    y="26"
                    width="38"
                    height="29"
                    rx="7"
                    fill="currentColor"
                  />

                  <circle
                    cx="32"
                    cy="38"
                    r="4"
                    fill="white"
                  />

                  <path
                    d="M32 41V47"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* =================================================
                DECORATIVE DIVIDER
            ================================================= */}

            <div className="mb-7 flex items-center justify-center">
              <div className="h-px flex-1 bg-[#7A1F2B]/15" />

              <div
                className="
                  mx-4
                  h-2
                  w-2
                  rounded-full
                  bg-[#7A1F2B]
                "
              />

              <div className="h-px flex-1 bg-[#7A1F2B]/15" />
            </div>

            {/* =================================================
                TITLE
            ================================================= */}

            <h2
              className="
                text-center
                text-3xl
                font-extrabold
                tracking-tight
                text-[#7A1F2B]
                sm:text-4xl
              "
            >
              Заблоковано
            </h2>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <p
              className="
                mx-auto
                mt-5
                max-w-md
                text-center
                text-base
                leading-7
                text-gray-600
                sm:text-lg
                sm:leading-8
              "
            >
              Адміністратор зупинив виконання
              <br className="hidden sm:block" />
              {" "}Вашого тестування.
            </p>

            {/* =================================================
                WAITING MESSAGE
            ================================================= */}

            <div
              className="
                mt-8
                flex
                items-center
                gap-5
                rounded-2xl
                bg-[#7A1F2B]/[0.055]
                px-5
                py-5
                sm:px-6
                sm:py-6
              "
            >
              <div
                className="
                  flex
                  h-16
                  w-16
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border-2
                  border-[#7A1F2B]
                  bg-white
                "
              >
                <svg
                  viewBox="0 0 64 64"
                  className="
                    h-9
                    w-9
                    text-[#7A1F2B]
                  "
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="23"
                    stroke="currentColor"
                    strokeWidth="4"
                  />

                  <path
                    d="M32 18V32L41 38"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <circle
                    cx="32"
                    cy="32"
                    r="2.5"
                    fill="currentColor"
                  />

                  <path
                    d="M32 9V12"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  <path
                    d="M55 32H52"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  <path
                    d="M32 55V52"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  <path
                    d="M9 32H12"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <p
                className="
                  text-base
                  font-medium
                  leading-6
                  text-[#7A1F2B]
                  sm:text-lg
                  sm:leading-7
                "
              >
                Очікуйте подальших вказівок
                <br className="hidden sm:block" />
                {" "}адміністратора.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}