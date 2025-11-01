import { X } from "lucide-react";
import { Button } from "../ui/button";
import { motion } from "motion/react";
import { QuizDisplay } from "./QuizDisplay";
import type { GeneratedQuiz } from "../../types/quiz";

interface QuizOverlayProps {
  quiz: GeneratedQuiz;
  onClose: () => void;
}

export const QuizOverlay = ({ quiz, onClose }: QuizOverlayProps) => {
  return (
    <motion.div
      initial={{
        y: "-100%",
      }}
      animate={{
        y: 0,
        transition: {
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }}
      exit={{
        y: "-100%",
        transition: {
          duration: 0.4,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }}
      className="absolute inset-0 z-50 flex flex-col bg-background backdrop-blur-2xl overflow-hidden"
    >
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 pb-28">
        <div className="container mx-auto max-w-full">
          <QuizDisplay quiz={quiz} />
        </div>
      </div>

      {/* Fixed Close Button at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4">
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20 hover:border-white/40 transition-all duration-300 bg-secondary/80 backdrop-blur-xl hover:bg-secondary/90 hover:scale-110 active:scale-95"
          >
            <X size={28} className="text-white" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
