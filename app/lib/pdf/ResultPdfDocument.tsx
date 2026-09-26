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
const BURGUNDY_DARK = "#641923";
const DARK = "#202020";
const GRAY = "#666666";
const LIGHT_GRAY = "#E5E5E5";
const VERY_LIGHT_GRAY = "#F7F7F7";
const WHITE = "#FFFFFF";
const GREEN = "#287A45";
const RED = "#A83232";
const GOLD = "#B38B35";

// =====================================================
// FONT
// =====================================================

const brandingPath = path.join(
  process.cwd(),
  "public",
  "branding"
);

const fontRegularPath = path.join(
  brandingPath,
  "noto-sans-regular.woff"
);

const fontBoldPath = path.join(
  brandingPath,
  "noto-sans-bold.woff"
);

const fontItalicPath = path.join(
  brandingPath,
  "noto-sans-italic.woff"
);

/*
 * Якщо окремого italic-файлу немає, використовуємо
 * regular/bold як fallback.
 *
 * Головне — react-pdf отримує коректну пару
 * fontWeight + fontStyle і більше не падає
 * на:
 *
 * Could not resolve font for NotoSans,
 * fontWeight 700, fontStyle italic
 */
const resolvedItalicPath = fs.existsSync(fontItalicPath)
  ? fontItalicPath
  : fontRegularPath;

Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: fontRegularPath,
      fontWeight: 400,
      fontStyle: "normal",
    },
    {
      src: fontBoldPath,
      fontWeight: 700,
      fontStyle: "normal",
    },
    {
      src: resolvedItalicPath,
      fontWeight: 400,
      fontStyle: "italic",
    },
    {
      src: fs.existsSync(fontItalicPath)
        ? fontItalicPath
        : fontBoldPath,
      fontWeight: 700,
      fontStyle: "italic",
    },
  ],
});

// =====================================================
// HELPERS
// =====================================================

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
}

function stripHtml(
  value: string | null | undefined
): string {
  if (!value) {
    return "";
  }

  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
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
    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;
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

  const selectedIds = [...selectedAnswers].sort(
    (a, b) => a - b
  );

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

function isMatchingQuestion(
  question: QuestionData
): boolean {
  const normalizedType = String(
    question.type ?? ""
  )
    .toLowerCase()
    .trim();

  return (
    normalizedType.includes("matching") ||
    normalizedType.includes("відповідність")
  );
}

// =====================================================
// ANSWER LETTERS
// =====================================================

function getOrdinaryAnswerLetters(
  question: QuestionData,
  selectedAnswers: number[]
): string {
  return question.answerOptions
    .map((option, index) =>
      isSelected(selectedAnswers, option.id)
        ? getLetter(index)
        : null
    )
    .filter(Boolean)
    .join("");
}

function getCorrectOrdinaryAnswerLetters(
  question: QuestionData
): string {
  return question.answerOptions
    .map((option, index) =>
      option.isCorrect ? getLetter(index) : null
    )
    .filter(Boolean)
    .join("");
}

function getMatchingAnswerLetters(
  question: QuestionData,
  selectedAnswers: number[]
): string {
  const { left, right } =
    getMatchingData(question);

  return left
    .map((_, index) => {
      const selectedRightId = selectedAnswers[index];

      if (selectedRightId === undefined) {
        return "—";
      }

      const rightIndex = right.findIndex(
        (item) => item.id === selectedRightId
      );

      return rightIndex >= 0
        ? getLetter(rightIndex)
        : "—";
    })
    .join("");
}

function getMatchingCorrectAnswerLetters(
  question: QuestionData
): string {
  const { left, right } =
    getMatchingData(question);

  return left
    .map((item) => {
      const rightIndex = right.findIndex(
        (rightItem) =>
          rightItem.id === item.correctRightId
      );

      return rightIndex >= 0
        ? getLetter(rightIndex)
        : "—";
    })
    .join("");
}

// =====================================================
// EARNED POINTS
// =====================================================

function getEarnedPoints(
  question: QuestionData,
  selectedAnswers: number[]
): number {
  if (isMatchingQuestion(question)) {
    const status = getMatchingStatus(
      question,
      selectedAnswers
    );

    if (status.total === 0) {
      return 0;
    }

    return Math.round(
      (question.points * status.correct) /
        status.total
    );
  }

  return isQuestionCorrect(
    question,
    selectedAnswers
  )
    ? question.points
    : 0;
}

// =====================================================
// HTML PARSER
// =====================================================

type InlineStyle = {
  fontWeight?: 400 | 700;
  fontStyle?: "normal" | "italic";
  textDecoration?:
    | "none"
    | "underline"
    | "line-through";
  backgroundColor?: string;
  color?: string;
};

type HtmlNode =
  | {
      type: "root";
      children: HtmlNode[];
    }
  | {
      type: "element";
      tag: string;
      attrs: Record<string, string>;
      children: HtmlNode[];
    }
  | {
      type: "text";
      text: string;
    };

function parseAttributes(
  source: string
): Record<string, string> {
  const attrs: Record<string, string> = {};

  const regex =
    /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(source)) !== null) {
    const name = match[1].toLowerCase();
    const value =
      match[2] ??
      match[3] ??
      match[4] ??
      "";

    attrs[name] = decodeHtml(value);
  }

  return attrs;
}

