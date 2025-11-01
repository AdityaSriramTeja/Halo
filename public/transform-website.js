(() => {
  const HALO_NAMESPACE = "__haloTransformInitialized";
  const globalScope = typeof window !== "undefined" ? window : globalThis;

  if (globalScope[HALO_NAMESPACE]) {
    console.debug(
      "[Halo Transform] Script already initialized; skipping reinjection."
    );
    return;
  }

  globalScope[HALO_NAMESPACE] = true;

  let isTransformActive = false;
  let originalParagraphs = [];
  let chunkMappings = [];
  const HALO_PARAGRAPH_DELIMITER = "<<HALO_BREAK>>";

  const EXCLUDED_ANCESTOR_SELECTOR =
    "header, footer, nav, aside, form, dialog, [role='navigation'], [role='banner'], [role='contentinfo'], [data-testid='InlineNewsletter'], [data-testid='subscribe'], [aria-label='related'], [aria-label='breadcrumb']";

  const EXCLUDED_CLASS_PATTERNS =
    /(nav|menu|footer|header|subscribe|promo|share|related|newsletter)/i;

  function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    if (!style) return false;
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = element.getBoundingClientRect();
    return rect.height > 0 && rect.width > 0;
  }

  function shouldIncludeElement(element) {
    if (!element) return false;
    if (!isVisible(element)) return false;
    if (element.closest(EXCLUDED_ANCESTOR_SELECTOR)) return false;
    const className = element.className || "";
    if (
      typeof className === "string" &&
      EXCLUDED_CLASS_PATTERNS.test(className)
    ) {
      return false;
    }
    if (
      element.getAttribute &&
      element.getAttribute("aria-hidden") === "true"
    ) {
      return false;
    }
    return true;
  }

  function chunkParagraphs(paragraphs) {
    const MAX_CHUNK_CHARS = 1600;
    const MAX_PARAGRAPHS_PER_CHUNK = 4;
    const chunks = [];
    let currentChunk = {
      indexes: [],
      texts: [],
      length: 0,
    };

    const pushChunk = () => {
      if (currentChunk.indexes.length > 0) {
        chunks.push({
          indexes: currentChunk.indexes.slice(),
          texts: currentChunk.texts.slice(),
        });
        currentChunk = { indexes: [], texts: [], length: 0 };
      }
    };

    paragraphs.forEach((paragraph, index) => {
      const text = paragraph.text;
      if (!text) return;

      const exceedsCharLimit =
        currentChunk.length + text.length > MAX_CHUNK_CHARS;
      const exceedsParagraphLimit =
        currentChunk.indexes.length >= MAX_PARAGRAPHS_PER_CHUNK;

      if (exceedsCharLimit || exceedsParagraphLimit) {
        pushChunk();
      }

      currentChunk.indexes.push(index);
      currentChunk.texts.push(text);
      currentChunk.length += text.length;
    });

    pushChunk();
    return chunks;
  }

  // Extract paragraphs directly from the page
  function extractMainContent() {
    console.log("[Halo Transform] Extracting paragraphs...");

    // Try to find the main content area
    const mainContentSelectors = [
      "main",
      "article",
      '[role="main"]',
      ".article-content",
      ".post-content",
      ".entry-content",
      "#content",
      ".content",
    ];

    let mainElement = null;
    for (const selector of mainContentSelectors) {
      mainElement = document.querySelector(selector);
      if (mainElement) {
        console.log(
          "[Halo Transform] Found main content with selector:",
          selector
        );
        break;
      }
    }

    if (!mainElement) {
      const allElements = document.querySelectorAll("div, section, article");
      let maxTextLength = 0;

      for (const el of allElements) {
        const textLength = el.textContent?.trim().length || 0;
        if (textLength > maxTextLength) {
          maxTextLength = textLength;
          mainElement = el;
        }
      }
    }

    if (!mainElement) {
      throw new Error("Could not find main content on this page");
    }

    const paragraphSelectors = "p, h1, h2, h3, h4, h5, h6, blockquote";
    const paragraphElements = mainElement.querySelectorAll(paragraphSelectors);

    const paragraphs = [];
    paragraphElements.forEach((element) => {
      if (!shouldIncludeElement(element)) {
        return;
      }
      const text = element.textContent?.trim();
      if (text && text.length > 20) {
        paragraphs.push({
          element: element,
          text: text,
        });
      }
    });

    console.log(
      `[Halo Transform] Found ${paragraphs.length} paragraphs to transform`
    );

    originalParagraphs = paragraphs;
    const chunks = chunkParagraphs(paragraphs);
    chunkMappings = chunks.map((chunk) => chunk.indexes);

    return {
      segments: chunks.map((chunk) => chunk.texts),
      segmentCount: chunks.length,
      paragraphCount: paragraphs.length,
      delimiter: HALO_PARAGRAPH_DELIMITER,
      mappings: chunkMappings,
    };
  }

  function replaceParagraphs(
    transformedSegments,
    delimiter = HALO_PARAGRAPH_DELIMITER
  ) {
    console.log(
      "[Halo Transform] Replacing paragraphs with transformed content..."
    );
    console.log(
      "[Halo Transform] Original paragraphs:",
      originalParagraphs.length
    );
    console.log(
      "[Halo Transform] Transformed segments:",
      transformedSegments.length
    );

    if (!originalParagraphs || originalParagraphs.length === 0) {
      console.error("[Halo Transform] No paragraphs to replace");
      return;
    }

    if (!chunkMappings || chunkMappings.length === 0) {
      console.error("[Halo Transform] No chunk mappings available");
      return;
    }

    let totalReplaced = 0;

    chunkMappings.forEach((indexes, segmentIndex) => {
      const transformedSegment = transformedSegments[segmentIndex];
      if (!transformedSegment || typeof transformedSegment !== "string") {
        console.warn(
          `[Halo Transform] Missing or invalid segment ${segmentIndex}`
        );
        return;
      }

      let transformedParts = [];

      transformedParts = transformedSegment
        .split(/\n\n+/)
        .map((part) => part.trim())
        .filter(Boolean);

      if (transformedParts.length === 1 && indexes.length > 1) {
        transformedParts = transformedSegment
          .split(/\n+/)
          .map((part) => part.trim())
          .filter(Boolean);
      }

      console.log(
        `[Halo Transform] Segment ${segmentIndex}: ${transformedParts.length} parts for ${indexes.length} original paragraphs`
      );

      indexes.forEach((originalParagraphIndex, localIndex) => {
        const paragraph = originalParagraphs[originalParagraphIndex];
        if (!paragraph || !paragraph.element) {
          console.warn(
            `[Halo Transform] Missing paragraph at index ${originalParagraphIndex}`
          );
          return;
        }

        if (!paragraph.originalText) {
          paragraph.originalText = paragraph.element.textContent;
        }

        let transformedText;

        if (localIndex < transformedParts.length) {
          transformedText = transformedParts[localIndex];
        } else if (transformedParts.length === 1 && indexes.length > 1) {
          if (localIndex === 0) {
            transformedText = transformedParts[0];
          } else {
            transformedText = "";
            paragraph.element.style.display = "none";
          }
        } else {
          console.warn(
            `[Halo Transform] No transformed part for paragraph ${originalParagraphIndex}`
          );
          transformedText = paragraph.text;
        }

        if (transformedText) {
          paragraph.element.textContent = transformedText;
          if (paragraph.element.style.display === "none") {
            paragraph.element.style.display = "";
          }
          totalReplaced++;
        }
      });
    });

    isTransformActive = true;
    console.log(
      `[Halo Transform] Successfully replaced ${totalReplaced} paragraphs with transformed content!`
    );
  }

  function removeTransform() {
    console.log("[Halo Transform] Restoring original text...");

    if (originalParagraphs && originalParagraphs.length > 0) {
      originalParagraphs.forEach((paragraph) => {
        if (paragraph.element && paragraph.originalText) {
          paragraph.element.textContent = paragraph.originalText;
          if (paragraph.element.style.display === "none") {
            paragraph.element.style.display = "";
          }
        }
      });
    }

    isTransformActive = false;
    originalParagraphs = [];
    chunkMappings = [];

    console.log("[Halo Transform] Original text restored");
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "EXTRACT_CONTENT") {
      console.log("[Halo Transform] Received extract content message");

      try {
        const content = extractMainContent();
        sendResponse({
          success: true,
          segments: content.segments,
          segmentCount: content.segmentCount,
          paragraphCount: content.paragraphCount,
          delimiter: content.delimiter,
          mappings: content.mappings,
        });
      } catch (error) {
        console.error("[Halo Transform] Error extracting content:", error);
        sendResponse({
          success: false,
          error: error.message,
        });
      }
      return true;
    }

    if (message.type === "EXTRACT_QUIZ_CONTENT") {
      console.log("[Halo Transform] Received extract quiz content message");

      try {
        const content = extractMainContent();
        const pageTitle = document.title?.trim() || "";
        const paragraphTexts = (originalParagraphs || [])
          .map((p) => p.text?.trim())
          .filter((text) => !!text);

        sendResponse({
          success: true,
          title: pageTitle,
          paragraphs: paragraphTexts,
          paragraphCount: paragraphTexts.length,
          segmentCount: content.segmentCount,
        });
      } catch (error) {
        console.error("[Halo Transform] Error extracting quiz content:", error);
        sendResponse({
          success: false,
          error: error.message,
        });
      }
      return true;
    }

    if (message.type === "SHOW_TRANSFORMED_CONTENT") {
      console.log("[Halo Transform] Received show transformed content message");

      try {
        replaceParagraphs(message.transformedSegments, message.delimiter);

        sendResponse({ success: true });
      } catch (error) {
        console.error(
          "[Halo Transform] Error showing transformed content:",
          error
        );
        sendResponse({
          success: false,
          error: error.message,
        });
      }
      return true;
    }

    if (message.type === "REMOVE_TRANSFORM") {
      console.log("[Halo Transform] Received remove transform message");
      removeTransform();
      sendResponse({ success: true });
      return true;
    }
  });

  console.log("[Halo Transform] Content script loaded");
})();
