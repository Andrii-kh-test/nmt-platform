import React from "react";
import fs from "fs";
import path from "path";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// =====================================================
// TYPES
// =====================================================

export type PdfMode = "summary" | "answers" | "full";

type AnswerOptionData = {
  id: number;
  order: number;
  text: string;
  isCorrect: boolean;
};

type QuestionData = {
  id: number;
  type: string;
  text: string;
  points: number;
  answerOptions: AnswerOptionData[];
};

type TestQuestionData = {
  id: number;
  order: number;
  question: QuestionData;
};

type TestData = {
  id: number;
  title: string;
  subject: string;
  schoolYear: string;
  duration: number;
  maxPoints: number;
  questions: TestQuestionData[];
};

type ResultData = {
  id: number;
  testId: number;
  earnedPoints: number;
  maxPoints: number;
  percent: number;
  correct: number;
  incorrect: number;
  skipped: number;
  timeSpent: number;
  answers: unknown;
  finishReason: string;
  createdAt: Date;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  accessCode: string | null;
  finishedAt: Date | null;
  startedAt: Date | null;
  sessionId: number | null;
  test: TestData;
};

type Props = {
  result: ResultData;
  mode: PdfMode;
};

// =====================================================
// CONSTANTS
// =====================================================

const BURGUNDY = "#7A1F2B";
const DARK = "#202020";
const GRAY = "#666666";
const LIGHT_GRAY = "#E5E5E5";
const VERY_LIGHT_GRAY = "#F6F6F6";
const WHITE = "#FFFFFF";
const GREEN = "#287A45";
const RED = "#A83232";

// =====================================================
// FONT
// =====================================================

const fontRegularPath = path.join(
  process.cwd(),
  "public",
  "branding",
  "noto-sans-regular.ttf"
);

