// =====================================================
// PSYCHOMETRICS
// NMT Platform
//
// P-value
// D-index
// Rit
// Розподіл відповідей
// =====================================================

export type PsychometricQuestionType =
  | "single"
  | "multiple"
  | "matching"
  | "sequence";

export type PsychometricOption = {
  id: number;
  order: number;
  text: string;
  isCorrect: boolean;
};

export type PsychometricQuestion = {
  id: number;
  order: number;
  type: string;
  points: number;
  answerOptions: PsychometricOption[];
};

export type PsychometricParticipant = {
  id: number;
  earnedPoints: number;
  answers: unknown;
};

export type AnswerDistributionItem = {
  key: string;
  text: string;
  count: number;
  percent: number;
};

export type ScoreDistributionItem = {
  score: number;
  count: number;
  percent: number;
};

export type QuestionPsychometrics = {
  pValue: number | null;
  dIndex: number | null;
  rit: number | null;

  key: string;

  answerDistribution: AnswerDistributionItem[];

  scoreDistribution: ScoreDistributionItem[];

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

// =====================================================
// HELPERS
// =====================================================

function round(
  value: number,
  digits = 2
): number {
  const multiplier =
    Math.pow(10, digits);

  return (
    Math.round(
      value * multiplier
    ) / multiplier
  );
}

// =====================================================
// ANSWERS RECORD
// =====================================================

function getAnswersRecord(
  value: unknown
): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  if (
    typeof value === "string"
  ) {
    try {
      const parsed =
        JSON.parse(value);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<
          string,
          unknown
        >;
      }
    } catch {
      return {};
    }
  }

  return {};
}

// =====================================================
// ANSWER IDS
// =====================================================

