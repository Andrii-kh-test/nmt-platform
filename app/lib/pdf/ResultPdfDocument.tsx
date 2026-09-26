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
      fontStyle: "normal",
    },
    {
      src: fontBoldPath,
      fontWeight: 700,
      fontStyle: "normal",
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

function getParticipantName(
  result: ResultData
): string {
  return [
    result.lastName,
    result.firstName,
    result.middleName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || "Не вказано";
}

function getFinishReason(
  reason: string
): string {
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
  if (
    !answers ||
    typeof answers !== "object"
  ) {
    return [];
  }

  const source =
    answers as Record<string, unknown>;

  const value =
    source[String(questionId)];

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => Number(item))
    .filter((item) =>
      Number.isFinite(item)
    );
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

  return (
    letters[index] ??
    String(index + 1)
  );
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
  const correctIds =
    question.answerOptions
      .filter(
        (option) => option.isCorrect
      )
      .map((option) => option.id)
      .sort((a, b) => a - b);

  const selectedIds = [
    ...selectedAnswers,
  ].sort((a, b) => a - b);

  if (
    correctIds.length !==
    selectedIds.length
  ) {
    return false;
  }

  return correctIds.every(
    (id, index) =>
      id === selectedIds[index]
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

function getMatchingData(
  question: QuestionData
): {
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
        correctRightId: Number(
          parts[3]
        ),
      });
    }

    if (text.startsWith("R|")) {
      const parts = text.split("|");

      right.push({
        id: Number(parts[1]),
        text: parts
          .slice(2)
          .join("|"),
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
  const { left } =
    getMatchingData(question);

  let correct = 0;

  for (
    let index = 0;
    index < left.length;
    index++
  ) {
    const selectedRightId =
      selectedAnswers[index];

    if (
      selectedRightId !==
        undefined &&
      selectedRightId ===
        left[index].correctRightId
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
  const normalizedType =
    String(question.type ?? "")
      .toLowerCase()
      .trim();

  return (
    normalizedType.includes(
      "matching"
    ) ||
    normalizedType.includes(
      "відповідність"
    )
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
      isSelected(
        selectedAnswers,
        option.id
      )
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
      option.isCorrect
        ? getLetter(index)
        : null
    )
    .filter(Boolean)
    .join("");
}

/**
 * Для matching:
 *
 * Якщо праві варіанти:
 * А — ...
 * Б — ...
 * В — ...
 * Г — ...
 *
 * а учасник для лівих елементів
 * обрав [В, А, Б, Д],
 * отримаємо:
 *
 * ВАБД
 *
 * без розділювачів.
 */
function getMatchingAnswerLetters(
  question: QuestionData,
  selectedAnswers: number[]
): string {
  const { left, right } =
    getMatchingData(question);

  return left
    .map((_, index) => {
      const selectedRightId =
        selectedAnswers[index];

      if (
        selectedRightId ===
        undefined
      ) {
        return "—";
      }

      const rightIndex =
        right.findIndex(
          (item) =>
            item.id ===
            selectedRightId
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
      const rightIndex =
        right.findIndex(
          (rightItem) =>
            rightItem.id ===
            item.correctRightId
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
  if (
    isMatchingQuestion(question)
  ) {
    const status =
      getMatchingStatus(
        question,
        selectedAnswers
      );

    if (status.total === 0) {
      return 0;
    }

    /*
     * Для завдань на відповідність
     * кожна правильна пара дає
     * відповідну частину балів.
     *
     * Наприклад:
     * 4 пари, 4 бали,
     * 3 правильні → 3 бали.
     */
    return Math.min(
      question.points,
      Math.round(
        (question.points *
          status.correct) /
          status.total
      )
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
// RICH HTML → PDF
// =====================================================

type HtmlNode = {
  type: "element" | "text";
  tag?: string;
  attrs?: Record<
    string,
    string
  >;
  text?: string;
  children?: HtmlNode[];
};

type PdfInlineStyle = {
  fontWeight?: 400 | 700;
  fontStyle?:
    | "normal"
    | "italic";
  textDecoration?:
    | "none"
    | "underline"
    | "line-through";
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  textAlign?:
    | "left"
    | "center"
    | "right"
    | "justify";
};

/**
 * React-PDF не має browser fallback
 * для відсутнього font face.
 *
 * У нас зареєстровано:
 * 400 normal
 * 700 normal
 *
 * Тому 700 italic автоматично
 * перетворюємо на 400 italic.
 *
 * Це не дає renderToBuffer()
 * падати з:
 *
 * Could not resolve font for
 * NotoSans, fontWeight 700,
 * fontStyle italic
 */
function normalizeFontStyle(
  style: any
): any {
  if (
    style &&
    typeof style === "object" &&
    style.fontStyle === "italic" &&
    Number(style.fontWeight) === 700
  ) {
    return {
      ...style,
      fontWeight: 400,
    };
  }

  return style;
}

function parseAttributes(
  source: string
): Record<string, string> {
  const attrs: Record<
    string,
    string
  > = {};

  const attrRegex =
    /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

  let match: RegExpExecArray | null;

  while (
    (match =
      attrRegex.exec(source)) !== null
  ) {
    attrs[
      match[1].toLowerCase()
    ] =
      match[2] ??
      match[3] ??
      match[4] ??
      "";
  }

  return attrs;
}

function parseHtml(
  html: string
): HtmlNode {
  const root: HtmlNode = {
    type: "element",
    tag: "root",
    attrs: {},
    children: [],
  };

  const stack: HtmlNode[] = [root];

  const tokens =
    html
      .replace(
        /<!--[\s\S]*?-->/g,
        ""
      )
      .match(
        /<[^>]+>|[^<]+/g
      ) ?? [];

  const voidTags = new Set([
    "br",
    "img",
    "hr",
    "meta",
    "input",
    "source",
    "area",
    "base",
    "col",
    "embed",
    "link",
    "param",
    "track",
    "wbr",
  ]);

  for (const token of tokens) {
    if (
      token.startsWith("<")
    ) {
      if (
        /^<\s*\//.test(token)
      ) {
        const match =
          token.match(
            /^<\s*\/\s*([a-zA-Z0-9:-]+)/
          );

        if (!match) {
          continue;
        }

        const closingTag =
          match[1].toLowerCase();

        let foundIndex = -1;

        for (
          let i =
            stack.length - 1;
          i >= 0;
          i--
        ) {
          if (
            stack[i].tag ===
            closingTag
          ) {
            foundIndex = i;
            break;
          }
        }

        if (foundIndex >= 0) {
          stack.length =
            foundIndex;
        }

        continue;
      }

      if (
        /^<\s*!/.test(token) ||
        /^<\s*\?/.test(token)
      ) {
        continue;
      }

      const openingMatch =
        token.match(
          /^<\s*([a-zA-Z0-9:-]+)/
        );

      if (!openingMatch) {
        continue;
      }

      const tag =
        openingMatch[1].toLowerCase();

      const attrs =
        parseAttributes(token);

      const node: HtmlNode = {
        type: "element",
        tag,
        attrs,
        children: [],
      };

      const parent =
        stack[stack.length - 1];

      parent.children =
        parent.children ?? [];

      parent.children.push(node);

      const selfClosing =
        /\/\s*>$/.test(token) ||
        voidTags.has(tag);

      if (!selfClosing) {
        stack.push(node);
      }

      continue;
    }

    const text =
      decodeHtml(token);

    if (!text) {
      continue;
    }

    const parent =
      stack[stack.length - 1];

    parent.children =
      parent.children ?? [];

    parent.children.push({
      type: "text",
      text,
    });
  }

  return root;
}

function parseCssStyle(
  styleText?: string
): PdfInlineStyle {
  const result: PdfInlineStyle = {};

  if (!styleText) {
    return result;
  }

  const declarations =
    styleText.split(";");

  for (const declaration of declarations) {
    const separator =
      declaration.indexOf(":");

    if (separator < 0) {
      continue;
    }

    const property =
      declaration
        .slice(0, separator)
        .trim()
        .toLowerCase();

    const value =
      declaration
        .slice(separator + 1)
        .trim();

    if (!value) {
      continue;
    }

    switch (property) {
      case "font-weight":
        if (
          value === "bold" ||
          Number(value) >= 600
        ) {
          result.fontWeight = 700;
        } else if (
          value === "normal" ||
          Number(value) <= 500
        ) {
          result.fontWeight = 400;
        }
        break;

      case "font-style":
        if (
          value.toLowerCase() ===
          "italic"
        ) {
          result.fontStyle =
            "italic";
        }
        break;

      case "text-decoration":
      case "text-decoration-line":
        if (
          value.includes(
            "underline"
          )
        ) {
          result.textDecoration =
            "underline";
        } else if (
          value.includes(
            "line-through"
          )
        ) {
          result.textDecoration =
            "line-through";
        }
        break;

      case "background":
      case "background-color":
        if (
          value !== "transparent"
        ) {
          result.backgroundColor =
            value;
        }
        break;

      case "color":
        result.color = value;
        break;

      case "font-size": {
        const size =
          parseFloat(value);

        if (
          Number.isFinite(size)
        ) {
          result.fontSize =
            size * 0.75;
        }
        break;
      }

      case "text-align":
        if (
          value === "left" ||
          value === "center" ||
          value === "right" ||
          value === "justify"
        ) {
          result.textAlign =
            value;
        }
        break;
    }
  }

  return result;
}

function getNodeStyle(
  node: HtmlNode,
  inherited: PdfInlineStyle
): PdfInlineStyle {
  const next = {
    ...inherited,
  };

  const tag =
    node.tag?.toLowerCase() ?? "";

  switch (tag) {
    case "strong":
    case "b":
      next.fontWeight = 700;
      break;

    case "em":
    case "i":
      next.fontStyle = "italic";
      break;

    case "u":
      next.textDecoration =
        "underline";
      break;

    case "s":
    case "strike":
    case "del":
      next.textDecoration =
        "line-through";
      break;

    case "mark":
      next.backgroundColor =
        "#FFF2A8";
      break;

    case "a":
      next.textDecoration =
        "underline";
      break;

    case "sup":
      next.fontSize = 6;
      break;

    case "sub":
      next.fontSize = 6;
      break;
  }

  const cssStyle =
    parseCssStyle(
      node.attrs?.style
    );

  Object.assign(
    next,
    cssStyle
  );

  return normalizeFontStyle(
    next
  );
}

function isImageNode(
  node: HtmlNode
): boolean {
  return (
    node.type === "element" &&
    node.tag === "img"
  );
}

function getBaseUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL;

  if (explicit) {
    return explicit.replace(
      /\/$/,
      ""
    );
  }

  const vercel =
    process.env.VERCEL_URL;

  if (vercel) {
    return `https://${vercel}`;
  }

  return "http://localhost:3000";
}

function resolveImageSrc(
  src: string
): string {
  const trimmed =
    src.trim();

  if (!trimmed) {
    return "";
  }

  if (
    trimmed.startsWith(
      "data:"
    )
  ) {
    return trimmed;
  }

  if (
    /^https?:\/\//i.test(
      trimmed
    )
  ) {
    return trimmed;
  }

  if (
    trimmed.startsWith("//")
  ) {
    return `https:${trimmed}`;
  }

  if (
    trimmed.startsWith("/")
  ) {
    return `${getBaseUrl()}${trimmed}`;
  }

  return trimmed;
}

function getImageDimensions(
  node: HtmlNode
): {
  width: number;
  height: number;
} {
  const attrs =
    node.attrs ?? {};

  const style =
    attrs.style ?? "";

  const widthMatch =
    style.match(
      /width\s*:\s*([\d.]+)px/i
    );

  const heightMatch =
    style.match(
      /height\s*:\s*([\d.]+)px/i
    );

  const attrWidth =
    attrs.width
      ? parseFloat(attrs.width)
      : NaN;

  const attrHeight =
    attrs.height
      ? parseFloat(attrs.height)
      : NaN;

  const width =
    Number.isFinite(
      attrWidth
    )
      ? attrWidth
      : widthMatch
      ? Number(widthMatch[1])
      : 260;

  const height =
    Number.isFinite(
      attrHeight
    )
      ? attrHeight
      : heightMatch
      ? Number(heightMatch[1])
      : 160;

  return {
    width: Math.min(
      Math.max(width, 30),
      470
    ),
    height: Math.min(
      Math.max(height, 20),
      400
    ),
  };
}

function PdfImage({
  node,
}: {
  node: HtmlNode;
}) {
  const src =
    node.attrs?.src;

  if (!src) {
    return null;
  }

  const resolved =
    resolveImageSrc(src);

  if (!resolved) {
    return null;
  }

  const dimensions =
    getImageDimensions(node);

  return (
    <Image
      src={resolved}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        objectFit: "contain",
        marginVertical: 5,
        alignSelf: "flex-start",
      }}
    />
  );
}

function renderInlineNodes(
  nodes: HtmlNode[],
  inheritedStyle: PdfInlineStyle = {}
): React.ReactNode[] {
  return nodes.map(
    (node, index) => {
      const key =
        `${node.tag ?? "text"}-${index}`;

      if (
        node.type === "text"
      ) {
        return node.text ?? "";
      }

      const tag =
        node.tag?.toLowerCase() ?? "";

      if (tag === "br") {
        return (
          <Text key={key}>
            {"\n"}
          </Text>
        );
      }

      if (tag === "img") {
        return null;
      }

      const style =
        getNodeStyle(
          node,
          inheritedStyle
        );

      return (
        <Text
          key={key}
          style={normalizeFontStyle(
            style
          )}
        >
          {renderInlineNodes(
            node.children ?? [],
            style
          )}
        </Text>
      );
    }
  );
}

function renderParagraph(
  node: HtmlNode,
  key: string
) {
  const children =
    node.children ?? [];

  const hasDirectImage =
    children.some(isImageNode);

  const blockStyle =
    parseCssStyle(
      node.attrs?.style
    );

  if (!hasDirectImage) {
    return (
      <Text
        key={key}
        style={normalizeFontStyle(
          blockStyle
        )}
      >
        {renderInlineNodes(
          children,
          blockStyle
        )}
      </Text>
    );
  }

  return (
    <View key={key}>
      {children.map(
        (child, index) => {
          if (
            isImageNode(child)
          ) {
            return (
              <PdfImage
                key={`img-${index}`}
                node={child}
              />
            );
          }

          return (
            <Text
              key={`text-${index}`}
              style={normalizeFontStyle(
                blockStyle
              )}
            >
              {renderInlineNodes(
                [child],
                blockStyle
              )}
            </Text>
          );
        }
      )}
    </View>
  );
}

function renderHtmlBlock(
  node: HtmlNode,
  index: number
): React.ReactNode {
  if (
    node.type === "text"
  ) {
    if (
      !node.text?.trim()
    ) {
      return null;
    }

    return (
      <Text
        key={`text-${index}`}
      >
        {node.text}
      </Text>
    );
  }

  const tag =
    node.tag?.toLowerCase() ?? "";

  const key =
    `${tag}-${index}`;

  if (tag === "img") {
    return (
      <PdfImage
        key={key}
        node={node}
      />
    );
  }

  if (
    tag === "p" ||
    tag === "div" ||
    tag === "section" ||
    tag === "article"
  ) {
    return renderParagraph(
      node,
      key
    );
  }

  if (
    /^h[1-6]$/.test(tag)
  ) {
    const headingSize =
      tag === "h1"
        ? 15
        : tag === "h2"
        ? 13
        : tag === "h3"
        ? 11
        : 9.5;

    return (
      <Text
        key={key}
        style={[
          {
            fontSize:
              headingSize,
            fontWeight: 700,
            marginBottom: 5,
            marginTop: 3,
            color: DARK,
          },
          normalizeFontStyle(
            parseCssStyle(
              node.attrs?.style
            )
          ),
        ]}
      >
        {renderInlineNodes(
          node.children ?? [],
          {
            fontWeight: 700,
          }
        )}
      </Text>
    );
  }

  if (
    tag === "ul" ||
    tag === "ol"
  ) {
    return (
      <View
        key={key}
        style={{
          marginVertical: 3,
        }}
      >
        {(node.children ?? []).map(
          (child, childIndex) =>
            renderListItem(
              child,
              childIndex,
              tag === "ol"
            )
        )}
      </View>
    );
  }

  if (tag === "li") {
    return renderListItem(
      node,
      index,
      false
    );
  }

  if (
    tag === "figure"
  ) {
    return (
      <View
        key={key}
        style={{
          marginVertical: 5,
        }}
      >
        {(node.children ?? []).map(
          (child, childIndex) =>
            renderHtmlBlock(
              child,
              childIndex
            )
        )}
      </View>
    );
  }

  if (
    tag === "figcaption"
  ) {
    return (
      <Text
        key={key}
        style={{
          fontSize: 7,
          color: GRAY,
          marginTop: 2,
        }}
      >
        {renderInlineNodes(
          node.children ?? []
        )}
      </Text>
    );
  }

  if (
    tag === "blockquote"
  ) {
    return (
      <View
        key={key}
        style={{
          borderLeftWidth: 2,
          borderLeftColor:
            BURGUNDY,
          paddingLeft: 7,
          marginVertical: 4,
        }}
      >
        <Text>
          {renderInlineNodes(
            node.children ?? []
          )}
        </Text>
      </View>
    );
  }

  if (tag === "hr") {
    return (
      <View
        key={key}
        style={{
          borderTopWidth: 0.6,
          borderTopColor:
            LIGHT_GRAY,
          marginVertical: 5,
        }}
      />
    );
  }

  return (
    <View key={key}>
      {renderInlineNodes(
        node.children ?? []
      )}
    </View>
  );
}

function renderListItem(
  node: HtmlNode,
  index: number,
  ordered: boolean
) {
  const marker = ordered
    ? `${index + 1}.`
    : "•";

  return (
    <View
      key={`li-${index}`}
      style={{
        flexDirection: "row",
        marginBottom: 3,
      }}
    >
      <Text
        style={{
          width: 15,
          fontSize: 8,
          fontWeight: 700,
        }}
      >
        {marker}
      </Text>

      <Text
        style={{
          flex: 1,
          fontSize: 8,
          lineHeight: 1.35,
        }}
      >
        {renderInlineNodes(
          node.children ?? []
        )}
      </Text>
    </View>
  );
}

function HtmlContentPdf({
  html,
  style,
}: {
  html: string;
  style?: any;
}) {
  if (!html) {
    return null;
  }

  const root =
    parseHtml(html);

  const children =
    root.children ?? [];

  if (
    children.length === 0
  ) {
    const fallback =
      stripHtml(html);

    if (!fallback) {
      return null;
    }

    return (
      <Text style={style}>
        {fallback}
      </Text>
    );
  }

  return (
    <View style={style}>
      {children.map(
        (node, index) =>
          renderHtmlBlock(
            node,
            index
          )
      )}
    </View>
  );
}

// =====================================================
// SIGNATURE
// =====================================================

function getSignatureData(): string | null {
  const brandingDir =
    path.join(
      process.cwd(),
      "public",
      "branding"
    );

  const candidates = [
    "signature.jpg",
    "signature.png",
    "signature.png.jpg",
  ];

  for (const filename of candidates) {
    const signaturePath =
      path.join(
        brandingDir,
        filename
      );

    if (
      !fs.existsSync(
        signaturePath
      )
    ) {
      continue;
    }

    try {
      const buffer =
        fs.readFileSync(
          signaturePath
        );

      let mime =
        "image/jpeg";

      /*
       * Визначаємо PNG за сигнатурою,
       * навіть якщо файл має дивне
       * розширення на кшталт
       * signature.png.jpg.
       */
      if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      ) {
        mime =
          "image/png";
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
    paddingBottom: 100,
    paddingHorizontal: 42,
    fontFamily: "NotoSans",
    fontSize: 9,
    color: DARK,
    backgroundColor: WHITE,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 74,
    backgroundColor: BURGUNDY,
    paddingHorizontal: 42,
    paddingVertical: 16,
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

  // ===================================================
  // FOOTER
  // ===================================================

  footer: {
    position: "absolute",
    bottom: 22,
    left: 42,
    right: 42,
    borderTopWidth: 0.7,
    borderTopColor: LIGHT_GRAY,
    paddingTop: 8,
  },

  footerAuthorBlock: {
    width: 330,
  },

  footerMain: {
    fontSize: 7.8,
    fontWeight: 700,
    color: BURGUNDY,
    marginBottom: 2,
  },

  footerRole: {
    width: 320,
    fontSize: 5.9,
    lineHeight: 1.3,
    color: "#777777",
    marginBottom: 3,
  },

  footerBottomRow: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "flex-end",
  },

  signatureRow: {
    height: 29,
    width: 100,
    alignItems: "flex-start",
    justifyContent:
      "center",
  },

  signature: {
    width: 88,
    height: 29,
    objectFit: "contain",
  },

  footerContact: {
    fontSize: 6.1,
    color: "#777777",
    marginTop: 2,
  },

  pageNumber: {
    position: "absolute",
    right: 0,
    bottom: 0,
    fontSize: 7,
    color: "#888888",
  },

  // ===================================================
  // HEADINGS
  // ===================================================

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

  // ===================================================
  // GENERAL INFO
  // ===================================================

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

  // ===================================================
  // STATS
  // ===================================================

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

  // ===================================================
  // ANSWER TABLE
  // ===================================================

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
    fontSize: 7.1,
    fontWeight: 700,
    paddingHorizontal: 4,
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
    paddingHorizontal: 4,
    paddingVertical: 4,
  },

  colNumber: {
    width: 52,
    textAlign: "center",
  },

  colAnswer: {
    flex: 1,
    textAlign: "center",
  },

  /*
   * Саме третя колонка:
   * Завдання | Відповідь | Нараховані бали | Правильна
   */
  colPoints: {
    width: 82,
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

  // ===================================================
  // QUESTIONS
  // ===================================================

  questionBlock: {
    borderWidth: 0.7,
    borderColor: LIGHT_GRAY,
    borderRadius: 6,
    marginBottom: 10,
    padding: 10,
  },

  questionHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
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

  // ===================================================
  // MATCHING
  // ===================================================

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

  matchingCellView: {
    width: "50%",
    padding: 5,
  },

  matchingCellText: {
    fontSize: 7.5,
    lineHeight: 1.3,
  },

  matchingCellCorrect: {
    width: "50%",
    padding: 5,
  },

  matchingCellIncorrect: {
    width: "50%",
    padding: 5,
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
    <View
      style={styles.header}
      fixed
    >
      <View
        style={
          styles.decorativeCircleLeft
        }
      />

      <View
        style={
          styles.decorativeCircleRight
        }
      />

      <View
        style={
          styles.decorativeCircleSmall
        }
      />

      <Text
        style={styles.headerBrand}
      >
        NMT Platform
      </Text>

      <Text
        style={styles.headerTitle}
      >
        ПЛАТФОРМА КОМП&apos;ЮТЕРНОГО
        ТЕСТУВАННЯ
      </Text>
    </View>
  );
}

// =====================================================
// FOOTER
// =====================================================

function Footer() {
  const signature =
    getSignatureData();

  return (
    <View
      style={styles.footer}
      fixed
    >
      <View
        style={styles.footerAuthorBlock}
      >
        <Text
          style={styles.footerMain}
        >
          Автор &quot;NMT Platform&quot;
          {" "}
          Хорунжий Андрій
          Володимирович
        </Text>

        <Text
          style={styles.footerRole}
        >
          Учитель української мови
          та літератури Комунального
          закладу «Харківський ліцей
          № 5 Харківської міської
          ради», методист
          Комунального закладу
          «Харківська обласна Мала
          академія наук»
        </Text>
      </View>

      <View
        style={
          styles.footerBottomRow
        }
      >
        <View
          style={
            styles.signatureRow
          }
        >
          {signature ? (
            <Image
              src={signature}
              style={styles.signature}
            />
          ) : null}
        </View>
      </View>

      <Text
        style={styles.footerContact}
      >
        У разі виникнення технічних
        проблем звертайтеся на
        ahorunzij81@gmail.com
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
      <Text
        style={styles.mainHeading}
      >
        {result.test.title}
      </Text>

      <View
        style={styles.infoBox}
      >
        <Text
          style={styles.sectionTitle}
        >
          Загальна інформація
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Учасник
          </Text>

          <Text style={styles.infoValue}>
            {getParticipantName(
              result
            )}
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
            {result.test.subject ||
              "—"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Навчальний рік
          </Text>

          <Text style={styles.infoValue}>
            {result.test
              .schoolYear || "—"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Дата початку
          </Text>

          <Text style={styles.infoValue}>
            {formatDate(
              result.startedAt
            )}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Дата завершення
          </Text>

          <Text style={styles.infoValue}>
            {formatDate(
              result.finishedAt
            )}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Час виконання
          </Text>

          <Text style={styles.infoValue}>
            {formatDuration(
              result.timeSpent
            )}
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

        <View
          style={styles.infoRowLast}
        >
          <Text style={styles.infoLabel}>
            Код учасника
          </Text>

          <Text style={styles.infoValue}>
            {result.accessCode ||
              "—"}
          </Text>
        </View>
      </View>

      <Text
        style={styles.sectionTitle}
      >
        Результат
      </Text>

      <View
        style={styles.statsContainer}
      >
        <View
          style={styles.statBox}
        >
          <Text
            style={styles.statValue}
          >
            {result.earnedPoints} /{" "}
            {result.maxPoints}
          </Text>

          <Text
            style={styles.statLabel}
          >
            Набрані бали
          </Text>
        </View>

        <View
          style={styles.statBox}
        >
          <Text
            style={styles.statValue}
          >
            {result.percent}%
          </Text>

          <Text
            style={styles.statLabel}
          >
            Результативність
          </Text>
        </View>

        <View
          style={styles.statBox}
        >
          <Text
            style={styles.statValue}
          >
            {result.correct}
          </Text>

          <Text
            style={styles.statLabel}
          >
            Правильних
          </Text>
        </View>

        <View
          style={styles.statBox}
        >
          <Text
            style={styles.statValue}
          >
            {result.incorrect}
          </Text>

          <Text
            style={styles.statLabel}
          >
            Неправильних
          </Text>
        </View>

        <View
          style={styles.statBox}
        >
          <Text
            style={styles.statValue}
          >
            {result.skipped}
          </Text>

          <Text
            style={styles.statLabel}
          >
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
      <Text
        style={styles.sectionTitle}
      >
        Журнал відповідей
      </Text>

      <View style={styles.table}>
        <View
          style={styles.tableHeader}
        >
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
          (
            testQuestion,
            index
          ) => {
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

            let participantAnswer =
              "—";

            let correctAnswer =
              "—";

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
                      : participantAnswer ===
                        "—"
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
  const correct =
    isQuestionCorrect(
      question,
      selectedAnswers
    );

  const earnedPoints =
    getEarnedPoints(
      question,
      selectedAnswers
    );

  return (
    <View
      style={styles.questionBlock}
    >
      <View
        style={styles.questionHeader}
      >
        <Text
          style={styles.questionNumber}
        >
          Завдання {number}
        </Text>

        <Text
          style={styles.questionPoints}
        >
          {question.points} б.
        </Text>
      </View>

      <Text
        style={styles.conditionLabel}
      >
        Умова
      </Text>

      <HtmlContentPdf
        html={question.text}
        style={
          styles.conditionText
        }
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
                style={
                  styles.optionLetter
                }
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
                  style={
                    styles.optionText
                  }
                />
              </View>

              {optionSelected ? (
                <Text
                  style={
                    styles.selectedTag
                  }
                >
                  Відповідь
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

      <View
        style={styles.answerLine}
      >
        <Text
          style={styles.answerLabel}
        >
          Обрано:
        </Text>

        <Text
          style={styles.answerValue}
        >
          {getOrdinaryAnswerLetters(
            question,
            selectedAnswers
          ) || "—"}
        </Text>
      </View>

      <View
        style={styles.answerLine}
      >
        <Text
          style={styles.answerLabel}
        >
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

      <View
        style={styles.answerLine}
      >
        <Text
          style={styles.answerLabel}
        >
          Нараховані бали:
        </Text>

        <Text
          style={[
            styles.answerValue,
            earnedPoints > 0
              ? styles.correctText
              : styles.incorrectText,
          ]}
        >
          {earnedPoints} /{" "}
          {question.points}
        </Text>
      </View>

      <View
        style={styles.answerLine}
      >
        <Text
          style={styles.answerLabel}
        >
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
            : selectedAnswers.length ===
              0
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
    <View
      style={styles.questionBlock}
    >
      <View
        style={styles.questionHeader}
      >
        <Text
          style={styles.questionNumber}
        >
          Завдання {number}
        </Text>

        <Text
          style={styles.questionPoints}
        >
          {question.points} б.
        </Text>
      </View>

      <Text
        style={styles.conditionLabel}
      >
        Умова
      </Text>

      <HtmlContentPdf
        html={question.text}
        style={
          styles.conditionText
        }
      />

      <View
        style={styles.matchingTable}
      >
        <View
          style={styles.matchingHeader}
        >
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

        {left.map(
          (item, index) => {
            const selectedRightId =
              selectedAnswers[index];

            const selectedRight =
              right.find(
                (rightItem) =>
                  rightItem.id ===
                  selectedRightId
              );

            const pairCorrect =
              selectedRightId !==
                undefined &&
              selectedRightId ===
                item.correctRightId;

            return (
              <View
                key={item.id}
                style={
                  styles.matchingRow
                }
              >
                <View
                  style={
                    styles.matchingCellView
                  }
                >
                  <Text
                    style={
                      styles.matchingCellText
                    }
                  >
                    {getLetter(index)}.
                  </Text>

                  <HtmlContentPdf
                    html={item.text}
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
                      html={
                        selectedRight.text
                      }
                    />
                  ) : (
                    <Text
                      style={[
                        styles.matchingCellText,
                        styles.muted,
                      ]}
                    >
                      —
                    </Text>
                  )}
                </View>
              </View>
            );
          }
        )}
      </View>

      <View
        style={styles.matchingResult}
      >
        <View
          style={
            styles.matchingResultRow
          }
        >
          <Text
            style={
              styles.matchingResultLabel
            }
          >
            Відповідь учасника:
          </Text>

          <Text
            style={
              styles.matchingResultValue
            }
          >
            {getMatchingAnswerLetters(
              question,
              selectedAnswers
            )}
          </Text>
        </View>

        <View
          style={
            styles.matchingResultRow
          }
        >
          <Text
            style={
              styles.matchingResultLabel
            }
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

        <View
          style={
            styles.matchingResultRow
          }
        >
          <Text
            style={
              styles.matchingResultLabel
            }
          >
            Правильних пар:
          </Text>

          <Text
            style={
              styles.matchingResultValue
            }
          >
            {status.correct} /{" "}
            {status.total}
          </Text>
        </View>

        <View
          style={
            styles.matchingResultRow
          }
        >
          <Text
            style={
              styles.matchingResultLabel
            }
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
      <Text
        style={styles.sectionTitle}
      >
        Завдання та відповіді
      </Text>

      {result.test.questions.map(
        (
          testQuestion,
          index
        ) => {
          const question =
            testQuestion.question;

          const selectedAnswers =
            getSavedAnswers(
              result.answers,
              question.id
            );

          if (
            isMatchingQuestion(
              question
            )
          ) {
            return (
              <MatchingQuestion
                key={
                  testQuestion.id
                }
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
            <Text
              style={
                styles.mainHeading
              }
            >
              РЕЗУЛЬТАТ ТЕСТУВАННЯ
            </Text>

            <GeneralInfo
              result={result}
            />
          </>
        ) : null}

        {mode === "answers" ? (
          <>
            <Text
              style={
                styles.mainHeading
              }
            >
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
            <Text
              style={
                styles.mainHeading
              }
            >
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