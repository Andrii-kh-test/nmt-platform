

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import fs from "fs";
import path from "path";

// =====================================================
// TYPES
// =====================================================

export type AnalyticsPdfMode =
  | "simple"
  | "advanced";

type AnswerDistributionItem = {
  key: string;
  text: string;
  count: number;
  percent: number;
};

type ScoreDistributionItem = {
  score: number;
  count: number;
  percent: number;
};

type QuestionPsychometrics = {
  key: string;
  pValue: number | null;
  dIndex: number | null;
  rit: number | null;

  answerDistribution: AnswerDistributionItem[];
  scoreDistribution?: ScoreDistributionItem[];

  correctCount: number;
  incorrectCount: number;
  skippedCount: number;

  correctPercent: number;
  incorrectPercent: number;
  skippedPercent: number;

  meanScore: number;
  maxPoints: number;

  strongGroupSize: number;
  weakGroupSize: number;

  insufficientData: boolean;
};

type AnswerOptionData = {
  id: number;
  order: number;
  text: string;
  isCorrect: boolean;
};

type QuestionData = {
  id: number;
  order: number;
  type: string;
  text: string;
  points: number;

  answerOptions: AnswerOptionData[];

  correct: number;
  incorrect: number;
  skipped: number;
  total: number;

  correctPercent: number;
  incorrectPercent: number;
  skippedPercent: number;

  difficulty: string;
  difficultyColor?: string;

  psychometrics: QuestionPsychometrics;
};

type ParticipantData = {
  id: number;

  firstName: string | null;
  lastName: string | null;
  middleName: string | null;

  earnedPoints: number;
  maxPoints: number;
  percent: number;

  correct: number;
  incorrect: number;
  skipped: number;

  createdAt: Date | string;
};

type AnalyticsData = {
  test: {
    id: number;
    title: string;
    subject: string | null;
    maxPoints: number;
    questionCount: number;
  };

  summary: {
    participants: number;
    maxScore: number;
    minScore: number;
    averageScore: number;
    averagePercent: number;
  };

  participants: ParticipantData[];
  questions: QuestionData[];
};

type Props = {
  analytics: AnalyticsData;
  mode: AnalyticsPdfMode;
};

// =====================================================
// COLORS
// =====================================================

const BURGUNDY = "#7A1F2B";
const BURGUNDY_DARK = "#5E1721";
const LIGHT_BURGUNDY = "#F4E9EB";

const BORDER = "#C9C9C9";
const LIGHT_GRAY = "#F4F4F4";
const MEDIUM_GRAY = "#E7E7E7";
const TEXT = "#222222";
const MUTED = "#666666";
const WHITE = "#FFFFFF";

// =====================================================
// FONTS
// =====================================================

const regularFontPath = path.join(
  process.cwd(),
  "public",
  "branding",
  "noto-sans-regular.woff"
);

const boldFontPath = path.join(
  process.cwd(),
  "public",
  "branding",
  "noto-sans-bold.woff"
);

const italicFontPath = path.join(
  process.cwd(),
  "public",
  "branding",
  "noto-sans-italic.woff"
);

if (fs.existsSync(regularFontPath)) {
  Font.register({
    family: "NotoSans",
    src: regularFontPath,
    fontWeight: 400,
  });
}

if (fs.existsSync(boldFontPath)) {
  Font.register({
    family: "NotoSans",
    src: boldFontPath,
    fontWeight: 700,
  });
}