function parseHtml(
  html: string | null | undefined
): HtmlNode {
  const root: HtmlNode = {
    type: "root",
    children: [],
  };

  if (!html) {
    return root;
  }

  const stack: Array<
    Extract<HtmlNode, { type: "element" }>
  > = [];

  const getCurrentChildren = () => {
    if (stack.length > 0) {
      return stack[stack.length - 1].children;
    }

    return root.children;
  };

  const tokenRegex =
    /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/g;

  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(html)) !== null) {
    const token = match[0];

    if (token.startsWith("<!--")) {
      continue;
    }

    if (token.startsWith("<")) {
      const closingMatch =
        token.match(/^<\s*\/\s*([a-zA-Z0-9]+)\s*>$/);

      if (closingMatch) {
        const closingTag =
          closingMatch[1].toLowerCase();

        for (
          let i = stack.length - 1;
          i >= 0;
          i--
        ) {
          if (
            stack[i].tag === closingTag
          ) {
            stack.length = i;
            break;
          }
        }

        continue;
      }

      const openingMatch =
        token.match(
          /^<\s*([a-zA-Z0-9]+)([\s\S]*?)\/?\s*>$/
        );

      if (!openingMatch) {
        continue;
      }

      const tag =
        openingMatch[1].toLowerCase();

      const attrs = parseAttributes(
        openingMatch[2] ?? ""
      );

      const node: Extract<
        HtmlNode,
        { type: "element" }
      > = {
        type: "element",
        tag,
        attrs,
        children: [],
      };

      getCurrentChildren().push(node);

      const selfClosing =
        /\/\s*>$/.test(token) ||
        [
          "br",
          "img",
          "hr",
          "meta",
          "link",
          "input",
        ].includes(tag);

      if (!selfClosing) {
        stack.push(node);
      }

      continue;
    }

    const text = decodeHtml(token);

    if (text) {
      getCurrentChildren().push({
        type: "text",
        text,
      });
    }
  }

  return root;
}

// =====================================================
// HTML STYLES
// =====================================================

function parseCss(
  css: string | undefined
): Record<string, string> {
  const result: Record<string, string> = {};

  if (!css) {
    return result;
  }

  css.split(";").forEach((declaration) => {
    const separator =
      declaration.indexOf(":");

    if (separator === -1) {
      return;
    }

    const property = declaration
      .slice(0, separator)
      .trim()
      .toLowerCase();

    const value = declaration
      .slice(separator + 1)
      .trim();

    if (property && value) {
      result[property] = value;
    }
  });

  return result;
}

function normalizeColor(
  value: string | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  if (
    /^#[0-9a-f]{3,8}$/i.test(trimmed)
  ) {
    return trimmed;
  }

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/i
  );

  if (rgbMatch) {
    const r = Number(rgbMatch[1])
      .toString(16)
      .padStart(2, "0");

    const g = Number(rgbMatch[2])
      .toString(16)
      .padStart(2, "0");

    const b = Number(rgbMatch[3])
      .toString(16)
      .padStart(2, "0");

    return `#${r}${g}${b}`;
  }

  const named: Record<string, string> = {
    yellow: "#FFF2A8",
    gold: "#FFD700",
    red: "#FF0000",
    blue: "#0000FF",
    green: "#008000",
    black: "#000000",
    white: "#FFFFFF",
  };

  return named[trimmed.toLowerCase()];
}

