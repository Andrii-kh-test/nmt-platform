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
  CheckCircle2,
  Clock3,
  LockKeyhole,
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
          points?: number;
          answerOptions: AnswerOption[];
        }>;
      };
    }>;
  };
};

/* ============================================================
   ДОПУСТИМІ HTML-ТЕГИ В ТЕКСТАХ ЗАВДАНЬ
   ============================================================ */

const ALLOWED_HTML_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "sub",
  "sup",
  "ul",
  "ol",
  "li",
  "span",
]);

/*
 * БД може містити:
 *
 * <p>Текст завдання</p>
 *
 * або:
 *
 * <p>Однаковий <strong>звук</strong>...</p>
 *
 * Ми не показуємо HTML-теги як текст.
 *
 * Одночасно прибираємо атрибути HTML,
 * щоб у тексті завдання не могли виконуватися
 * небезпечні конструкції.
 */
function sanitizeQuestionHtml(
  value: string
): string {
  if (!value) {
    return "";
  }

  return value
    .replace(
      /<!--[\s\S]*?-->/g,
      ""
    )
    .replace(
      /<\s*\/?\s*([a-zA-Z0-9]+)(?:\s[^>]*)?>/g,
      (
        fullMatch,
        tagName: string
      ) => {
        const normalized =
          tagName.toLowerCase();

        if (
          !ALLOWED_HTML_TAGS.has(
            normalized
          )
        ) {
          return "";
        }

        const isClosing =
          /^<\s*\//.test(
            fullMatch
          );

        if (
          normalized === "br"
        ) {
          return "<br>";
        }

        return isClosing
          ? `</${normalized}>`
          : `<${normalized}>`;
      }
    );
}

/*
 * Рендеринг тексту завдання.
 *
 * Якщо текст звичайний — показуємо як звичайний текст.
 * Якщо містить HTML — відображаємо форматування.
 */
function QuestionText({
  text,
}: {
  text: string;
}) {
  const containsHtml =
    /<\s*[a-zA-Z][^>]*>/.test(
      text
    );

  if (!containsHtml) {
    return (
      <div className="whitespace-pre-wrap text-base leading-7 text-gray-800 md:text-lg">
        {text}
      </div>
    );
  }

  const safeHtml =
    sanitizeQuestionHtml(text);

  return (
    <div
      className="
        question-html
        text-base
        leading-7
        text-gray-800
        md:text-lg
        [&_p]:mb-3
        [&_p:last-child]:mb-0
        [&_strong]:font-bold
        [&_b]:font-bold
        [&_em]:italic
        [&_i]:italic
        [&_u]:underline
        [&_s]:line-through
        [&_ul]:my-3
        [&_ul]:list-disc
        [&_ul]:pl-6
        [&_ol]:my-3
        [&_ol]:list-decimal
        [&_ol]:pl-6
        [&_li]:mb-1
      "
      dangerouslySetInnerHTML={{
        __html: safeHtml,
      }}
    />
  );
}

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
  if (
    value === null ||
    value === undefined
  ) {
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
): Record<
  string,
  Record<string, AnswerValue>
> {
  const result: Record<
    string,
    Record<string, AnswerValue>
  > = {};

  if (
    isRecord(
      currentSavedAnswers
    )
  ) {
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
        ] of Object.entries(
          testValue
        )) {
          result[testKey][
            questionKey
          ] =
            normalizeAnswer(
              questionValue
            );
        }
      }
    }
  }

  if (!result[String(testId)]) {
    result[String(testId)] = {};
  }

  result[String(testId)][
    String(questionId)
  ] = answer;

  return result;
}

