import { loadSettings } from "@/lib/utils/settings";
import { CEFR_LEVELS } from "@/types/settings";

declare const LanguageModel: {
  create: (options: {
    expectedOutputs: { type: string; languages: string[] }[];
  }) => Promise<{
    prompt: (text: string, config?: Record<string, unknown>) => Promise<string>;
    destroy: () => void;
  }>;
};

const DEFAULT_MAX_SESSION_POOL = 4;
const HARD_MAX_SESSION_POOL = 6;

export async function transformWebsite(
  setOutputText: React.Dispatch<React.SetStateAction<string>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
): Promise<void> {
  console.log("Starting website transform...");
  setIsLoading(true);
  setOutputText("Initializing transformation...\n");

  type LanguageSession = Awaited<ReturnType<typeof LanguageModel.create>>;
  let session: LanguageSession | null = null;
  let sessionPool: LanguageSession[] = [];

  try {
    setOutputText("Extracting content from page...\n");
    const extractResponse = await chrome.runtime.sendMessage({
      action: "transformWebsite",
    });

    if (!extractResponse?.success) {
      throw new Error(extractResponse?.error || "Failed to extract content");
    }

    const segments: string[][] = extractResponse.segments || [];
    const segmentMappings: number[][] = extractResponse.mappings || [];
    const paragraphCount: number = extractResponse.paragraphCount || 0;
    const delimiter: string = extractResponse.delimiter || "<<HALO_BREAK>>";

    if (segments.length !== segmentMappings.length) {
      throw new Error("Segment/mapping mismatch");
    }

    console.log("Segments extracted:", segments.length);
    console.log("Paragraphs represented:", paragraphCount);
    setOutputText(
      `Found ${paragraphCount} paragraphs across ${segments.length} segments\n\nInitializing AI session...`
    );

    session = await LanguageModel.create({
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    });
    console.log("AI session created");
    setOutputText((prev) => prev + "\nAI session ready\n");

    const userSettings = await loadSettings();
    const cefrLevel = userSettings.level;
    const levelDescription = CEFR_LEVELS[cefrLevel].label;

    if (paragraphCount === 0 || segments.length === 0) {
      setOutputText(
        (prev) =>
          prev + "\nNo content found to transform. Try a different page."
      );
      setIsLoading(false);
      return;
    }

    const basePrompt = `Adapt this text for a ${levelDescription} (${cefrLevel}) English learner. Maintain all proper nouns, names, places, dates, quotes, and numbers exactly as they appear. Adjust vocabulary complexity, sentence structure, and explanations to match the ${cefrLevel} proficiency level. 

IMPORTANT: 
- Preserve the structure - keep the same number of paragraphs
- Separate each paragraph with a blank line (double newline)
- Return ONLY the adapted text, no additional commentary

Text to adapt:`;
    const transformedSegments: string[] = new Array(segments.length).fill("");

    let configuredSessionLimit: number | null = null;
    if (chrome?.storage?.local) {
      try {
        const stored = await chrome.storage.local.get("sessionPoolSize");
        if (
          stored.sessionPoolSize !== undefined &&
          typeof stored.sessionPoolSize === "number"
        ) {
          configuredSessionLimit = stored.sessionPoolSize;
        }
      } catch (storageErr) {
        console.warn(
          "Could not read session pool size from storage:",
          storageErr
        );
      }
    }

    const hardwareThreads =
      typeof navigator !== "undefined" && navigator.hardwareConcurrency
        ? Math.max(1, Math.floor(navigator.hardwareConcurrency))
        : DEFAULT_MAX_SESSION_POOL;

    const sessionPoolUpperBound = Math.max(1, hardwareThreads);
    const configuredUpperBound =
      configuredSessionLimit !== null
        ? Math.max(1, configuredSessionLimit)
        : DEFAULT_MAX_SESSION_POOL;

    const effectiveSessionLimit = Math.min(
      sessionPoolUpperBound,
      configuredUpperBound,
      HARD_MAX_SESSION_POOL
    );

    const targetSessionCount = Math.min(
      Math.max(1, segments.length),
      effectiveSessionLimit
    );

    sessionPool = [session];
    for (let i = 1; i < targetSessionCount; i++) {
      try {
        const newSession = await LanguageModel.create({
          expectedOutputs: [{ type: "text", languages: ["en"] }],
        });
        sessionPool.push(newSession);
      } catch (err) {
        console.warn(`Could not create session #${i + 1}:`, err);
        break;
      }
    }

    const pluralizedSessions =
      sessionPool.length === 1 ? "session" : "sessions";
    setOutputText(
      (prev) =>
        prev +
        `\nProcessing ${paragraphCount} paragraphs using ${sessionPool.length} ${pluralizedSessions}...`
    );

    const progressLabel = "Progress:";
    const updateProgress = (completedParagraphs: number) => {
      const percentParagraphs =
        paragraphCount > 0
          ? Math.round((completedParagraphs / paragraphCount) * 100)
          : 0;
      setOutputText((prev) => {
        const lines = prev.split("\n");
        const progressIndex = lines.findIndex((line) =>
          line.startsWith(progressLabel)
        );
        const progressLine = `${progressLabel} ${completedParagraphs}/${paragraphCount} paragraphs (${percentParagraphs}%)`;
        if (progressIndex >= 0) {
          lines[progressIndex] = progressLine;
        } else {
          lines.push(progressLine);
        }
        return lines.join("\n");
      });
    };

    updateProgress(0);

    const sessionLocks = sessionPool.map(() => Promise.resolve());
    let completedCount = 0;

    const segmentPromises = segments.map(
      (segmentTexts: string[], index: number) => {
        return (async () => {
          const sessionIndex = index % sessionPool.length;
          await sessionLocks[sessionIndex];

          const lockResolve = (async () => {
            try {
              const currentSession = sessionPool[sessionIndex];
              const combined = segmentTexts.join("\n\n");
              const fullPrompt = `${basePrompt}\n\n${combined}`;
              const result = await currentSession.prompt(fullPrompt);
              transformedSegments[index] = result;

              const representedParagraphsCount = segmentMappings[index].length;
              completedCount += representedParagraphsCount;
              updateProgress(completedCount);
            } catch (err) {
              console.error(`Error transforming segment ${index}:`, err);
              transformedSegments[index] = segmentTexts.join("\n\n");
              const representedParagraphsCount = segmentMappings[index].length;
              completedCount += representedParagraphsCount;
              updateProgress(completedCount);
            }
          })();

          sessionLocks[sessionIndex] = lockResolve;
          return lockResolve;
        })();
      }
    );

    await Promise.all(segmentPromises);

    console.log("All paragraphs transformed");
    setOutputText(
      (prev) =>
        prev + "\nTransformation complete\n\nApplying changes to page..."
    );

    const showResponse = await chrome.runtime.sendMessage({
      action: "showTransformedContent",
      transformedSegments: transformedSegments,
      delimiter,
    });

    if (showResponse?.success) {
      setOutputText(
        (prev) =>
          prev +
          "\nPage successfully transformed\n\nTip: Refresh to restore original content"
      );
      setIsLoading(false);
      setTimeout(() => {
        setOutputText("");
      }, 10000);
    } else {
      throw new Error(showResponse?.error || "Failed to apply transformation");
    }
  } catch (error) {
    console.error("Error transforming website:", error);
    setOutputText(
      `Error: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }\n\nPlease try again`
    );
    setIsLoading(false);

    // Clear error after 5 seconds
    setTimeout(() => {
      setOutputText("");
    }, 5000);
  } finally {
    for (let i = 0; i < sessionPool.length; i++) {
      try {
        sessionPool[i].destroy();
      } catch (err) {
        console.warn(`Could not destroy session #${i + 1}:`, err);
      }
    }

    sessionPool = [];
    session = null;
  }
}
