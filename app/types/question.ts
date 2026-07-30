import { AnswerOption } from "./answerOption";

export type QuestionType =
  | "single"
  | "multiple"
  | "matching"
  | "sequence";

export interface MatchingPair {
  id: number;
  left: string;
  right: string;
}

export interface SequenceItem {
  id: number;
  text: string;
  order: number;
}

export interface Question {
  id: number;

  order: number;

  type: QuestionType;

  text: string;

  options: AnswerOption[];

  correctAnswers: number[];

  matchingPairs: MatchingPair[];

  sequenceItems: SequenceItem[];

  textAnswer: string;

  points: number;

  explanation?: string;
}