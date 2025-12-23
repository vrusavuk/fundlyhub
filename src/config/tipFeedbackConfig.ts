export type TipMood = 'none' | 'grateful' | 'thrilled' | 'understanding';

export interface MoodConfig {
  messages: string[];
  styles: string;
  showHeart: boolean;
}

export const tipFeedbackConfig: Record<TipMood, MoodConfig> = {
  none: {
    messages: [
      "No worries — 100% goes to the cause.",
      "Every dollar goes directly to them!",
      "Your full donation reaches them.",
    ],
    styles: "text-muted-foreground",
    showHeart: false,
  },
  grateful: {
    messages: [
      "Thank you for supporting our mission!",
      "Your support means everything!",
      "You're helping us keep going!",
      "We appreciate your generosity!",
    ],
    styles: "bg-primary/10 text-primary",
    showHeart: true,
  },
  thrilled: {
    messages: [
      "Wow, you're incredible! 🚀",
      "Above and beyond — thank you!",
      "You just made our day!",
      "Your generosity is inspiring!",
      "That's amazing — thank you so much!",
    ],
    styles: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    showHeart: true,
  },
  understanding: {
    messages: [
      "Every bit counts — thank you!",
      "We appreciate any support!",
      "Still grateful for your help!",
      "Thanks for being with us!",
    ],
    styles: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    showHeart: true,
  },
};
