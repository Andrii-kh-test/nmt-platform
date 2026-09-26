import React from "react";
import path from "path";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// =====================================================
// TYPES
// =====================================================

export type AnalyticsPdfMode = "simple" | "advanced";

type AnswerOption = {
  id: number;
  order: number;
  text: string;
  isCorrect: boolean;
};

type QuestionDetails = {
  id: number;
  order: number;
  type: string;
  text: string;
  points: number;
  options: AnswerOption[];
};

type AnswerDistributionItem = {
  label: string;
  value: number;
};

type Psychometrics = {
  key: string | null;
  pValue: number | null;
  dIndex: number | null;
  rit: number | null;
  answerDistribution: AnswerDistributionItem[];
  insufficientData?: boolean;
};

type QuestionStatistic = {
  questionId: number;
  order: number;
  text: string;
  type: string;
  points: number;
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  correctPercent: number;
  difficulty: string;
  psychometrics?: Psychometrics | null;
};

type Participant = {
  id: number;
  participantId?: number | null;
  sessionId?: number | null;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  earnedPoints: number;
  maxPoints: number;
  percent: number;
  correct: number;
  incorrect: number;
  skipped: number;
};

type AnalyticsData = {
  test: {
    id: number;
    title: string;
    subject: string;
    maxPoints: number;
  };

  summary: {
    participants: number;
    max: number;
    min: number;
    average: number;
    averagePercent: number;
  };

  participants: Participant[];

  questions: QuestionStatistic[];
};

type Props = {
  analytics: AnalyticsData;
  questionDetails: Record<number, QuestionDetails>;
  mode: AnalyticsPdfMode;
};

// =====================================================
// CONSTANTS
// =====================================================

const BURGUNDY = "#7A1F2B";
const BURGUNDY_DARK = "#641923";
const DARK = "#202020";
const GRAY = "#666666";
const LIGHT_GRAY = "#D9D9D9";
const VERY_LIGHT_GRAY = "#F5F5F5";
const WHITE = "#FFFFFF";

// =====================================================
// FONT
// =====================================================

const fontRegularPath = path.join(
  process.cwd(),
  "public",
  "branding",
  "noto-sans-regular.woff"
);

const fontBoldPath = path.join(
  process.cwd(),
  "public",
  "branding",
  "noto-sans-bold.woff"
);

Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: fontRegularPath,
      fontWeight: 400,
    },
    {
      src: fontBoldPath,
      fontWeight: 700,
    },
  ],
});

// =====================================================
// HELPERS
// =====================================================

function cleanText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatNumber(
  value: number | null | undefined,
  digits = 1
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return value.toLocaleString("uk-UA", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatPercent(
  value: number | null | undefined,
  digits = 1
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return formatNumber(value, digits);
}

function getParticipantName(
  participant: Participant
): string {
  const parts = [
    participant.lastName,
    participant.firstName,
    participant.middleName,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(" ")
    : "Не вказано";
}

function getLetter(index: number): string {
  const letters = [
    "А",
    "Б",
    "В",
    "Г",
    "Д",
    "Е",
    "Є",
    "Ж",
    "З",
    "И",
    "І",
  ];

  return letters[index] ?? String(index + 1);
}

function getQuestionTypeLabel(type: string): string {
  const normalized = String(type ?? "")
    .toLowerCase()
    .trim();

  if (
    normalized.includes("single") ||
    normalized.includes("одна")
  ) {
    return "Вибір однієї відповіді";
  }

  if (
    normalized.includes("multiple") ||
    normalized.includes("кілька")
  ) {
    return "Вибір кількох відповідей";
  }

  if (
    normalized.includes("matching") ||
    normalized.includes("відповід")
  ) {
    return "Установлення відповідності";
  }

  if (
    normalized.includes("sequence") ||
    normalized.includes("послід")
  ) {
    return "Установлення послідовності";
  }

  return type || "Тестове завдання";
}

function isMatchingType(type: string): boolean {
  const normalized = String(type ?? "")
    .toLowerCase()
    .trim();

  return (
    normalized.includes("matching") ||
    normalized.includes("відповід")
  );
}

// =====================================================
// QUESTION OPTION TEXT
// =====================================================

function getDisplayOptions(
  details: QuestionDetails
): Array<{
  letter: string;
  text: string;
  isCorrect: boolean;
}> {
  if (isMatchingType(details.type)) {
    return details.options
      .filter((option) =>
        option.text.startsWith("R|")
      )
      .map((option, index) => {
        const parts = option.text.split("|");

        return {
          letter: getLetter(index),
          text: parts.slice(2).join("|"),
          isCorrect: false,
        };
      });
  }

  return details.options.map(
    (option, index) => ({
      letter: getLetter(index),
      text: cleanText(option.text),
      isCorrect: option.isCorrect,
    })
  );
}

// =====================================================
// HEADER
// =====================================================

function Header() {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.headerBrand}>
        NMT Platform
      </Text>

      <Text style={styles.headerTitle}>
        ПЛАТФОРМА КОМП&apos;ЮТЕРНОГО ТЕСТУВАННЯ
      </Text>
    </View>
  );
}

// =====================================================
// FOOTER
// =====================================================

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerMain}>
        Автор &quot;NMT Platform&quot; Хорунжий Андрій
        Володимирович
      </Text>

      <Text style={styles.footerRole}>
        Учитель української мови та літератури
        Комунального закладу «Харківський ліцей № 5
        Харківської міської ради», методист
        Комунального закладу «Харківська обласна
        Мала академія наук»
      </Text>

      <Text style={styles.footerContact}>
        У разі виникнення технічних проблем звертайтеся
        на ahorunzij81@gmail.com
      </Text>

      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

