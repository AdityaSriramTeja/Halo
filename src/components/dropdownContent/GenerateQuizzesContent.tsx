import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

interface GenerateQuizzesContentProps {
    onExecute: (params: Record<string, unknown>) => Promise<unknown>;
}

export const GenerateQuizzesContent = ({
    onExecute,
}: GenerateQuizzesContentProps) => {
    const [topic, setTopic] = useState("");
    const [content, setContent] = useState("");
    const [numQuestions, setNumQuestions] = useState("5");
    const [difficulty, setDifficulty] = useState<string>("medium");
    const [isLoading, setIsLoading] = useState(false);
    const [quizResult, setQuizResult] = useState<{
        title: string;
        questions: QuizQuestion[];
    } | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim() && !content.trim()) {
            return;
        }

        setIsLoading(true);
        setQuizResult(null);

        try {
            const result = await onExecute({
                topic: topic || undefined,
                content: content || undefined,
                numberOfQuestions: parseInt(numQuestions),
                difficulty,
            });

            // Type assertion to access quiz data
            const response = result as {
                title?: string;
                questions?: QuizQuestion[];
            };
            setQuizResult({
                title: response.title || "Generated Quiz",
                questions: response.questions || [],
            });
        } catch (error) {
            console.error("Failed to generate quiz:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
        >
            {!quizResult ? (
                <>
                    {/* Topic */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="topic"
                            className="text-white/60 text-[11px] font-normal uppercase tracking-wider"
                        >
                            Quiz Topic
                        </Label>
                        <Input
                            id="topic"
                            placeholder="e.g., World War II, Machine Learning, Shakespeare"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="h-10 bg-transparent border-white/10 text-white placeholder:text-white/30 focus:border-white/30 transition-colors text-sm"
                        />
                    </div>

                    {/* Source Content */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="content"
                            className="text-white/60 text-[11px] font-normal uppercase tracking-wider"
                        >
                            Source Content (optional)
                        </Label>
                        <Textarea
                            id="content"
                            placeholder="Paste text or leave empty to use current webpage..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[100px] bg-transparent border-white/10 text-white placeholder:text-white/30 focus:border-white/30 transition-colors resize-none text-sm leading-relaxed"
                        />
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="numQuestions"
                                className="text-white/60 text-[11px] font-normal uppercase tracking-wider"
                            >
                                Questions
                            </Label>
                            <Select
                                value={numQuestions}
                                onValueChange={setNumQuestions}
                            >
                                <SelectTrigger className="h-10 bg-transparent border-white/10 text-white text-sm focus:border-white/30">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="15">15</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="difficulty"
                                className="text-white/60 text-[11px] font-normal uppercase tracking-wider"
                            >
                                Difficulty
                            </Label>
                            <Select
                                value={difficulty}
                                onValueChange={setDifficulty}
                            >
                                <SelectTrigger className="h-10 bg-transparent border-white/10 text-white text-sm focus:border-white/30">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">
                                        Medium
                                    </SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={
                            isLoading || (!topic.trim() && !content.trim())
                        }
                        className="w-full h-11 text-sm mt-4 bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Quiz...
                            </>
                        ) : (
                            "Generate Quiz"
                        )}
                    </Button>
                </>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-white/90">
                            {quizResult.title}
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuizResult(null)}
                            className="text-[11px] text-white/60 hover:text-white h-8 px-3"
                        >
                            New Quiz
                        </Button>
                    </div>

                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                        {quizResult.questions.map((q, idx) => (
                            <div
                                key={idx}
                                className="p-4 rounded-lg bg-white/5 border border-white/10"
                            >
                                <p className="text-white/90 text-sm font-medium mb-3 leading-relaxed">
                                    {idx + 1}. {q.question}
                                </p>
                                <div className="space-y-1.5">
                                    {q.options.map((option, optIdx) => (
                                        <div
                                            key={optIdx}
                                            className={`p-2.5 rounded-md text-xs transition-colors ${
                                                optIdx === q.correctAnswer
                                                    ? "bg-green-500/10 border border-green-500/30 text-green-300"
                                                    : "bg-transparent border border-white/10 text-white/70"
                                            }`}
                                        >
                                            {option}
                                        </div>
                                    ))}
                                </div>
                                {q.explanation && (
                                    <p className="text-[11px] text-white/50 mt-2.5 italic leading-relaxed">
                                        💡 {q.explanation}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};
