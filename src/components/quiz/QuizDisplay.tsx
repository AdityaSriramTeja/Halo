import { GeneratedQuiz } from "../../types/quiz";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { motion } from "motion/react";
import { useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface QuizDisplayProps {
  quiz: GeneratedQuiz;
}

type UserAnswer = {
  questionIndex: number;
  selectedOption?: number;
  textAnswer?: string;
};

type ValidationResult = {
  questionIndex: number;
  isCorrect: boolean;
  feedback: string;
  explanation?: string;
};

const optionLetter = (index: number) => String.fromCharCode(65 + index);

export function QuizDisplay({ quiz }: QuizDisplayProps) {
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [validationResults, setValidationResults] = useState<
    ValidationResult[] | null
  >(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleMCQAnswer = (questionIndex: number, optionIndex: number) => {
    setUserAnswers((prev) => {
      const existing = prev.filter((a) => a.questionIndex !== questionIndex);
      return [...existing, { questionIndex, selectedOption: optionIndex }];
    });
  };

  const handleShortAnswer = (questionIndex: number, text: string) => {
    setUserAnswers((prev) => {
      const existing = prev.filter((a) => a.questionIndex !== questionIndex);
      return [...existing, { questionIndex, textAnswer: text }];
    });
  };

  const getUserAnswer = (questionIndex: number): UserAnswer | undefined => {
    return userAnswers.find((a) => a.questionIndex === questionIndex);
  };

  const getValidationResult = (
    questionIndex: number
  ): ValidationResult | undefined => {
    return validationResults?.find((r) => r.questionIndex === questionIndex);
  };

  const validateAnswers = async () => {
    setIsValidating(true);

    try {
      const session = await LanguageModel.create({
        expectedOutputs: [{ type: "text", languages: ["en"] }],
      });

      const validationData = quiz.questions.map((question, idx) => {
        const userAnswer = getUserAnswer(idx);
        let userAnswerText = "";

        if (question.type === "multiple-choice") {
          if (userAnswer?.selectedOption !== undefined) {
            userAnswerText =
              question.options?.[userAnswer.selectedOption] || "No answer";
          } else {
            userAnswerText = "No answer provided";
          }
        } else {
          userAnswerText =
            userAnswer?.textAnswer?.trim() || "No answer provided";
        }

        const correctAnswerText =
          question.type === "multiple-choice"
            ? question.options?.[question.answerIndex ?? 0]
            : question.answerText;

        return {
          index: idx,
          type: question.type,
          question: question.question,
          userAnswer: userAnswerText,
          correctAnswer: correctAnswerText,
          context: question.explanation || "",
        };
      });

      const validationPrompt = `You are a language tutor providing honest, constructive feedback. Review these quiz answers carefully.

QUIZ ANSWERS TO VALIDATE:
${validationData
  .map(
    (q) => `
[Question Index: ${q.index}]
Type: ${q.type}
Question: ${q.question}
Student's Answer: "${q.userAnswer}"
Correct Answer: "${q.correctAnswer}"
${q.context ? `Context: ${q.context}` : ""}
`
  )
  .join("\n---\n")}

CRITICAL INSTRUCTIONS:
- You MUST return feedback for question indexes 0 through ${
        quiz.questions.length - 1
      } in order
- For multiple-choice: Mark correct ONLY if user's answer EXACTLY matches the correct answer
- For short-answer: Mark correct if the core meaning matches (flexible with wording)
- If answer is WRONG, explain what's incorrect WITHOUT complimenting the wrong answer
- If answer is CORRECT, briefly affirm
- Each feedback entry must have questionIndex matching the [Question Index: X] above

Return a JSON array with EXACTLY ${
        quiz.questions.length
      } objects in order (indexes 0-${quiz.questions.length - 1}), each with:
- questionIndex: number (0-based, matching the question index above)
- isCorrect: boolean (true ONLY if actually correct)
- feedback: string (honest, constructive 1-2 sentences)
- explanation: string (optional learning tip)

Return ONLY the JSON array, no other text.`;

      const responseSchema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            questionIndex: { type: "number" },
            isCorrect: { type: "boolean" },
            feedback: { type: "string" },
            explanation: { type: "string" },
          },
          required: ["questionIndex", "isCorrect", "feedback"],
        },
        minItems: quiz.questions.length,
        maxItems: quiz.questions.length,
      } as const;

      const result = await session.prompt(validationPrompt, {
        responseConstraint: responseSchema,
      });

      const parsed = JSON.parse(result) as ValidationResult[];
      setValidationResults(parsed);

      session.destroy();
    } catch (error) {
      console.error("Validation error:", error);
      alert("Failed to validate answers. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const allQuestionsAnswered = quiz.questions.every((_, idx) => {
    const answer = getUserAnswer(idx);
    return (
      answer &&
      (answer.selectedOption !== undefined || answer.textAnswer?.trim())
    );
  });

  const correctCount = validationResults
    ? validationResults.filter((r) => r.isCorrect).length
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 text-left"
    >
      {/* Header */}
      <div className=" border-b border-white/10 pb-3 mb-3">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/50 mb-1">
          Language Practice
        </p>
        <h2 className="text-base font-semibold text-white/90 leading-tight">
          {quiz.title}
        </h2>
      </div>

      {/* Score Display */}
      {validationResults && (
        <div className="rounded-lg border border-white/20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-3 text-center mb-3">
          <p className="text-xl font-bold text-white mb-0.5">
            {correctCount} / {quiz.questions.length}
          </p>
          <p className="text-[10px] text-white/70 leading-tight">
            {correctCount === quiz.questions.length
              ? "Perfect score! 🎉"
              : correctCount >= quiz.questions.length * 0.7
              ? "Great job! Keep practicing! 💪"
              : "Keep learning! You're making progress! 📚"}
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-3">
        {quiz.questions.map((question, idx) => {
          const userAnswer = getUserAnswer(idx);
          const validation = getValidationResult(idx);

          return (
            <div
              key={`${idx}-${question.question}`}
              className={`rounded-lg border p-3 shadow-sm backdrop-blur-sm transition-all ${
                validation
                  ? validation.isCorrect
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-red-500/40 bg-red-500/5"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start gap-2 mb-2">
                <div className="flex-1">
                  <h3 className="text-xs font-medium text-white/90 leading-relaxed">
                    <span className="font-bold mr-1">{idx + 1}.</span>
                    {question.question}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className="uppercase text-[9px] tracking-wide px-1.5 py-0"
                  >
                    {question.type === "multiple-choice" ? "MCQ" : "Short"}
                  </Badge>
                  {validation && (
                    <div>
                      {validation.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* MCQ Options */}
              {question.type === "multiple-choice" && question.options && (
                <RadioGroup
                  value={userAnswer?.selectedOption?.toString()}
                  onValueChange={(value: string) =>
                    handleMCQAnswer(idx, parseInt(value))
                  }
                  disabled={validationResults !== null}
                >
                  <div className="space-y-1.5">
                    {question.options.map((option, optionIdx) => {
                      const isSelected =
                        userAnswer?.selectedOption === optionIdx;
                      const isCorrectAnswer =
                        optionIdx === question.answerIndex;
                      const showCorrect = validationResults && isCorrectAnswer;

                      return (
                        <div
                          key={optionIdx}
                          className={`flex items-start gap-2 rounded-md border px-2.5 py-2 text-[11px] leading-snug transition-colors ${
                            showCorrect
                              ? "border-emerald-500/50 bg-emerald-500/10"
                              : isSelected
                              ? "border-blue-500/50 bg-blue-500/10"
                              : "border-white/10 bg-black/20 hover:bg-white/5"
                          }`}
                        >
                          <RadioGroupItem
                            value={optionIdx.toString()}
                            id={`q${idx}-opt${optionIdx}`}
                            className="mt-0.5 flex-shrink-0"
                          />
                          <Label
                            htmlFor={`q${idx}-opt${optionIdx}`}
                            className="flex-1 cursor-pointer text-white/90 leading-snug"
                          >
                            <span className="font-semibold text-[10px] opacity-80 mr-1.5">
                              {optionLetter(optionIdx)}.
                            </span>
                            {option}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              )}

              {/* Short Answer Input */}
              {question.type === "short-answer" && (
                <div className="space-y-2">
                  <Input
                    placeholder="Type your answer here..."
                    value={userAnswer?.textAnswer || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleShortAnswer(idx, e.target.value)
                    }
                    disabled={validationResults !== null}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-xs h-9"
                  />
                </div>
              )}

              {/* Validation Feedback */}
              {validation && (
                <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-2">
                  {/* User's feedback */}
                  <div
                    className={`text-[11px] leading-relaxed p-2 rounded-md ${
                      validation.isCorrect
                        ? "bg-emerald-500/10 text-emerald-100 border border-emerald-500/30"
                        : "bg-red-500/10 text-red-100 border border-red-500/30"
                    }`}
                  >
                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                      {validation.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Correct!
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          Not quite right
                        </>
                      )}
                    </p>
                    <p className="text-white/90">{validation.feedback}</p>
                  </div>

                  {/* Model Answer for short answer questions */}
                  {question.type === "short-answer" && question.answerText && (
                    <div className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-2 text-[11px]">
                      <span className="block text-[9px] font-semibold uppercase tracking-wide opacity-70 mb-1">
                        Expected Answer
                      </span>
                      <p className="text-sky-100 leading-relaxed">
                        {question.answerText}
                      </p>
                    </div>
                  )}

                  {/* Additional explanation */}
                  {validation.explanation && (
                    <p className="text-[10px] leading-relaxed text-white/50 italic px-2">
                      💡 {validation.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 pb-2 space-y-2">
        {!validationResults && (
          <Button
            onClick={validateAnswers}
            disabled={!allQuestionsAnswered || isValidating}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold text-sm h-11"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking Answers...
              </>
            ) : (
              "Check My Answers"
            )}
          </Button>
        )}

        {validationResults && (
          <Button
            onClick={() => {
              setUserAnswers([]);
              setValidationResults(null);
            }}
            variant="outline"
            className="w-full border-white/20 text-white/90 hover:bg-white/10 text-sm h-11"
          >
            Try Again
          </Button>
        )}
      </div>
    </motion.div>
  );
}