function getNodeInlineStyle(
  node: Extract<
    HtmlNode,
    { type: "element" }
  >,
  parent: InlineStyle
): InlineStyle {
  const style: InlineStyle = {
    ...parent,
  };

  const tag = node.tag;
  const css = parseCss(node.attrs.style);

  if (
    tag === "strong" ||
    tag === "b"
  ) {
    style.fontWeight = 700;
  }

  if (
    tag === "em" ||
    tag === "i"
  ) {
    style.fontStyle = "italic";
  }

  if (tag === "u") {
    style.textDecoration = "underline";
  }

  if (
    tag === "s" ||
    tag === "strike" ||
    tag === "del"
  ) {
    style.textDecoration =
      "line-through";
  }

  if (tag === "mark") {
    style.backgroundColor =
      normalizeColor(
        css["background-color"]
      ) ?? "#FFF2A8";
  }

  const fontWeight =
    css["font-weight"];

  if (
    fontWeight === "bold" ||
    fontWeight === "700" ||
    fontWeight === "800" ||
    fontWeight === "900"
  ) {
    style.fontWeight = 700;
  }

  const fontStyle =
    css["font-style"];

  if (
    fontStyle === "italic" ||
    fontStyle === "oblique"
  ) {
    style.fontStyle = "italic";
  }

  const textDecoration =
    css["text-decoration"] ??
    css["text-decoration-line"];

  if (textDecoration) {
    if (
      textDecoration.includes("underline")
    ) {
      style.textDecoration =
        "underline";
    } else if (
      textDecoration.includes(
        "line-through"
      )
    ) {
      style.textDecoration =
        "line-through";
    }
  }

  const background =
    css["background-color"] ??
    css["background"];

  if (background) {
    style.backgroundColor =
      normalizeColor(background);
  }

  const color = normalizeColor(
    css["color"]
  );

  if (color) {
    style.color = color;
  }

  return style;
}

// =====================================================
// IMAGE HELPERS
// =====================================================

function resolveImageSrc(
  src: string
): string | null {
  if (!src) {
    return null;
  }

  const normalized = src.trim();

  if (
    normalized.startsWith("data:image/")
  ) {
    return normalized;
  }

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return normalized;
  }

  if (normalized.startsWith("/")) {
    const filePath = path.join(
      process.cwd(),
      "public",
      normalized.replace(/^\/+/, "")
    );

    if (!fs.existsSync(filePath)) {
      return normalized;
    }

    try {
      const buffer =
        fs.readFileSync(filePath);

      const extension =
        path.extname(filePath).toLowerCase();

      const mime =
        extension === ".png"
          ? "image/png"
          : extension === ".webp"
          ? "image/webp"
          : extension === ".gif"
          ? "image/gif"
          : "image/jpeg";

      return `data:${mime};base64,${buffer.toString(
        "base64"
      )}`;
    } catch {
      return normalized;
    }
  }

  return normalized;
}

function parseDimension(
  value: string | undefined
): number | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(
    /([\d.]+)\s*(px|pt|%)?/i
  );

  if (!match) {
    return undefined;
  }

  const number = Number(match[1]);

  if (!Number.isFinite(number)) {
    return undefined;
  }

  if (match[2] === "%") {
    return undefined;
  }

  return number;
}

function getImageDimensions(
  node: Extract<
    HtmlNode,
    { type: "element" }
  >
): {
  width: number;
  height: number;
} {
  const css = parseCss(
    node.attrs.style
  );

  const width =
    parseDimension(
      node.attrs.width
    ) ??
    parseDimension(css.width);

  const height =
    parseDimension(
      node.attrs.height
    ) ??
    parseDimension(css.height);

  /*
   * Для зображень без заданого розміру
   * використовуємо безпечний розмір.
   */
  if (width && height) {
    return {
      width: Math.min(width, 470),
      height: Math.min(height, 320),
    };
  }

  if (width) {
    return {
      width: Math.min(width, 470),
      height: Math.min(
        Math.max(width * 0.6, 40),
        320
      ),
    };
  }

  if (height) {
    return {
      width: Math.min(
        Math.max(height * 1.6, 40),
        470
      ),
      height: Math.min(height, 320),
    };
  }

  return {
    width: 240,
    height: 120,
  };
}

