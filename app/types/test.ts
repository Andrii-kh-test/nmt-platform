import { Question } from "./question";

export interface Test {
  id?: number;

  title: string;

  // Тип іспиту
  examType: "НМТ" | "ЄВІ" | "ЄФВВ";

  subject: string;
subjectId?: number;
  description: string;

  duration: number;

  schoolYear: string;

  maxPoints: number;

  // Номер розташування тесту
  // на головній сторінці
  displayOrder: number;

  isPublished: boolean;

  codeRequired: boolean;

  accessCode: string;

  questions: Question[];
}