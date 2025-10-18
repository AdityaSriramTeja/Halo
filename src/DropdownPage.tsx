import { X } from "lucide-react";
import { Button } from "./components/ui/button";
import { motion } from "motion/react";
import {
    PostToSocialsContent,
    ReplyToEmailsContent,
    GenerateQuizzesContent,
} from "./components/dropdownContent";
import { routeFunction, FunctionName } from "./api/functionRouter";

interface DropdownPageProps {
    onClose: () => void;
    initialFunction?: FunctionName | null;
}

type DropdownContentType =
    | "postToSocials"
    | "replyToEmails"
    | "generateQuizzes";

const DropdownPage = ({ onClose, initialFunction }: DropdownPageProps) => {
    // Always require an initialFunction - no default menu page
    const activeContent: DropdownContentType =
        initialFunction === "postToSocials"
            ? "postToSocials"
            : initialFunction === "replyToEmails"
            ? "replyToEmails"
            : initialFunction === "generateQuizzes"
            ? "generateQuizzes"
            : "postToSocials"; // fallback

    const executeFunction = async (
        functionName: FunctionName,
        params: unknown
    ) => {
        try {
            const result = await routeFunction({
                functionName,
                params: params as Record<string, unknown>,
            });
            console.log("Function result:", result);
            return result;
        } catch (error) {
            console.error("Error executing function:", error);
            throw error;
        }
    };

    return (
        <>
            {/* Main dropdown panel */}
            <motion.div
                initial={{
                    y: "-100%",
                }}
                animate={{
                    y: 0,
                    transition: {
                        duration: 0.5,
                        ease: [0.25, 0.1, 0.25, 1], // Smooth easeInOut
                    },
                }}
                exit={{
                    y: "-100%",
                    transition: {
                        duration: 0.4,
                        ease: [0.25, 0.1, 0.25, 1], // Smooth easeInOut
                    },
                }}
                className="absolute inset-0 z-50 flex flex-col px-4 py-6 bg-background backdrop-blur-2xl overflow-hidden "
            >
                {/* Content Area */}
                <div className="mt-[15vh] container mx-auto max-w-xl px-6">
                    {/* Dynamic Content Based on Active Item */}
                    <div className="backdrop-blur-md rounded-2xl p-8 border border-white/10 bg-black/20">
                        {activeContent === "postToSocials" && (
                            <PostToSocialsContent
                                onExecute={(params) =>
                                    executeFunction("postToSocials", params)
                                }
                            />
                        )}
                        {activeContent === "replyToEmails" && (
                            <ReplyToEmailsContent
                                onExecute={(params) =>
                                    executeFunction("replyToEmails", params)
                                }
                            />
                        )}
                        {activeContent === "generateQuizzes" && (
                            <GenerateQuizzesContent
                                onExecute={(params) =>
                                    executeFunction("generateQuizzes", params)
                                }
                            />
                        )}
                    </div>
                </div>

                {/* Close Button at Bottom Center */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20 hover:border-white/40 transition-all duration-300 bg-secondary/80 backdrop-blur-xl hover:bg-secondary/90 hover:scale-110 active:scale-95"
                    >
                        <X size={32} className="text-white" />
                    </Button>
                </div>
            </motion.div>
        </>
    );
};

export default DropdownPage;
