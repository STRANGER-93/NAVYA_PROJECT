export type MoodId = "happy" | "sad" | "angry" | "anxious" | "tired" | "stressed";
export type ActivityType = "journal" | "breathing" | "grounding" | "relaxation";

export type MoodConfig = { id: MoodId; label: string; emoji: string; color: string; activity: ActivityType; activityLabel: string };

export const moodConfigurations: Record<MoodId, MoodConfig> = {
  happy: { id: "happy", label: "Happy", emoji: "😊", color: "#FFF6D9", activity: "journal", activityLabel: "✨ Capture This Moment" },
  sad: { id: "sad", label: "Sad", emoji: "😔", color: "#EEF5FF", activity: "journal", activityLabel: "💭 Express Your Feelings" },
  angry: { id: "angry", label: "Angry", emoji: "😠", color: "#FFF0EA", activity: "breathing", activityLabel: "Try a breathing exercise" },
  anxious: { id: "anxious", label: "Anxious", emoji: "😰", color: "#EDFFF4", activity: "grounding", activityLabel: "Try a grounding exercise" },
  tired: { id: "tired", label: "Tired", emoji: "😴", color: "#F2EDFF", activity: "relaxation", activityLabel: "Take a relaxation pause" },
  stressed: { id: "stressed", label: "Stressed", emoji: "😣", color: "#FFF0FA", activity: "breathing", activityLabel: "Try a breathing exercise" },
};

export const getMoodConfiguration = (value: string | undefined) => moodConfigurations[(value as MoodId) in moodConfigurations ? value as MoodId : "happy"];
