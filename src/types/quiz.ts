export type QuizQuestionType = "multiple-choice" | "short-answer";

export interface QuizQuestion {
  type: QuizQuestionType;
  question: string;
  options?: string[];
  answerIndex?: number;
  answerText?: string;
  explanation?: string;
}

export interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
}