function getAnswerIds(
  value: unknown
): number[] {
  let source = value;

  if (
    typeof source === "string"
  ) {
    try {
      source = JSON.parse(source);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map((item) =>
      Number(item)
    )
    .filter(
      (item) =>
        Number.isInteger(item) &&
        item > 0
    );
}

// =====================================================
// NORMALIZE ANSWERS
// =====================================================

function normalizeAnswers(
  answers: number[]
): number[] {
  return [...answers].sort(
    (a, b) => a - b
  );
}

// =====================================================
// EXACT ANSWER COMPARISON
// =====================================================

function isSameAnswers(
  userAnswer: number[],
  correctAnswers: number[]
): boolean {
  const user =
    normalizeAnswers(
      userAnswer
    );

  const correct =
    normalizeAnswers(
      correctAnswers
    );

  if (
    user.length !==
    correct.length
  ) {
    return false;
  }

  return correct.every(
    (id, index) =>
      user[index] === id
  );
}

// =====================================================
// MATCHING CORRECT PAIRS
// =====================================================

function getMatchingPairs(
  question: PsychometricQuestion
) {
  return question.answerOptions
    .filter((option) =>
      option.text.startsWith(
        "L|"
      )
    )
    .map((option) => {
      const parts =
        option.text.split("|");

      return {
        leftId: Number(parts[1]),
        correctRightId:
          Number(parts[3]),
      };
    })
    .filter(
      (pair) =>
        Number.isInteger(
          pair.leftId
        ) &&
        Number.isInteger(
          pair.correctRightId
        )
    )
    .sort(
      (a, b) =>
        a.leftId - b.leftId
    );
}

// =====================================================
// SCORE MATCHING
//
// За кожну правильну пару —
// points / кількість пар.
// =====================================================

function getMatchingScore(
  question: PsychometricQuestion,
  userAnswer: number[]
): number {
  const pairs =
    getMatchingPairs(
      question
    );

  if (pairs.length === 0) {
    return 0;
  }

  let correctPairs = 0;

  pairs.forEach(
    (pair, index) => {
      if (
        userAnswer[index] ===
        pair.correctRightId
      ) {
        correctPairs++;
      }
    }
  );

  return (
    question.points *
    (correctPairs /
      pairs.length)
  );
}

// =====================================================
// SCORE SEQUENCE
//
// Для послідовності порядок ID
// має збігатися з правильним порядком.
// =====================================================

function getSequenceScore(
  question: PsychometricQuestion,
  userAnswer: number[]
): number {
  const correctOrder =
    [...question.answerOptions]
      .filter(
        (option) =>
          !option.text.startsWith(
            "L|"
          ) &&
          !option.text.startsWith(
            "R|"
          )
      )
      .sort(
        (a, b) =>
          a.order - b.order
      )
      .map(
        (option) =>
          option.id
      );

  if (
    correctOrder.length === 0
  ) {
    return 0;
  }

  if (
    userAnswer.length !==
    correctOrder.length
  ) {
    return 0;
  }

  const correct =
    correctOrder.every(
      (id, index) =>
        userAnswer[index] === id
    );

  return correct
    ? question.points
    : 0;
}

// =====================================================
// SCORE SINGLE / MULTIPLE
// =====================================================

function getChoiceScore(
  question: PsychometricQuestion,
  userAnswer: number[]
): number {
  const correctAnswers =
    question.answerOptions
      .filter(
        (option) =>
          option.isCorrect
      )
      .map(
        (option) =>
          option.id
      );

  return isSameAnswers(
    userAnswer,
    correctAnswers
  )
    ? question.points
    : 0;
}

// =====================================================
// SCORE QUESTION
// =====================================================

export function getQuestionScore(
  question: PsychometricQuestion,
  rawAnswer: unknown
): number {
  const userAnswer =
    getAnswerIds(
      rawAnswer
    );

  if (
    userAnswer.length === 0
  ) {
    return 0;
  }

  switch (
    question.type
  ) {
    case "matching":
      return getMatchingScore(
        question,
        userAnswer
      );

    case "sequence":
      return getSequenceScore(
        question,
        userAnswer
      );

    case "single":
    case "multiple":
    default:
      return getChoiceScore(
        question,
        userAnswer
      );
  }
}

// =====================================================
// GET RAW ANSWER
// =====================================================

function getQuestionRawAnswer(
  participant: PsychometricParticipant,
  questionId: number
): unknown {
  const answers =
    getAnswersRecord(
      participant.answers
    );

  return answers[
    String(questionId)
  ];
}

// =====================================================
// P-VALUE
//
// P-value =
// сума фактично набраних балів
// усіма учасниками /
// максимальна сума балів.
//
// У відсотках.
// =====================================================

function calculatePValue(
  scores: number[],
  maxPoints: number
): number | null {
  if (
    scores.length === 0 ||
    maxPoints <= 0
  ) {
    return null;
  }

  const totalEarned =
    scores.reduce(
      (sum, score) =>
        sum + score,
      0
    );

  const maximumPossible =
    scores.length *
    maxPoints;

  return round(
    (totalEarned /
      maximumPossible) *
      100,
    2
  );
}

// =====================================================
// MEAN
// =====================================================

function mean(
  values: number[]
): number {
  if (
    values.length === 0
  ) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    values.length
  );
}

// =====================================================
// D-INDEX
//
// Верхня та нижня групи.
// Використовуємо стандартний підхід
// із крайніми 27% вибірки.
//
// Показник:
// середній % виконання сильної групи
// мінус
// середній % виконання слабкої групи.
//
// Значення у відсотках.
// =====================================================

function calculateDIndex(
  participants: PsychometricParticipant[],
  questionScores: number[],
  maxPoints: number
): {
  value: number | null;
  strongGroupSize: number;
  weakGroupSize: number;
} {
  const n =
    participants.length;

  if (
    n < 4 ||
    maxPoints <= 0 ||
    questionScores.length !== n
  ) {
    return {
      value: null,
      strongGroupSize: 0,
      weakGroupSize: 0,
    };
  }

  const indexed =
    participants.map(
      (
        participant,
        index
      ) => ({
        total:
          participant.earnedPoints,
        score:
          questionScores[index],
      })
    );

  indexed.sort(
    (a, b) =>
      b.total - a.total
  );

  const groupSize =
    Math.max(
      1,
      Math.ceil(n * 0.27)
    );

  const strongGroup =
    indexed.slice(
      0,
      groupSize
    );

  const weakGroup =
    indexed.slice(
      n - groupSize
    );

  const strongMean =
    mean(
      strongGroup.map(
        (item) =>
          (item.score /
            maxPoints) *
          100
      )
    );

  const weakMean =
    mean(
      weakGroup.map(
        (item) =>
          (item.score /
            maxPoints) *
          100
      )
    );

  return {
    value: round(
      strongMean -
        weakMean,
      2
    ),
    strongGroupSize:
      strongGroup.length,
    weakGroupSize:
      weakGroup.length,
  };
}

// =====================================================
// PEARSON CORRELATION
// =====================================================

function calculatePearson(
  x: number[],
  y: number[]
): number | null {
  if (
    x.length !== y.length ||
    x.length < 2
  ) {
    return null;
  }

  const xMean =
    mean(x);

  const yMean =
    mean(y);

  let numerator = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (
    let i = 0;
    i < x.length;
    i++
  ) {
    const xDiff =
      x[i] - xMean;

    const yDiff =
      y[i] - yMean;

    numerator +=
      xDiff * yDiff;

    xVariance +=
      xDiff * xDiff;

    yVariance +=
      yDiff * yDiff;
  }

  if (
    xVariance === 0 ||
    yVariance === 0
  ) {
    return null;
  }

  return round(
    numerator /
      Math.sqrt(
        xVariance *
          yVariance
      ),
    3
  );
}

// =====================================================
// RIT
//
// Кореляція між:
// 1. балом за завдання;
// 2. загальним результатом тесту.
//
// Загальний результат включає
// це завдання — саме Rit.
// =====================================================

function calculateRit(
  participants: PsychometricParticipant[],
  questionScores: number[]
): number | null {
  const totalScores =
    participants.map(
      (participant) =>
        participant.earnedPoints
    );

  return calculatePearson(
    questionScores,
    totalScores
  );
}

// =====================================================
// LETTER
// =====================================================

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

// =====================================================
// ANSWER DISTRIBUTION
// =====================================================

function calculateChoiceDistribution(
  question: PsychometricQuestion,
  participants: PsychometricParticipant[]
): AnswerDistributionItem[] {
  const options =
    question.answerOptions.filter(
      (option) =>
        !option.text.startsWith(
          "L|"
        ) &&
        !option.text.startsWith(
          "R|"
        )
    );

  return options.map(
    (option, index) => {
      let count = 0;

      participants.forEach(
        (participant) => {
          const rawAnswer =
            getQuestionRawAnswer(
              participant,
              question.id
            );

          const answer =
            getAnswerIds(
              rawAnswer
            );

          if (
            answer.includes(
              option.id
            )
          ) {
            count++;
          }
        }
      );

      return {
        key: getLetter(index),
        text: option.text,
        count,
        percent:
          participants.length > 0
            ? round(
                (count /
                  participants.length) *
                  100,
                2
              )
            : 0,
      };
    }
  );
}

// =====================================================
// MATCHING DISTRIBUTION
//
// Для matching офіційний формат
// доцільніше подавати за кількістю
// набраних балів.
// =====================================================

function calculateScoreDistribution(
  scores: number[],
  maxPoints: number
): ScoreDistributionItem[] {
  if (
    scores.length === 0
  ) {
    return [];
  }

  const counts =
    new Map<
      number,
      number
    >();

  scores.forEach(
    (score) => {
      const normalized =
        round(
          score,
          2
        );

      counts.set(
        normalized,
        (counts.get(
          normalized
        ) ?? 0) + 1
      );
    }
  );

  return [
    ...counts.entries(),
  ]
    .sort(
      ([a], [b]) =>
        a - b
    )
    .map(
      ([score, count]) => ({
        score,
        count,
        percent:
          round(
            (count /
              scores.length) *
              100,
            2
          ),
      })
    );
}

// =====================================================
// KEY
// =====================================================

function getQuestionKey(
  question: PsychometricQuestion
): string {
  if (
    question.type ===
    "matching"
  ) {
    return getMatchingPairs(
      question
    )
      .map(
        (pair) =>
          `${pair.leftId}–${pair.correctRightId}`
      )
      .join(", ");
  }

  if (
    question.type ===
    "sequence"
  ) {
    return [...question.answerOptions]
      .filter(
        (option) =>
          !option.text.startsWith(
            "L|"
          ) &&
          !option.text.startsWith(
            "R|"
          )
      )
      .sort(
        (a, b) =>
          a.order - b.order
      )
      .map(
        (option, index) =>
          getLetter(
            index
          )
      )
      .join(" → ");
  }

  const correct =
    question.answerOptions
      .filter(
        (option) =>
          option.isCorrect
      )
      .sort(
        (a, b) =>
          a.order - b.order
      );

  return correct
    .map(
      (option) => {
        const index =
          question.answerOptions
            .filter(
              (item) =>
                !item.text.startsWith(
                  "L|"
                ) &&
                !item.text.startsWith(
                  "R|"
                )
            )
            .findIndex(
              (item) =>
                item.id ===
                option.id
            );

        return getLetter(
          index
        );
      }
    )
    .join(", ");
}

// =====================================================
// MAIN
// =====================================================

export function calculateQuestionPsychometrics(
  question: PsychometricQuestion,
  participants: PsychometricParticipant[]
): QuestionPsychometrics {
  const questionScores =
    participants.map(
      (participant) => {
        const rawAnswer =
          getQuestionRawAnswer(
            participant,
            question.id
          );

        return getQuestionScore(
          question,
          rawAnswer
        );
      }
    );

  const maxPoints =
    question.points;

  const pValue =
    calculatePValue(
      questionScores,
      maxPoints
    );

  const dIndex =
    calculateDIndex(
      participants,
      questionScores,
      maxPoints
    );

  const rit =
    calculateRit(
      participants,
      questionScores
    );

  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;

  questionScores.forEach(
    (score, index) => {
      const rawAnswer =
        getQuestionRawAnswer(
          participants[index],
          question.id
        );

      const answer =
        getAnswerIds(
          rawAnswer
        );

      if (
        answer.length === 0
      ) {
        skippedCount++;
      } else if (
        score === maxPoints
      ) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }
  );

  const total =
    participants.length;

  const answerDistribution =
    question.type ===
      "matching" ||
    question.type ===
      "sequence"
      ? []
      : calculateChoiceDistribution(
          question,
          participants
        );

  const scoreDistribution =
    question.type ===
      "matching"
      ? calculateScoreDistribution(
          questionScores,
          maxPoints
        )
      : [];

  return {
    pValue,
    dIndex: dIndex.value,
    rit,

    key:
      getQuestionKey(
        question
      ),

    answerDistribution,

    scoreDistribution,

    correctCount,
    incorrectCount,
    skippedCount,

    correctPercent:
      total > 0
        ? round(
            (correctCount /
              total) *
              100,
            2
          )
        : 0,

    incorrectPercent:
      total > 0
        ? round(
            (incorrectCount /
              total) *
              100,
            2
          )
        : 0,

    skippedPercent:
      total > 0
        ? round(
            (skippedCount /
              total) *
              100,
            2
          )
        : 0,

    meanScore:
      round(
        mean(
          questionScores
        ),
        2
      ),

    maxPoints,

    strongGroupSize:
      dIndex.strongGroupSize,

    weakGroupSize:
      dIndex.weakGroupSize,

    insufficientData:
      participants.length <
        4,
  };
}

// =====================================================
// ALL QUESTIONS
// =====================================================

export function calculateTestPsychometrics(
  questions: PsychometricQuestion[],
  participants: PsychometricParticipant[]
): Map<
  number,
  QuestionPsychometrics
> {
  const result =
    new Map<
      number,
      QuestionPsychometrics
    >();

  questions.forEach(
    (question) => {
      result.set(
        question.id,
        calculateQuestionPsychometrics(
          question,
          participants
        )
      );
    }
  );

  return result;
}