// =====================================================
// SIMPLE REPORT
// =====================================================

function SimpleReport({
  analytics,
}: {
  analytics: AnalyticsData;
}) {
  return (
    <>
      <Text style={styles.mainHeading}>
        АНАЛІТИЧНИЙ ЗВІТ
      </Text>

      <Text style={styles.testTitle}>
        {analytics.test.title}
      </Text>

      <Text style={styles.testSubject}>
        {analytics.test.subject}
      </Text>

      <View style={styles.summaryGrid}>
        <SummaryCard
          label="Учасників"
          value={String(
            analytics.summary.participants
          )}
        />

        <SummaryCard
          label="Максимальний результат"
          value={formatNumber(
            analytics.summary.max,
            1
          )}
        />

        <SummaryCard
          label="Мінімальний результат"
          value={formatNumber(
            analytics.summary.min,
            1
          )}
        />

        <SummaryCard
          label="Середній результат"
          value={formatNumber(
            analytics.summary.average,
            1
          )}
        />

        <SummaryCard
          label="Середній результат (%)"
          value={`${formatPercent(
            analytics.summary.averagePercent
          )}%`}
        />
      </View>

      <Text style={styles.sectionTitle}>
        Учасники тестування
      </Text>

      <ParticipantsTable
        participants={analytics.participants}
      />

      <Text style={styles.sectionTitle}>
        Статистичні характеристики тестових завдань
      </Text>

      <SimpleQuestionsTable
        questions={analytics.questions}
      />
    </>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>
        {label}
      </Text>

      <Text style={styles.summaryValue}>
        {value}
      </Text>
    </View>
  );
}

// =====================================================
// PARTICIPANTS
// =====================================================

function ParticipantsTable({
  participants,
}: {
  participants: Participant[];
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text
          style={[
            styles.tableCell,
            styles.participantNumber,
            styles.headerCell,
          ]}
        >
          №
        </Text>

        <Text
          style={[
            styles.tableCell,
            styles.participantName,
            styles.headerCell,
          ]}
        >
          Учасник
        </Text>

        <Text
          style={[
            styles.tableCell,
            styles.participantPoints,
            styles.headerCell,
          ]}
        >
          Бал
        </Text>

        <Text
          style={[
            styles.tableCell,
            styles.participantPercent,
            styles.headerCell,
          ]}
        >
          %
        </Text>
      </View>

      {participants.map(
        (participant, index) => (
          <View
            key={participant.id}
            style={
              index % 2 === 0
                ? styles.tableRow
                : styles.tableRowAlt
            }
          >
            <Text
              style={[
                styles.tableCell,
                styles.participantNumber,
              ]}
            >
              {index + 1}
            </Text>

            <Text
              style={[
                styles.tableCell,
                styles.participantName,
              ]}
            >
              {getParticipantName(
                participant
              )}
            </Text>

            <Text
              style={[
                styles.tableCell,
                styles.participantPoints,
              ]}
            >
              {formatNumber(
                participant.earnedPoints,
                1
              )}{" "}
              /{" "}
              {formatNumber(
                participant.maxPoints,
                1
              )}
            </Text>

            <Text
              style={[
                styles.tableCell,
                styles.participantPercent,
              ]}
            >
              {formatPercent(
                participant.percent
              )}
            </Text>
          </View>
        )
      )}
    </View>
  );
}

