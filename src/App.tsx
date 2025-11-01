import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  Brain,
} from "lucide-react";
import SiriOrb from "./components/smoothui/ui/SiriOrb";
import { FlipWords } from "./components/ui/flip-words";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MainFooter } from "./components/layout";
import { QuizOverlay } from "./components/quiz";
import { GeneratedQuiz } from "./types/quiz";
import { Card } from "./components/ui/card";
import { ScrollArea } from "./components/ui/scroll-area";

function App() {
  const [isFocusOn, setIsFocusOn] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quizData, setQuizData] = useState<GeneratedQuiz | null>(null);

  // Feature labels for the flip words animation
  const words = [
    "Simplify Complex Text",
    "Generate Reading Quizzes",
    "Enable Focus Mode",
    "Transform Websites",
    "Practice Language Skills",
  ];

  const parseOutputText = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim());
    const items: Array<{
      icon: any;
      text: string;
      type: "success" | "info" | "error";
    }> = [];

    lines.forEach((line) => {
      if (
        line.toLowerCase().includes("success") ||
        line.toLowerCase().includes("complete") ||
        line.toLowerCase().includes("ready")
      ) {
        items.push({
          icon: CheckCircle2,
          text: line.trim(),
          type: "success",
        });
      } else if (
        line.toLowerCase().includes("initializing") ||
        line.toLowerCase().includes("creating") ||
        line.toLowerCase().includes("processing") ||
        line.toLowerCase().includes("analyzing")
      ) {
        items.push({
          icon: Brain,
          text: line.trim(),
          type: "info",
        });
      } else if (
        line.toLowerCase().includes("error") ||
        line.toLowerCase().includes("failed")
      ) {
        items.push({
          icon: AlertCircle,
          text: line.trim(),
          type: "error",
        });
      } else if (line.trim()) {
        items.push({
          icon: FileText,
          text: line.trim(),
          type: "info",
        });
      }
    });

    return items;
  };

  useEffect(() => {
    // Listen for keyboard shortcut from service worker
    const handleMessage = (message: { type: string }) => {
      if (message.type === "TOGGLE_MIC") {
        setIsFocusOn((prev) => !prev);
      }
    };

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "Q") {
        event.preventDefault();
        setIsFocusOn((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const handleTabChange = async () => {
      if (isFocusOn) {
        console.log("Tab changed, disabling focus mode");

        try {
          const tabs = await chrome.tabs.query({});
          for (const tab of tabs) {
            if (tab.id) {
              chrome.tabs.sendMessage(
                tab.id,
                { type: "TOGGLE_FOCUS_MODE", enabled: false },
                () => {
                  if (chrome.runtime.lastError) {
                  }
                }
              );
            }
          }
        } catch (error) {
          console.error("Error disabling focus mode on tab change:", error);
        }

        setIsFocusOn(false);
      }
    };

    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.onActivated.addListener(handleTabChange);
    }

    return () => {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.onActivated.removeListener(handleTabChange);
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFocusOn]);

  const toggleFocus = () => {
    setIsFocusOn((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden p-5">
      <AnimatePresence>
        {quizData && (
          <QuizOverlay quiz={quizData} onClose={() => setQuizData(null)} />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Simple Brand */}
        <div className="text-center space-y-5 mb-10">
          <h1 className="text-4xl font-medium text-white/90 tracking-wide">
            Halo
          </h1>
          <p className="text-xs ">
            <FlipWords words={words} />
          </p>
        </div>

        {/* Orb */}
        <div className="relative mb-8">
          <SiriOrb size={"120px"} animationDuration={20} />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white/60 animate-spin" />
            </div>
          )}
        </div>

        {/* Output */}
        <div className="w-full max-w-md text-muted-foreground">
          <AnimatePresence mode="wait">
            {outputText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="bg-background backdrop-blur border-0">
                  <ScrollArea className="h-64">
                    <div className="p-4 space-y-3">
                      {parseOutputText(outputText).map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg flex-shrink-0 ${
                              item.type === "success"
                                ? "bg-green-500/10"
                                : item.type === "error"
                                ? "bg-red-500/10"
                                : "bg-blue-500/10"
                            }`}
                          >
                            <item.icon
                              className={`w-3.5 h-3.5 ${
                                item.type === "success"
                                  ? "text-green-400"
                                  : item.type === "error"
                                  ? "text-red-400"
                                  : "text-blue-400"
                              }`}
                            />
                          </div>
                          <p
                            className={`text-xs leading-relaxed ${
                              item.type === "success"
                                ? "text-green-100/90"
                                : item.type === "error"
                                ? "text-red-100/90"
                                : "text-white/70"
                            }`}
                          >
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!outputText && !isLoading && (
            <div className="text-center mt-5">
              <p className="text-xs text-white/30">Select a tool below</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <MainFooter
        isMicOn={isFocusOn}
        toggleMic={toggleFocus}
        setOutputText={setOutputText}
        setIsLoading={setIsLoading}
        setQuizData={setQuizData}
      />
    </div>
  );
}

export default App;