if (fs.existsSync(italicFontPath)) {
  Font.register({
    family: "NotoSans",
    src: italicFontPath,
    fontWeight: 400,
    fontStyle: "italic",
  });
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingBottom: 42,
    paddingHorizontal: 38,

    fontFamily: "NotoSans",
    fontSize: 8.5,
    color: TEXT,

    backgroundColor: WHITE,
  },

  // ---------------------------------------------------
  // HEADER
  // ---------------------------------------------------

  header: {
    marginBottom: 18,
    paddingBottom: 9,

    borderBottomWidth: 2,
    borderBottomColor: BURGUNDY,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandMark: {
    width: 25,
    height: 25,

    borderRadius: 12.5,

    backgroundColor: BURGUNDY,

    marginRight: 8,

    alignItems: "center",
    justifyContent: "center",
  },

  brandMarkText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: 700,
  },

  brandTitle: {
    color: BURGUNDY,
    fontSize: 17,
    fontWeight: 700,
  },

  brandSubtitle: {
    marginTop: 2,

    color: TEXT,
    fontSize: 7.5,
    fontWeight: 700,

    letterSpacing: 0.4,
  },

  // ---------------------------------------------------
  // FOOTER
  // ---------------------------------------------------

  footer: {
    position: "absolute",

    left: 38,
    right: 38,
    bottom: 18,

    paddingTop: 6,

    borderTopWidth: 0.7,
    borderTopColor: BORDER,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerText: {
    fontSize: 6.5,
    color: MUTED,
  },

  pageNumber: {
    fontSize: 6.5,
    color: MUTED,
  },

  // ---------------------------------------------------
  // TITLES
  // ---------------------------------------------------

  documentTitle: {
    fontSize: 16,
    fontWeight: 700,

    color: BURGUNDY,

    marginBottom: 5,
  },

  documentSubtitle: {
    fontSize: 8,
    color: MUTED,

    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,

    color: BURGUNDY,

    marginTop: 15,
    marginBottom: 7,
  },

  subsectionTitle: {
    fontSize: 9.5,
    fontWeight: 700,

    color: TEXT,

    marginTop: 10,
    marginBottom: 5,
  },

  // ---------------------------------------------------
  // GENERAL INFORMATION
  // ---------------------------------------------------

  infoBox: {
    borderWidth: 0.7,
    borderColor: BORDER,
    borderRadius: 3,

    marginBottom: 12,
  },

  infoRow: {
    flexDirection: "row",

    minHeight: 22,

    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },

  infoRowLast: {
    borderBottomWidth: 0,
  },

  infoLabel: {
    width: "30%",

    paddingHorizontal: 7,
    paddingVertical: 5,

    backgroundColor: LIGHT_GRAY,

    fontWeight: 700,
    color: TEXT,
  },

  infoValue: {
    width: "70%",

    paddingHorizontal: 7,
    paddingVertical: 5,

    color: TEXT,
  },

  // ---------------------------------------------------
  // SUMMARY CARDS
  // ---------------------------------------------------

  cardsRow: {
    flexDirection: "row",

    marginBottom: 12,
  },

  card: {
    flex: 1,

    marginRight: 6,

    borderWidth: 0.7,
    borderColor: BORDER,
    borderRadius: 3,

    padding: 7,

    minHeight: 48,
  },

  cardLast: {
    marginRight: 0,
  },

  cardLabel: {
    fontSize: 6.8,
    color: MUTED,

    marginBottom: 4,
  },

  cardValue: {
    fontSize: 13,
    fontWeight: 700,

    color: BURGUNDY,
  },

  // ---------------------------------------------------
  // TABLE
  // ---------------------------------------------------

  table: {
    width: "100%",

    borderWidth: 0.6,
    borderColor: BORDER,

    marginBottom: 10,
  },

  tableRow: {
    flexDirection: "row",
  },

  tableHeader: {
    backgroundColor: BURGUNDY,
    color: WHITE,

    fontWeight: 700,
  },

  tableHeaderLight: {
    backgroundColor: LIGHT_GRAY,
    color: TEXT,

    fontWeight: 700,
  },

  tableCell: {
    paddingHorizontal: 4,
    paddingVertical: 4,

    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,

    borderColor: BORDER,

    justifyContent: "center",
  },

  tableCellLast: {
    borderRightWidth: 0,
  },

  tableCellText: {
    fontSize: 7,
  },

  tableHeaderText: {
    fontSize: 6.8,
  },

  center: {
    textAlign: "center",
  },

  right: {
    textAlign: "right",
  },

  // ---------------------------------------------------
  // DIFFICULTY
  // ---------------------------------------------------

  difficultyBox: {
    borderWidth: 0.6,
    borderColor: BORDER,

    marginBottom: 10,
  },

  difficultyRow: {
    flexDirection: "row",

    minHeight: 20,

    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },

  difficultyRowLast: {
    borderBottomWidth: 0,
  },

  difficultyName: {
    width: "55%",

    padding: 5,
  },

  difficultyCount: {
    width: "20%",

    padding: 5,

    textAlign: "center",
  },

  difficultyPercent: {
    width: "25%",

    padding: 5,

    textAlign: "right",
  },

  // ---------------------------------------------------
  // QUESTION
  // ---------------------------------------------------

  questionBlock: {
    marginBottom: 17,

    paddingBottom: 10,

    borderBottomWidth: 0.8,
    borderBottomColor: BORDER,
  },

  questionHeader: {
    flexDirection: "row",

    alignItems: "flex-start",

    marginBottom: 6,
  },

  questionNumber: {
    width: 35,

    fontSize: 10,
    fontWeight: 700,

    color: BURGUNDY,
  },

  questionHeaderText: {
    flex: 1,

    fontSize: 9,
    fontWeight: 700,

    color: TEXT,
  },

  questionType: {
    marginTop: 2,

    fontSize: 6.8,
    color: MUTED,
    fontWeight: 400,
  },

  questionCondition: {
    fontSize: 8,

    lineHeight: 1.35,

    marginBottom: 7,
  },

  optionRow: {
    flexDirection: "row",

    marginBottom: 3,

    paddingLeft: 8,
  },

  optionLetter: {
    width: 18,

    fontWeight: 700,
    color: BURGUNDY,
  },

  optionText: {
    flex: 1,

    fontSize: 7.5,
    lineHeight: 1.25,
  },

  correctOption: {
    fontWeight: 700,
  },

  // ---------------------------------------------------
  // OFFICIAL PSYCHOMETRIC TABLE
  // ---------------------------------------------------

  psychometricTable: {
    width: "100%",

    borderWidth: 0.7,
    borderColor: "#888888",

    marginTop: 8,
    marginBottom: 5,
  },

  psychometricRow: {
    flexDirection: "row",
  },

  psychometricHeaderTop: {
    minHeight: 24,

    backgroundColor: BURGUNDY,
    color: WHITE,
  },

  psychometricHeaderBottom: {
    minHeight: 18,

    backgroundColor: LIGHT_BURGUNDY,
    color: TEXT,
  },

  psychometricCell: {
    paddingHorizontal: 3,
    paddingVertical: 3,

    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,

    borderColor: "#888888",

    justifyContent: "center",
    alignItems: "center",
  },

  psychometricCellLast: {
    borderRightWidth: 0,
  },

  psychometricText: {
    fontSize: 6.2,

    textAlign: "center",

    lineHeight: 1.1,
  },

  psychometricHeaderText: {
    fontSize: 5.9,

    fontWeight: 700,

    textAlign: "center",

    lineHeight: 1.1,
  },

  psychometricKeyText: {
    fontSize: 6.5,

    fontWeight: 700,

    textAlign: "center",
  },

  // ---------------------------------------------------
  // ADVANCED EXTRA INFORMATION
  // ---------------------------------------------------

  questionStats: {
    flexDirection: "row",

    marginTop: 5,
    marginBottom: 4,
  },

  questionStat: {
    marginRight: 12,

    fontSize: 6.7,
    color: MUTED,
  },

  questionStatStrong: {
    fontWeight: 700,
    color: TEXT,
  },

  psychometricNote: {
    fontSize: 6.3,

    color: MUTED,

    lineHeight: 1.3,

    marginTop: 3,
  },

  // ---------------------------------------------------
  // SCORE DISTRIBUTION
  // ---------------------------------------------------

  scoreDistribution: {
    marginTop: 5,

    borderWidth: 0.5,
    borderColor: BORDER,
  },

  scoreDistributionTitle: {
    padding: 4,

    backgroundColor: LIGHT_GRAY,

    fontSize: 6.8,
    fontWeight: 700,
  },

  scoreDistributionRow: {
    flexDirection: "row",

    borderTopWidth: 0.5,
    borderTopColor: BORDER,
  },

  scoreDistributionCell: {
    padding: 3,

    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },

  // ---------------------------------------------------
  // LEGEND
  // ---------------------------------------------------

  legendBox: {
    marginTop: 10,

    padding: 8,

    borderWidth: 0.6,
    borderColor: BORDER,

    backgroundColor: LIGHT_GRAY,
  },

  legendTitle: {
    fontSize: 8,
    fontWeight: 700,

    marginBottom: 5,
  },

  legendText: {
    fontSize: 6.8,

    color: MUTED,

    lineHeight: 1.35,

    marginBottom: 2,
  },

  // ---------------------------------------------------
  // SIMPLE QUESTION TABLE
  // ---------------------------------------------------

  simpleQuestionTable: {
    width: "100%",

    borderWidth: 0.6,
    borderColor: BORDER,
  },

  // ---------------------------------------------------
  // SPACERS
  // ---------------------------------------------------

  smallSpace: {
    height: 4,
  },

  mediumSpace: {
    height: 8,
  },
});

