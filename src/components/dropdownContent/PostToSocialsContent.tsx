import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

interface PostToSocialsContentProps {
    onExecute: (params: Record<string, unknown>) => Promise<unknown>;
}

export const PostToSocialsContent = ({
    onExecute,
}: PostToSocialsContentProps) => {
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<string>("");

    const handleRewrite = async () => {
        if (!content.trim()) {
            setResult("Please enter content");
            return;
        }

        setIsLoading(true);
        setResult("");

        try {
            await onExecute({
                content,
                platforms: ["twitter", "facebook", "linkedin", "instagram"],
            });
            setResult(`✓ Post rewritten successfully!`);
        } catch (error) {
            setResult(
                `✗ Failed to rewrite: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!content.trim()) {
            return;
        }

        setIsSending(true);

        try {
            // Mock sending post - in real scenario, this would post to social media
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setResult("✓ Posted successfully to all platforms!");
            setContent("");
        } catch (error) {
            setResult(
                `✗ Failed to send: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        } finally {
            setIsSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* Post Content */}
            <div className="space-y-1.5">
                <Label
                    htmlFor="post-content"
                    className="text-white/60 text-[11px] font-normal uppercase tracking-wider"
                >
                    Post Content
                </Label>
                <Textarea
                    id="post-content"
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[160px] bg-transparent border-white/10 text-white placeholder:text-white/30 focus:border-white/30 transition-colors resize-none text-sm leading-relaxed"
                    maxLength={280}
                />
                <p className="text-[10px] text-white/40 text-right">
                    {content.length}/280
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6">
                <Button
                    variant={"outline"}
                    onClick={handleRewrite}
                    disabled={isLoading || !content.trim()}
                    className="flex-1"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Rewriting...
                        </>
                    ) : (
                        "Rewrite"
                    )}
                </Button>

                <Button
                    onClick={handleSend}
                    disabled={isSending || !content.trim()}
                    className="flex-1"
                >
                    {isSending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        "Send"
                    )}
                </Button>
            </div>

            {/* Result Message */}
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg text-sm ${
                        result.startsWith("✓")
                            ? "bg-green-500/10 text-green-300 border border-green-500/20"
                            : "bg-red-500/10 text-red-300 border border-red-500/20"
                    }`}
                >
                    {result}
                </motion.div>
            )}
        </motion.div>
    );
};