const fontBoldPath = path.join(
  process.cwd(),
  "public",
  "branding",
  "noto-sans-bold.ttf"
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

function stripHtml(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatDate(date: Date | null): string {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString("uk-UA", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}`;
}

function getParticipantName(result: ResultData): string {
  return [
    result.lastName,
    result.firstName,
    result.middleName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || "Не вказано";
}

function getFinishReason(reason: string): string {
  switch (reason) {
    case "manual":
      return "Завершено учасником";

    case "timeout":
      return "Час вичерпано";

    case "security":
      return "Завершено через порушення умов тестування";

    default:
      return reason || "Не визначено";
  }
}

function getSavedAnswers(
  answers: unknown,
  questionId: number
): number[] {
  if (!answers || typeof answers !== "object") {
    return [];
  }

  const source = answers as Record<string, unknown>;
  const value = source[String(questionId)];

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
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

function isSelected(
  selectedAnswers: number[],
  optionId: number
): boolean {
  return selectedAnswers.includes(optionId);
}

function isQuestionCorrect(
  question: QuestionData,
  selectedAnswers: number[]
): boolean {
  const correctIds = question.answerOptions
    .filter((option) => option.isCorrect)
    .map((option) => option.id)
    .sort((a, b) => a - b);

  const selectedIds = [...selectedAnswers].sort((a, b) => a - b);

  if (correctIds.length !== selectedIds.length) {
    return false;
  }

  return correctIds.every(
    (id, index) => id === selectedIds[index]
  );
}

// =====================================================
// MATCHING
// =====================================================

type MatchingLeft = {
  id: number;
  text: string;
  correctRightId: number;
};

type MatchingRight = {
  id: number;
  text: string;
};

function getMatchingData(question: QuestionData): {
  left: MatchingLeft[];
  right: MatchingRight[];
} {
  const left: MatchingLeft[] = [];
  const right: MatchingRight[] = [];

  for (const option of question.answerOptions) {
    const text = option.text ?? "";

    if (text.startsWith("L|")) {
      const parts = text.split("|");

      left.push({
        id: Number(parts[1]),
        text: parts[2] ?? "",
        correctRightId: Number(parts[3]),
      });
    }

    if (text.startsWith("R|")) {
      const parts = text.split("|");

      right.push({
        id: Number(parts[1]),
        text: parts.slice(2).join("|"),
      });
    }
  }

  return {
    left,
    right,
  };
}

function getMatchingStatus(
  question: QuestionData,
  selectedAnswers: number[]
): {
  total: number;
  correct: number;
} {
  const { left } = getMatchingData(question);

  let correct = 0;

  for (let index = 0; index < left.length; index++) {
    const selectedRightId = selectedAnswers[index];

    if (
      selectedRightId !== undefined &&
      selectedRightId === left[index].correctRightId
    ) {
      correct++;
    }
  }

  return {
    total: left.length,
    correct,
  };
}

function isMatchingQuestion(question: QuestionData): boolean {
  const normalizedType = String(question.type ?? "")
    .toLowerCase()
    .trim();

  return (
    normalizedType.includes("matching") ||
    (normalizedType.includes("відповід") &&
      normalizedType.includes("відповідність"))
  );
}

// =====================================================
// SIGNATURE
// =====================================================

function getSignatureData(): string | null {
  const signaturePath = path.join(
    process.cwd(),
    "public",
    "branding",
    "signature.png"
  );

  if (!fs.existsSync(signaturePath)) {
    return null;
  }

  try {
    const buffer = fs.readFileSync(signaturePath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 78,
    paddingHorizontal: 42,
    fontFamily: "NotoSans",
    fontSize: 9,
    color: DARK,
    backgroundColor: WHITE,
  },

  header: {
    marginBottom: 22,
  },

  headerLine: {
    height: 4,
    backgroundColor: BURGUNDY,
    marginBottom: 10,
    borderRadius: 2,
  },

  headerBrand: {
    fontSize: 17,
    fontWeight: 700,
    color: BURGUNDY,
    marginBottom: 3,
  },

  headerTitle: {
    fontSize: 9.5,
    fontWeight: 700,
    color: DARK,
    letterSpacing: 0.3,
  },

  footer: {
    position: "absolute",
    bottom: 25,
    left: 42,
    right: 42,
    borderTopWidth: 0.7,
    borderTopColor: LIGHT_GRAY,
    paddingTop: 8,
  },

  footerMain: {
    fontSize: 7.8,
    fontWeight: 700,
    color: BURGUNDY,
    marginBottom: 3,
  },

  footerRole: {
    fontSize: 6.1,
    lineHeight: 1.25,
    color: "#777777",
    marginBottom: 5,
  },

  signatureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },

  signature: {
    width: 95,
    height: 32,
    objectFit: "contain",
  },

  footerContact: {
    fontSize: 6.2,
    color: "#777777",
    marginTop: 1,
  },

  pageNumber: {
    position: "absolute",
    right: 42,
    bottom: 10,
    fontSize: 7,
    color: "#888888",
  },

  mainHeading: {
    fontSize: 15,
    fontWeight: 700,
    color: BURGUNDY,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    color: BURGUNDY,
    marginBottom: 8,
    marginTop: 14,
  },

  infoBox: {
    borderWidth: 0.7,
    borderColor: LIGHT_GRAY,
    borderRadius: 5,
    padding: 10,
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: "row",
    marginBottom: 5,
  },

  infoRowLast: {
    flexDirection: "row",
  },

  infoLabel: {
    width: 125,
    color: GRAY,
    fontSize: 8.5,
  },

  infoValue: {
    flex: 1,
    fontWeight: 700,
    fontSize: 8.5,
  },

  statsContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },

  statBox: {
    flex: 1,
    borderWidth: 0.7,
    borderColor: LIGHT_GRAY,
    borderRadius: 5,
    padding: 8,
    alignItems: "center",
  },

  statValue: {
    fontSize: 13,
    fontWeight: 700,
    color: BURGUNDY,
    marginBottom: 2,
  },

  statLabel: {
    fontSize: 7,
    color: GRAY,
    textAlign: "center",
  },

  table: {
    width: "100%",
    borderWidth: 0.7,
    borderColor: LIGHT_GRAY,
    marginBottom: 14,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: BURGUNDY,
    color: WHITE,
    minHeight: 24,
    alignItems: "center",
  },

  tableHeaderCell: {
    color: WHITE,
    fontSize: 7.5,
    fontWeight: 700,
    paddingHorizontal: 5,
    paddingVertical: 5,
  },

  tableRow: {
    flexDirection: "row",
    minHeight: 24,
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_GRAY,
    alignItems: "center",
  },

  tableRowAlt: {
    flexDirection: "row",
    minHeight: 24,
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_GRAY,
    alignItems: "center",
    backgroundColor: VERY_LIGHT_GRAY,
  },

  tableCell: {
    fontSize: 7.5,
    paddingHorizontal: 5,
    paddingVertical: 4,
  },

  colNumber: {
    width: 38,
  },

  colAnswer: {
    flex: 1,
  },

  colCorrect: {
    flex: 1,
  },

  correctText: {
    color: GREEN,
    fontWeight: 700,
  },

  incorrectText: {
    color: RED,
    fontWeight: 700,
  },

  skippedText: {
    color: GRAY,
  },

  questionBlock: {
    borderWidth: 0.7,
    borderColor: LIGHT_GRAY,
    borderRadius: 5,
    marginBottom: 10,
    padding: 10,
  },

  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  questionNumber: {
    fontSize: 9.5,
    fontWeight: 700,
    color: BURGUNDY,
  },

  questionPoints: {
    fontSize: 7.5,
    color: GRAY,
  },

  questionText: {
    fontSize: 8.5,
    lineHeight: 1.4,
    marginBottom: 8,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
    borderTopWidth: 0.4,
    borderTopColor: "#EEEEEE",
  },

  optionLetter: {
    width: 20,
    fontSize: 8,
    fontWeight: 700,
  },

  optionText: {
    flex: 1,
    fontSize: 8,
    lineHeight: 1.35,
  },

  selectedTag: {
    fontSize: 6.5,
    color: BURGUNDY,
    fontWeight: 700,
    marginLeft: 5,
  },

  correctTag: {
    fontSize: 6.5,
    color: GREEN,
    fontWeight: 700,
    marginLeft: 5,
  },

  answerLine: {
    flexDirection: "row",
    marginTop: 7,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_GRAY,
  },

  answerLabel: {
    width: 120,
    fontSize: 7.5,
    color: GRAY,
  },

  answerValue: {
    flex: 1,
    fontSize: 7.5,
    fontWeight: 700,
  },

  matchingTable: {
    width: "100%",
    borderWidth: 0.6,
    borderColor: LIGHT_GRAY,
    marginTop: 5,
  },

  matchingHeader: {
    flexDirection: "row",
    backgroundColor: BURGUNDY,
  },

  matchingHeaderCell: {
    color: WHITE,
    fontSize: 7.5,
    fontWeight: 700,
    padding: 5,
  },

  matchingRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_GRAY,
  },

  matchingCell: {
    width: "50%",
    fontSize: 7.5,
    padding: 5,
    lineHeight: 1.3,
  },

  matchingCellCorrect: {
    width: "50%",
    fontSize: 7.5,
    padding: 5,
    lineHeight: 1.3,
    color: GREEN,
    fontWeight: 700,
  },

  matchingCellIncorrect: {
    width: "50%",
    fontSize: 7.5,
    padding: 5,
    lineHeight: 1.3,
    color: RED,
  },

  conditionLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: GRAY,
    marginBottom: 3,
  },

  conditionText: {
    fontSize: 8,
    lineHeight: 1.4,
    marginBottom: 8,
  },

  muted: {
    color: GRAY,
  },

  small: {
    fontSize: 7,
  },
});

// =====================================================
// HEADER
// =====================================================

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.headerLine} />

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
  const signature = getSignatureData();

  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerMain}>
        Автор &quot;NMT Platform&quot; Хорунжий Андрій Володимирович
      </Text>

      <Text style={styles.footerRole}>
        Учитель української мови та літератури Комунального закладу
        «Харківський ліцей № 5 Харківської міської ради», методист
        Комунального закладу «Харківська обласна Мала академія наук»
      </Text>

      <View style={styles.signatureRow}>
        {signature ? (
          <Image
            src={signature}
            style={styles.signature}
          />
        ) : null}
      </View>

      <Text style={styles.footerContact}>
        У разі виникнення технічних проблем звертайтеся на
        ahorunzij81@gmail.com
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
// GENERAL INFO
// =====================================================

function GeneralInfo({
  result,
}: {
  result: ResultData;
}) {
  return (
    <>
      <Text style={styles.mainHeading}>
        {result.test.title}
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.sectionTitle}>
          Загальна інформація
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Учасник
          </Text>

          <Text style={styles.infoValue}>
            {getParticipantName(result)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Тест
          </Text>

          <Text style={styles.infoValue}>
            {result.test.title}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Предмет
          </Text>

          <Text style={styles.infoValue}>
            {result.test.subject || "—"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Навчальний рік
          </Text>

          <Text style={styles.infoValue}>
            {result.test.schoolYear || "—"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Дата початку
          </Text>

          <Text style={styles.infoValue}>
            {formatDate(result.startedAt)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Дата завершення
          </Text>

          <Text style={styles.infoValue}>
            {formatDate(result.finishedAt)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Час виконання
          </Text>

          <Text style={styles.infoValue}>
            {formatDuration(result.timeSpent)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Причина завершення
          </Text>

          <Text style={styles.infoValue}>
            {getFinishReason(result.finishReason)}
          </Text>
        </View>

        <View style={styles.infoRowLast}>
          <Text style={styles.infoLabel}>
            Код учасника
          </Text>

          <Text style={styles.infoValue}>
            {result.accessCode || "—"}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Результат
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {result.earnedPoints} / {result.maxPoints}
          </Text>

          <Text style={styles.statLabel}>
            Набрані бали
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {result.percent}%
          </Text>

          <Text style={styles.statLabel}>
            Результативність
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {result.correct}
          </Text>

          <Text style={styles.statLabel}>
            Правильних
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {result.incorrect}
          </Text>

          <Text style={styles.statLabel}>
            Неправильних
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {result.skipped}
          </Text>

          <Text style={styles.statLabel}>
            Пропущених
          </Text>
        </View>
      </View>
    </>
  );
}

// =====================================================
// ANSWERS TABLE
// =====================================================

function AnswersTable({
  result,
}: {
  result: ResultData;
}) {
  return (
    <>
      <Text style={styles.sectionTitle}>
        Журнал відповідей
      </Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text
            style={[
              styles.tableHeaderCell,
              styles.colNumber,
            ]}
          >
            Завдання
          </Text>

          <Text
            style={[
              styles.tableHeaderCell,
              styles.colAnswer,
            ]}
          >
            Відповідь учасника
          </Text>

          <Text
            style={[
              styles.tableHeaderCell,
              styles.colCorrect,
            ]}
          >
            Правильна відповідь
          </Text>
        </View>

        {result.test.questions.map((testQuestion, index) => {
          const question = testQuestion.question;
          const selectedAnswers = getSavedAnswers(
            result.answers,
            question.id
          );

          const matching = isMatchingQuestion(question);

          let participantAnswer = "—";
          let correctAnswer = "—";
          let correct = false;

          if (matching) {
            const { left, right } =
              getMatchingData(question);

            participantAnswer = left
              .map((item, leftIndex) => {
                const selectedRightId =
                  selectedAnswers[leftIndex];

                const selectedRight = right.find(
                  (itemRight) =>
                    itemRight.id === selectedRightId
                );

                return selectedRight
                  ? `${getLetter(leftIndex)} → ${selectedRight.text}`
                  : `${getLetter(leftIndex)} → —`;
              })
              .join("; ");

            correctAnswer = left
              .map((item, leftIndex) => {
                const correctRight = right.find(
                  (itemRight) =>
                    itemRight.id === item.correctRightId
                );

                return correctRight
                  ? `${getLetter(leftIndex)} → ${correctRight.text}`
                  : `${getLetter(leftIndex)} → —`;
              })
              .join("; ");

            const matchingStatus =
              getMatchingStatus(
                question,
                selectedAnswers
              );

            correct =
              matchingStatus.total > 0 &&
              matchingStatus.correct ===
                matchingStatus.total;
          } else {
            const selectedOptions =
              question.answerOptions.filter(
                (option) =>
                  selectedAnswers.includes(option.id)
              );

            const correctOptions =
              question.answerOptions.filter(
                (option) => option.isCorrect
              );

            participantAnswer =
              selectedOptions.length > 0
                ? selectedOptions
                    .map(
                      (option) =>
                        `${getLetter(option.order - 1)}`
                    )
                    .join(", ")
                : "—";

            correctAnswer =
              correctOptions.length > 0
                ? correctOptions
                    .map(
                      (option) =>
                        `${getLetter(option.order - 1)}`
                    )
                    .join(", ")
                : "—";

            correct = isQuestionCorrect(
              question,
              selectedAnswers
            );
          }

          const rowStyle =
            index % 2 === 0
              ? styles.tableRow
              : styles.tableRowAlt;

          return (
            <View
              key={testQuestion.id}
              style={rowStyle}
            >
              <Text
                style={[
                  styles.tableCell,
                  styles.colNumber,
                ]}
              >
                {index + 1}
              </Text>

              <Text
                style={[
                  styles.tableCell,
                  styles.colAnswer,
                  correct
                    ? styles.correctText
                    : participantAnswer === "—"
                    ? styles.skippedText
                    : styles.incorrectText,
                ]}
              >
                {participantAnswer}
              </Text>

              <Text
                style={[
                  styles.tableCell,
                  styles.colCorrect,
                  styles.correctText,
                ]}
              >
                {correctAnswer}
              </Text>
            </View>
          );
        })}
      </View>
    </>
  );
}

// =====================================================
// ORDINARY QUESTION
// =====================================================

function OrdinaryQuestion({
  question,
  number,
  selectedAnswers,
}: {
  question: QuestionData;
  number: number;
  selectedAnswers: number[];
}) {
  const correct = isQuestionCorrect(
    question,
    selectedAnswers
  );

  return (
    <View style={styles.questionBlock} wrap={false}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>
          Завдання {number}
        </Text>

        <Text style={styles.questionPoints}>
          {question.points} б.
        </Text>
      </View>

      <Text style={styles.conditionLabel}>
        Умова
      </Text>

      <Text style={styles.conditionText}>
        {stripHtml(question.text)}
      </Text>

      {question.answerOptions.map(
        (option, index) => {
          const optionSelected =
            isSelected(
              selectedAnswers,
              option.id
            );

          return (
            <View
              key={option.id}
              style={styles.optionRow}
            >
              <Text style={styles.optionLetter}>
                {getLetter(index)}.
              </Text>

              <Text style={styles.optionText}>
                {stripHtml(option.text)}
              </Text>

              {optionSelected ? (
                <Text
                  style={
                    styles.selectedTag
                  }
                >
                  Відповідь учасника
                </Text>
              ) : null}

              {option.isCorrect ? (
                <Text
                  style={
                    styles.correctTag
                  }
                >
                  Правильна
                </Text>
              ) : null}
            </View>
          );
        }
      )}

      <View style={styles.answerLine}>
        <Text style={styles.answerLabel}>
          Обрано:
        </Text>

        <Text style={styles.answerValue}>
          {selectedAnswers.length > 0
            ? question.answerOptions
                .map(
                  (option, index) =>
                    isSelected(
                      selectedAnswers,
                      option.id
                    )
                      ? getLetter(index)
                      : null
                )
                .filter(Boolean)
                .join(", ")
            : "—"}
        </Text>
      </View>

      <View style={styles.answerLine}>
        <Text style={styles.answerLabel}>
          Правильна відповідь:
        </Text>

        <Text
          style={[
            styles.answerValue,
            styles.correctText,
          ]}
        >
          {question.answerOptions
            .map(
              (option, index) =>
                option.isCorrect
                  ? getLetter(index)
                  : null
            )
            .filter(Boolean)
            .join(", ") || "—"}
        </Text>
      </View>

      <View style={styles.answerLine}>
        <Text style={styles.answerLabel}>
          Результат:
        </Text>

        <Text
          style={[
            styles.answerValue,
            correct
              ? styles.correctText
              : styles.incorrectText,
          ]}
        >
          {correct
            ? "Правильно"
            : selectedAnswers.length === 0
            ? "Не виконано"
            : "Неправильно"}
        </Text>
      </View>
    </View>
  );
}

// =====================================================
// MATCHING QUESTION
// =====================================================

function MatchingQuestion({
  question,
  number,
  selectedAnswers,
}: {
  question: QuestionData;
  number: number;
  selectedAnswers: number[];
}) {
  const { left, right } =
    getMatchingData(question);

  const status = getMatchingStatus(
    question,
    selectedAnswers
  );

  return (
    <View style={styles.questionBlock} wrap={false}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>
          Завдання {number}
        </Text>

        <Text style={styles.questionPoints}>
          {question.points} б.
        </Text>
      </View>

      <Text style={styles.conditionLabel}>
        Умова
      </Text>

      <Text style={styles.conditionText}>
        {stripHtml(question.text)}
      </Text>

      <View style={styles.matchingTable}>
        <View style={styles.matchingHeader}>
          <Text
            style={[
              styles.matchingHeaderCell,
              {
                width: "50%",
              },
            ]}
          >
            Елемент
          </Text>

          <Text
            style={[
              styles.matchingHeaderCell,
              {
                width: "50%",
              },
            ]}
          >
            Відповідь учасника
          </Text>
        </View>

        {left.map((item, index) => {
          const selectedRightId =
            selectedAnswers[index];

          const selectedRight =
            right.find(
              (rightItem) =>
                rightItem.id ===
                selectedRightId
            );

          const correctRight =
            right.find(
              (rightItem) =>
                rightItem.id ===
                item.correctRightId
            );

          const pairCorrect =
            selectedRightId !== undefined &&
            selectedRightId ===
              item.correctRightId;

          return (
            <View
              key={item.id}
              style={styles.matchingRow}
            >
              <Text
                style={styles.matchingCell}
              >
                {getLetter(index)}.{" "}
                {stripHtml(item.text)}
              </Text>

              <Text
                style={
                  pairCorrect
                    ? styles.matchingCellCorrect
                    : styles.matchingCellIncorrect
                }
              >
                {selectedRight
                  ? stripHtml(
                      selectedRight.text
                    )
                  : "—"}
              </Text>

              <Text
                style={{
                  position: "absolute",
                  right: 5,
                  top: 5,
                  fontSize: 6,
                  color: GRAY,
                }}
              >
                {pairCorrect
                  ? "✓"
                  : "Правильно: " +
                    (correctRight
                      ? stripHtml(
                          correctRight.text
                        )
                      : "—")}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.answerLine}>
        <Text style={styles.answerLabel}>
          Правильних пар:
        </Text>

        <Text style={styles.answerValue}>
          {status.correct} / {status.total}
        </Text>
      </View>
    </View>
  );
}

// =====================================================
// FULL QUESTIONS
// =====================================================

function FullQuestions({
  result,
}: {
  result: ResultData;
}) {
  return (
    <>
      <Text style={styles.sectionTitle}>
        Завдання та відповіді
      </Text>

      {result.test.questions.map(
        (testQuestion, index) => {
          const question =
            testQuestion.question;

          const selectedAnswers =
            getSavedAnswers(
              result.answers,
              question.id
            );

          if (
            isMatchingQuestion(question)
          ) {
            return (
              <MatchingQuestion
                key={testQuestion.id}
                question={question}
                number={index + 1}
                selectedAnswers={
                  selectedAnswers
                }
              />
            );
          }

          return (
            <OrdinaryQuestion
              key={testQuestion.id}
              question={question}
              number={index + 1}
              selectedAnswers={
                selectedAnswers
              }
            />
          );
        }
      )}
    </>
  );
}

// =====================================================
// DOCUMENT
// =====================================================

export default function ResultPdfDocument({
  result,
  mode,
}: Props) {
  return (
    <Document
      title={`Результат тестування — ${getParticipantName(
        result
      )}`}
      author='NMT Platform'
      subject={result.test.title}
      creator="NMT Platform"
      producer="NMT Platform"
    >
      <Page
        size="A4"
        style={styles.page}
        wrap
      >
        <Header />

        {mode === "summary" ? (
          <>
            <Text style={styles.mainHeading}>
              РЕЗУЛЬТАТ ТЕСТУВАННЯ
            </Text>

            <GeneralInfo
              result={result}
            />
          </>
        ) : null}

        {mode === "answers" ? (
          <>
            <Text style={styles.mainHeading}>
              ЖУРНАЛ ВІДПОВІДЕЙ
            </Text>

            <GeneralInfo
              result={result}
            />

            <AnswersTable
              result={result}
            />
          </>
        ) : null}

        {mode === "full" ? (
          <>
            <Text style={styles.mainHeading}>
              ПОВНИЙ РЕЗУЛЬТАТ
            </Text>

            <GeneralInfo
              result={result}
            />

            <AnswersTable
              result={result}
            />

            <FullQuestions
              result={result}
            />
          </>
        ) : null}

        <Footer />
      </Page>
    </Document>
  );
}