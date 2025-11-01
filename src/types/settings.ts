export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LanguageProficiencySettings {
  level: CEFRLevel;
  nativeLanguage: string;
  learningGoals: string[];
}

export const CEFR_LEVELS: Record<
  CEFRLevel,
  { label: string; description: string }
> = {
  A1: {
    label: "A1 - Beginner",
    description:
      "Can understand and use familiar everyday expressions and basic phrases",
  },
  A2: {
    label: "A2 - Elementary",
    description: "Can understand sentences and frequently used expressions",
  },
  B1: {
    label: "B1 - Intermediate",
    description: "Can understand the main points of clear standard input",
  },
  B2: {
    label: "B2 - Upper Intermediate",
    description: "Can understand the main ideas of complex text",
  },
  C1: {
    label: "C1 - Advanced",
    description: "Can understand a wide range of demanding, longer texts",
  },
  C2: {
    label: "C2 - Proficient",
    description: "Can understand virtually everything heard or read with ease",
  },
};

export const DEFAULT_SETTINGS: LanguageProficiencySettings = {
  level: "B1",
  nativeLanguage: "English",
  learningGoals: [],
};
