import { Button } from "../ui/button";
import {
  BookOpenCheck,
  Eye,
  EyeClosed,
  FilePenLine,
  Settings2,
} from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { GeneratedQuiz } from "../../types/quiz";
import {
  toggleFocusMode,
  transformWebsite,
  generateQuiz,
} from "../../features";
import { LanguageProficiencyForm } from "../settings";

export default function MainFooter({
  isMicOn,
  toggleMic,
  setOutputText,
  setIsLoading,
  setQuizData,
}: {
  isMicOn: boolean;
  toggleMic: () => void;
  setOutputText: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setQuizData: React.Dispatch<React.SetStateAction<GeneratedQuiz | null>>;
}) {
  async function getCurrentTabUrl() {
    console.log("Getting current tab URL...");
    let [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    console.log("Current tab URL:", tab.url);
    return tab.url;
  }

  const handleFocusModeToggle = async () => {
    const newState = await toggleFocusMode(isMicOn);
    if (newState !== isMicOn) {
      toggleMic();
    }
  };

  const handleWebsiteTransform = () =>
    transformWebsite(setOutputText, setIsLoading);

  const handleGenerateQuiz = () =>
    generateQuiz(setOutputText, setIsLoading, setQuizData);

  return (
    <div className="flex items-center justify-center px-5 w-full max-w-2xl mx-auto mb-2 gap-x-3">
      <Drawer>
        <DrawerTrigger asChild>
          <Button
            onClick={getCurrentTabUrl}
            variant="outline"
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow border border-gray-300 hover:bg-gray-100 transition-all duration-200 bg-black/30 backdrop-blur"
          >
            <Settings2 size={28} />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="pb-4">
            <DrawerTitle className="text-lg">Learning Preferences</DrawerTitle>
            <DrawerDescription className="text-sm">
              Customize your English learning experience
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-6 pb-4 max-h-[65vh] overflow-y-auto">
            <LanguageProficiencyForm />
          </div>
          <DrawerFooter className="pt-4">
            <DrawerClose asChild>
              <Button variant="outline" size="sm">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Transform Website */}
      <Button
        onClick={handleWebsiteTransform}
        variant="outline"
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow border border-gray-300 hover:bg-gray-100 transition-all duration-200 bg-black/30 backdrop-blur"
      >
        <FilePenLine size={28} />
      </Button>

      {/* Focus Mode */}
      <Button
        variant={isMicOn ? "outline" : "destructive"}
        onClick={handleFocusModeToggle}
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow border transition-all duration-200 backdrop-blur"
      >
        {isMicOn ? (
          <Eye size={28} />
        ) : (
          <EyeClosed size={28} className="text-white" />
        )}
      </Button>

      {/* Quiz Generator */}
      <Button
        onClick={handleGenerateQuiz}
        variant="outline"
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow border border-gray-300 hover:bg-gray-100 transition-all duration-200 bg-black/30 backdrop-blur"
      >
        <BookOpenCheck size={28} />
      </Button>
    </div>
  );
}
