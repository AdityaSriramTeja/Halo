import { GeneratedQuiz, QuizQuestion } from "@/types/quiz";
import { loadSettings } from "@/lib/utils/settings";
import { CEFR_LEVELS } from "@/types/settings";
import {
  isYouTubeUrl,
  extractVideoId,
  getYouTubeTranscript,
} from "./youtubeTranscript";

declare const LanguageModel: {
  create: (options: {
    expectedOutputs: { type: string; languages: string[] }[];
  }) => Promise<{
    prompt: (text: string, config?: Record<string, unknown>) => Promise<string>;
    destroy: () => void;
  }>;
};

declare const Summarizer:
  | undefined
  | {
      availability: () => Promise<string>;
      create: (options?: Record<string, unknown>) => Promise<{
        summarize: (
          content: string,
          config?: Record<string, unknown>
        ) => Promise<string>;
        destroy?: () => void;
      }>;
    };

export async function generateQuiz(
  setOutputText: React.Dispatch<React.SetStateAction<string>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setQuizData: React.Dispatch<React.SetStateAction<GeneratedQuiz | null>>
): Promise<void> {
  console.log("Starting quiz generation...");
  setIsLoading(true);
  setQuizData(null);
  setOutputText("Gathering article content...\n");

  let session: Awaited<ReturnType<typeof LanguageModel.create>> | null = null;
  let summarizerInstance: {
    summarize: (
      content: string,
      config?: Record<string, unknown>
    ) => Promise<string>;
    destroy?: () => void;
  } | null = null;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      windowType: "normal",
    });

    let pageParagraphs: string[] = [];
    let pageTitle = "Reading Comprehension Challenge";

    if (tab?.url && isYouTubeUrl(tab.url)) {
      console.log("Detected YouTube URL:", tab.url);
      setOutputText("Detected YouTube video, fetching transcript...\n");

      const videoId = extractVideoId(tab.url);
      if (!videoId) {
        throw new Error("Could not extract video ID from YouTube URL");
      }

      try {
        const { text, title } = await getYouTubeTranscript(videoId);

        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        pageParagraphs = sentences;
        pageTitle = title || "YouTube Video Quiz";
        setOutputText(
          (prev) => prev + `Successfully extracted YouTube transcript\n`
        );
      } catch (ytError) {
        console.error("YouTube transcript error:", ytError);
        setOutputText(
          (prev) =>
            prev +
            `Could not get YouTube transcript. Trying to extract page content...\n`
        );

        const extractResponse = await chrome.runtime.sendMessage({
          action: "extractQuizContent",
        });
        if (!extractResponse?.success) {
          throw new Error(
            extractResponse?.error || "Failed to extract content"
          );
        }
        pageParagraphs = extractResponse.paragraphs || [];
        pageTitle = extractResponse.title || pageTitle;
      }
    } else {
      setOutputText("Analyzing webpage content...\n");
      const extractResponse = await chrome.runtime.sendMessage({
        action: "extractQuizContent",
      });

      if (!extractResponse?.success) {
        throw new Error(extractResponse?.error || "Failed to extract content");
      }

      pageParagraphs = extractResponse.paragraphs || [];
      pageTitle = extractResponse.title || pageTitle;
    }

    if (pageParagraphs.length === 0) {
      throw new Error("No content found. Try a different page with more text.");
    }

    setOutputText(
      (prev) =>
        prev +
        `Analyzed ${pageParagraphs.length} ${
          tab?.url && isYouTubeUrl(tab.url)
            ? "transcript segments"
            : "paragraphs"
        } from ${tab?.url && isYouTubeUrl(tab.url) ? "video" : "page"}\n`
    );

    const combinedText = pageParagraphs.join("\n\n");
    const MAX_CONTEXT_CHARS = 14000;
    const trimmedText =
      combinedText.length > MAX_CONTEXT_CHARS
        ? combinedText.slice(0, MAX_CONTEXT_CHARS)
        : combinedText;

    let keyPoints = "";
    if (typeof Summarizer !== "undefined") {
      try {
        const availability = await Summarizer.availability();
        if (availability === "readily") {
          summarizerInstance = await Summarizer.create({
            outputLanguage: "en",
          });
          keyPoints = await summarizerInstance.summarize(trimmedText);
          setOutputText((prev) => prev + "Summarized key points\n");
        }
      } catch (summarizerError) {
        console.warn("Summarizer unavailable:", summarizerError);
      }
    }

    session = await LanguageModel.create({
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    });

    const userSettings = await loadSettings();
    const cefrLevel = userSettings.level;
    const levelDescription = CEFR_LEVELS[cefrLevel].label;

    const desiredQuestions = Math.min(
      8,
      Math.max(6, Math.round(pageParagraphs.length / 5))
    );
    const numShortAnswer = Math.ceil(desiredQuestions / 2);
    const numMCQ = desiredQuestions - numShortAnswer;

    const prompt = `You are an encouraging language tutor. Create EXACTLY ${desiredQuestions} comprehension-focused questions for ${levelDescription} (${cefrLevel}) English learners based on the provided article excerpt. 

CRITICAL REQUIREMENTS:
- Create EXACTLY ${numShortAnswer} short-answer questions and EXACTLY ${numMCQ} multiple-choice questions
- Adapt question complexity, vocabulary, and expected answer depth to match ${cefrLevel} proficiency level
- Focus on reading comprehension, vocabulary in context, inference, tone, and summarizing ability appropriate for ${cefrLevel} learners
- For short-answer questions: Provide a complete model answer in the "answerText" field (2-3 sentences, using ${cefrLevel}-appropriate language)
- For multiple-choice questions: Provide 3-4 options with the correct answer indicated by "answerIndex" (0-based), using ${cefrLevel}-appropriate vocabulary
- Every question MUST have a helpful "explanation" field that supports learning at the ${cefrLevel} level

ARTICLE EXCERPT:
${trimmedText}

${keyPoints ? `KEY IDEAS:\n${keyPoints}\n` : ""}

Return a JSON object with:
- title: A descriptive quiz title
- questions: Array of EXACTLY ${desiredQuestions} question objects, each with:
  - question: The question text (${cefrLevel}-appropriate)
  - type: Either "multiple-choice" or "short-answer"
  - For multiple-choice: options (array), answerIndex (number)
  - For short-answer: answerText (complete model answer)
  - explanation: Learning context or tip tailored to ${cefrLevel} learners`;

    const responseSchema = {
      type: "object",
      properties: {
        title: { type: "string" },
        questions: {
          type: "array",
          minItems: desiredQuestions,
          maxItems: desiredQuestions,
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              type: {
                type: "string",
                enum: ["multiple-choice", "short-answer"],
              },
              options: { type: "array", items: { type: "string" } },
              answerIndex: { type: "number" },
              answerText: { type: "string" },
              explanation: { type: "string" },
            },
            required: ["question", "type"],
          },
        },
      },
      required: ["title", "questions"],
    } as const;

    const rawResult = await session.prompt(prompt, {
      responseConstraint: responseSchema,
      omitResponseConstraintInput: true,
    });

    const parsedQuiz = JSON.parse(rawResult) as GeneratedQuiz;

    if (!parsedQuiz?.questions || parsedQuiz.questions.length === 0) {
      throw new Error("The model did not return any quiz questions.");
    }

    const normalizedQuestions: QuizQuestion[] = parsedQuiz.questions
      .slice(0, desiredQuestions)
      .map((question, index) => {
        if (question.type === "multiple-choice") {
          const options = Array.isArray(question.options)
            ? question.options
                .filter(
                  (opt) => typeof opt === "string" && opt.trim().length > 0
                )
                .slice(0, 5)
            : [];
          const safeOptions = options.length >= 2 ? options : ["Yes", "No"];
          const answerIndex =
            typeof question.answerIndex === "number" &&
            question.answerIndex >= 0 &&
            question.answerIndex < safeOptions.length
              ? question.answerIndex
              : 0;
          return {
            type: "multiple-choice",
            question: question.question?.trim() || `Question ${index + 1}`,
            options: safeOptions,
            answerIndex,
            explanation: question.explanation?.trim(),
          } satisfies QuizQuestion;
        }

        return {
          type: "short-answer",
          question: question.question?.trim() || `Question ${index + 1}`,
          answerText:
            question.answerText?.trim() ||
            "Please provide your interpretation based on the article content.",
          explanation: question.explanation?.trim(),
        } satisfies QuizQuestion;
      });

    const quizTitle =
      parsedQuiz.title?.trim() || `${pageTitle} — Language Check`;

    setQuizData({
      title: quizTitle,
      questions: normalizedQuestions,
    });

    setOutputText((prev) => prev + "Quiz generated successfully\n");
  } catch (error) {
    console.error("Error generating quiz:", error);
    setOutputText(
      `Quiz generation failed: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }\n\nTry refreshing or choosing a different article`
    );
    setQuizData(null);
  } finally {
    if (session) {
      try {
        session.destroy();
      } catch (sessionError) {
        console.warn("Failed to destroy quiz session", sessionError);
      }
    }
    if (
      summarizerInstance &&
      typeof summarizerInstance.destroy === "function"
    ) {
      try {
        summarizerInstance.destroy();
      } catch (summarizerError) {
        console.warn("Failed to destroy summarizer", summarizerError);
      }
    }
    setIsLoading(false);
  }
}
