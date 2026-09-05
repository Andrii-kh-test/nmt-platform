"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Maximize2,
  ShieldCheck,
} from "lucide-react";

type AnswerValue = string | string[] | null;

type AnswerOption = {
  id: number;
  order: number;
  text: string;
};

type Question = {
  id: number;
  order: number;
  type: string;
  text: string;
  points: number;
  answerOptions: AnswerOption[];
  savedAnswer: AnswerValue;
};

type ComplexTestSubject = {
  id: number;
  order: number;
  title: string;
  subject: string;
  duration: number;
  questions: Question[];
};

type SessionData = {
  id: number;
  complexTestId: number;
  participantId: number | null;

  currentTestId: number | null;
  currentQuestion: number;

  savedAnswers: unknown;

  timeLeft: number;
  extraTime: number;

  finished: boolean;
  finishedAt: string | null;

  blocked: boolean;
  blockReason: string | null;
  blockedAt: string | null;

  startedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
};

type ComplexTestData = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  examType: string;
  section: string | null;
};

type SessionResponse = {
  success: boolean;
  message?: string;

  session: SessionData;

  complexTest: {
    id: number;
    title: string;
    description: string | null;
    duration: number;
    examType: string;
    section: string | null;

    tests: Array<{
      id: number;
      order: number;

      test: {
        id: number;
        title: string;
        subject: string;
        duration: number;

        questions: Array<{
          id: number;
          text: string;
          type: string;
          answerOptions: AnswerOption[];
        }>;
      };
    }>;
  };
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeAnswer(
  value: unknown
): AnswerValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return null;
}

function getSavedAnswer(
  savedAnswers: unknown,
  testId: number,
  questionId: number
): AnswerValue {
  if (!isRecord(savedAnswers)) {
    return null;
  }

  const testAnswers =
    savedAnswers[String(testId)];

  if (!isRecord(testAnswers)) {
    return null;
  }

  return normalizeAnswer(
    testAnswers[String(questionId)]
  );
}

function buildSavedAnswers(
  currentSavedAnswers: unknown,
  testId: number,
  questionId: number,
  answer: AnswerValue
): Record<string, Record<string, AnswerValue>> {
  const result: Record<
    string,
    Record<string, AnswerValue>
  > = {};

  if (isRecord(currentSavedAnswers)) {
    for (const [
      testKey,
      testValue,
    ] of Object.entries(
      currentSavedAnswers
    )) {
      if (isRecord(testValue)) {
        result[testKey] = {};

        for (const [
          questionKey,
          questionValue,
        ] of Object.entries(testValue)) {
          result[testKey][questionKey] =
            normalizeAnswer(questionValue);
        }
      }
    }
  }

  if (!result[String(testId)]) {
    result[String(testId)] = {};
  }

  result[String(testId)][String(questionId)] =
    answer;

  return result;
}

