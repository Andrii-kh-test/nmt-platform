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

export interface MatchingLeftItem {
  id: number;
  text: string;
  correctRightId: number;
}

export interface MatchingRightItem {
  id: number;
  text: string;
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

  points: number;

  shuffleQuestion: boolean;

  options: AnswerOption[];

  // Для завдань на встановлення відповідності
  matchingLeftItems: MatchingLeftItem[];

  matchingRightItems: MatchingRightItem[];

  // Для завдань на встановлення послідовності
  sequenceItems: SequenceItem[];

  // Для відкритої відповіді
  textAnswer: string;

  explanation?: string;
}