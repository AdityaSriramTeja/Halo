## 🧠 Inspiration

When learning a new language, one of the biggest challenges is understanding real-world content. A beginner reading an English article might struggle with advanced vocabulary or long, complex sentences. They often have to pause constantly to look up meanings, which breaks focus and slows learning.

At the same time, someone who is already highly proficient in English may find most traditional learning resources too basic or repetitive. I wanted to create something that adapts to both types of learners.

The idea behind **Halo** came from imagining a smoother, more natural way to learn.  
What if learners could browse the web or watch videos, and the content automatically matched their level of proficiency?  
With **Gemini Nano**, I was able to build a Chrome extension that does exactly that — making language learning seamless, adaptive, and part of everyday browsing.

---

## 🚀 What It Does

**Halo** is a Chrome side panel extension powered by **Gemini Nano** that transforms everyday web content into an English learning experience.

It adapts any website or YouTube video to the user’s English proficiency level, provides a focused reading experience, and generates comprehension questions in real time.

### ✨ Key Features

- **Adaptive Text Conversion**  
  Adjusts the complexity of text to match the learner’s skill level while keeping the original meaning.

- **Focus Mode**  
  Removes distractions such as images, ads, and headers so users can fully concentrate on the content.

- **Smart Quiz Layer**  
  Creates English comprehension questions from webpages or video transcripts, helping users strengthen vocabulary and understanding in context.

---

## 🛠️ How I Built It

**Halo** is built as a Chrome side panel extension using **Gemini Nano** for text transformation and quiz generation.  
The interface is developed with **React** and **TypeScript**, while **Chrome’s Extension APIs** manage content extraction and page manipulation.

When a user visits a website, a **content script** extracts visible text and divides it into smaller sections.  
**Gemini Nano** processes each batch to simplify or enrich the language according to the selected proficiency level.  
The transformed text then **replaces the original website text directly**, preserving the styling and layout to maintain a seamless reading experience.

For videos, the extension retrieves the **YouTube transcript** and applies the same process to create contextual English comprehension questions.  
User preferences and progress are stored locally, ensuring a private and secure experience.

---

## ⚙️ Challenges I Ran Into

A major challenge was converting large blocks of text into simpler English while keeping the meaning intact. Processing the entire page at once often caused Gemini Nano to lose context or change details. To solve this, I divided the text into smaller batches of four paragraphs each, which made processing more efficient and consistent.

Another difficulty was ensuring that the simplified text still preserved important information. **Gemini Nano** sometimes replaced proper nouns or technical terms, which made the rewritten text inaccurate. This required extensive prompt engineering and experimentation to guide the model to simplify grammar and vocabulary without changing meaning.

Other challenges included handling dynamic single-page applications and maintaining the visual flow of webpages after simplification.

---

## 🏆 Accomplishments That I'm Proud Of

I’m proud of successfully integrating **Gemini Nano** into a real-time Chrome extension workflow and building a reliable text simplification pipeline.  
The batching approach made the extension fast and stable, even for large web pages.

Creating the **Smart Quiz Layer** was another highlight, as it can generate English comprehension questions from any type of content, including YouTube educational videos.  
The side panel interface also feels clean, minimal, and easy to use, fitting naturally into the Chrome browsing experience.

Most importantly, **Halo** makes English learning feel effortless, turning ordinary browsing into a meaningful learning opportunity.

---

## 🚧 What's Next for Halo

Next, I plan to expand **Halo** to support **multiple languages** so learners can use it beyond English.  
I also want to add **gamified progress tracking**, such as streaks and achievement badges, to keep users motivated.

Another goal is to introduce an **adaptive feedback system**, where Gemini Nano analyzes quiz results and adjusts future questions based on the learner’s performance.

Eventually, I want **Halo** to become a **universal language companion for the web**, helping people learn directly from the content they already love to read and watch.

I would also like to add a **dictation feature** that uses audio to help users improve pronunciation and speaking fluency.