// =====================================================
// HELPERS
// =====================================================

function round(
  value: number,
  digits = 1
): string {
  return value.toFixed(digits);
}

function formatPercent(
  value: number | null | undefined
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${value.toFixed(1)}%`;
}

function formatNumber(
  value: number | null | undefined,
  digits = 2
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return value.toFixed(digits);
}

function getParticipantName(
  participant: ParticipantData
): string {
  return [
    participant.lastName,
    participant.firstName,
    participant.middleName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getLetter(
  index: number
): string {
  let result = "";
  let n = index;

  while (n >= 0) {
    result =
      String.fromCharCode(
        65 + (n % 26)
      ) + result;

    n =
      Math.floor(n / 26) - 1;
  }

  return result;
}

function getQuestionTypeLabel(
  type: string
): string {
  switch (type) {
    case "single":
    case "SINGLE":
      return "Однозначний вибір";

    case "multiple":
    case "MULTIPLE":
      return "Множинний вибір";

    case "matching":
    case "MATCHING":
      return "Відповідність";

    case "sequence":
    case "SEQUENCE":
      return "Послідовність";

    default:
      return type;
  }
}

function getDifficultyColor(
  difficulty: string
): string {
  switch (difficulty) {
    case "Дуже легке":
      return "#DCEFD9";

    case "Легке":
      return "#E8F4E5";

    case "Оптимальне":
      return "#FFF4D6";

    case "Складне":
      return "#FCE8D8";

    case "Дуже складне":
      return "#F5D7D7";

    default:
      return WHITE;
  }
}

// =====================================================
// HTML DECODING
// =====================================================

function decodeHtml(
  value: string
): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#8211;/gi, "–")
    .replace(/&#8212;/gi, "—")
    .replace(/&#8594;/gi, "→")
    .replace(/&#8592;/gi, "←");
}

function stripHtml(
  value: string
): string {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  ).trim();
}

// =====================================================
// FOOTER
// =====================================================

function Footer() {
  return (
    <View
      style={styles.footer}
      fixed
    >
      <Text style={styles.footerText}>
        Автор "NMT Platform" Хорунжий Андрій
        Володимирович
      </Text>

      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Сторінка ${pageNumber} з ${totalPages}`
        }
      />
    </View>
  );
}

// =====================================================
// HEADER
// =====================================================

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>
            N
          </Text>
        </View>

        <View>
          <Text style={styles.brandTitle}>
            NMT Platform
          </Text>

          <Text style={styles.brandSubtitle}>
            ПЛАТФОРМА КОМП'ЮТЕРНОГО ТЕСТУВАННЯ
          </Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================
// GENERAL INFORMATION
// =====================================================

