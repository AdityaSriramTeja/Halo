import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { Input } from "../ui/input";

interface ReplyToEmailsContentProps {
    onExecute: (params: Record<string, unknown>) => Promise<unknown>;
}

export const ReplyToEmailsContent = ({
    onExecute,
}: ReplyToEmailsContentProps) => {
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [sender, setSender] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [generatedReply, setGeneratedReply] = useState<string>("");

    const handleGenerate = async () => {
        if (!emailSubject.trim() || !emailBody.trim() || !sender.trim()) {
            setGeneratedReply("Please fill in all email details");
            return;
        }

        setIsLoading(true);
        setGeneratedReply("");

        try {
            const result = await onExecute({
                emailContext: {
                    from: sender,
                    subject: emailSubject,
                    body: emailBody,
                },
                tone: "professional",
            });

            // Type assertion to access generatedReply
            const response = result as { generatedReply?: string };
            setGeneratedReply(
                response.generatedReply || "Reply generated successfully!"
            );
        } catch (error) {
            setGeneratedReply(
                `✗ Failed to generate reply: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!generatedReply) {
            return;
        }

        setIsSending(true);

        try {
            // Mock sending email - in real scenario, this would send the email
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setGeneratedReply("✓ Email sent successfully!");
        } catch (error) {
            setGeneratedReply(
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
            className="space-y-3"
        >
            {/* From Field */}
            <div className="space-y-1.5">
                <Label
                    htmlFor="sender"
                    className="text-white/60 text-[11px] font-normal uppercase tracking-wider"
                >
                    From
                </Label>
                <Input
                    id="sender"
                    type="email"
                    placeholder="sender@example.com"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="h-10 bg-transparent border-white/10 text-white placeholder:text-white/40 focus:border-white/30 transition-colors text-sm"
                />
            </div>

            {/* Subject Field */}
            <div className="space-y-1.5">
                <Label
                    htmlFor="subject"
                    className="text-white/60 text-[11px] font-normal uppercase tracking-wider"
                >
                    Subject
                </Label>
                <Input
                    id="subject"
                    placeholder="RE: Project Update"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="h-10 bg-transparent border-white/10 text-white placeholder:text-white/40 focus:border-white/30 transition-colors text-sm"
                />
            </div>

            {/* Email Body */}
            <div className="space-y-1.5">
                <Label
                    htmlFor="body"
                    className="text-white/60 text-[11px] font-normal uppercase tracking-wider"
                >
                    Your email...
                </Label>
                <Textarea
                    id="body"
                    placeholder="Paste the email content here..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="min-h-[140px] bg-transparent border-white/10 text-white placeholder:text-white/30 focus:border-white/30 transition-colors resize-none text-sm leading-relaxed"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6">
                <Button
                    variant={"outline"}
                    onClick={handleGenerate}
                    disabled={
                        isLoading || !emailSubject.trim() || !emailBody.trim()
                    }
                    className="flex-1 "
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
                    disabled={
                        isSending ||
                        !generatedReply ||
                        generatedReply.startsWith("✗")
                    }
                    className="flex-1 "
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

            {/* Generated Reply */}
            {generatedReply && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm"
                >
                    <Label className="text-white/60 text-[11px] font-normal uppercase tracking-wider mb-3 block">
                        Generated Reply
                    </Label>
                    <div className="text-white/90 whitespace-pre-wrap text-sm leading-relaxed">
                        {generatedReply}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};
