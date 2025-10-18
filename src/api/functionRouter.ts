/**
 * Function Router
 * Maps LLM responses to actual function calls
 */

import {
    summarizeWebsite,
    SummarizeWebsiteParams,
    SummarizeWebsiteResponse,
} from "./summarizeWebsite";
import {
    translateInstantly,
    TranslateInstantlyParams,
    TranslateInstantlyResponse,
} from "./translateInstantly";
import {
    wishlistFromYouTube,
    WishlistFromYouTubeParams,
    WishlistFromYouTubeResponse,
} from "./wishlistFromYouTube";
import {
    postToSocials,
    PostToSocialsParams,
    PostToSocialsResponse,
} from "./postToSocials";
import {
    replyToEmails,
    ReplyToEmailsParams,
    ReplyToEmailsResponse,
} from "./replyToEmails";
import {
    generateQuizzes,
    GenerateQuizzesParams,
    GenerateQuizzesResponse,
} from "./generateQuizzes";
import {
    transformWebsites,
    TransformWebsitesParams,
    TransformWebsitesResponse,
} from "./transformWebsites";

export type FunctionName =
    | "summarizeWebsite"
    | "translateInstantly"
    | "wishlistFromYouTube"
    | "postToSocials"
    | "replyToEmails"
    | "generateQuizzes"
    | "transformWebsites";

export type FunctionParams =
    | SummarizeWebsiteParams
    | TranslateInstantlyParams
    | WishlistFromYouTubeParams
    | PostToSocialsParams
    | ReplyToEmailsParams
    | GenerateQuizzesParams
    | TransformWebsitesParams;

export type FunctionResponse =
    | SummarizeWebsiteResponse
    | TranslateInstantlyResponse
    | WishlistFromYouTubeResponse
    | PostToSocialsResponse
    | ReplyToEmailsResponse
    | GenerateQuizzesResponse
    | TransformWebsitesResponse;

export interface FunctionCall {
    functionName: FunctionName;
    params: FunctionParams;
}

export interface FunctionMetadata {
    label: string;
    description: string;
    needsDropdown: boolean;
    icon: string;
}

// Metadata about each function for UI display
export const FUNCTION_METADATA: Record<FunctionName, FunctionMetadata> = {
    summarizeWebsite: {
        label: "Summarize websites",
        description: "Extract and summarize webpage content",
        needsDropdown: false,
        icon: "🌐",
    },
    translateInstantly: {
        label: "Translate instantly",
        description: "Translate text to any language",
        needsDropdown: false,
        icon: "🌍",
    },
    wishlistFromYouTube: {
        label: "Wishlist from YouTube",
        description: "Extract products from YouTube videos",
        needsDropdown: false,
        icon: "📺",
    },
    postToSocials: {
        label: "Post to socials",
        description: "Create and post to social media",
        needsDropdown: true,
        icon: "📱",
    },
    replyToEmails: {
        label: "Reply to emails",
        description: "Generate email replies with AI",
        needsDropdown: true,
        icon: "✉️",
    },
    generateQuizzes: {
        label: "Generate quizzes",
        description: "Create quizzes from content",
        needsDropdown: true,
        icon: "📝",
    },
    transformWebsites: {
        label: "Transform websites",
        description: "Convert webpages to different formats",
        needsDropdown: false,
        icon: "🔄",
    },
};

// Function mapping
const FUNCTION_MAP = {
    summarizeWebsite,
    translateInstantly,
    wishlistFromYouTube,
    postToSocials,
    replyToEmails,
    generateQuizzes,
    transformWebsites,
};

/**
 * Routes LLM response to the appropriate function
 * @param functionCall - The function to call with its parameters
 * @returns Promise with the function response
 */
export async function routeFunction(
    functionCall: FunctionCall
): Promise<FunctionResponse> {
    const { functionName, params } = functionCall;

    if (!(functionName in FUNCTION_MAP)) {
        throw new Error(`Unknown function: ${functionName}`);
    }

    const func = FUNCTION_MAP[functionName];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await func(params as any);
}

/**
 * Parses LLM text response to extract function name and parameters
 * Expected format: "FUNCTION: functionName\nPARAMS: {json params}"
 * @param llmResponse - The text response from the LLM
 * @returns Parsed function call or null if invalid
 */
export function parseLLMResponse(llmResponse: string): FunctionCall | null {
    try {
        // Simple parsing - adjust based on your LLM's output format
        const functionMatch = llmResponse.match(/FUNCTION:\s*(\w+)/i);
        const paramsMatch = llmResponse.match(/PARAMS:\s*({[\s\S]*})/i);

        if (!functionMatch) {
            return null;
        }

        const functionName = functionMatch[1] as FunctionName;
        const params = paramsMatch ? JSON.parse(paramsMatch[1]) : {};

        return {
            functionName,
            params,
        };
    } catch (error) {
        console.error("Failed to parse LLM response:", error);
        return null;
    }
}

/**
 * Gets list of all available functions with their metadata
 */
export function getAvailableFunctions(): Array<
    FunctionMetadata & { name: FunctionName }
> {
    return Object.entries(FUNCTION_METADATA).map(([name, metadata]) => ({
        name: name as FunctionName,
        ...metadata,
    }));
}
