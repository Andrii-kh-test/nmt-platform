import { Question } from "./question";

export interface Test {
  id?: number;

  title: string;

  // Тип іспиту
  examType: "НМТ" | "ЄВІ" | "ЄФВВ";

  subject: string;

  description: string;

  duration: number;

  schoolYear: string;

  maxPoints: number;

  isPublished: boolean;

  codeRequired: boolean;

  accessCode: string;

  questions: Question[];
}