function hasAnswer(
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

export default function ComplexTestPage() {
  const router = useRouter();
  const params = useParams();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const complexTestId =
    Number(id);

  const sessionStorageKey =
    `complex-test-session-${id}`;

  const [sessionId, setSessionId] =
    useState<number | null>(null);

  const [session, setSession] =
    useState<SessionData | null>(null);

  const [complexTest, setComplexTest] =
    useState<ComplexTestData | null>(
      null
    );

  const [tests, setTests] =
    useState<ComplexTestSubject[]>(
      []
    );

  const [selectedTestId, setSelectedTestId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [sessionLoaded, setSessionLoaded] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

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

  /*
   * ============================================================
   * ЗАХИСТ
   * ============================================================
   */

  const [fullscreenActive, setFullscreenActive] =
    useState(false);

  const [securityReady, setSecurityReady] =
    useState(false);

  const [securityWarning, setSecurityWarning] =
    useState("");

  const [securityWarningCount, setSecurityWarningCount] =
    useState(0);

  const [tabHidden, setTabHidden] =
    useState(false);

  /*
   * ============================================================
   * ОТРИМАННЯ SESSION ID
   * ============================================================
   */

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
        JSON.parse(
          storedSession
        );

      const storedSessionId =
        Number(
          parsed.sessionId
        );

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

  /*
   * ============================================================
   * ПЕРЕТВОРЕННЯ ТЕСТІВ
   * ============================================================
   */

  const convertTests =
    useCallback(
      (
        apiTests:
          SessionResponse["complexTest"]["tests"],
        savedAnswers: unknown
      ): ComplexTestSubject[] => {
        return [...apiTests]
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
                [...item.test.questions]
                  .sort(
                    (a, b) =>
                      a.id - b.id
                  )
                  .map(
                    (
                      question,
                      questionIndex
                    ) => ({
                      id:
                        question.id,

                      order:
                        questionIndex,

                      type:
                        question.type,

                      text:
                        question.text,

                      points:
                        Number(
                          question.points ??
                            1
                        ),

                      answerOptions:
                        [...question.answerOptions].sort(
                          (a, b) =>
                            a.order -
                            b.order
                        ),

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

  /*
   * ============================================================
   * ЗАВАНТАЖЕННЯ СЕСІЇ
   * ============================================================
   */

  const loadSession =
    useCallback(
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

          if (
            !data.complexTest ||
            !data.complexTest.tests
          ) {
            throw new Error(
              "Сервер не повернув структуру комбінованого тесту."
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

          setSelectedTestId(
            data.session.currentTestId ??
              convertedTests[0]?.id ??
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

  /*
   * ============================================================
   * ПОТОЧНИЙ ПРЕДМЕТ
   * ============================================================
   */

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

  /*
   * ============================================================
   * COUNTDOWN
   *
   * ВАЖЛИВО:
   * timeLeft береться з БД.
   * startedAt / lastActivityAt тут НЕ використовуються.
   * ============================================================
   */

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
            if (previous <= 1) {
              window.clearInterval(
                timer
              );

              return 0;
            }

            return previous - 1;
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

  /*
   * ============================================================
   * АВТОМАТИЧНЕ ЗАВЕРШЕННЯ
   * ============================================================
   */

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

              body: JSON.stringify({
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

        if (cancelled) {
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

        if (cancelled) {
          return;
        }

        setError(
          "Час тестування завершився, але не вдалося зафіксувати завершення."
        );
      } finally {
        if (!cancelled) {
          setFinishing(false);
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

  /*
   * ============================================================
   * ПОВНОЕКРАННИЙ РЕЖИМ
   * ============================================================
   */

  const enterFullscreen =
    useCallback(
      async () => {
        try {
          if (
            !document.fullscreenElement
          ) {
            await document.documentElement.requestFullscreen();
          }

          setFullscreenActive(
            Boolean(
              document.fullscreenElement
            )
          );

          setSecurityReady(true);
          setSecurityWarning("");
        } catch (error) {
          console.error(
            "Fullscreen error:",
            error
          );

          setSecurityWarning(
            "Не вдалося перейти у повноекранний режим. Перевірте, чи дозволено браузеру використовувати повноекранний режим."
          );
        }
      },
      []
    );

  useEffect(() => {
    function handleFullscreenChange() {
      const active =
        Boolean(
          document.fullscreenElement
        );

      setFullscreenActive(
        active
      );

      if (
        securityReady &&
        !active &&
        !finished &&
        !blocked
      ) {
        setSecurityWarningCount(
          (previous) =>
            previous + 1
        );

        setSecurityWarning(
          "Ви вийшли з повноекранного режиму. Для продовження тестування необхідно знову перейти у повноекранний режим."
        );
      }
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, [
    securityReady,
    finished,
    blocked,
  ]);

  /*
   * ============================================================
   * ЗАХИСТ ВІД ПЕРЕХОДУ НА ІНШУ ВКЛАДКУ
   * ============================================================
   */

  useEffect(() => {
    if (
      !sessionLoaded ||
      finished ||
      blocked
    ) {
      return;
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "hidden"
      ) {
        setTabHidden(true);

        setSecurityWarningCount(
          (previous) =>
            previous + 1
        );

        setSecurityWarning(
          "Зафіксовано вихід зі сторінки тестування. Поверніться до тесту."
        );
      } else {
        setTabHidden(false);
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    sessionLoaded,
    finished,
    blocked,
  ]);

  /*
   * ============================================================
   * ЗАХИСТ ВІД BLUR / FOCUS
   * ============================================================
   */

  useEffect(() => {
    if (
      !sessionLoaded ||
      finished ||
      blocked
    ) {
      return;
    }

    let blurTimeout:
      | number
      | undefined;

    function handleBlur() {
      if (
        document.visibilityState ===
        "hidden"
      ) {
        return;
      }

      blurTimeout =
        window.setTimeout(() => {
          setSecurityWarningCount(
            (previous) =>
              previous + 1
          );

          setSecurityWarning(
            "Увага: фокус сторінки тестування було втрачено."
          );
        }, 300);
    }

    function handleFocus() {
      if (
        blurTimeout !==
        undefined
      ) {
        window.clearTimeout(
          blurTimeout
        );
      }
    }

    window.addEventListener(
      "blur",
      handleBlur
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      if (
        blurTimeout !==
        undefined
      ) {
        window.clearTimeout(
          blurTimeout
        );
      }

      window.removeEventListener(
        "blur",
        handleBlur
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [
    sessionLoaded,
    finished,
    blocked,
  ]);

  /*
   * ============================================================
   * БЛОКУВАННЯ КОНТЕКСТНОГО МЕНЮ,
   * ВИДІЛЕННЯ, КОПІЮВАННЯ,
   * DRAG-AND-DROP
   * ============================================================
   */

  useEffect(() => {
    if (
      !sessionLoaded ||
      finished ||
      blocked
    ) {
      return;
    }

    function preventContextMenu(
      event: MouseEvent
    ) {
      event.preventDefault();
    }

    function preventCopy(
      event: ClipboardEvent
    ) {
      event.preventDefault();
    }

    function preventCut(
      event: ClipboardEvent
    ) {
      event.preventDefault();
    }

    function preventPaste(
      event: ClipboardEvent
    ) {
      event.preventDefault();
    }

    function preventDrag(
      event: DragEvent
    ) {
      event.preventDefault();
    }

    function preventSelect(
      event: Event
    ) {
      event.preventDefault();
    }

    document.addEventListener(
      "contextmenu",
      preventContextMenu
    );

    document.addEventListener(
      "copy",
      preventCopy
    );

    document.addEventListener(
      "cut",
      preventCut
    );

    document.addEventListener(
      "paste",
      preventPaste
    );

    document.addEventListener(
      "dragstart",
      preventDrag
    );

    document.addEventListener(
      "selectstart",
      preventSelect
    );

    return () => {
      document.removeEventListener(
        "contextmenu",
        preventContextMenu
      );

      document.removeEventListener(
        "copy",
        preventCopy
      );

      document.removeEventListener(
        "cut",
        preventCut
      );

      document.removeEventListener(
        "paste",
        preventPaste
      );

      document.removeEventListener(
        "dragstart",
        preventDrag
      );

      document.removeEventListener(
        "selectstart",
        preventSelect
      );
    };
  }, [
    sessionLoaded,
    finished,
    blocked,
  ]);

  /*
   * ============================================================
   * БЛОКУВАННЯ КЛАВІАТУРНИХ КОМБІНАЦІЙ
   * ============================================================
   */

  useEffect(() => {
    if (
      !sessionLoaded ||
      finished ||
      blocked
    ) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      const key =
        event.key.toLowerCase();

      const ctrl =
        event.ctrlKey;

      const meta =
        event.metaKey;

      const shift =
        event.shiftKey;

      /*
       * F12
       */
      if (
        key === "f12"
      ) {
        event.preventDefault();
        event.stopPropagation();

        setSecurityWarning(
          "Клавіша F12 заблокована під час тестування."
        );

        return;
      }

      /*
       * Ctrl / Cmd + C
       */
      if (
        (ctrl || meta) &&
        key === "c"
      ) {
        event.preventDefault();
        event.stopPropagation();

        setSecurityWarning(
          "Копіювання матеріалів тесту заборонене."
        );

        return;
      }

      /*
       * Ctrl / Cmd + X
       */
      if (
        (ctrl || meta) &&
        key === "x"
      ) {
        event.preventDefault();
        event.stopPropagation();

        setSecurityWarning(
          "Вирізання матеріалів тесту заборонене."
        );

        return;
      }

      /*
       * Ctrl / Cmd + V
       */
      if (
        (ctrl || meta) &&
        key === "v"
      ) {
        event.preventDefault();
        event.stopPropagation();

        setSecurityWarning(
          "Вставлення матеріалів під час тестування заборонене."
        );

        return;
      }

      /*
       * Ctrl / Cmd + A
       */
      if (
        (ctrl || meta) &&
        key === "a"
      ) {
        event.preventDefault();
        event.stopPropagation();

        return;
      }

      /*
       * Ctrl / Cmd + S
       */
      if (
        (ctrl || meta) &&
        key === "s"
      ) {
        event.preventDefault();
        event.stopPropagation();

        setSecurityWarning(
          "Збереження сторінки під час тестування заборонене."
        );

        return;
      }

      /*
       * Ctrl / Cmd + P
       */
      if (
        (ctrl || meta) &&
        key === "p"
      ) {
        event.preventDefault();
        event.stopPropagation();

        setSecurityWarning(
          "Друк матеріалів тесту заборонений."
        );

        return;
      }

      /*
       * Ctrl / Cmd + F
       */
      if (
        (ctrl || meta) &&
        key === "f"
      ) {
        event.preventDefault();
        event.stopPropagation();

        setSecurityWarning(
          "Пошук по сторінці під час тестування заборонений."
        );

        return;
      }

      /*
       * Ctrl / Cmd + U
       */
      if (
        (ctrl || meta) &&
        key === "u"
      ) {
        event.preventDefault();
        event.stopPropagation();

        setSecurityWarning(
          "Перегляд вихідного коду сторінки під час тестування заборонений."
        );

        return;
      }

      /*
       * Ctrl / Cmd + Shift + I
       * Ctrl / Cmd + Shift + J
       * Ctrl / Cmd + Shift + C
       */
      if (
        (ctrl || meta) &&
        shift &&
        (
          key === "i" ||
          key === "j" ||
          key === "c"
        )
      ) {
        event.preventDefault();
        event.stopPropagation();

        setSecurityWarning(
          "Інструменти розробника заблоковані під час тестування."
        );

        return;
      }

      /*
       * Ctrl / Cmd + Shift + S
       */
      if (
        (ctrl || meta) &&
        shift &&
        key === "s"
      ) {
        event.preventDefault();
        event.stopPropagation();

        return;
      }

      /*
       * PrintScreen.
       *
       * Браузер не гарантує повного блокування
       * системного скриншота, але перехоплюємо
       * подію, якщо браузер її передає.
       */
      if (
        key === "printscreen"
      ) {
        event.preventDefault();

        setSecurityWarning(
          "Створення знімків екрана під час тестування заборонене."
        );

        return;
      }

      /*
       * Alt + Left / Right
       */
      if (
        event.altKey &&
        (
          key === "arrowleft" ||
          key === "arrowright"
        )
      ) {
        event.preventDefault();
        event.stopPropagation();

        return;
      }

      /*
       * F5 / Ctrl+R / Cmd+R
       */
      if (
        key === "f5" ||
        (
          (ctrl || meta) &&
          key === "r"
        )
      ) {
        event.preventDefault();
        event.stopPropagation();

        setSecurityWarning(
          "Перезавантаження сторінки під час тестування заборонене."
        );

        return;
      }

      /*
       * Ctrl / Cmd + Shift + R
       */
      if (
        (ctrl || meta) &&
        shift &&
        key === "r"
      ) {
        event.preventDefault();
        event.stopPropagation();

        return;
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
      true
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
        true
      );
    };
  }, [
    sessionLoaded,
    finished,
    blocked,
  ]);

  /*
   * ============================================================
   * ЗАПОБІГАННЯ ЗАКРИТТЮ / ПЕРЕЗАВАНТАЖЕННЮ
   * ============================================================
   */

  useEffect(() => {
    if (
      !sessionLoaded ||
      finished ||
      blocked
    ) {
      return;
    }

    function handleBeforeUnload(
      event: BeforeUnloadEvent
    ) {
      event.preventDefault();

      event.returnValue =
        "Тестування ще не завершено.";
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [
    sessionLoaded,
    finished,
    blocked,
  ]);

  /*
   * ============================================================
   * ФОРМАТУВАННЯ ЧАСУ
   * ============================================================
   */

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

  /*
   * ============================================================
   * ЛОКАЛЬНЕ ОНОВЛЕННЯ ВІДПОВІДІ
   * ============================================================
   */

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

    setSession(
      (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,

          savedAnswers:
            buildSavedAnswers(
              previous.savedAnswers,
              testId,
              questionId,
              answer
            ),
        };
      }
    );
  }

  /*
   * ============================================================
   * ЗБЕРЕЖЕННЯ ВІДПОВІДІ
   * ============================================================
   */

  async function saveAnswer(
    testId: number,
    questionId: number,
    answer: AnswerValue
  ) {
    if (
      !sessionId ||
      finished ||
      blocked
    ) {
      return;
    }

    try {
      setSaving(true);

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

            body: JSON.stringify({
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

      if (data.session) {
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
      setSaving(false);
    }
  }

  /*
   * ============================================================
   * ОДНА ВІДПОВІДЬ
   * ============================================================
   */

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

    void saveAnswer(
      testId,
      questionId,
      answer
    );
  }

  /*
   * ============================================================
   * КІЛЬКА ВІДПОВІДЕЙ
   * ============================================================
   */

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

    void saveAnswer(
      testId,
      questionId,
      answer
    );
  }

  /*
   * ============================================================
   * ЧИ ОБРАНА ВІДПОВІДЬ
   * ============================================================
   */

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

  /*
   * ============================================================
   * ПЕРЕМИКАННЯ ПРЕДМЕТА
   * ============================================================
   */

  async function selectTest(
    testId: number
  ) {
    if (
      !sessionId ||
      finished ||
      blocked ||
      saving ||
      finishing
    ) {
      return;
    }

    setSelectedTestId(
      testId
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

            body: JSON.stringify({
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

  /*
   * ============================================================
   * ПРОКРУТКА ДО ПИТАННЯ
   * ============================================================
   */

  function scrollToQuestion(
    questionId: number
  ) {
    const element =
      document.getElementById(
        `question-${questionId}`
      );

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  /*
   * ============================================================
   * РУЧНЕ ЗАВЕРШЕННЯ
   * ============================================================
   */

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

            body: JSON.stringify({
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

      /*
       * Після завершення виходимо
       * з повноекранного режиму.
       */
      if (
        document.fullscreenElement
      ) {
        try {
          await document.exitFullscreen();
        } catch {
          // браузер може відмовити
        }
      }
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
      setFinishing(false);
    }
  }

  /*
   * ============================================================
   * ПРОГРЕС
   * ============================================================
   */

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
              hasAnswer(
                question.savedAnswer
              )
          ).length,
        0
      );
    }, [tests]);

  const currentAnswered =
    useMemo(() => {
      if (!currentTest) {
        return 0;
      }

      return currentTest.questions.filter(
        (question) =>
          hasAnswer(
            question.savedAnswer
          )
      ).length;
    }, [currentTest]);

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2B]" />

          <p className="mt-5 text-lg text-gray-600">
            Завантаження тесту...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * ПОМИЛКА
   * ============================================================
   */

  if (
    error &&
    !complexTest
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />

          <h1 className="mt-5 text-2xl font-bold text-gray-800">
            Не вдалося завантажити тест
          </h1>

          <p className="mt-4 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/complex-tests"
              )
            }
            className="mt-8 rounded-xl bg-[#7A1F2B] px-7 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Повернутися до тестів
          </button>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * ЗАВЕРШЕНО
   * ============================================================
   */

  if (finished) {
    return (
      <main className="flex min-h-screen flex-col bg-slate-100">
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-11 w-11 text-green-600" />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-[#7A1F2B]">
              Тест завершено
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-gray-600">
              Ваші відповіді
              збережено.
              Дякуємо за
              проходження
              комбінованого
              тесту.
            </p>

            <div className="mt-8 rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-gray-500">
                Опрацьовано
                відповідей
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-800">
                {answeredQuestions} /{" "}
                {totalQuestions}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/complex-tests"
                )
              }
              className="mt-8 rounded-xl bg-[#7A1F2B] px-8 py-4 text-lg font-semibold text-white shadow-md transition hover:opacity-90"
            >
              Повернутися до
              тестів
            </button>
          </div>
        </div>

        <footer className="border-t border-gray-200 bg-white py-8">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <p className="font-medium text-gray-700">
              © Хорунжий Андрій
              Володимирович,
              2026
            </p>
          </div>
        </footer>
      </main>
    );
  }

  /*
   * ============================================================
   * ЗАБЛОКОВАНО
   * ============================================================
   */

  if (blocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <LockKeyhole className="h-10 w-10 text-red-600" />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-red-700">
            Тестування
            заблоковано
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            Доступ до
            проходження тесту
            тимчасово
            заблоковано.
          </p>

          {session?.blockReason && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
              {session.blockReason}
            </div>
          )}
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * НЕМАЄ ПРЕДМЕТА
   * ============================================================
   */

  if (!currentTest) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="text-center">
          <p className="text-lg text-gray-600">
            У тесті немає
            доступних питань.
          </p>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * ОСНОВНИЙ ІНТЕРФЕЙС
   * ============================================================
   */

  return (
    <main
      className="
        min-h-screen
        bg-slate-100
        select-none
      "
    >
      {/* ======================================================
          ЗАХИСНИЙ FULLSCREEN OVERLAY
          ====================================================== */}

      {!securityReady &&
        !finished &&
        !blocked && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-100 px-6">
            <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-2xl md:p-12">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#7A1F2B]">
                <LockKeyhole className="h-10 w-10 text-white" />
              </div>

              <h1 className="mt-7 text-2xl font-bold text-gray-800 md:text-3xl">
                Захищене тестування
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-600 md:text-lg">
                Для проходження
                тесту необхідно
                перейти у
                повноекранний режим.
              </p>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left">
                <p className="font-semibold text-amber-800">
                  Під час тестування
                  заборонено:
                </p>

                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-800">
                  <li>
                    копіювати або
                    виділяти текст;
                  </li>
                  <li>
                    використовувати
                    контекстне меню;
                  </li>
                  <li>
                    відкривати
                    інструменти
                    розробника;
                  </li>
                  <li>
                    друкувати або
                    зберігати
                    сторінку;
                  </li>
                  <li>
                    переходити на
                    інші вкладки;
                  </li>
                  <li>
                    виходити з
                    повноекранного
                    режиму.
                  </li>
                </ul>
              </div>

              {securityWarning && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {securityWarning}
                </div>
              )}

              <button
                type="button"
                onClick={
                  enterFullscreen
                }
                className="mt-7 w-full rounded-xl bg-[#7A1F2B] px-7 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-[#641923]"
              >
                Перейти у
                повноекранний режим
              </button>
            </div>
          </div>
        )}

      {/* ======================================================
          ПОВЕРНЕННЯ У FULLSCREEN
          ====================================================== */}

      {securityReady &&
        !fullscreenActive &&
        !finished &&
        !blocked && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 px-6">
            <div className="w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>

              <h2 className="mt-5 text-2xl font-bold text-gray-800">
                Повноекранний режим
                вимкнено
              </h2>

              <p className="mt-4 leading-7 text-gray-600">
                Для продовження
                тестування необхідно
                повернутися у
                повноекранний режим.
              </p>

              {securityWarningCount >
                0 && (
                <p className="mt-4 text-sm font-semibold text-red-600">
                  Зафіксовано порушень
                  фокусу:
                  {" "}
                  {securityWarningCount}
                </p>
              )}

              <button
                type="button"
                onClick={
                  enterFullscreen
                }
                className="mt-7 w-full rounded-xl bg-[#7A1F2B] px-6 py-4 font-bold text-white transition hover:opacity-90"
              >
                Повернутися до
                повноекранного режиму
              </button>
            </div>
          </div>
        )}

      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 md:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A1F2B]">
                {complexTest?.examType}
              </p>

              <h1 className="truncate text-lg font-bold text-gray-800 md:text-xl">
                {complexTest?.title}
              </h1>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div
                className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                  timeLeft <= 300
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-gray-200 bg-slate-50 text-gray-800"
                }`}
              >
                <Clock3 className="h-5 w-5" />

                <div>
                  <p className="text-xs text-gray-500">
                    Залишилося
                    часу
                  </p>

                  <p className="font-mono text-xl font-bold leading-none">
                    {formatTime(
                      timeLeft
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  finishing
                }
                onClick={() =>
                  setFinishModal(
                    true
                  )
                }
                className="rounded-xl bg-[#7A1F2B] px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {finishing
                  ? "Завершення..."
                  : "Завершити тест"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================
          ПОВНОШИРИННА НАВІГАЦІЯ ПРЕДМЕТІВ
          ====================================================== */}

      <nav className="sticky top-[76px] z-40 w-full border-b border-gray-300 bg-white shadow-sm">
        <div className="flex w-full overflow-x-auto">
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
                    hasAnswer(
                      question.savedAnswer
                    )
                ).length;

              const allAnswered =
                test.questions.length >
                  0 &&
                answered ===
                  test.questions.length;

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
                    saving ||
                    finishing
                  }
                  className={`
                    relative
                    min-w-[180px]
                    flex-1
                    border-r
                    border-gray-200
                    px-5
                    py-4
                    text-center
                    transition
                    md:min-w-0
                    ${
                      isActive
                        ? "bg-[#7A1F2B] text-white"
                        : "bg-white text-gray-700 hover:bg-slate-50"
                    }
                    disabled:cursor-not-allowed
                    disabled:opacity-70
                  `}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span
                      className={`
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        text-sm
                        font-bold
                        ${
                          isActive
                            ? "bg-white/20 text-white"
                            : allAnswered
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                        }
                      `}
                    >
                      {allAnswered ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </span>

                    <div className="min-w-0 text-left">
                      <p className="truncate font-bold">
                        {test.subject}
                      </p>

                      <p
                        className={`mt-0.5 text-xs ${
                          isActive
                            ? "text-white/75"
                            : "text-gray-500"
                        }`}
                      >
                        {answered} /{" "}
                        {
                          test.questions
                            .length
                        }{" "}
                        виконано
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-white" />
                  )}
                </button>
              );
            }
          )}
        </div>
      </nav>

      {/* ======================================================
          ОСНОВНА РОЗМІТКА:
          КОНТЕНТ + ПРАВА НАВІГАЦІЯ
          ====================================================== */}

      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
        {/* ====================================================
            ЛІВА ЧАСТИНА
            ==================================================== */}

        <section className="min-w-0">
          {/* ==================================================
              ЗАГОЛОВОК ПРЕДМЕТА
              ================================================== */}

          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7A1F2B]">
                  Предмет
                </p>

                <h2 className="mt-2 text-3xl font-bold text-gray-800">
                  {
                    currentTest.subject
                  }
                </h2>

                <p className="mt-2 text-gray-600">
                  {
                    currentTest.title
                  }
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-5 py-4 text-center">
                <p className="text-xs text-gray-500">
                  Виконано
                </p>

                <p className="mt-1 text-2xl font-bold text-[#7A1F2B]">
                  {currentAnswered}{" "}
                  /{" "}
                  {
                    currentTest
                      .questions
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              ПОМИЛКА
              ================================================== */}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

              <div className="flex-1 text-sm">
                {error}
              </div>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="font-bold text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          {/* ==================================================
              ПИТАННЯ
              ================================================== */}

          <div className="space-y-5">
            {currentTest.questions.map(
              (
                question,
                questionIndex
              ) => {
                const answer =
                  question.savedAnswer;

                const isMultiple =
                  question.type ===
                    "multiple" ||
                  question.type ===
                    "multiple_choice" ||
                  question.type ===
                    "MULTIPLE_CHOICE" ||
                  question.type ===
                    "MULTIPLE";

                const answered =
                  hasAnswer(
                    answer
                  );

                return (
                  <section
                    key={
                      question.id
                    }
                    id={`question-${question.id}`}
                    className="
                      scroll-mt-40
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                      shadow-sm
                    "
                  >
                    <div className="p-6 md:p-8">
                      {/* ================================
                          НОМЕР ЗАВДАННЯ
                          ================================ */}

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`
                              flex
                              h-11
                              w-11
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              text-sm
                              font-bold
                              ${
                                answered
                                  ? "bg-[#7A1F2B] text-white"
                                  : "bg-gray-100 text-gray-600"
                              }
                            `}
                          >
                            {
                              questionIndex +
                              1
                            }
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-500">
                              Завдання{" "}
                              {
                                questionIndex +
                                1
                              }
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
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

                        {answered && (
                          <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
                        )}
                      </div>

                      {/* ================================
                          ТЕКСТ ЗАВДАННЯ
                          ================================ */}

                      <div className="mt-7">
                        <QuestionText
                          text={
                            question.text
                          }
                        />
                      </div>

                      {/* ================================
                          ВІДПОВІДІ
                          ================================ */}

                      <div className="mt-7 space-y-3">
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

                            return (
                              <button
                                key={
                                  option.id
                                }
                                type="button"
                                disabled={
                                  saving ||
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
                                className={`
                                  group
                                  flex
                                  w-full
                                  items-start
                                  gap-4
                                  rounded-xl
                                  border
                                  p-4
                                  text-left
                                  transition
                                  ${
                                    selected
                                      ? "border-[#7A1F2B] bg-[#7A1F2B]/5 shadow-sm"
                                      : "border-gray-200 bg-white hover:border-[#7A1F2B]/40 hover:bg-slate-50"
                                  }
                                  disabled:cursor-not-allowed
                                  disabled:opacity-70
                                `}
                              >
                                <span
                                  className={`
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    text-sm
                                    font-bold
                                    ${
                                      isMultiple
                                        ? "rounded-lg"
                                        : "rounded-full"
                                    }
                                    ${
                                      selected
                                        ? "bg-[#7A1F2B] text-white"
                                        : "bg-gray-100 text-gray-600 group-hover:bg-[#7A1F2B]/10 group-hover:text-[#7A1F2B]"
                                    }
                                  `}
                                >
                                  {String.fromCharCode(
                                    65 +
                                      optionIndex
                                  )}
                                </span>

                                <span
                                  className={`
                                    pt-1
                                    text-base
                                    leading-7
                                    ${
                                      selected
                                        ? "font-semibold text-gray-800"
                                        : "text-gray-700"
                                    }
                                  `}
                                >
                                  <QuestionText
                                    text={
                                      option.text
                                    }
                                  />
                                </span>
                              </button>
                            );
                          }
                        )}
                      </div>

                      {/* ================================
                          СТАТУС ЗБЕРЕЖЕННЯ
                          ================================ */}

                      <div className="mt-5 flex justify-end">
                        <span className="text-xs text-gray-400">
                          {saving
                            ? "Збереження..."
                            : answered
                              ? "Відповідь збережено"
                              : "Відповідь не обрана"}
                        </span>
                      </div>
                    </div>
                  </section>
                );
              }
            )}
          </div>

          {/* ==================================================
              ПРОГРЕС
              ================================================== */}

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Загальний прогрес
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-800">
                  {answeredQuestions}{" "}
                  /{" "}
                  {totalQuestions}
                </p>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 sm:max-w-md">
                <div
                  className="h-full rounded-full bg-[#7A1F2B] transition-all"
                  style={{
                    width:
                      totalQuestions >
                      0
                        ? `${Math.round(
                            (answeredQuestions /
                              totalQuestions) *
                              100
                          )}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            ПРАВА НАВІГАЦІЙНА ПАНЕЛЬ
            ==================================================== */}

        <aside className="hidden lg:block">
          <div className="sticky top-[140px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="border-b border-gray-200 pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7A1F2B]">
                Навігація
              </p>

              <h3 className="mt-1 text-lg font-bold text-gray-800">
                {
                  currentTest.subject
                }
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {currentAnswered} з{" "}
                {
                  currentTest
                    .questions
                    .length
                }{" "}
                завдань виконано
              </p>
            </div>

            {/* ============================================
                НОМЕРИ ЗАВДАНЬ
                ============================================ */}

            <div className="mt-5 grid grid-cols-5 gap-2">
              {currentTest.questions.map(
                (
                  question,
                  index
                ) => {
                  const answered =
                    hasAnswer(
                      question.savedAnswer
                    );

                  return (
                    <button
                      key={
                        question.id
                      }
                      type="button"
                      onClick={() =>
                        scrollToQuestion(
                          question.id
                        )
                      }
                      className={`
                        flex
                        h-11
                        w-full
                        items-center
                        justify-center
                        rounded-lg
                        border
                        text-sm
                        font-bold
                        transition
                        ${
                          answered
                            ? "border-[#7A1F2B] bg-[#7A1F2B] text-white hover:bg-[#641923]"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[#7A1F2B]/40 hover:bg-[#7A1F2B]/5 hover:text-[#7A1F2B]"
                        }
                      `}
                    >
                      {index + 1}
                    </button>
                  );
                }
              )}
            </div>

            {/* ============================================
                ЛЕГЕНДА
                ============================================ */}

            <div className="mt-6 space-y-2 border-t border-gray-200 pt-5">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded bg-[#7A1F2B]" />

                <span className="text-xs text-gray-600">
                  Відповідь збережено
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded border border-gray-300 bg-gray-50" />

                <span className="text-xs text-gray-600">
                  Відповідь не обрана
                </span>
              </div>
            </div>

            {/* ============================================
                ЗАГАЛЬНИЙ ПРОГРЕС
                ============================================ */}

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Усього
                </span>

                <span className="font-bold text-gray-800">
                  {answeredQuestions} /{" "}
                  {totalQuestions}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-[#7A1F2B] transition-all"
                  style={{
                    width:
                      totalQuestions >
                      0
                        ? `${Math.round(
                            (answeredQuestions /
                              totalQuestions) *
                              100
                          )}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            {/* ============================================
                ЗАХИСТ
                ============================================ */}

            <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-[#7A1F2B]" />

                <p className="text-xs font-bold text-gray-700">
                  Захищене тестування
                </p>
              </div>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Повноекранний режим
                активний.
                Копіювання та
                контекстне меню
                заблоковані.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-8 text-center">
          <p className="font-medium text-gray-700">
            © Хорунжий Андрій
            Володимирович,
            2026
          </p>

          <span className="text-sm text-gray-500">
            Захищене тестування
          </span>
        </div>
      </footer>

      {/* ======================================================
          МОДАЛЬНЕ ВІКНО ЗАВЕРШЕННЯ
          ====================================================== */}

      {finishModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800">
              Завершити
              тестування?
            </h2>

            <p className="mt-4 leading-relaxed text-gray-600">
              Після завершення
              тесту змінити
              або додати
              відповіді буде
              неможливо.
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Опрацьовано
                </span>

                <span className="font-bold text-gray-800">
                  {answeredQuestions}{" "}
                  /{" "}
                  {totalQuestions}
                </span>
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                Продовжити
                тест
              </button>

              <button
                type="button"
                onClick={
                  finishTest
                }
                disabled={
                  finishing
                }
                className="rounded-xl bg-[#7A1F2B] px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {finishing
                  ? "Завершення..."
                  : "Так, завершити тест"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          ПОПЕРЕДЖЕННЯ БЕЗПЕКИ
          ====================================================== */}

      {securityWarning &&
        securityReady &&
        fullscreenActive &&
        !finished &&
        !blocked && (
          <div className="fixed bottom-6 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2">
            <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-2xl">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div className="flex-1">
                <p className="font-semibold text-amber-800">
                  Попередження
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-700">
                  {
                    securityWarning
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSecurityWarning(
                    ""
                  )
                }
                className="font-bold text-amber-600 hover:text-amber-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

      {/* ======================================================
          СТАН ПРИ ПРИХОВУВАННІ ВКЛАДКИ
          ====================================================== */}

      {tabHidden &&
        !finished &&
        !blocked && (
          <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 px-6">
            <div className="w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-2xl">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-600" />

              <h2 className="mt-5 text-2xl font-bold text-gray-800">
                Поверніться до тестування
              </h2>

              <p className="mt-4 leading-7 text-gray-600">
                Було зафіксовано
                вихід зі сторінки
                тестування.
              </p>

              <button
                type="button"
                onClick={() => {
                  setTabHidden(
                    false
                  );

                  void enterFullscreen();
                }}
                className="mt-7 rounded-xl bg-[#7A1F2B] px-7 py-3 font-bold text-white transition hover:opacity-90"
              >
                Повернутися до тесту
              </button>
            </div>
          </div>
        )}
    </main>
  );
}