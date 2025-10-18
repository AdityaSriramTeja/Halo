import { Menu, Mic, MicOff, Paperclip } from "lucide-react";
import SiriOrb from "./components/smoothui/ui/SiriOrb";
import { Button } from "./components/ui/button";
import { ScrollArea } from "./components/ui/scroll-area";
import { FlipWords } from "./components/ui/flip-words";
import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import DropdownPage from "./DropdownPage";
import {
  getAvailableFunctions,
  routeFunction,
  FunctionName,
} from "./api/functionRouter";

function App() {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [outputText, setOutputText] = useState(
    'I can help you discover new contacts, draft concise emails, summarize long message threads, extract key phone numbers, schedule follow‑ups, and even remember contextual details like where you met someone or what project they mentioned last week. Just ask something natural like "find designers in my recent imports," "summarize my last three calls," "add Priya Sharma to a follow‑up list," or "compose a friendly intro for a potential collaborator." I\'ll continuously refine suggestions as you speak or type, and you can interrupt me at any time with a new request. If you want to pivot, try asking for related people, shared companies, missing info gaps, or enrichment data. Ready whenever you are—go ahead and give me something to do.',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<FunctionName | null>(
    null,
  );

  // Get words from the function metadata
  const words = getAvailableFunctions().map((fn) => fn.label);

  useEffect(() => {
    // Listen for keyboard shortcut from service worker
    const handleMessage = (message: { type: string }) => {
      if (message.type === "TOGGLE_MIC") {
        setIsMicOn((prev) => !prev);
      }
    };

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }

    // Listen for Ctrl+Shift+Q in the panel itself
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "Q") {
        event.preventDefault();
        setIsMicOn((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleMic = () => {
    setIsMicOn((prev) => !prev);
  };

  const handleKeyboardClick = async () => {
    // Get all available functions
    const availableFunctions = getAvailableFunctions();

    // Randomly select one
    const randomIndex = 3;
    const selectedFunc = availableFunctions[randomIndex];

    setIsLoading(true);
    setOutputText(`🎯 Testing feature: ${selectedFunc.label}\n\nProcessing...`);

    try {
      // Check if this function needs dropdown
      if (
        selectedFunc.name === "postToSocials" ||
        selectedFunc.name === "replyToEmails" ||
        selectedFunc.name === "generateQuizzes"
      ) {
        // Open dropdown with the selected function
        setSelectedFunction(selectedFunc.name);
        setIsDropdownOpen(true);
        setOutputText(
          `✨ ${selectedFunc.label} requires additional input. Opening form...`,
        );
      } else {
        // Execute the function immediately with mock parameters
        const mockParams = getMockParams(selectedFunc.name);
        const result = await routeFunction({
          functionName: selectedFunc.name,
          params: mockParams,
        });

        // Format and display the result
        const formattedResult = formatResult(selectedFunc.name, result);
        setOutputText(formattedResult);
      }
    } catch (error) {
      setOutputText(
        `❌ Error testing ${selectedFunc.label}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getMockParams = (
    functionName: FunctionName,
  ): Record<string, unknown> => {
    switch (functionName) {
      case "summarizeWebsite":
        return { url: "https://example.com", length: "medium" };
      case "translateInstantly":
        return {
          text: "Hello, how are you?",
          targetLanguage: "Spanish",
        };
      case "wishlistFromYouTube":
        return { videoUrl: "https://youtube.com/watch?v=example" };
      case "transformWebsites":
        return {
          url: "https://example.com",
          format: "markdown",
          includeImages: false,
        };
      default:
        return {};
    }
  };

  const formatResult = (
    functionName: FunctionName,
    result: unknown,
  ): string => {
    const res = result as Record<string, unknown>;

    if (!res.success) {
      return `❌ Failed: ${res.error || "Unknown error"}`;
    }

    let output = `✅ Successfully executed: ${functionName}\n\n`;

    switch (functionName) {
      case "summarizeWebsite":
        output += `📄 Summary:\n${res.summary}\n\n`;
        if (res.keyPoints && Array.isArray(res.keyPoints)) {
          output += "🔑 Key Points:\n";
          res.keyPoints.forEach((point: string) => {
            output += `• ${point}\n`;
          });
        }
        break;
      case "translateInstantly":
        output += `🌍 Translated Text:\n${res.translatedText}\n\n`;
        output += `Detected Language: ${res.detectedLanguage}`;
        break;
      case "wishlistFromYouTube":
        output += `📺 Video: ${res.videoTitle}\n\n`;
        output += "🛒 Wishlist Items:\n";
        if (res.items && Array.isArray(res.items)) {
          res.items.forEach(
            (item: { name: string; timestamp?: string; price?: string }) => {
              output += `• ${item.name}`;
              if (item.timestamp) output += ` (${item.timestamp})`;
              if (item.price) output += ` - ${item.price}`;
              output += "\n";
            },
          );
        }
        break;
      case "transformWebsites":
        output += `🔄 Format: ${res.format}\n\n`;
        if (res.content) {
          output += `Content Preview:\n${String(res.content).substring(
            0,
            200,
          )}...`;
        }
        break;
      default:
        output += JSON.stringify(res, null, 2);
    }

    return output;
  };

  return (
    <div className="flex flex-col h-screen px-4 py-4 overflow-hidden relative">
      {/* Dropdown Menu with Animation */}
      <AnimatePresence>
        {isDropdownOpen && (
          <DropdownPage
            onClose={() => {
              setIsDropdownOpen(false);
              setSelectedFunction(null);
            }}
            initialFunction={selectedFunction}
          />
        )}
      </AnimatePresence>

      {/* header */}
      {/* Attachments slim header */}
      <div className="h-8 w-full flex justify-center items-center mb-2">
        <span className="px-3 py-1 rounded-full bg-secondary/80 flex items-center text-xs text-white/80 font-medium shadow-sm border border-secondary/40">
          <span className="inline-block align-middle mr-1.5">
            <Paperclip size={15} />
          </span>{" "}
          Attachments: pasted image
        </span>
      </div>
      {/* Top space for aesthetic padding */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Animated actions (FlipWords) */}
        {/* Header */}
        <div className="text-4xl font-semibold text-center  mb-5 text-white drop-shadow-lg px-5">
          What Can I Do for You Today?
        </div>
        <div className="text-sm text-muted-foreground mb-16 mt-2 opacity-80 ">
          <FlipWords words={words} />
        </div>
        {/* Siri Orb */}
        <div className="flex justify-center items-center mb-20">
          <SiriOrb
            size={"160px"}
            animationDuration={20}
            className="drop-shadow-2xl "
          />
        </div>
        {/* Animated Output (scrollable, shadcn ScrollArea) now under the orb */}
        <div className="relative w-full max-w-xl mb-10 ">
          <ScrollArea
            className="rounded-xl px-8 py-3 text-white text-center h-40 w-full animate-fade-in flex flex-col gap-1 shadow-lg backdrop-blur-sm text-md "
            style={{
              lineHeight: "1.4",
              maskImage:
                "linear-gradient(to bottom, transparent, black 2.5rem, black calc(100% - 2.5rem), transparent)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent, black 2.5rem, black calc(100% - 2.5rem), transparent)",
            }}
          >
            {/* Dynamic output text */}
            <p
              className={isLoading ? "opacity-60" : ""}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {outputText}
            </p>
          </ScrollArea>
        </div>
      </div>
      {/* Controls at the bottom with Quick Actions in between */}
      <div className="flex items-center justify-between px-5 w-full max-w-2xl mx-auto mb-2 gap-x-5">
        <Button
          variant="outline"
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow border border-gray-300 hover:bg-gray-100 transition-all duration-200 bg-black/30 backdrop-blur"
        >
          <Menu size={28} />
        </Button>
        {/* Quick Actions in between controls */}
        <div
          onClick={handleKeyboardClick}
          className={`bg-secondary flex-1 h-14 rounded-full flex items-center justify-center mx-2 px-4 min-w-[120px] backdrop-blur cursor-pointer hover:bg-secondary/80 transition-all duration-200 active:scale-95 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <span className="text-white/80 text-base">
            {isLoading ? "Testing..." : "Use Keyboard"}
          </span>
        </div>
        <Button
          variant={isMicOn ? "outline" : "destructive"}
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow border transition-all duration-200 backdrop-blur`}
        >
          {isMicOn ? (
            <Mic size={28} />
          ) : (
            <MicOff size={28} className="text-white" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default App;