// =====================================================
// HTML → PDF RENDERING
// =====================================================

function renderInlineNodes(
  nodes: HtmlNode[],
  parentStyle: InlineStyle = {}
): React.ReactNode[] {
  const result: React.ReactNode[] = [];

  nodes.forEach((node, index) => {
    if (node.type === "text") {
      if (!node.text) {
        return;
      }

      result.push(
        <Text
          key={`text-${index}`}
          style={parentStyle}
        >
          {node.text}
        </Text>
      );

      return;
    }

    if (node.type !== "element") {
      return;
    }

    const tag = node.tag;

    if (tag === "br") {
      result.push(
        <Text
          key={`br-${index}`}
        >
          {"\n"}
        </Text>
      );

      return;
    }

    if (tag === "img") {
      const src = resolveImageSrc(
        node.attrs.src ?? ""
      );

      if (!src) {
        return;
      }

      const dimensions =
        getImageDimensions(node);

      /*
       * Image НЕ вкладається всередину Text.
       * Це була одна з причин падіння full-режиму.
       *
       * Тут повертаємо View, який може бути
       * дочірнім елементом загального View.
       */
      result.push(
        <View
          key={`image-${index}`}
          style={{
            marginVertical: 4,
            alignItems: "flex-start",
          }}
        >
          <Image
            src={src}
            style={{
              width: dimensions.width,
              height: dimensions.height,
              objectFit: "contain",
            }}
          />
        </View>
      );

      return;
    }

    const nextStyle =
      getNodeInlineStyle(
        node,
        parentStyle
      );

    result.push(
      <Text
        key={`inline-${index}`}
        style={nextStyle}
      >
        {renderInlineNodes(
          node.children,
          nextStyle
        )}
      </Text>
    );
  });

  return result;
}

