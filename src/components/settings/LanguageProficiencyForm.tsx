import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { BookOpen, Target, Languages, CheckCircle2 } from "lucide-react";
import {
  CEFRLevel,
  CEFR_LEVELS,
  LanguageProficiencySettings,
  DEFAULT_SETTINGS,
} from "@/types/settings";
import { loadSettings, saveSettings } from "@/lib/utils/settings";

const LEARNING_GOALS = [
  "Vocabulary expansion",
  "Grammar improvement",
  "Reading comprehension",
  "Everyday conversation",
  "Academic English",
  "Business English",
];

interface LanguageProficiencyFormProps {
  onSave?: () => void;
}

export default function LanguageProficiencyForm({
  onSave,
}: LanguageProficiencyFormProps) {
  const [settings, setSettings] =
    useState<LanguageProficiencySettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings().then((loadedSettings) => {
      setSettings(loadedSettings);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSave?.();
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGoal = (goal: string) => {
    setSettings((prev) => ({
      ...prev,
      learningGoals: prev.learningGoals.includes(goal)
        ? prev.learningGoals.filter((g) => g !== goal)
        : [...prev.learningGoals, goal],
    }));
  };

  return (
    <div className="space-y-5">
      {/* CEFR Level Selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
          <Label htmlFor="level" className="text-sm font-semibold">
            Proficiency Level
          </Label>
        </div>
        <Select
          value={settings.level}
          onValueChange={(value) =>
            setSettings({ ...settings, level: value as CEFRLevel })
          }
        >
          <SelectTrigger id="level" className="w-full h-9">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CEFR_LEVELS).map(([level, { label }]) => (
              <SelectItem key={level} value={level} className="text-sm">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground leading-tight">
          {CEFR_LEVELS[settings.level].description}
        </p>
      </div>

      {/* Native Language */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary flex-shrink-0" />
          <Label htmlFor="native" className="text-sm font-semibold">
            Native Language
          </Label>
        </div>
        <Select
          value={settings.nativeLanguage}
          onValueChange={(value) =>
            setSettings({ ...settings, nativeLanguage: value })
          }
        >
          <SelectTrigger id="native" className="w-full h-9">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="Spanish">Spanish</SelectItem>
            <SelectItem value="French">French</SelectItem>
            <SelectItem value="German">German</SelectItem>
            <SelectItem value="Chinese">Chinese</SelectItem>
            <SelectItem value="Japanese">Japanese</SelectItem>
            <SelectItem value="Korean">Korean</SelectItem>
            <SelectItem value="Arabic">Arabic</SelectItem>
            <SelectItem value="Hindi">Hindi</SelectItem>
            <SelectItem value="Portuguese">Portuguese</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Learning Goals */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary flex-shrink-0" />
          <Label className="text-sm font-semibold">Learning Goals</Label>
        </div>
        <div className="space-y-2">
          {LEARNING_GOALS.map((goal) => (
            <div key={goal} className="flex items-center space-x-2">
              <Checkbox
                id={goal}
                checked={settings.learningGoals.includes(goal)}
                onCheckedChange={() => toggleGoal(goal)}
                className="flex-shrink-0"
              />
              <label
                htmlFor={goal}
                className="text-sm leading-tight cursor-pointer select-none"
              >
                {goal}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full"
        size="default"
      >
        {saved ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Saved!
          </>
        ) : (
          <>Save Preferences</>
        )}
      </Button>
    </div>
  );
}
