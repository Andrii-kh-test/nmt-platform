import { Question } from "./question";

export interface Test {
  id?: number;

  title: string;

  subject: string;

  description: string;

  duration: number;

  schoolYear: string;

  maxPoints: number;

  questions: Question[];

  /**
   * Чи видно тест на головній сторінці
   */
  isPublished: boolean;

  /**
   * Чи потрібен код доступу
   */
  codeRequired: boolean;

  /**
   * Код доступу
   */
  accessCode: string;
}