// =====================================================
// SIMPLE QUESTIONS TABLE
// =====================================================

function SimpleQuestionsTable({
  questions,
}: {
  questions: QuestionStatistic[];
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text
          style={[
            styles.tableCell,
            styles.qNumber,
            styles.headerCell,
          ]}
        >
          №
        </Text>

        <Text
          style={[
            styles.tableCell,
            styles.qText,
            styles.headerCell,
          ]}
        >
          Питання
        </Text>

        <Text
          style={[
            styles.tableCell,
            styles.qSmall,
            styles.headerCell,
          ]}
        >
          Правильно
        </Text>

        <Text
          style={[
            styles.tableCell,
            styles.qSmall,
            styles.headerCell,
          ]}
        >
          Неправильно
        </Text>

        <Text
          style={[
            styles.tableCell,
            styles.qSmall,
            styles.headerCell,
          ]}
        >
          Пропущено
        </Text>

        <Text
          style={[
            styles.tableCell,
            styles.qSmall,
            styles.headerCell,
          ]}
        >
          Складність
        </Text>
      </View>

      {questions.map(
        (question, index) => (
          <View
            key={question.questionId}
            style={
              index % 2 === 0
                ? styles.tableRow
                : styles.tableRowAlt
            }
          >
            <Text
              style={[
                styles.tableCell,
                styles.qNumber,
              ]}
            >
              {question.order}
            </Text>

            <Text
              style={[
                styles.tableCell,
                styles.qText,
              ]}
            >
              {cleanText(question.text)}
            </Text>

            <Text
              style={[
                styles.tableCell,
                styles.qSmall,
              ]}
            >
              {question.correct} (
              {formatPercent(
                question.correctPercent
              )}
              %)
            </Text>

            <Text
              style={[
                styles.tableCell,
                styles.qSmall,
              ]}
            >
              {question.incorrect}
            </Text>

            <Text
              style={[
                styles.tableCell,
                styles.qSmall,
              ]}
            >
              {question.skipped}
            </Text>

            <Text
              style={[
                styles.tableCell,
                styles.qSmall,
              ]}
            >
              {question.difficulty}
            </Text>
          </View>
        )
      )}
    </View>
  );
}

// =====================================================
// ADVANCED REPORT
// =====================================================

function AdvancedReport({
  analytics,
  questionDetails,
}: {
  analytics: AnalyticsData;
  questionDetails: Record<number, QuestionDetails>;
}) {
  return (
    <>
      <Text style={styles.mainHeading}>
        РОЗШИРЕНИЙ АНАЛІТИЧНИЙ ЗВІТ
      </Text>

      <Text style={styles.testTitle}>
        {analytics.test.title}
      </Text>

      <Text style={styles.testSubject}>
        {analytics.test.subject}
      </Text>

      <View style={styles.advancedInfo}>
        <Text style={styles.advancedInfoText}>
          Кількість учасників:{" "}
          <Text style={styles.bold}>
            {analytics.summary.participants}
          </Text>
        </Text>

        <Text style={styles.advancedInfoText}>
          Максимальний бал:{" "}
          <Text style={styles.bold}>
            {formatNumber(
              analytics.summary.max,
              1
            )}
          </Text>
        </Text>
      </View>

      {analytics.questions.map(
        (question) => {
          const details =
            questionDetails[
              question.questionId
            ];

          return (
            <AdvancedQuestion
              key={question.questionId}
              statistic={question}
              details={details}
            />
          );
        }
      )}
    </>
  );
}

// =====================================================
// ADVANCED QUESTION
// =====================================================

