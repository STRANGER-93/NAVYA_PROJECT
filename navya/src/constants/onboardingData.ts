export interface OnboardingItem {
  id: number;
  title: string;
  description: string;
  image: any;
  buttonTitle: string;
}

export const onboardingData: OnboardingItem[] = [
  {
    id: 1,
    title: "Know Your Cycle Better",
    description:
      "Track periods, understand patterns, and prepare for your next cycle.",
    image: require("../../assets/images/cycle.png"),
    buttonTitle: "Next",
  },

  {
    id: 2,
    title: "Understand How You Feel",
    description:
      "Record your daily mood and discover emotional patterns over time.",
    image: require("../../assets/images/mood.png"),
    buttonTitle: "Next",
  },

  {
    id: 3,
    title: "A Safe Space for Your Thoughts",
    description:
      "Write freely in your private journal. Your entries stay on your device.",
    image: require("../../assets/images/journal.png"),
    buttonTitle: "Next",
  },

  {
    id: 4,
    title: "Your Wellness, Your Journey",
    description:
      "Get personalized predictions, mood insights, and supportive recommendations.",
    image: require("../../assets/images/wellness.png"),
    buttonTitle: "Get Started",
  },
];