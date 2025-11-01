export function extractVideoId(url: string): string | null {
  if (!url) return null;

  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    if (url.includes("v=")) {
      return url.split("v=")[1].split("&")[0];
    }
  } catch (error) {
    console.error("Error extracting video ID:", error);
  }

  return null;
}

/**
 * Check if a URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.includes("youtube.com/watch") ||
    url.includes("youtu.be/") ||
    url.includes("youtube.com/shorts") ||
    url.includes("youtube.com/embed")
  );
}

/**
 * Parse SRT format subtitle text into clean readable text
 */
function parseSRTSubtitle(srtText: string): string {
  if (!srtText) return "";

  const lines = srtText.split("\n");
  const textLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line || /^\d+$/.test(line) || /^\d{2}:\d{2}:\d{2}/.test(line)) {
      continue;
    }

    textLines.push(line);
  }

  return textLines.join(" ").replace(/\s+/g, " ").trim();
}

export async function getYouTubeTranscript(
  videoId: string
): Promise<{ text: string; title: string }> {
  const title = "YouTube Video Comprehension Quiz";

  try {
    const url = `https://youtube-captions-transcript-subtitles-video-combiner.p.rapidapi.com/download-all/${videoId}?format_subtitle=srt&format_answer=json`;
    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": "b3175be588mshf2e2f780ab56eb6p11831ejsn9ac16dbc8d19",
        "x-rapidapi-host":
          "youtube-captions-transcript-subtitles-video-combiner.p.rapidapi.com",
      },
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch transcript: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error("No transcripts available for this video");
    }

    let englishTranscript = result.find(
      (item) =>
        item.languageCode === "en" || item.languageCode?.startsWith("en")
    );

    if (!englishTranscript) {
      englishTranscript = result.find((item) =>
        item.languageCode?.toLowerCase().includes("en")
      );
    }

    const transcript = englishTranscript || result[0];

    if (!transcript?.subtitle) {
      throw new Error("No transcript content found");
    }

    const cleanText = parseSRTSubtitle(transcript.subtitle);

    if (!cleanText) {
      throw new Error("Unable to parse transcript content");
    }

    console.log(
      `✓ Successfully fetched ${
        transcript.languageCode || "unknown"
      } transcript (${cleanText.length} characters)`
    );

    return {
      text: cleanText,
      title,
    };
  } catch (error) {
    console.error("Error fetching YouTube transcript:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("403") || errorMessage.includes("404")) {
      throw new Error("Video not found or transcript not available");
    } else if (errorMessage.includes("No transcripts")) {
      throw new Error("This video has no available transcripts");
    }

    throw new Error(`Failed to get transcript: ${errorMessage}`);
  }
}