function AdvancedQuestion({
  statistic,
  details,
}: {
  statistic: QuestionStatistic;
  details?: QuestionDetails;
}) {
  const psychometrics =
    statistic.psychometrics;

  const options = details
    ? getDisplayOptions(details)
    : [];

  const distribution =
    psychometrics?.answerDistribution ?? [];

  /*
   * Для звичайних завдань беремо реальні
   * варіанти відповіді з QuestionDetails.
   *
   * Для інших типів, якщо API передав
   * answerDistribution, використовуємо її
   * як fallback.
   */
  const columns =
    options.length > 0
      ? options.map((option, index) => ({
          label: getLetter(index),
          value:
            distribution[index]?.value ??
            0,
        }))
      : distribution.map((item) => ({
          label: item.label,
          value: item.value,
        }));

  const skippedPercent =
    statistic.total > 0
      ? (statistic.skipped /
          statistic.total) *
        100
      : 0;

  return (
    <View
      style={styles.advancedQuestion}
      wrap
    >
      {/* -------------------------------------------------
          QUESTION
      ------------------------------------------------- */}

      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>
          Завдання {statistic.order}
        </Text>

        <Text style={styles.questionType}>
          {getQuestionTypeLabel(
            statistic.type
          )}
        </Text>

        <Text style={styles.questionPoints}>
          {formatNumber(
            statistic.points,
            1
          )} б.
        </Text>
      </View>

      <Text style={styles.conditionLabel}>
        Умова
      </Text>

      <Text style={styles.conditionText}>
        {cleanText(statistic.text)}
      </Text>

      {/* -------------------------------------------------
          OPTIONS
      ------------------------------------------------- */}

      {options.length > 0 ? (
        <View style={styles.optionsBlock}>
          {options.map((option) => (
            <View
              key={option.letter}
              style={styles.optionRow}
            >
              <Text
                style={styles.optionLetter}
              >
                {option.letter}
              </Text>

              <Text
                style={styles.optionText}
              >
                {option.text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* -------------------------------------------------
          OFFICIAL-STYLE PSYCHOMETRIC TABLE
      ------------------------------------------------- */}

      <PsychometricTable
        statistic={statistic}
        columns={columns}
        skippedPercent={skippedPercent}
      />
    </View>
  );
}

// =====================================================
// PSYCHOMETRIC TABLE
//
// Структура:
// Ключ
// Відповіді учасників (%) — об'єднаний блок
//   А | Б | В | Г | ...
// Не виконали завдання (%)
// Складність (P-value)
// Дискримінація (D-index)
// Кореляція (Rit)
// =====================================================

function PsychometricTable({
  statistic,
  columns,
  skippedPercent,
}: {
  statistic: QuestionStatistic;
  columns: Array<{
    label: string;
    value: number;
  }>;
  skippedPercent: number;
}) {
  const psychometrics =
    statistic.psychometrics;

  const key =
    psychometrics?.key || "—";

  return (
    <View style={styles.psychometricTable}>
      {/* ================================
          HEADER ROW 1
         ================================= */}

      <View
        style={styles.psychometricHeaderRow}
      >
        <Text
          style={[
            styles.psychometricCell,
            styles.keyColumn,
            styles.psychometricHeader,
          ]}
        >
          Ключ
        </Text>

        <Text
          style={[
            styles.psychometricCell,
            styles.answerGroupHeader,
            styles.psychometricHeader,
          ]}
        >
          Відповіді учасників (%)
        </Text>

        <Text
          style={[
            styles.psychometricCell,
            styles.skippedColumn,
            styles.psychometricHeader,
          ]}
        >
          Не виконали{"\n"}
          завдання (%)
        </Text>

        <Text
          style={[
            styles.psychometricCell,
            styles.metricColumn,
            styles.psychometricHeader,
          ]}
        >
          Складність{"\n"}
          (P-value)
        </Text>

        <Text
          style={[
            styles.psychometricCell,
            styles.metricColumn,
            styles.psychometricHeader,
          ]}
        >
          Дискримінація{"\n"}
          (D-index)
        </Text>

        <Text
          style={[
            styles.psychometricCell,
            styles.metricColumn,
            styles.psychometricHeader,
          ]}
        >
          Кореляція{"\n"}
          (Rit)
        </Text>
      </View>

      {/* ================================
          HEADER ROW 2
         ================================= */}

      <View
        style={styles.psychometricHeaderRow}
      >
        <Text
          style={[
            styles.psychometricCell,
            styles.keyColumn,
            styles.psychometricSubHeaderEmpty,
          ]}
        >
          {" "}
        </Text>

        {columns.map((column) => (
          <Text
            key={column.label}
            style={[
              styles.psychometricCell,
              styles.answerColumn,
              styles.psychometricSubHeader,
            ]}
          >
            {column.label}
          </Text>
        ))}

        <Text
          style={[
            styles.psychometricCell,
            styles.skippedColumn,
            styles.psychometricSubHeaderEmpty,
          ]}
        >
          {" "}
        </Text>

        <Text
          style={[
            styles.psychometricCell,
            styles.metricColumn,
            styles.psychometricSubHeaderEmpty,
          ]}
        >
          {" "}
        </Text>

        <Text
          style={[
            styles.psychometricCell,
            styles.metricColumn,
            styles.psychometricSubHeaderEmpty,
          ]}
        >
          {" "}
        </Text>

        <Text
          style={[
            styles.psychometricCell,
            styles.metricColumn,
            styles.psychometricSubHeaderEmpty,
          ]}
        >
          {" "}
        </Text>
      </View>

      {/* ================================
          DATA ROW
         ================================= */}

      <View
        style={styles.psychometricDataRow}
      >
        <Text
          style={[
            styles.psychometricCell,
            styles.keyColumn,
            styles.dataCell,
            styles.bold,
          ]}
        >
          {key}
        </Text>

        {columns.map((column) => (
          <Text
            key={column.label}
            style={[
              styles.psychometricCell,
              styles.answerColumn,
              styles.dataCell,
            ]}
          >
            {formatPercent(
              column.value
            )}
          </Text>
        ))}

        <Text
          style={[
            styles.psychometricCell,
            styles.skippedColumn,
            styles.dataCell,
          ]}
        >
          {formatPercent(
            skippedPercent
          )}
        </Text>

        <Text
          style={[
            styles.psychometricCell,
            styles.metricColumn,
            styles.dataCell,
          ]}
        >
          {formatPercent(
            psychometrics?.pValue
          )}
        </Text>

        <Text
          style={[
            styles.psychometricCell,
            styles.metricColumn,
            styles.dataCell,
          ]}
        >
          {formatNumber(
            psychometrics?.dIndex
          )}
        </Text>

        <Text
          style={[
            styles.psychometricCell,
            styles.metricColumn,
            styles.dataCell,
          ]}
        >
          {formatNumber(
            psychometrics?.rit
          )}
        </Text>
      </View>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    fontSize: 8,
    color: DARK,
    paddingTop: 72,
    paddingBottom: 72,
    paddingLeft: 38,
    paddingRight: 38,
  },

  header: {
    position: "absolute",
    top: 22,
    left: 38,
    right: 38,
    height: 34,
    borderBottomWidth: 1,
    borderBottomColor: BURGUNDY,
    paddingBottom: 7,
  },

  headerBrand: {
    fontSize: 14,
    fontWeight: 700,
    color: BURGUNDY,
  },

  headerTitle: {
    marginTop: 2,
    fontSize: 6.5,
    fontWeight: 700,
    color: GRAY,
    letterSpacing: 0.4,
  },

  footer: {
    position: "absolute",
    left: 38,
    right: 38,
    bottom: 20,
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_GRAY,
    paddingTop: 5,
  },

  footerMain: {
    fontSize: 6.5,
    fontWeight: 700,
    color: BURGUNDY,
  },

  footerRole: {
    marginTop: 1,
    fontSize: 5.5,
    color: GRAY,
    lineHeight: 1.25,
  },

  footerContact: {
    marginTop: 2,
    fontSize: 5.5,
    color: GRAY,
  },

  pageNumber: {
    position: "absolute",
    right: 0,
    bottom: 0,
    fontSize: 6,
    color: GRAY,
  },

  mainHeading: {
    fontSize: 15,
    fontWeight: 700,
    color: BURGUNDY,
    marginBottom: 8,
  },

  testTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: DARK,
    marginBottom: 2,
  },

  testSubject: {
    fontSize: 8,
    color: GRAY,
    marginBottom: 12,
  },

  sectionTitle: {
    marginTop: 16,
    marginBottom: 7,
    fontSize: 10,
    fontWeight: 700,
    color: BURGUNDY,
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },

  summaryCard: {
    width: "19%",
    minHeight: 48,
    borderWidth: 0.6,
    borderColor: LIGHT_GRAY,
    padding: 7,
  },

  summaryLabel: {
    fontSize: 6.5,
    color: GRAY,
    marginBottom: 5,
  },

  summaryValue: {
    fontSize: 12,
    fontWeight: 700,
    color: BURGUNDY,
  },

  advancedInfo: {
    flexDirection: "row",
    marginBottom: 12,
  },

  advancedInfoText: {
    marginRight: 25,
    fontSize: 7.5,
    color: GRAY,
  },

  bold: {
    fontWeight: 700,
  },

  table: {
    width: "100%",
    borderWidth: 0.6,
    borderColor: LIGHT_GRAY,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: BURGUNDY,
  },

  tableRow: {
    flexDirection: "row",
    backgroundColor: WHITE,
    borderTopWidth: 0.4,
    borderTopColor: LIGHT_GRAY,
  },

  tableRowAlt: {
    flexDirection: "row",
    backgroundColor: VERY_LIGHT_GRAY,
    borderTopWidth: 0.4,
    borderTopColor: LIGHT_GRAY,
  },

  tableCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 0.4,
    borderRightColor: LIGHT_GRAY,
    fontSize: 6.5,
  },

  headerCell: {
    color: WHITE,
    fontWeight: 700,
    fontSize: 6.2,
  },

  participantNumber: {
    width: "6%",
    textAlign: "center",
  },

  participantName: {
    width: "54%",
  },

  participantPoints: {
    width: "20%",
    textAlign: "center",
  },

  participantPercent: {
    width: "20%",
    textAlign: "center",
  },

  qNumber: {
    width: "5%",
    textAlign: "center",
  },

  qText: {
    width: "43%",
  },

  qSmall: {
    width: "13%",
    textAlign: "center",
  },

  // ===================================================
  // ADVANCED QUESTION
  // ===================================================

  advancedQuestion: {
    marginBottom: 16,
    breakInside: "avoid",
  },

  questionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    borderBottomWidth: 0.8,
    borderBottomColor: BURGUNDY,
    paddingBottom: 4,
    marginBottom: 6,
  },

  questionNumber: {
    fontSize: 9,
    fontWeight: 700,
    color: BURGUNDY,
  },

  questionType: {
    flex: 1,
    marginLeft: 8,
    fontSize: 6.5,
    color: GRAY,
  },

  questionPoints: {
    fontSize: 7,
    fontWeight: 700,
    color: DARK,
  },

  conditionLabel: {
    marginBottom: 2,
    fontSize: 6.5,
    fontWeight: 700,
    color: GRAY,
    textTransform: "uppercase",
  },

  conditionText: {
    marginBottom: 7,
    fontSize: 7.2,
    lineHeight: 1.35,
  },

  optionsBlock: {
    marginBottom: 8,
    paddingLeft: 5,
  },

  optionRow: {
    flexDirection: "row",
    marginBottom: 2.5,
  },

  optionLetter: {
    width: 17,
    fontSize: 7,
    fontWeight: 700,
  },

  optionText: {
    flex: 1,
    fontSize: 7,
    lineHeight: 1.3,
  },

  // ===================================================
  // OFFICIAL-STYLE PSYCHOMETRIC TABLE
  // ===================================================

  psychometricTable: {
    width: "100%",
    borderWidth: 0.6,
    borderColor: "#000000",
    marginTop: 6,
  },

  psychometricHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#EDEDED",
  },

  psychometricDataRow: {
    flexDirection: "row",
    backgroundColor: WHITE,
  },

  psychometricCell: {
    borderRightWidth: 0.5,
    borderRightColor: "#000000",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    paddingVertical: 4,
    paddingHorizontal: 2,
    fontSize: 5.8,
    textAlign: "center",
  },

  psychometricHeader: {
    fontWeight: 700,
    fontSize: 5.7,
    lineHeight: 1.2,
    minHeight: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  psychometricSubHeader: {
    fontWeight: 700,
    fontSize: 6.2,
    paddingVertical: 3,
  },

  psychometricSubHeaderEmpty: {
    paddingVertical: 3,
  },

  keyColumn: {
    width: "8%",
  },

  /*
   * Усі колонки відповідей отримують
   * однакову ширину через answerColumn.
   *
   * Сам блок «Відповіді учасників (%)»
   * візуально є одним об'єднаним заголовком.
   */
  answerGroupHeader: {
    width: "32%",
  },

  answerColumn: {
    width: "4%",
  },

  skippedColumn: {
    width: "14%",
  },

  metricColumn: {
    width: "10%",
  },

  dataCell: {
    minHeight: 22,
    justifyContent: "center",
  },
});

// =====================================================
// DOCUMENT
// =====================================================

export default function AnalyticsPdfDocument({
  analytics,
  questionDetails,
  mode,
}: Props) {
  const isAdvanced = mode === "advanced";

  return (
    <Document
      title={`Аналітичний звіт — ${analytics.test.title}`}
      author="NMT Platform"
      subject={analytics.test.title}
      creator="NMT Platform"
      producer="NMT Platform"
    >
      <Page
        size="A4"
        orientation={isAdvanced ? "landscape" : "portrait"}
        style={styles.page}
        wrap
      >
        <Header />

        {mode === "simple" ? (
          <SimpleReport
            analytics={analytics}
          />
        ) : (
          <AdvancedReport
            analytics={analytics}
            questionDetails={questionDetails}
          />
        )}

        <Footer />
      </Page>
    </Document>
  );
}