function renderHtmlNode(
  node: HtmlNode,
  parentStyle: InlineStyle = {}
): React.ReactNode[] {
  if (node.type === "text") {
    return [
      <Text style={parentStyle}>
        {node.text}
      </Text>,
    ];
  }

  if (node.type === "root") {
    const result: React.ReactNode[] = [];

    node.children.forEach(
      (child, index) => {
        result.push(
          <React.Fragment
            key={`root-${index}`}
          >
            {renderHtmlNode(
              child,
              parentStyle
            )}
          </React.Fragment>
        );
      }
    );

    return result;
  }

  const tag = node.tag;

  if (tag === "img") {
    const src = resolveImageSrc(
      node.attrs.src ?? ""
    );

    if (!src) {
      return [];
    }

    const dimensions =
      getImageDimensions(node);

    return [
      <View
        key={`image-${node.attrs.src}-${Math.random()}`}
        style={{
          marginVertical: 5,
          alignItems: "flex-start",
        }}
      >
        <Image
          src={src}
          style={{
            width: dimensions.width,
            height: dimensions.height,
            objectFit: "contain",
          }}
        />
      </View>,
    ];
  }

  if (tag === "br") {
    return [
      <Text key="break">
        {"\n"}
      </Text>,
    ];
  }

  const nextStyle =
    getNodeInlineStyle(
      node,
      parentStyle
    );

  const blockTags = new Set([
    "p",
    "div",
    "section",
    "article",
    "figure",
    "figcaption",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "pre",
  ]);

  if (!blockTags.has(tag)) {
    return renderInlineNodes(
      node.children,
      nextStyle
    );
  }

  if (
    tag === "ul" ||
    tag === "ol"
  ) {
    return [
      <View
        key={`list-${tag}`}
        style={{
          marginVertical: 3,
        }}
      >
        {node.children.map(
          (child, index) => (
            <View
              key={`li-${index}`}
              style={{
                flexDirection: "row",
                marginBottom: 2,
              }}
            >
              <Text
                style={{
                  width: 15,
                  fontSize: 8,
                }}
              >
                {tag === "ol"
                  ? `${index + 1}.`
                  : "•"}
              </Text>

              <View
                style={{
                  flex: 1,
                }}
              >
                {renderHtmlNode(
                  child,
                  nextStyle
                )}
              </View>
            </View>
          )
        )}
      </View>,
    ];
  }

  if (tag === "figure") {
    return [
      <View
        key="figure"
        style={{
          marginVertical: 5,
        }}
      >
        {node.children.map(
          (child, index) => (
            <React.Fragment
              key={`figure-${index}`}
            >
              {renderHtmlNode(
                child,
                nextStyle
              )}
            </React.Fragment>
          )
        )}
      </View>,
    ];
  }

  if (tag === "figcaption") {
    return [
      <Text
        key="figcaption"
        style={{
          ...nextStyle,
          fontSize: 7,
          color: GRAY,
          marginTop: 2,
        }}
      >
        {renderInlineNodes(
          node.children,
          nextStyle
        )}
      </Text>,
    ];
  }

  if (tag === "blockquote") {
    return [
      <View
        key="blockquote"
        style={{
          borderLeftWidth: 2,
          borderLeftColor: BURGUNDY,
          paddingLeft: 7,
          marginVertical: 4,
        }}
      >
        {node.children.map(
          (child, index) => (
            <React.Fragment
              key={`blockquote-${index}`}
            >
              {renderHtmlNode(
                child,
                nextStyle
              )}
            </React.Fragment>
          )
        )}
      </View>,
    ];
  }

  const headingSizes: Record<
    string,
    number
  > = {
    h1: 15,
    h2: 13,
    h3: 11,
    h4: 10,
    h5: 9,
    h6: 8,
  };

  if (headingSizes[tag]) {
    return [
      <Text
        key={`heading-${tag}`}
        style={{
          ...nextStyle,
          fontSize:
            headingSizes[tag],
          fontWeight: 700,
          marginVertical: 3,
        }}
      >
        {renderInlineNodes(
          node.children,
          nextStyle
        )}
      </Text>,
    ];
  }

  if (tag === "li") {
    return [
      <View
        key="li"
        style={{
          flexDirection: "row",
          marginBottom: 2,
        }}
      >
        <Text
          style={{
            width: 15,
            fontSize: 8,
          }}
        >
          •
        </Text>

        <Text
          style={{
            flex: 1,
            ...nextStyle,
          }}
        >
          {renderInlineNodes(
            node.children,
            nextStyle
          )}
        </Text>
      </View>,
    ];
  }

  /*
   * Для p/div та інших block-елементів
   * окремий View дозволяє безпечно вставляти
   * зображення між текстовими частинами.
   */
  return [
    <View
      key={`block-${tag}-${Math.random()}`}
      style={{
        marginBottom:
          tag === "p" ? 4 : 2,
      }}
    >
      {node.children.map(
        (child, index) => (
          <React.Fragment
            key={`${tag}-${index}`}
          >
            {renderHtmlNode(
              child,
              nextStyle
            )}
          </React.Fragment>
        )
      )}
    </View>,
  ];
}

function HtmlContentPdf({
  html,
  style,
}: {
  html: string;
  style?: any;
}) {
  const tree = parseHtml(html);

  if (
    tree.type === "root" &&
    tree.children.length === 0
  ) {
    return null;
  }

  const result =
    tree.type === "root"
      ? tree.children.map(
          (child, index) => (
            <React.Fragment
              key={`html-${index}`}
            >
              {renderHtmlNode(child)}
            </React.Fragment>
          )
        )
      : renderHtmlNode(tree);

  return (
    <View style={style}>
      {result}
    </View>
  );
}

// =====================================================
// SIGNATURE
// =====================================================