function GeneralInformation({
  analytics,
}: {
  analytics: AnalyticsData;
}) {
  return (
    <>
      <Text style={styles.documentTitle}>
        Аналітичний звіт
      </Text>

      <Text style={styles.documentSubtitle}>
        Результати комп'ютерного тестування
      </Text>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Назва тесту
          </Text>

          <Text style={styles.infoValue}>
            {analytics.test.title}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Предмет
          </Text>

          <Text style={styles.infoValue}>
            {analytics.test.subject || "—"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Кількість завдань
          </Text>

          <Text style={styles.infoValue}>
            {analytics.test.questionCount}
          </Text>
        </View>

        <View
          style={[
            styles.infoRow,
            styles.infoRowLast,
          ]}
        >
          <Text style={styles.infoLabel}>
            Максимальна кількість балів
          </Text>

          <Text style={styles.infoValue}>
            {analytics.test.maxPoints}
          </Text>
        </View>
      </View>

      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            Учасників
          </Text>

          <Text style={styles.cardValue}>
            {analytics.summary.participants}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            Максимальний результат
          </Text>

          <Text style={styles.cardValue}>
            {round(
              analytics.summary.maxScore,
              1
            )}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            Мінімальний результат
          </Text>

          <Text style={styles.cardValue}>
            {round(
              analytics.summary.minScore,
              1
            )}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            Середній результат
          </Text>

          <Text style={styles.cardValue}>
            {round(
              analytics.summary.averageScore,
              1
            )}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            styles.cardLast,
          ]}
        >
          <Text style={styles.cardLabel}>
            Середній відсоток
          </Text>

          <Text style={styles.cardValue}>
            {formatPercent(
              analytics.summary.averagePercent
            )}
          </Text>
        </View>
      </View>
    </>
  );
}

// =====================================================
// PARTICIPANTS TABLE
// =====================================================

function ParticipantsTable({
  participants,
}: {
  participants: ParticipantData[];
}) {
  return (
    <>
      <Text style={styles.sectionTitle}>
        Учасники
      </Text>

      <View style={styles.table}>
        <View
          style={[
            styles.tableRow,
            styles.tableHeader,
          ]}
        >
          <View
            style={[
              styles.tableCell,
              { width: "6%" },
            ]}
          >
            <Text
              style={[
                styles.tableHeaderText,
                styles.center,
              ]}
            >
              №
            </Text>
          </View>

          <View
            style={[
              styles.tableCell,
              { width: "31%" },
            ]}
          >
            <Text style={styles.tableHeaderText}>
              Учасник
            </Text>
          </View>

          <View
            style={[
              styles.tableCell,
              { width: "14%" },
            ]}
          >
            <Text
              style={[
                styles.tableHeaderText,
                styles.center,
              ]}
            >
              Бал
            </Text>
          </View>

          <View
            style={[
              styles.tableCell,
              { width: "13%" },
            ]}
          >
            <Text
              style={[
                styles.tableHeaderText,
                styles.center,
              ]}
            >
              %
            </Text>
          </View>

          <View
            style={[
              styles.tableCell,
              { width: "12%" },
            ]}
          >
            <Text
              style={[
                styles.tableHeaderText,
                styles.center,
              ]}
            >
              Правильні
            </Text>
          </View>

          <View
            style={[
              styles.tableCell,
              { width: "12%" },
            ]}
          >
            <Text
              style={[
                styles.tableHeaderText,
                styles.center,
              ]}
            >
              Неправильні
            </Text>
          </View>

          <View
            style={[
              styles.tableCell,
              styles.tableCellLast,
              { width: "12%" },
            ]}
          >
            <Text
              style={[
                styles.tableHeaderText,
                styles.center,
              ]}
            >
              Пропущені
            </Text>
          </View>
        </View>

        {participants.map(
          (participant, index) => (
            <View
              style={styles.tableRow}
              key={participant.id}
              wrap={false}
            >
              <View
                style={[
                  styles.tableCell,
                  { width: "6%" },
                ]}
              >
                <Text
                  style={[
                    styles.tableCellText,
                    styles.center,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>

              <View
                style={[
                  styles.tableCell,
                  { width: "31%" },
                ]}
              >
                <Text
                  style={styles.tableCellText}
                >
                  {getParticipantName(
                    participant
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.tableCell,
                  { width: "14%" },
                ]}
              >
                <Text
                  style={[
                    styles.tableCellText,
                    styles.center,
                  ]}
                >
                  {round(
                    participant.earnedPoints,
                    1
                  )}
                  {" / "}
                  {round(
                    participant.maxPoints,
                    1
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.tableCell,
                  { width: "13%" },
                ]}
              >
                <Text
                  style={[
                    styles.tableCellText,
                    styles.center,
                  ]}
                >
                  {formatPercent(
                    participant.percent
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.tableCell,
                  { width: "12%" },
                ]}
              >
                <Text
                  style={[
                    styles.tableCellText,
                    styles.center,
                  ]}
                >
                  {participant.correct}
                </Text>
              </View>

              <View
                style={[
                  styles.tableCell,
                  { width: "12%" },
                ]}
              >
                <Text
                  style={[
                    styles.tableCellText,
                    styles.center,
                  ]}
                >
                  {participant.incorrect}
                </Text>
              </View>

              <View
                style={[
                  styles.tableCell,
                  styles.tableCellLast,
                  { width: "12%" },
                ]}
              >
                <Text
                  style={[
                    styles.tableCellText,
                    styles.center,
                  ]}
                >
                  {participant.skipped}
                </Text>
              </View>
            </View>
          )
        )}
      </View>
    </>
  );
}

// =====================================================
// DIFFICULTY DISTRIBUTION
// =====================================================

function DifficultyDistribution({
  questions,
}: {
  questions: QuestionData[];
}) {
  const labels = [
    "Дуже легке",
    "Легке",
    "Оптимальне",
    "Складне",
    "Дуже складне",
  ];

  const counts = new Map<
    string,
    number
  >();

  labels.forEach((label) =>
    counts.set(label, 0)
  );

  questions.forEach((question) => {
    counts.set(
      question.difficulty,
      (counts.get(
        question.difficulty
      ) ?? 0) + 1
    );
  });

  return (
    <>
      <Text style={styles.sectionTitle}>
        Розподіл завдань за складністю
      </Text>

      <View style={styles.difficultyBox}>
        {labels.map(
          (label, index) => {
            const count =
              counts.get(label) ?? 0;

            const percent =
              questions.length > 0
                ? (count /
                    questions.length) *
                  100
                : 0;

            return (
              <View
                key={label}
                style={[
                  styles.difficultyRow,
                  index ===
                    labels.length - 1
                    ? styles.difficultyRowLast
                    : {},
                ]}
              >
                <View
                  style={[
                    styles.difficultyName,
                    {
                      backgroundColor:
                        getDifficultyColor(
                          label
                        ),
                    },
                  ]}
                >
                  <Text
                    style={
                      styles.tableCellText
                    }
                  >
                    {label}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.difficultyCount,
                    styles.tableCellText,
                  ]}
                >
                  {count}
                </Text>

                <Text
                  style={[
                    styles.difficultyPercent,
                    styles.tableCellText,
                  ]}
                >
                  {formatPercent(
                    percent
                  )}
                </Text>
              </View>
            );
          }
        )}
      </View>
    </>
  );
}

