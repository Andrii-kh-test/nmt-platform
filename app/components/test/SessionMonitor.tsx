"use client";

import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  useTestSession,
} from "@/app/context/TestSessionContext";

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

  const result: Record<
    number,
    number[]
  > = {};

  for (const [
    key,
    valueForQuestion,
  ] of Object.entries(
    value as Record<
      string,
      unknown
    >
  )) {
    if (
      !Array.isArray(
        valueForQuestion
      )
    ) {
      continue;
    }

    const questionId =
      Number(key);

    if (
      !Number.isInteger(
        questionId
      )
    ) {
      continue;
    }

    result[questionId] =
      valueForQuestion.filter(
        (
          item
        ): item is number =>
          typeof item ===
            "number" &&
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
  const {
    sessionId,

    setSessionId,

    restoreSession,

    setCurrentQuestion,
  } = useTestSession();

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
    if (
      !testId ||
      sessionId
    ) {
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
      Number(
        storedSessionId
      );

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
          }
        );

        lastServerTimeRef.current =
          normalizedTime;

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
      [restoreSession]
    );

  // =====================================================
  // FETCH SESSION
  //
  // ВАЖЛИВО:
  //
  // ЦЕЙ КОМПОНЕНТ БІЛЬШЕ НЕ ВИКЛИКАЄ
  // POST /api/test/begin.
  //
  // Він ТІЛЬКИ ЧИТАЄ АКТИВНУ СЕСІЮ
  // через GET /api/session/[testId].
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
          //
          // Перший GET після відкриття
          // синхронізує Context із сервером.
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
          // FINISHED / BLOCKED / EXPIRED
          // =================================================

          if (
            serverSession.finished ||
            serverSession.blocked ||
            serverTime <= 0
          ) {
            applySession(
              serverSession
            );

            return;
          }

          // =================================================
          // FORCE SYNC
          //
          // Повернення у вкладку,
          // відновлення мережі тощо.
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
          // +5 хв
          // -5 хв
          //
          // або інша зміна часу.
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

  return null;
}