function decodeHtmlEntities(
  value: string
): string {
  return value.replace(
    /&(#\d+|#x[a-f0-9]+|lt|gt|quot|apos|nbsp|amp);/gi,
    (entity) => {
      const normalized =
        entity.toLowerCase();

      if (normalized === "&lt;") {
        return "<";
      }

      if (normalized === "&gt;") {
        return ">";
      }

      if (normalized === "&quot;") {
        return '"';
      }

      if (normalized === "&apos;") {
        return "'";
      }

      if (normalized === "&nbsp;") {
        return " ";
      }

      if (normalized === "&amp;") {
        return "&";
      }

      if (normalized.startsWith("&#x")) {
        const code = parseInt(
          normalized.slice(3, -1),
          16
        );

        return Number.isFinite(code)
          ? String.fromCodePoint(code)
          : entity;
      }

      if (normalized.startsWith("&#")) {
        const code = parseInt(
          normalized.slice(2, -1),
          10
        );

        return Number.isFinite(code)
          ? String.fromCodePoint(code)
          : entity;
      }

      return entity;
    }
  );
}

function escapeHtmlAttribute(
  value: string
): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeRichText(
  value: string
): string {
  const source =
    decodeHtmlEntities(
      value ?? ""
    );

  const dangerousTags =
    /<\s*(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|option|link|meta|base|template)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;

  const withoutDangerous =
    source.replace(
      dangerousTags,
      ""
    );

  const allowedTags =
    new Set([
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "mark",
      "small",
      "sub",
      "sup",
      "ul",
      "ol",
      "li",
      "blockquote",
      "div",
      "span",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "img",
    ]);

  return withoutDangerous.replace(
    /<\s*(\/?)\s*([a-z0-9]+)([^>]*)>/gi,
    (
      _match,
      slash,
      tagName,
      attributes
    ) => {
      const tag =
        String(tagName).toLowerCase();

      const closing =
        String(slash) === "/";

      if (!allowedTags.has(tag)) {
        return "";
      }

      if (tag === "br") {
        return closing
          ? ""
          : "<br />";
      }

      if (tag === "img") {
        if (closing) {
          return "";
        }

        const srcMatch =
          String(attributes).match(
            /\bsrc\s*=\s*(['"])(.*?)\1/i
          );

        const altMatch =
          String(attributes).match(
            /\balt\s*=\s*(['"])(.*?)\1/i
          );

        const src =
          srcMatch?.[2] ?? "";

        const alt =
          altMatch?.[2] ?? "";

        const validSrc =
          /^(https?:\/\/|\/|\.\/|\.\.\/|data:image\/)/i.test(
            src
          );

        if (!validSrc) {
          return "";
        }

        return `<img src="${escapeHtmlAttribute(
          src
        )}" alt="${escapeHtmlAttribute(
          alt
        )}" class="max-w-full h-auto rounded-lg" />`;
      }

      if (closing) {
        return `</${tag}>`;
      }

      return `<${tag}>`;
    }
  );
}

function RichText({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  const safeHtml = useMemo(
    () => sanitizeRichText(html),
    [html]
  );

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{
        __html: safeHtml,
      }}
    />
  );
}

function getQuestionElementId(
  testId: number,
  questionId: number
) {
  return `complex-question-${testId}-${questionId}`;
}

function isAnswerProvided(
  answer: AnswerValue
): boolean {
  if (Array.isArray(answer)) {
    return answer.length > 0;
  }

  return (
    answer !== null &&
    answer !== ""
  );
}

function answersEqual(
  first: AnswerValue,
  second: AnswerValue
): boolean {
  if (
    Array.isArray(first) &&
    Array.isArray(second)
  ) {
    if (first.length !== second.length) {
      return false;
    }

    const firstSorted =
      [...first].map(String).sort();

    const secondSorted =
      [...second].map(String).sort();

    return firstSorted.every(
      (value, index) =>
        value === secondSorted[index]
    );
  }

  if (
    Array.isArray(first) ||
    Array.isArray(second)
  ) {
    return false;
  }

  return first === second;
}

export default function ComplexTestPage() {
  const router = useRouter();
  const params = useParams();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const complexTestId = Number(id);

  const sessionStorageKey =
    `complex-test-session-${id}`;

  const [sessionId, setSessionId] =
    useState<number | null>(null);

  const [session, setSession] =
    useState<SessionData | null>(null);

  const [complexTest, setComplexTest] =
    useState<ComplexTestData | null>(null);

  const [tests, setTests] =
    useState<ComplexTestSubject[]>([]);

  const [selectedTestId, setSelectedTestId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [sessionLoaded, setSessionLoaded] =
    useState(false);

  const [savingQuestionKey, setSavingQuestionKey] =
    useState<string | null>(null);

  const [finishing, setFinishing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [finishModal, setFinishModal] =
    useState(false);

  const [finished, setFinished] =
    useState(false);

  const [blocked, setBlocked] =
    useState(false);

  const [activeQuestionId, setActiveQuestionId] =
    useState<number | null>(null);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [securityReady, setSecurityReady] =
    useState(false);

  const [securityWarning, setSecurityWarning] =
    useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    const storedSession =
      sessionStorage.getItem(
        sessionStorageKey
      );

    if (!storedSession) {
      router.replace(
        `/complex-tests/${id}/start`
      );

      return;
    }

    try {
      const parsed =
        JSON.parse(storedSession);

      const storedSessionId =
        Number(parsed.sessionId);

      if (
        !Number.isInteger(
          storedSessionId
        ) ||
        storedSessionId <= 0
      ) {
        sessionStorage.removeItem(
          sessionStorageKey
        );

        router.replace(
          `/complex-tests/${id}/start`
        );

        return;
      }

      setSessionId(
        storedSessionId
      );
    } catch (error) {
      console.error(
        "Invalid complex test session:",
        error
      );

      sessionStorage.removeItem(
        sessionStorageKey
      );

      router.replace(
        `/complex-tests/${id}/start`
      );
    }
  }, [
    id,
    router,
    sessionStorageKey,
  ]);

  const convertTests = useCallback(
    (
      apiTests:
        SessionResponse["complexTest"]["tests"],
      savedAnswers: unknown
    ): ComplexTestSubject[] => {
      return apiTests
        .slice()
        .sort(
          (a, b) =>
            a.order - b.order
        )
        .map(
          (item) => ({
            id: item.test.id,

            order: item.order,

            title:
              item.test.title,

            subject:
              item.test.subject,

            duration:
              item.test.duration,

            questions:
              item.test.questions.map(
                (
                  question,
                  questionIndex
                ) => ({
                  id: question.id,

                  order:
                    questionIndex,

                  type:
                    question.type,

                  text:
                    question.text,

                  points: 1,

                  answerOptions:
                    question.answerOptions,

                  savedAnswer:
                    getSavedAnswer(
                      savedAnswers,
                      item.test.id,
                      question.id
                    ),
                })
              ),
          })
        );
    },
    []
  );

  const loadSession = useCallback(
    async (
      currentSessionId: number
    ) => {
      if (
        !Number.isInteger(
          complexTestId
        ) ||
        complexTestId <= 0
      ) {
        setError(
          "Некоректний id комбінованого тесту."
        );

        setLoading(false);
        setSessionLoaded(false);

        return;
      }

      try {
        setLoading(true);
        setSessionLoaded(false);
        setError("");

        const response =
          await fetch(
            `/api/complex-tests/${complexTestId}/session?sessionId=${currentSessionId}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data =
          (await response.json()) as SessionResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Не вдалося завантажити сесію."
          );
        }

        const convertedTests =
          convertTests(
            data.complexTest.tests,
            data.session.savedAnswers
          );

        setSession(
          data.session
        );

        setComplexTest({
          id:
            data.complexTest.id,

          title:
            data.complexTest.title,

          description:
            data.complexTest.description,

          duration:
            data.complexTest.duration,

          examType:
            data.complexTest.examType,

          section:
            data.complexTest.section,
        });

        setTests(
          convertedTests
        );

        const serverTimeLeft =
          Math.max(
            0,
            Math.floor(
              Number(
                data.session.timeLeft
              )
            )
          );

        setTimeLeft(
          serverTimeLeft
        );

        setBlocked(
          Boolean(
            data.session.blocked
          )
        );

        setFinished(
          Boolean(
            data.session.finished
          )
        );

        const initialTestId =
          data.session.currentTestId ??
          convertedTests[0]?.id ??
          null;

        setSelectedTestId(
          initialTestId
        );

        setActiveQuestionId(
          convertedTests.find(
            (test) =>
              test.id ===
              initialTestId
          )?.questions[0]?.id ??
            null
        );

        setSessionLoaded(true);
      } catch (error) {
        console.error(
          "Load complex test session error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Не вдалося завантажити тест."
        );

        setSessionLoaded(false);
      } finally {
        setLoading(false);
      }
    },
    [
      complexTestId,
      convertTests,
    ]
  );

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    void loadSession(
      sessionId
    );
  }, [
    sessionId,
    loadSession,
  ]);

  const currentTest =
    useMemo(() => {
      if (tests.length === 0) {
        return null;
      }

      return (
        tests.find(
          (test) =>
            test.id ===
            selectedTestId
        ) ??
        tests[0]
      );
    }, [
      tests,
      selectedTestId,
    ]);

  useEffect(() => {
    if (!currentTest) {
      return;
    }

    const firstQuestion =
      currentTest.questions[0];

    if (
      activeQuestionId === null ||
      !currentTest.questions.some(
        (question) =>
          question.id ===
          activeQuestionId
      )
    ) {
      setActiveQuestionId(
        firstQuestion?.id ??
          null
      );
    }
  }, [
    currentTest?.id,
    currentTest?.questions.length,
    activeQuestionId,
  ]);

  useEffect(() => {
    if (
      !sessionLoaded ||
      loading ||
      finished ||
      blocked ||
      timeLeft <= 0
    ) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setTimeLeft(
          (previous) => {
            if (
              previous <= 1
            ) {
              window.clearInterval(
                timer
              );

              return 0;
            }

            return (
              previous - 1
            );
          }
        );
      }, 1000);

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    sessionLoaded,
    loading,
    finished,
    blocked,
    timeLeft,
  ]);

  useEffect(() => {
    if (
      !sessionLoaded ||
      loading ||
      finished ||
      blocked ||
      timeLeft > 0 ||
      !sessionId
    ) {
      return;
    }

    let cancelled = false;

    async function finishByTimer() {
      try {
        setFinishing(true);
        setError("");

        const response =
          await fetch(
            `/api/complex-tests/${complexTestId}/session`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  sessionId,

                  finished: true,
                }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Не вдалося завершити тест."
          );
        }

        if (
          cancelled
        ) {
          return;
        }

        setFinished(true);

        setSession(
          (previous) =>
            previous
              ? {
                  ...previous,

                  finished:
                    true,

                  timeLeft:
                    0,

                  finishedAt:
                    data.session
                      ?.finishedAt ??
                    previous.finishedAt,
                }
              : previous
        );
      } catch (error) {
        console.error(
          "Finish by timer error:",
          error
        );

        if (
          cancelled
        ) {
          return;
        }

        setError(
          "Час тестування завершився, але не вдалося зафіксувати завершення."
        );
      } finally {
        if (
          !cancelled
        ) {
          setFinishing(
            false
          );
        }
      }
    }

    void finishByTimer();

    return () => {
      cancelled = true;
    };
  }, [
    sessionLoaded,
    loading,
    finished,
    blocked,
    timeLeft,
    sessionId,
    complexTestId,
  ]);

  const requestFullscreen =
    useCallback(
      async () => {
        try {
          if (
            document.fullscreenElement
          ) {
            setIsFullscreen(true);
            setSecurityReady(true);
            setSecurityWarning("");

            return;
          }

          const element =
            document.documentElement as FullscreenElement;

          if (
            element.requestFullscreen
          ) {
            await element.requestFullscreen();
          } else if (
            element.webkitRequestFullscreen
          ) {
            await element.webkitRequestFullscreen();
          } else {
            throw new Error(
              "Ваш браузер не підтримує повноекранний режим."
            );
          }

          setSecurityReady(true);
          setSecurityWarning("");
        } catch (error) {
          console.error(
            "Fullscreen error:",
            error
          );

          setSecurityReady(false);

          setSecurityWarning(
            error instanceof Error
              ? error.message
              : "Не вдалося увімкнути повноекранний режим. Спробуйте ще раз."
          );
        }
      },
      []
    );

  useEffect(() => {
    if (
      !sessionLoaded ||
      finished ||
      blocked
    ) {
      return;
    }

    const handleFullscreenChange =
      () => {
        const fullscreen =
          Boolean(
            document.fullscreenElement
          );

        setIsFullscreen(
          fullscreen
        );

        if (fullscreen) {
          setSecurityReady(
            true
          );

          setSecurityWarning(
            ""
          );
        } else {
          setSecurityReady(
            false
          );

          setSecurityWarning(
            "Повноекранний режим вимкнено. Для продовження тестування знову увійдіть у повноекранний режим."
          );
        }
      };

    const handleKeyDown =
      (event: KeyboardEvent) => {
        const key =
          event.key.toLowerCase();

        const modifier =
          event.ctrlKey ||
          event.metaKey;

        const forbidden =
          key === "f12" ||
          key === "f5" ||
          key === "f11" ||
          key === "printscreen" ||
          key === "tab" &&
            event.ctrlKey ||
            modifier &&
              [
                "c",
                "x",
                "v",
                "a",
                "s",
                "p",
                "u",
                "f",
                "r",
                "w",
                "t",
                "n",
              ].includes(key) ||
            modifier &&
              event.shiftKey &&
              [
                "i",
                "j",
                "c",
                "r",
                "t",
                "n",
              ].includes(key) ||
            event.altKey &&
              [
                "arrowleft",
                "arrowright",
              ].includes(key);

        if (!forbidden) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (
          key === "printscreen"
        ) {
          setSecurityReady(false);
          setSecurityWarning(
            "Знімок екрана заборонено під час тестування."
          );
        }
      };

    const preventContextMenu =
      (event: MouseEvent) => {
        event.preventDefault();
      };

    const preventClipboard =
      (event: Event) => {
        event.preventDefault();
      };

    const preventDrag =
      (event: DragEvent) => {
        event.preventDefault();
      };

    const handleVisibilityChange =
      () => {
        if (
          document.hidden
        ) {
          setSecurityReady(
            false
          );

          setSecurityWarning(
            "Ви залишили сторінку тестування. Для продовження поверніться до тесту та знову підтвердьте повноекранний режим."
          );
        }
      };

    const handleBlur =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          setSecurityReady(
            false
          );

          setSecurityWarning(
            "Фокус сторінки тестування втрачено. Поверніться до тесту."
          );
        }
      };

    const handleBeforeUnload =
      (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = "";
      };

    const handlePopState =
      () => {
        window.history.pushState(
          null,
          "",
          window.location.href
        );

        setSecurityReady(
          false
        );

        setSecurityWarning(
          "Під час тестування перехід назад заборонено."
        );
      };

    window.history.pushState(
      null,
      "",
      window.location.href
    );

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
      true
    );

    document.addEventListener(
      "contextmenu",
      preventContextMenu
    );

    document.addEventListener(
      "copy",
      preventClipboard
    );

    document.addEventListener(
      "cut",
      preventClipboard
    );

    document.addEventListener(
      "paste",
      preventClipboard
    );

    document.addEventListener(
      "selectstart",
      preventClipboard
    );

    document.addEventListener(
      "dragstart",
      preventDrag
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "blur",
      handleBlur
    );

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    window.addEventListener(
      "popstate",
      handlePopState
    );

    setIsFullscreen(
      Boolean(
        document.fullscreenElement
      )
    );

    if (
      document.fullscreenElement
    ) {
      setSecurityReady(
        true
      );
    }

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
        true
      );

      document.removeEventListener(
        "contextmenu",
        preventContextMenu
      );

      document.removeEventListener(
        "copy",
        preventClipboard
      );

      document.removeEventListener(
        "cut",
        preventClipboard
      );

      document.removeEventListener(
        "paste",
        preventClipboard
      );

      document.removeEventListener(
        "selectstart",
        preventClipboard
      );

      document.removeEventListener(
        "dragstart",
        preventDrag
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "blur",
        handleBlur
      );

      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );

      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, [
    sessionLoaded,
    finished,
    blocked,
  ]);

  function formatTime(
    seconds: number
  ) {
    const safeSeconds =
      Math.max(
        0,
        seconds
      );

    const hours =
      Math.floor(
        safeSeconds / 3600
      );

    const minutes =
      Math.floor(
        (safeSeconds % 3600) /
          60
      );

    const remainingSeconds =
      safeSeconds % 60;

    if (hours > 0) {
      return `${String(
        hours
      ).padStart(
        2,
        "0"
      )}:${String(
        minutes
      ).padStart(
        2,
        "0"
      )}:${String(
        remainingSeconds
      ).padStart(
        2,
        "0"
      )}`;
    }

    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(
      2,
      "0"
    )}`;
  }

  function updateLocalAnswer(
    testId: number,
    questionId: number,
    answer: AnswerValue
  ) {
    setTests(
      (previousTests) =>
        previousTests.map(
          (test) => {
            if (
              test.id !==
              testId
            ) {
              return test;
            }

            return {
              ...test,

              questions:
                test.questions.map(
                  (
                    question
                  ) => {
                    if (
                      question.id !==
                      questionId
                    ) {
                      return question;
                    }

                    return {
                      ...question,

                      savedAnswer:
                        answer,
                    };
                  }
                ),
            };
          }
        )
    );
  }

  async function saveAnswer(
    testId: number,
    questionId: number,
    answer: AnswerValue
  ) {
    if (
      !sessionId ||
      finished ||
      blocked ||
      !isAnswerProvided(answer)
    ) {
      return;
    }

    const questionKey =
      `${testId}-${questionId}`;

    try {
      setSavingQuestionKey(
        questionKey
      );

      setError("");

      const nextSavedAnswers =
        buildSavedAnswers(
          session?.savedAnswers,
          testId,
          questionId,
          answer
        );

      const response =
        await fetch(
          `/api/complex-tests/${complexTestId}/session`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                sessionId,

                savedAnswers:
                  nextSavedAnswers,

                currentTestId:
                  testId,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Не вдалося зберегти відповідь."
        );
      }

      if (
        data.session
      ) {
        setSession(
          (previous) =>
            previous
              ? {
                  ...previous,

                  savedAnswers:
                    data.session
                      .savedAnswers ??
                    nextSavedAnswers,

                  currentTestId:
                    data.session
                      .currentTestId,

                  currentQuestion:
                    data.session
                      .currentQuestion,
                }
              : previous
        );
      }
    } catch (error) {
      console.error(
        "Save complex test answer error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Не вдалося зберегти відповідь."
      );
    } finally {
      setSavingQuestionKey(
        null
      );
    }
  }

  function selectSingleAnswer(
    testId: number,
    questionId: number,
    optionId: number
  ) {
    const answer =
      String(optionId);

    updateLocalAnswer(
      testId,
      questionId,
      answer
    );
  }

  function selectMultipleAnswer(
    testId: number,
    questionId: number,
    currentAnswer: AnswerValue,
    optionId: number
  ) {
    const current =
      Array.isArray(
        currentAnswer
      )
        ? currentAnswer.map(
            String
          )
        : currentAnswer
          ? [
              String(
                currentAnswer
              ),
            ]
          : [];

    const option =
      String(optionId);

    const next =
      current.includes(
        option
      )
        ? current.filter(
            (value) =>
              value !==
              option
          )
        : [
            ...current,
            option,
          ];

    const answer =
      next.length > 0
        ? next
        : null;

    updateLocalAnswer(
      testId,
      questionId,
      answer
    );
  }

  function isOptionSelected(
    answer: AnswerValue,
    optionId: number
  ) {
    if (
      Array.isArray(answer)
    ) {
      return answer.includes(
        String(optionId)
      );
    }

    return (
      answer ===
      String(optionId)
    );
  }

  async function selectTest(
    testId: number
  ) {
    if (
      !sessionId ||
      finished ||
      blocked ||
      savingQuestionKey
    ) {
      return;
    }

    setSelectedTestId(
      testId
    );

    const firstQuestionId =
      tests.find(
        (test) =>
          test.id ===
          testId
      )?.questions[0]?.id ??
      null;

    setActiveQuestionId(
      firstQuestionId
    );

    try {
      const response =
        await fetch(
          `/api/complex-tests/${complexTestId}/session`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                sessionId,

                currentTestId:
                  testId,

                currentQuestion:
                  0,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Не вдалося змінити предмет."
        );
      }

      setSession(
        (previous) =>
          previous
            ? {
                ...previous,

                currentTestId:
                  testId,

                currentQuestion:
                  0,
              }
            : previous
      );
    } catch (error) {
      console.error(
        "Select complex test subject error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Не вдалося змінити предмет."
      );
    }
  }

  async function finishTest() {
    if (
      !sessionId ||
      finishing ||
      finished
    ) {
      return;
    }

    try {
      setFinishing(true);
      setError("");

      const response =
        await fetch(
          `/api/complex-tests/${complexTestId}/session`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                sessionId,

                finished: true,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Не вдалося завершити тест."
        );
      }

      setFinished(true);

      setFinishModal(
        false
      );

      setSession(
        (previous) =>
          previous
            ? {
                ...previous,

                finished:
                  true,

                timeLeft:
                  0,

                finishedAt:
                  data.session
                    ?.finishedAt ??
                  previous.finishedAt,
              }
            : previous
      );

      setTimeLeft(0);
    } catch (error) {
      console.error(
        "Finish complex test error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Не вдалося завершити тест."
      );
    } finally {
      setFinishing(
        false
      );
    }
  }

  function scrollToQuestion(
    testId: number,
    questionId: number
  ) {
    setActiveQuestionId(
      questionId
    );

    const element =
      document.getElementById(
        getQuestionElementId(
          testId,
          questionId
        )
      );

    element?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  const totalQuestions =
    useMemo(() => {
      return tests.reduce(
        (
          total,
          test
        ) =>
          total +
          test.questions.length,
        0
      );
    }, [tests]);

  const answeredQuestions =
    useMemo(() => {
      return tests.reduce(
        (
          total,
          test
        ) =>
          total +
          test.questions.filter(
            (question) =>
              isAnswerProvided(
                question.savedAnswer
              )
          ).length,
        0
      );
    }, [tests]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2B]" />

          <p className="mt-4 text-base text-gray-500">
            Завантаження тесту...
          </p>
        </div>
      </main>
    );
  }

  if (
    error &&
    !complexTest
  ) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />

          <h1 className="mt-4 text-xl font-semibold text-gray-800">
            Не вдалося завантажити тест
          </h1>

          <p className="mt-3 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/complex-tests"
              )
            }
            className="mt-6 rounded-lg bg-[#7A1F2B] px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Повернутися до тестів
          </button>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col">
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>

            <h1 className="mt-5 text-2xl font-semibold text-gray-800">
              Тест завершено
            </h1>

            <p className="mt-3 text-gray-500">
              Ваші відповіді збережено.
            </p>

            <p className="mt-5 text-sm text-gray-400">
              Опрацьовано відповідей
            </p>

            <p className="mt-1 text-xl font-semibold text-gray-800">
              {answeredQuestions} /{" "}
              {totalQuestions}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/complex-tests"
                )
              }
              className="mt-7 rounded-lg bg-[#7A1F2B] px-7 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Повернутися до тестів
            </button>
          </div>
        </div>

        <footer className="border-t border-gray-200 bg-white py-6">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <p className="text-sm text-gray-500">
              © Хорунжий Андрій
              Володимирович, 2026
            </p>
          </div>
        </footer>
      </main>
    );
  }

  if (blocked) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-xl border border-red-200 bg-white p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <LockKeyhole className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-red-700">
            Тестування заблоковано
          </h1>

          <p className="mt-3 text-gray-500">
            Доступ до проходження тесту тимчасово заблоковано.
          </p>

          {session?.blockReason && (
            <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {session.blockReason}
            </div>
          )}
        </div>
      </main>
    );
  }

  if (!currentTest) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <p className="text-base text-gray-500">
          У тесті немає доступних питань.
        </p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-slate-100 select-none"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onContextMenu={(event) =>
        event.preventDefault()
      }
      onCopy={(event) =>
        event.preventDefault()
      }
      onCut={(event) =>
        event.preventDefault()
      }
      onPaste={(event) =>
        event.preventDefault()
      }
      onDragStart={(event) =>
        event.preventDefault()
      }
    >
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                {complexTest?.examType}
              </p>

              <h1 className="truncate text-lg font-semibold text-gray-800 md:text-xl">
                {complexTest?.title}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  timeLeft <= 300
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                <Clock3 className="h-4 w-4" />

                <span className="font-mono text-base font-semibold">
                  {formatTime(
                    timeLeft
                  )}
                </span>
              </div>

              <button
                type="button"
                disabled={finishing}
                onClick={() =>
                  setFinishModal(
                    true
                  )
                }
                className="rounded-lg bg-[#7A1F2B] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {finishing
                  ? "Завершення..."
                  : "Завершити тест"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full border-b border-gray-200 bg-white">
        <div className="w-full overflow-x-auto">
          <div className="flex w-full min-w-max">
            {tests.map(
              (
                test,
                index
              ) => {
                const isActive =
                  test.id ===
                  currentTest.id;

                const answered =
                  test.questions.filter(
                    (
                      question
                    ) =>
                      isAnswerProvided(
                        question.savedAnswer
                      )
                  ).length;

                return (
                  <button
                    key={
                      test.id
                    }
                    type="button"
                    onClick={() =>
                      selectTest(
                        test.id
                      )
                    }
                    disabled={
                      Boolean(
                        savingQuestionKey
                      ) ||
                      finishing
                    }
                    className={`flex min-w-[190px] flex-1 items-center justify-center border-r border-gray-200 px-5 py-3 text-center transition last:border-r-0 ${
                      isActive
                        ? "bg-gray-100 text-gray-800"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {test.subject}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-400">
                        {answered} /{" "}
                        {
                          test.questions
                            .length
                        }
                      </p>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

            <div className="flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="font-semibold text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="order-2 min-w-0 lg:order-1">
            <div className="space-y-4">
              {currentTest.questions.map(
                (
                  question,
                  questionIndex
                ) => {
                  const answer =
                    question.savedAnswer;

                  const savedAnswer =
                    getSavedAnswer(
                      session?.savedAnswers,
                      currentTest.id,
                      question.id
                    );

                  const hasAnswer =
                    isAnswerProvided(
                      answer
                    );

                  const isSaved =
                    answersEqual(
                      answer,
                      savedAnswer
                    );

                  const isMultiple =
                    question.type ===
                      "multiple" ||
                    question.type ===
                      "multiple_choice" ||
                    question.type ===
                      "MULTIPLE_CHOICE" ||
                    question.type ===
                      "MULTIPLE";

                  const questionKey =
                    `${currentTest.id}-${question.id}`;

                  const isSaving =
                    savingQuestionKey ===
                    questionKey;

                  return (
                    <section
                      key={
                        question.id
                      }
                      id={getQuestionElementId(
                        currentTest.id,
                        question.id
                      )}
                      className="scroll-mt-28 rounded-xl border border-gray-200 bg-white"
                    >
                      <div className="p-5 md:p-7">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                              {
                                questionIndex +
                                1
                              }
                            </div>

                            <div className="pt-0.5">
                              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Завдання
                              </p>

                              <p className="mt-0.5 text-xs text-gray-400">
                                {
                                  question.points
                                }{" "}
                                {question.points ===
                                1
                                  ? "бал"
                                  : question.points >=
                                      2 &&
                                    question.points <=
                                      4
                                    ? "бали"
                                    : "балів"}
                              </p>
                            </div>
                          </div>

                          {isSaved && (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                          )}
                        </div>

                        <RichText
                          html={
                            question.text
                          }
                          className="mt-6 text-base leading-7 text-gray-800 md:text-lg"
                        />

                        <div className="mt-6 space-y-2">
                          {question.answerOptions.map(
                            (
                              option,
                              optionIndex
                            ) => {
                              const selected =
                                isOptionSelected(
                                  answer,
                                  option.id
                                );

                              const ukrainianLetters =
                                [
                                  "А",
                                  "Б",
                                  "В",
                                  "Г",
                                  "Ґ",
                                  "Д",
                                  "Е",
                                  "Є",
                                  "Ж",
                                  "З",
                                  "И",
                                  "І",
                                  "Ї",
                                  "Й",
                                  "К",
                                  "Л",
                                  "М",
                                  "Н",
                                  "О",
                                  "П",
                                ];

                              const optionLetter =
                                ukrainianLetters[
                                  optionIndex
                                ] ??
                                String.fromCharCode(
                                  1040 +
                                    optionIndex
                                );

                              return (
                                <button
                                  key={
                                    option.id
                                  }
                                  type="button"
                                  disabled={
                                    finishing ||
                                    finished ||
                                    blocked
                                  }
                                  onClick={() => {
                                    if (
                                      isMultiple
                                    ) {
                                      selectMultipleAnswer(
                                        currentTest.id,
                                        question.id,
                                        answer,
                                        option.id
                                      );
                                    } else {
                                      selectSingleAnswer(
                                        currentTest.id,
                                        question.id,
                                        option.id
                                      );
                                    }
                                  }}
                                  className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition ${
                                    selected
                                      ? "border-gray-400 bg-gray-100"
                                      : "border-gray-200 bg-white hover:bg-gray-50"
                                  } disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                  <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold ${
                                      selected
                                        ? "bg-gray-700 text-white"
                                        : "bg-gray-100 text-gray-500"
                                    }`}
                                  >
                                    {
                                      optionLetter
                                    }
                                  </span>

                                  <RichText
                                    html={
                                      option.text
                                    }
                                    className={`pt-0.5 text-sm leading-6 md:text-base ${
                                      selected
                                        ? "font-medium text-gray-800"
                                        : "text-gray-700"
                                    }`}
                                  />
                                </button>
                              );
                            }
                          )}
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
                          <div className="text-xs text-gray-400">
                            {!hasAnswer
                              ? "Відповідь не обрана"
                              : isSaved
                                ? "Відповідь збережено"
                                : "Відповідь ще не збережено"}
                          </div>

                          <button
                            type="button"
                            disabled={
                              !hasAnswer ||
                              isSaved ||
                              isSaving ||
                              Boolean(
                                savingQuestionKey
                              ) &&
                                !isSaving ||
                              finishing ||
                              finished ||
                              blocked
                            }
                            onClick={() =>
                              void saveAnswer(
                                currentTest.id,
                                question.id,
                                answer
                              )
                            }
                            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                              isSaved
                                ? "border border-gray-200 bg-gray-50 text-gray-400"
                                : "bg-[#7A1F2B] text-white hover:opacity-90"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {isSaving
                              ? "Збереження..."
                              : isSaved
                                ? "Відповідь збережено"
                                : "Зберегти відповідь"}
                          </button>
                        </div>
                      </div>
                    </section>
                  );
                }
              )}
            </div>
          </div>

          <aside className="order-1 lg:order-2 lg:sticky lg:top-24">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-5 gap-2">
                {currentTest.questions.map(
                  (
                    question,
                    questionIndex
                  ) => {
                    const answered =
                      isAnswerProvided(
                        question.savedAnswer
                      );

                    const active =
                      activeQuestionId ===
                      question.id;

                    return (
                      <button
                        key={
                          question.id
                        }
                        type="button"
                        onClick={() =>
                          scrollToQuestion(
                            currentTest.id,
                            question.id
                          )
                        }
                        className={`relative flex h-9 w-full items-center justify-center rounded-md border text-sm font-medium transition ${
                          active
                            ? "border-gray-500 bg-gray-200 text-gray-800"
                            : answered
                              ? "border-gray-300 bg-gray-100 text-gray-700"
                              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {
                          questionIndex +
                          1
                        }

                        {answered && (
                          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 text-center">
          <p className="text-sm font-medium text-gray-500">
            © Хорунжий Андрій
            Володимирович, 2026
          </p>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Brain className="h-4 w-4 text-[#7A1F2B]" />

            <span>
              Створено за підтримки технологій штучного інтелекту
            </span>
          </div>
        </div>
      </footer>

      {!securityReady &&
        sessionLoaded &&
        !finished &&
        !blocked && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/70 px-5">
            <div className="w-full max-w-md rounded-xl bg-white p-7 text-center shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <ShieldCheck className="h-7 w-7 text-gray-700" />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-gray-800">
                Захищений режим тестування
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Для продовження роботи потрібно увійти в повноекранний режим. Під час тестування заборонено копіювання, контекстне меню та частину системних комбінацій клавіш.
              </p>

              {securityWarning && (
                <div className="mt-4 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">
                  {securityWarning}
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  void requestFullscreen()
                }
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#7A1F2B] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Maximize2 className="h-4 w-4" />

                Увійти в повноекранний режим
              </button>
            </div>
          </div>
        )}

      {finishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
          <div className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-800">
              Завершити тестування?
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Після завершення тесту змінити або додати відповіді буде неможливо.
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setFinishModal(
                    false
                  )
                }
                disabled={
                  finishing
                }
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                Продовжити тест
              </button>

              <button
                type="button"
                onClick={
                  finishTest
                }
                disabled={
                  finishing
                }
                className="rounded-lg bg-[#7A1F2B] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {finishing
                  ? "Завершення..."
                  : "Так, завершити тест"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}