function getSignatureData(): string | null {
  const possibleFiles = [
    "signature.jpg",
    "signature.png",
    "signature.png.jpg",
  ];

  for (const fileName of possibleFiles) {
    const signaturePath = path.join(
      brandingPath,
      fileName
    );

    if (!fs.existsSync(signaturePath)) {
      continue;
    }

    try {
      const buffer =
        fs.readFileSync(signaturePath);

      const extension =
        path.extname(signaturePath).toLowerCase();

      let mime = "image/jpeg";

      if (extension === ".png") {
        mime = "image/png";
      }

      /*
       * signature.png.jpg може фактично бути PNG.
       * Перевіряємо сигнатуру файлу.
       */
      if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      ) {
        mime = "image/png";
      }

      return `data:${mime};base64,${buffer.toString(
        "base64"
      )}`;
    } catch {
      return null;
    }
  }

  return null;
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  page: {
    paddingTop: 96,
    paddingBottom: 92,
    paddingHorizontal: 42,
    fontFamily: "NotoSans",
    fontSize: 9,
    color: DARK,
    backgroundColor: WHITE,
  },

  // ---------------------------------------------------
  // HEADER
  // ---------------------------------------------------

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 74,
    backgroundColor: BURGUNDY,
    paddingHorizontal: 42,
    paddingVertical: 17,
    overflow: "hidden",
  },

  headerBrand: {
    fontSize: 17,
    fontWeight: 700,
    color: WHITE,
    marginBottom: 3,
  },

  headerTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: WHITE,
    letterSpacing: 0.35,
  },

  decorativeCircleLeft: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    right: -35,
    top: -39,
    backgroundColor: WHITE,
    opacity: 0.12,
  },

  decorativeCircleRight: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    right: -60,
    bottom: -72,
    backgroundColor: WHITE,
    opacity: 0.09,
  },

  decorativeCircleSmall: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    left: -18,
    bottom: -17,
    backgroundColor: WHITE,
    opacity: 0.12,
  },

  // ---------------------------------------------------
  // FOOTER
  // ---------------------------------------------------

  footer: {
    position: "absolute",
    bottom: 24,
    left: 42,
    right: 42,
    borderTopWidth: 0.7,
    borderTopColor: LIGHT_GRAY,
    paddingTop: 8,
  },

  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  footerAuthorBlock: {
    width: 315,
  },

  footerMain: {
    fontSize: 7.8,
    fontWeight: 700,
    color: BURGUNDY,
    marginBottom: 2,
  },

  footerRole: {
    fontSize: 5.9,
    lineHeight: 1.25,
    color: "#777777",
    width: 300,
    marginBottom: 3,
  },

  signatureBlock: {
    width: 90,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  signatureRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 29,
    marginBottom: 1,
  },

  signature: {
    width: 88,
    height: 29,
    objectFit: "contain",
  },

  footerContact: {
    fontSize: 6.1,
    color: "#777777",
    marginTop: 1,
  },

  pageNumber: {
    position: "absolute",
    right: 0,
    bottom: 0,
    fontSize: 7,
    color: "#888888",
  },

  // ---------------------------------------------------
  // HEADINGS
  // ---------------------------------------------------

  mainHeading: {
    fontSize: 15,
    fontWeight: 700,
    color: BURGUNDY,
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    color: BURGUNDY,
    marginBottom: 8,
    marginTop: 14,
  },

  // ---------------------------------------------------
  // GENERAL INFO
  // ---------------------------------------------------

  infoBox: {
    borderWidth: 0.7,
    borderColor: LIGHT_GRAY,
    borderRadius: 6,
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

  // ---------------------------------------------------
  // STATS
  // ---------------------------------------------------

  statsContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },

  statBox: {
    flex: 1,
    borderWidth: 0.7,
    borderColor: LIGHT_GRAY,
    borderRadius: 6,
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

  // ---------------------------------------------------
  // ANSWER TABLE
  // ---------------------------------------------------

  table: {
    width: "100%",
    borderWidth: 0.7,
    borderColor: LIGHT_GRAY,
    marginBottom: 14,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: BURGUNDY,
    minHeight: 27,
    alignItems: "center",
  },

  tableHeaderCell: {
    color: WHITE,
    fontSize: 7.3,
    fontWeight: 700,
    paddingHorizontal: 5,
    paddingVertical: 5,
  },

  tableRow: {
    flexDirection: "row",
    minHeight: 25,
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_GRAY,
    alignItems: "center",
  },

  tableRowAlt: {
    flexDirection: "row",
    minHeight: 25,
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
    width: 48,
    textAlign: "center",
  },

  colAnswer: {
    width: 140,
    textAlign: "center",
  },

  /*
   * Нараховані бали тепер третя колонка.
   */
  colPoints: {
    width: 75,
    textAlign: "center",
  },

  colCorrect: {
    flex: 1,
    textAlign: "center",
  },

  pointsCell: {
    fontWeight: 700,
    color: BURGUNDY,
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

  // ---------------------------------------------------
  // QUESTIONS
  // ---------------------------------------------------

  questionBlock: {
    borderWidth: 0.7,
    borderColor: LIGHT_GRAY,
    borderRadius: 6,
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
    fontSize: 6.3,
    color: BURGUNDY,
    fontWeight: 700,
    marginLeft: 5,
  },

  correctTag: {
    fontSize: 6.3,
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

  // ---------------------------------------------------
  // MATCHING
  // ---------------------------------------------------

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
    padding: 5,
    lineHeight: 1.3,
  },

  matchingCellCorrect: {
    width: "50%",
    padding: 5,
    lineHeight: 1.3,
    color: GREEN,
    fontWeight: 700,
  },

  matchingCellIncorrect: {
    width: "50%",
    padding: 5,
    lineHeight: 1.3,
    color: RED,
  },

  matchingResult: {
    marginTop: 7,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_GRAY,
  },

  matchingResultRow: {
    flexDirection: "row",
    marginBottom: 3,
  },

  matchingResultLabel: {
    width: 125,
    fontSize: 7.5,
    color: GRAY,
  },

  matchingResultValue: {
    flex: 1,
    fontSize: 7.5,
    fontWeight: 700,
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
    <View style={styles.header} fixed>
      <View
        style={styles.decorativeCircleLeft}
      />

      <View
        style={styles.decorativeCircleRight}
      />

      <View
        style={styles.decorativeCircleSmall}
      />

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
      <View style={styles.footerContent}>
        <View style={styles.footerAuthorBlock}>
          <Text style={styles.footerMain}>
            Автор &quot;NMT Platform&quot; Хорунжий
            Андрій Володимирович
          </Text>

          <Text style={styles.footerRole}>
            Учитель української мови та літератури
            Комунального закладу «Харківський ліцей
            № 5 Харківської міської ради», методист
            Комунального закладу «Харківська
            обласна Мала академія наук»
          </Text>
        </View>

        <View style={styles.signatureBlock}>
          {signature ? (
            <Image
              src={signature}
              style={styles.signature}
            />
          ) : null}
        </View>
      </View>

      <Text style={styles.footerContact}>
        У разі виникнення технічних проблем звертайтеся
        на ahorunzij81@gmail.com
      </Text>

      <Text
        style={styles.pageNumber}
        render={({
          pageNumber,
          totalPages,
        }) =>
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
            {getFinishReason(
              result.finishReason
            )}
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
            {result.earnedPoints} /{" "}
            {result.maxPoints}
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
              styles.colPoints,
            ]}
          >
            Нараховані бали
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

        {result.test.questions.map(
          (testQuestion, index) => {
            const question =
              testQuestion.question;

            const selectedAnswers =
              getSavedAnswers(
                result.answers,
                question.id
              );

            const matching =
              isMatchingQuestion(
                question
              );

            let participantAnswer = "—";
            let correctAnswer = "—";
            let correct = false;

            if (matching) {
              participantAnswer =
                getMatchingAnswerLetters(
                  question,
                  selectedAnswers
                );

              correctAnswer =
                getMatchingCorrectAnswerLetters(
                  question
                );

              const status =
                getMatchingStatus(
                  question,
                  selectedAnswers
                );

              correct =
                status.total > 0 &&
                status.correct ===
                  status.total;
            } else {
              participantAnswer =
                getOrdinaryAnswerLetters(
                  question,
                  selectedAnswers
                ) || "—";

              correctAnswer =
                getCorrectOrdinaryAnswerLetters(
                  question
                ) || "—";

              correct =
                isQuestionCorrect(
                  question,
                  selectedAnswers
                );
            }

            const earnedPoints =
              getEarnedPoints(
                question,
                selectedAnswers
              );

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
                    styles.colPoints,
                    earnedPoints > 0
                      ? styles.pointsCell
                      : styles.skippedText,
                  ]}
                >
                  {earnedPoints}
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
          }
        )}
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
    <View style={styles.questionBlock}>
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

      <HtmlContentPdf
        html={question.text}
        style={styles.conditionText}
      />

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
              <Text
                style={styles.optionLetter}
              >
                {getLetter(index)}.
              </Text>

              <View
                style={{
                  flex: 1,
                }}
              >
                <HtmlContentPdf
                  html={option.text}
                  style={styles.optionText}
                />
              </View>

              {optionSelected ? (
                <Text
                  style={styles.selectedTag}
                >
                  Відповідь учасника
                </Text>
              ) : null}

              {option.isCorrect ? (
                <Text
                  style={styles.correctTag}
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
          {getOrdinaryAnswerLetters(
            question,
            selectedAnswers
          ) || "—"}
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
          {getCorrectOrdinaryAnswerLetters(
            question
          ) || "—"}
        </Text>
      </View>

      <View style={styles.answerLine}>
        <Text style={styles.answerLabel}>
          Нараховані бали:
        </Text>

        <Text
          style={[
            styles.answerValue,
            getEarnedPoints(
              question,
              selectedAnswers
            ) > 0
              ? styles.correctText
              : styles.incorrectText,
          ]}
        >
          {getEarnedPoints(
            question,
            selectedAnswers
          )}{" "}
          / {question.points}
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

  const status =
    getMatchingStatus(
      question,
      selectedAnswers
    );

  const earnedPoints =
    getEarnedPoints(
      question,
      selectedAnswers
    );

  return (
    <View style={styles.questionBlock}>
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

      <HtmlContentPdf
        html={question.text}
        style={styles.conditionText}
      />

      <View style={styles.matchingTable}>
        <View style={styles.matchingHeader}>
          <Text
            style={[
              styles.matchingHeaderCell,
              { width: "50%" },
            ]}
          >
            Елемент
          </Text>

          <Text
            style={[
              styles.matchingHeaderCell,
              { width: "50%" },
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

          const pairCorrect =
            selectedRightId !== undefined &&
            selectedRightId ===
              item.correctRightId;

          return (
            <View
              key={item.id}
              style={styles.matchingRow}
            >
              <View
                style={styles.matchingCell}
              >
                <Text
                  style={{
                    fontSize: 7.5,
                    lineHeight: 1.3,
                  }}
                >
                  {getLetter(index)}.{" "}
                </Text>

                <HtmlContentPdf
                  html={item.text}
                  style={{
                    flex: 1,
                  }}
                />
              </View>

              <View
                style={
                  pairCorrect
                    ? styles.matchingCellCorrect
                    : styles.matchingCellIncorrect
                }
              >
                {selectedRight ? (
                  <HtmlContentPdf
                    html={selectedRight.text}
                    style={{
                      flex: 1,
                    }}
                  />
                ) : (
                  <Text
                    style={{
                      fontSize: 7.5,
                    }}
                  >
                    —
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.matchingResult}>
        <View style={styles.matchingResultRow}>
          <Text
            style={styles.matchingResultLabel}
          >
            Відповідь учасника:
          </Text>

          <Text
            style={styles.matchingResultValue}
          >
            {getMatchingAnswerLetters(
              question,
              selectedAnswers
            )}
          </Text>
        </View>

        <View style={styles.matchingResultRow}>
          <Text
            style={styles.matchingResultLabel}
          >
            Правильна відповідь:
          </Text>

          <Text
            style={[
              styles.matchingResultValue,
              styles.correctText,
            ]}
          >
            {getMatchingCorrectAnswerLetters(
              question
            )}
          </Text>
        </View>

        <View style={styles.matchingResultRow}>
          <Text
            style={styles.matchingResultLabel}
          >
            Правильних пар:
          </Text>

          <Text
            style={styles.matchingResultValue}
          >
            {status.correct} /{" "}
            {status.total}
          </Text>
        </View>

        <View style={styles.matchingResultRow}>
          <Text
            style={styles.matchingResultLabel}
          >
            Нараховані бали:
          </Text>

          <Text
            style={[
              styles.matchingResultValue,
              earnedPoints > 0
                ? styles.correctText
                : styles.incorrectText,
            ]}
          >
            {earnedPoints} /{" "}
            {question.points}
          </Text>
        </View>
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
      author="NMT Platform"
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