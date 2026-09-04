export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: string;
  moodScore: number; // 1 to 10
  tags: string[];
  coverImageUrl?: string;
  coverImagePrompt?: string;
  reflectionInsight?: string;
  sentimentAnalysis?: string;
  keyThemes?: string[];
  emotionalTriggers?: string[];
  copingStrategies?: string[];
  followUpPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoverImageResponse {
  imageUrl: string;
  prompt: string;
  styleDescription?: string;
  source?: "imagen" | "curated";
}

export interface GeminiAnalysisResponse {
  mood: string;
  moodScore: number;
  sentimentAnalysis: string;
  reflectionInsight: string;
  keyThemes: string[];
  emotionalTriggers?: string[];
  copingStrategies?: string[];
  followUpPrompt?: string;
}

export interface RecurringTrigger {
  trigger: string;
  frequency: string; // e.g. "Frequent", "Moderate", "Occasional"
  impact: "high" | "medium" | "low";
  context: string;
}

export interface EvidenceBasedCopingStrategy {
  title: string;
  category: "Cognitive (CBT)" | "Somatic / Nervous System" | "Mindfulness & Acceptance (ACT)" | "Behavioral";
  description: string;
  stepByStepPractice: string;
}

export interface SentimentTrendAnalysis {
  trendDirection: "improving" | "stable" | "fluctuating" | "declining";
  summary: string;
  emotionalTrajectory: string;
  recurringTriggers: RecurringTrigger[];
  evidenceBasedCopingStrategies: EvidenceBasedCopingStrategy[];
  resilienceInsights: string;
  analyzedEntriesCount: number;
  generatedAt: string;
}

export interface MoodPreset {
  name: string;
  label: string;
  score: number;
  badgeBg: string;
  badgeText: string;
  gradient: string;
}

export const MOOD_PRESETS: MoodPreset[] = [
  {
    name: "Radiant",
    label: "Radiant & Joyful",
    score: 10,
    badgeBg: "bg-amber-50/80 border-amber-200/80",
    badgeText: "text-amber-800",
    gradient: "from-amber-400 to-orange-400",
  },
  {
    name: "Peaceful",
    label: "Peaceful & Serene",
    score: 9,
    badgeBg: "bg-teal-50/80 border-teal-200/80",
    badgeText: "text-teal-800",
    gradient: "from-teal-400 to-cyan-400",
  },
  {
    name: "Grateful",
    label: "Grateful & Grounded",
    score: 8,
    badgeBg: "bg-emerald-50/80 border-emerald-200/80",
    badgeText: "text-emerald-800",
    gradient: "from-emerald-400 to-teal-400",
  },
  {
    name: "Inspired",
    label: "Inspired & Creative",
    score: 8,
    badgeBg: "bg-cyan-50/80 border-cyan-200/80",
    badgeText: "text-cyan-800",
    gradient: "from-cyan-400 to-blue-400",
  },
  {
    name: "Reflective",
    label: "Reflective & Mindful",
    score: 6,
    badgeBg: "bg-indigo-50/80 border-indigo-200/80",
    badgeText: "text-indigo-800",
    gradient: "from-indigo-400 to-violet-400",
  },
  {
    name: "Restless",
    label: "Restless & Anxious",
    score: 4,
    badgeBg: "bg-purple-50/80 border-purple-200/80",
    badgeText: "text-purple-800",
    gradient: "from-purple-400 to-pink-400",
  },
  {
    name: "Overwhelmed",
    label: "Overwhelmed & Heavy",
    score: 3,
    badgeBg: "bg-rose-50/80 border-rose-200/80",
    badgeText: "text-rose-800",
    gradient: "from-rose-400 to-red-400",
  },
  {
    name: "Exhausted",
    label: "Exhausted & Drained",
    score: 2,
    badgeBg: "bg-slate-100/80 border-slate-200/80",
    badgeText: "text-slate-700",
    gradient: "from-slate-400 to-zinc-400",
  },
];