// =====================================================
// SIMPLE QUESTION SUMMARY
// =====================================================

function QuestionsSummaryTable({
  questions,
}: {
  questions: QuestionData[];
}) {
  return (
    <>
      <Text style={styles.sectionTitle}>
        Аналіз завдань
      </Text>

      <View
        style={styles.simpleQuestionTable}
      >
        <View
          style={[
            styles.tableRow,
            styles.tableHeader,
          ]}
        >
          <View
            style={[
              styles.tableCell,
              { width: "6%" },
            ]}
          >
            <Text
              style={[
                styles.tableHeaderText,
                styles.center,
              ]}
            >
              №
            </Text>
          </View>

          <View
            style={[
              styles.tableCell,
              { width: "27%" },
            ]}
          >
            <Text style={styles.tableHeaderText}>
              Тип
            </Text>
          </View>

          <View
            style={[
              styles.tableCell,
              { width: "14%" },
            ]}
          >
            <Text
              style={[
                styles.tableHeaderText,
                styles.center,
              ]}
            >
              Бал
            </Text>
          </View>

          <View
            style={[
              styles.tableCell,
              { width: "14%" },
            ]}
          >
            <Text
              style={[
                styles.tableHeaderText,
                styles.center,
              ]}
            >
              Виконано
            </Text>
          </View>

          <View
            style={[
              styles.tableCell,
              { width: "14%" },
            ]}
          >
            <Text
              style={[
                styles.tableHeaderText,
                styles.center,
              ]}
            >
              Не виконано
            </Text>
          </View>

          <View
            style={[
              styles.tableCell,
              { width: "25%" },
            ]}
          >
            <Text
              style={[
                styles.tableHeaderText,
                styles.center,
              ]}
            >
              Складність
            </Text>
          </View>
        </View>

        {questions.map(
          (question) => (
            <View
              key={question.id}
              style={styles.tableRow}
              wrap={false}
            >
              <View
                style={[
                  styles.tableCell,
                  { width: "6%" },
                ]}
              >
                <Text
                  style={[
                    styles.tableCellText,
                    styles.center,
                  ]}
                >
                  {question.order}
                </Text>
              </View>

              <View
                style={[
                  styles.tableCell,
                  { width: "27%" },
                ]}
              >
                <Text
                  style={styles.tableCellText}
                >
                  {getQuestionTypeLabel(
                    question.type
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.tableCell,
                  { width: "14%" },
                ]}
              >
                <Text
                  style={[
                    styles.tableCellText,
                    styles.center,
                  ]}
                >
                  {question.points}
                </Text>
              </View>

              <View
                style={[
                  styles.tableCell,
                  { width: "14%" },
                ]}
              >
                <Text
                  style={[
                    styles.tableCellText,
                    styles.center,
                  ]}
                >
                  {formatPercent(
                    question.correctPercent
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.tableCell,
                  { width: "14%" },
                ]}
              >
                <Text
                  style={[
                    styles.tableCellText,
                    styles.center,
                  ]}
                >
                  {formatPercent(
                    question.skippedPercent
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.tableCell,
                  styles.tableCellLast,
                  {
                    width: "25%",
                    backgroundColor:
                      getDifficultyColor(
                        question.difficulty
                      ),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tableCellText,
                    styles.center,
                  ]}
                >
                  {question.difficulty}
                </Text>
              </View>
            </View>
          )
        )}
      </View>
    </>
  );
}

// =====================================================
// OPTION LETTER
// =====================================================

function getOptionLetter(
  question: QuestionData,
  option: AnswerOptionData
): string {
  const visibleOptions =
    question.answerOptions.filter(
      (item) =>
        !item.text.startsWith(
          "L|"
        ) &&
        !item.text.startsWith(
          "R|"
        )
    );

  const index =
    visibleOptions.findIndex(
      (item) =>
        item.id === option.id
    );

  if (index < 0) {
    return "";
  }

  return getLetter(index);
}

// =====================================================
// MATCHING / SCORE DISTRIBUTION
// =====================================================

function MatchingDistribution({
  psychometrics,
}: {
  psychometrics: QuestionPsychometrics;
}) {
  const distribution =
    psychometrics.scoreDistribution ??
    [];

  if (distribution.length === 0) {
    return null;
  }

  return (
    <View
      style={styles.scoreDistribution}
    >
      <Text
        style={
          styles.scoreDistributionTitle
        }
      >
        Розподіл учасників за набраними балами
      </Text>

      {distribution.map(
        (item, index) => (
          <View
            style={
              styles.scoreDistributionRow
            }
            key={`${item.score}-${index}`}
          >
            <View
              style={[
                styles.scoreDistributionCell,
                { width: "35%" },
              ]}
            >
              <Text
                style={
                  styles.tableCellText
                }
              >
                {item.score.toFixed(2)} бал.
              </Text>
            </View>

            <View
              style={[
                styles.scoreDistributionCell,
                { width: "30%" },
              ]}
            >
              <Text
                style={
                  styles.tableCellText
                }
              >
                {item.count} уч.
              </Text>
            </View>

            <View
              style={[
                styles.scoreDistributionCell,
                {
                  width: "35%",
                  borderRightWidth: 0,
                },
              ]}
            >
              <Text
                style={
                  styles.tableCellText
                }
              >
                {formatPercent(
                  item.percent
                )}
              </Text>
            </View>
          </View>
        )
      )}
    </View>
  );
}

// =====================================================
// OFFICIAL PSYCHOMETRIC TABLE
//
// Структура:
// Ключ |
// Відповіді учасників (%) |
// Не виконали завдання (%) |
// Складність (P-value) |
// Дискримінація (D-index) |
// Кореляція (Rit)
//
// Для SINGLE/MULTIPLE:
// A B C D ... під спільним заголовком
//
// Для MATCHING:
// замість A/B/C/D — розподіл за балами
//
// Для SEQUENCE:
// A/B/C/D ... не є розподілом,
// тому показуємо "—".
// =====================================================

function PsychometricTable({
  question,
}: {
  question: QuestionData;
}) {
  const psychometrics =
    question.psychometrics;

  const distribution =
    psychometrics.answerDistribution ??
    [];

  const isChoice =
    question.type === "single" ||
    question.type === "SINGLE" ||
    question.type === "multiple" ||
    question.type === "MULTIPLE";

  const isMatching =
    question.type === "matching" ||
    question.type === "MATCHING";

  const isSequence =
    question.type === "sequence" ||
    question.type === "SEQUENCE";

  const optionCount = Math.max(
    distribution.length,
    isChoice
      ? question.answerOptions.filter(
          (option) =>
            !option.text.startsWith(
              "L|"
            ) &&
            !option.text.startsWith(
              "R|"
            )
        ).length
      : 0
  );

  const answerColumns =
    isChoice
      ? Math.max(optionCount, 1)
      : isMatching
        ? 1
        : Math.max(
            optionCount,
            1
          );

  /*
   * Width calculation.
   *
   * Fixed columns:
   * Key                 11%
   * Skip                13%
   * P-value             11%
   * D-index             11%
   * Rit                 11%
   *
   * Remaining:
   * answer distribution.
   */
  const fixedWidth = 57;
  const answerWidth =
    (100 - fixedWidth) /
    answerColumns;

  return (
    <View
      style={styles.psychometricTable}
      wrap={false}
    >
      {/* ===============================
          HEADER ROW 1
          =============================== */}

      <View
        style={[
          styles.psychometricRow,
          styles.psychometricHeaderTop,
        ]}
      >
        {/* KEY */}

        <View
          style={[
            styles.psychometricCell,
            {
              width: "11%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricHeaderText
            }
          >
            Ключ
          </Text>
        </View>

        {/* ANSWER DISTRIBUTION */}

        <View
          style={[
            styles.psychometricCell,
            {
              width: `${100 - fixedWidth}%`,
            },
          ]}
        >
          <Text
            style={
              styles.psychometricHeaderText
            }
          >
            Відповіді учасників (%)
          </Text>
        </View>

        {/* SKIPPED */}

        <View
          style={[
            styles.psychometricCell,
            {
              width: "13%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricHeaderText
            }
          >
            Не виконали{"\n"}завдання (%)
          </Text>
        </View>

        {/* P-VALUE */}

        <View
          style={[
            styles.psychometricCell,
            {
              width: "11%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricHeaderText
            }
          >
            Складність{"\n"}
            (P-value)
          </Text>
        </View>

        {/* D-INDEX */}

        <View
          style={[
            styles.psychometricCell,
            {
              width: "11%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricHeaderText
            }
          >
            Дискримінація{"\n"}
            (D-index)
          </Text>
        </View>

        {/* RIT */}

        <View
          style={[
            styles.psychometricCell,
            styles.psychometricCellLast,
            {
              width: "11%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricHeaderText
            }
          >
            Кореляція{"\n"}
            (Rit)
          </Text>
        </View>
      </View>

      {/* ===============================
          HEADER ROW 2
          =============================== */}

      <View
        style={[
          styles.psychometricRow,
          styles.psychometricHeaderBottom,
        ]}
      >
        {/* KEY */}

        <View
          style={[
            styles.psychometricCell,
            {
              width: "11%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricHeaderText
            }
          >
            —
          </Text>
        </View>

        {/* A/B/C/D ... */}

        {isChoice &&
          Array.from({
            length: answerColumns,
          }).map((_, index) => {
            const item =
              distribution[index];

            return (
              <View
                key={index}
                style={[
                  styles.psychometricCell,
                  {
                    width: `${answerWidth}%`,
                  },
                ]}
              >
                <Text
                  style={
                    styles.psychometricHeaderText
                  }
                >
                  {item?.key ??
                    getLetter(index)}
                </Text>
              </View>
            );
          })}

        {isMatching && (
          <View
            style={[
              styles.psychometricCell,
              {
                width: `${answerWidth}%`,
              },
            ]}
          >
            <Text
              style={
                styles.psychometricHeaderText
              }
            >
              Розподіл за балами
            </Text>
          </View>
        )}

        {isSequence && (
          <View
            style={[
              styles.psychometricCell,
              {
                width: `${answerWidth}%`,
              },
            ]}
          >
            <Text
              style={
                styles.psychometricHeaderText
              }
            >
              —
            </Text>
          </View>
        )}

        {/* SKIPPED */}

        <View
          style={[
            styles.psychometricCell,
            {
              width: "13%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricHeaderText
            }
          >
            —
          </Text>
        </View>

        {/* P-VALUE */}

        <View
          style={[
            styles.psychometricCell,
            {
              width: "11%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricHeaderText
            }
          >
            —
          </Text>
        </View>

        {/* D-INDEX */}

        <View
          style={[
            styles.psychometricCell,
            {
              width: "11%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricHeaderText
            }
          >
            —
          </Text>
        </View>

        {/* RIT */}

        <View
          style={[
            styles.psychometricCell,
            styles.psychometricCellLast,
            {
              width: "11%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricHeaderText
            }
          >
            —
          </Text>
        </View>
      </View>

      {/* ===============================
          DATA ROW
          =============================== */}

      <View
        style={styles.psychometricRow}
      >
        {/* KEY */}

        <View
          style={[
            styles.psychometricCell,
            {
              width: "11%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricKeyText
            }
          >
            {psychometrics.key || "—"}
          </Text>
        </View>

        {/* DISTRIBUTION */}

        {isChoice &&
          Array.from({
            length: answerColumns,
          }).map((_, index) => {
            const item =
              distribution[index];

            return (
              <View
                key={index}
                style={[
                  styles.psychometricCell,
                  {
                    width: `${answerWidth}%`,
                  },
                ]}
              >
                <Text
                  style={
                    styles.psychometricText
                  }
                >
                  {item
                    ? formatPercent(
                        item.percent
                      )
                    : "0,0%"}
                </Text>
              </View>
            );
          })}

        {isMatching && (
          <View
            style={[
              styles.psychometricCell,
              {
                width: `${answerWidth}%`,
              },
            ]}
          >
            <Text
              style={
                styles.psychometricText
              }
            >
              {(
                psychometrics
                  .scoreDistribution ??
                []
              )
                .map(
                  (item) =>
                    `${item.score}: ${item.percent.toFixed(
                      1
                    )}%`
                )
                .join("\n") ||
                "—"}
            </Text>
          </View>
        )}

        {isSequence && (
          <View
            style={[
              styles.psychometricCell,
              {
                width: `${answerWidth}%`,
              },
            ]}
          >
            <Text
              style={
                styles.psychometricText
              }
            >
              —
            </Text>
          </View>
        )}

        {/* SKIPPED */}

        <View
          style={[
            styles.psychometricCell,
            {
              width: "13%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricText
            }
          >
            {formatPercent(
              psychometrics.skippedPercent
            )}
          </Text>
        </View>

        {/* P-VALUE */}

        <View
          style={[
            styles.psychometricCell,
            {
              width: "11%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricText
            }
          >
            {psychometrics.pValue ===
            null
              ? "—"
              : psychometrics.pValue.toFixed(
                  1
                )}
          </Text>
        </View>

        {/* D-INDEX */}

        <View
          style={[
            styles.psychometricCell,
            {
              width: "11%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricText
            }
          >
            {formatNumber(
              psychometrics.dIndex,
              2
            )}
          </Text>
        </View>

        {/* RIT */}

        <View
          style={[
            styles.psychometricCell,
            styles.psychometricCellLast,
            {
              width: "11%",
            },
          ]}
        >
          <Text
            style={
              styles.psychometricText
            }
          >
            {formatNumber(
              psychometrics.rit,
              3
            )}
          </Text>
        </View>
      </View>
    </View>
  );
}

// =====================================================
// ADVANCED QUESTION
// =====================================================

function AdvancedQuestion({
  question,
}: {
  question: QuestionData;
}) {
  return (
    <View
      style={styles.questionBlock}
      wrap
    >
      {/* QUESTION HEADER */}

      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>
          № {question.order}
        </Text>

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={styles.questionHeaderText}
          >
            {getQuestionTypeLabel(
              question.type
            )}
          </Text>

          <Text style={styles.questionType}>
            Максимальна кількість балів:{" "}
            {question.points}
          </Text>
        </View>
      </View>

      {/* CONDITION */}

      <Text style={styles.questionCondition}>
        {stripHtml(question.text)}
      </Text>

      {/* OPTIONS */}

      {question.answerOptions
        .filter(
          (option) =>
            !option.text.startsWith(
              "L|"
            ) &&
            !option.text.startsWith(
              "R|"
            )
        )
        .map((option) => {
          const letter =
            getOptionLetter(
              question,
              option
            );

          return (
            <View
              style={styles.optionRow}
              key={option.id}
            >
              <Text
                style={styles.optionLetter}
              >
                {letter}.
              </Text>

              <Text
                style={[
                  styles.optionText,
                  option.isCorrect
                    ? styles.correctOption
                    : {},
                ]}
              >
                {stripHtml(option.text)}
              </Text>
            </View>
          );
        })}

      {/* BASIC STATISTICS */}

      <View style={styles.questionStats}>
        <Text style={styles.questionStat}>
          Правильні:{" "}
          <Text
            style={
              styles.questionStatStrong
            }
          >
            {question.correct} (
            {formatPercent(
              question.correctPercent
            )}
            )
          </Text>
        </Text>

        <Text style={styles.questionStat}>
          Неправильні:{" "}
          <Text
            style={
              styles.questionStatStrong
            }
          >
            {question.incorrect} (
            {formatPercent(
              question.incorrectPercent
            )}
            )
          </Text>
        </Text>

        <Text style={styles.questionStat}>
          Не виконали:{" "}
          <Text
            style={
              styles.questionStatStrong
            }
          >
            {question.skipped} (
            {formatPercent(
              question.skippedPercent
            )}
            )
          </Text>
        </Text>
      </View>

      {/* PSYCHOMETRIC TABLE */}

      <PsychometricTable
        question={question}
      />

      {/* MATCHING EXTRA */}

      {(question.type ===
        "matching" ||
        question.type ===
          "MATCHING") && (
        <MatchingDistribution
          psychometrics={
            question.psychometrics
          }
        />
      )}

      {/* NOTE */}

      {question.psychometrics
        .insufficientData && (
        <Text
          style={styles.psychometricNote}
        >
          Примітка: для вибірки недостатньо
          даних для надійної інтерпретації
          окремих психометричних показників.
        </Text>
      )}
    </View>
  );
}

// =====================================================
// ADVANCED QUESTIONS
// =====================================================

function AdvancedQuestions({
  questions,
}: {
  questions: QuestionData[];
}) {
  return (
    <>
      <Text style={styles.sectionTitle}>
        Психометричні характеристики завдань
      </Text>

      {questions.map((question) => (
        <AdvancedQuestion
          key={question.id}
          question={question}
        />
      ))}
    </>
  );
}

// =====================================================
// PSYCHOMETRIC LEGEND
// =====================================================

function PsychometricLegend() {
  return (
    <View style={styles.legendBox}>
      <Text style={styles.legendTitle}>
        Пояснення показників
      </Text>

      <Text style={styles.legendText}>
        P-value — складність завдання,
        визначена як середня частка
        максимально можливого бала,
        отриманого учасниками, у відсотках.
      </Text>

      <Text style={styles.legendText}>
        D-index — різниця між середнім
        відсотком виконання завдання
        учасниками сильної та слабкої груп.
      </Text>

      <Text style={styles.legendText}>
        Rit — коефіцієнт кореляції між
        результатом виконання завдання
        та загальним результатом тесту.
      </Text>

      <Text style={styles.legendText}>
        «Не виконали завдання (%)» —
        частка учасників, які не надали
        відповіді на завдання.
      </Text>
    </View>
  );
}

// =====================================================
// DOCUMENT
// =====================================================

export default function AnalyticsPdfDocument({
  analytics,
  mode,
}: Props) {
  const isAdvanced =
    mode === "advanced";

  return (
    <Document
      title={`Аналітичний звіт — ${analytics.test.title}`}
      author="NMT Platform — Хорунжий Андрій Володимирович"
      subject="Аналітичний звіт результатів комп'ютерного тестування"
      creator="NMT Platform"
    >
      {/* =================================================
          GENERAL INFORMATION
          ================================================= */}

      <Page
        size="A4"
        style={styles.page}
        wrap
      >
        <Header />

        <GeneralInformation
          analytics={analytics}
        />

        {/* =================================================
            PARTICIPANTS
            ================================================= */}

        <ParticipantsTable
          participants={
            analytics.participants
          }
        />

        {/* =================================================
            DIFFICULTY
            ================================================= */}

        <DifficultyDistribution
          questions={
            analytics.questions
          }
        />

        {/* =================================================
            SIMPLE REPORT
            ================================================= */}

        {!isAdvanced && (
          <QuestionsSummaryTable
            questions={
              analytics.questions
            }
          />
        )}

        {/* =================================================
            ADVANCED REPORT
            ================================================= */}

        {isAdvanced && (
          <>
            <AdvancedQuestions
              questions={
                analytics.questions
              }
            />

            <PsychometricLegend />
          </>
        )}

        <Footer />
      </Page>
    </Document>
  );
}