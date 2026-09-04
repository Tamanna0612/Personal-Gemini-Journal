import { useState, useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  Heart,
  BookOpen,
  Brain,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
  Activity,
  Compass,
  Zap,
} from "lucide-react";
import { JournalEntry, SentimentTrendAnalysis } from "../types.ts";

interface MoodAnalyticsProps {
  entries: JournalEntry[];
}

export function MoodAnalytics({ entries }: MoodAnalyticsProps) {
  const [trendsAnalysis, setTrendsAnalysis] = useState<SentimentTrendAnalysis | null>(null);
  const [analyzingTrends, setAnalyzingTrends] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [expandedStrategyIdx, setExpandedStrategyIdx] = useState<number | null>(0);

  const stats = useMemo(() => {
    if (entries.length === 0) return null;

    const total = entries.length;
    const avgScore =
      entries.reduce((acc, curr) => acc + (curr.moodScore || 5), 0) / total;

    // Mood counts
    const moodCounts: { [key: string]: number } = {};
    entries.forEach((e) => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });

    let topMood = entries[0].mood;
    let maxCount = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topMood = mood;
      }
    });

    // Theme frequency
    const themeCounts: { [theme: string]: number } = {};
    entries.forEach((e) => {
      if (e.keyThemes) {
        e.keyThemes.forEach((th) => {
          themeCounts[th] = (themeCounts[th] || 0) + 1;
        });
      }
    });

    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);

    // Aggregated emotional triggers across entries
    const triggerCounts: { [trig: string]: number } = {};
    entries.forEach((e) => {
      if (e.emotionalTriggers && Array.isArray(e.emotionalTriggers)) {
        e.emotionalTriggers.forEach((t) => {
          const clean = t.trim();
          if (clean) {
            triggerCounts[clean] = (triggerCounts[clean] || 0) + 1;
          }
        });
      }
    });

    const topObservedTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      total,
      avgScore: avgScore.toFixed(1),
      topMood,
      topThemes,
      topObservedTriggers,
      recentValences: entries.slice(0, 10).reverse().map((e) => ({
        date: new Date(e.createdAt).toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
        score: e.moodScore || 5,
        mood: e.mood,
      })),
    };
  }, [entries]);

  const handleGenerateTrendsAnalysis = async () => {
    if (entries.length === 0) return;
    setAnalyzingTrends(true);
    setTrendsError(null);

    try {
      // Prepare chronological entries (oldest to newest)
      const chronological = [...entries]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((e) => ({
          date: new Date(e.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          title: e.title,
          mood: e.mood,
          moodScore: e.moodScore,
          contentExcerpt: e.content.slice(0, 350),
          emotionalTriggers: e.emotionalTriggers || [],
        }));

      const res = await fetch("/api/journal/trends-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: chronological }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze longitudinal sentiment trends.");
      }

      setTrendsAnalysis(data.analysis);
    } catch (err: any) {
      console.error("Trends analysis error:", err);
      setTrendsError(err.message || "Failed to complete mood trends analysis.");
    } finally {
      setAnalyzingTrends(false);
    }
  };

  if (!stats) return null;

  return (
    <div className="rounded-[32px] bg-white/30 backdrop-blur-xl border border-white/40 p-6 sm:p-8 shadow-xl mb-8 flex flex-col gap-6">
      {/* Title Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-5 border-b border-white/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-sm shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Mood Analytics & Advanced Sentiment Trends
            </h2>
            <p className="text-xs text-slate-500">
              Emotional baseline, recurring triggers, and personalized coping strategies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateTrendsAnalysis}
            disabled={analyzingTrends || entries.length === 0}
            className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {analyzingTrends ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Trends...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>{trendsAnalysis ? "Re-analyze Trends" : "Analyze Mood Trends & Coping"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white/40 border border-white/30 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            Total Entries
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-2">
            {stats.total}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/40 border border-white/30 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            Avg Valence
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-slate-800">
              {stats.avgScore}
            </span>
            <span className="text-xs text-slate-400">/ 10</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/40 border border-white/30 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            Dominant Mood
          </span>
          <span className="text-lg font-bold text-slate-800 mt-2 truncate">
            {stats.topMood}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/40 border border-white/30 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Reflection Rate
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-2">
            {Math.round(
              (entries.filter((e) => e.reflectionInsight).length / stats.total) * 100
            )}%
          </span>
        </div>
      </div>

      {/* Valence Trend & Observed Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
        {/* Valence Bars */}
        <div className="p-5 rounded-2xl bg-white/40 border border-white/30 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Valence Trajectory (Recent Reflections)
            </h3>
            <div className="flex items-end gap-2 h-24 pt-4 px-1">
              {stats.recentValences.map((val, idx) => {
                const heightPercent = Math.max(15, (val.score / 10) * 100);
                const barColor =
                  idx % 3 === 0
                    ? "bg-purple-500/70"
                    : idx % 3 === 1
                    ? "bg-cyan-500/70"
                    : "bg-indigo-400/70";

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[10px] px-2.5 py-0.5 rounded-full shadow-lg whitespace-nowrap z-10">
                      {val.mood} ({val.score}/10)
                    </div>
                    <div className="w-full bg-white/30 rounded-t-lg overflow-hidden flex items-end h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full ${barColor} rounded-t-lg transition-all duration-500`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {val.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mt-4 pt-3 border-t border-white/30">
            Dominant resonance toward <strong>{stats.topMood}</strong> across your recent entries.
          </p>
        </div>

        {/* Observed Triggers & Themes */}
        <div className="p-5 rounded-2xl bg-white/40 border border-white/30 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              Detected Emotional Stressors & Themes
            </h3>

            {stats.topObservedTriggers.length > 0 ? (
              <div className="mb-4">
                <span className="text-[11px] font-semibold text-rose-700 block mb-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Recurring Triggers:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {stats.topObservedTriggers.map(([trig, count], i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/60 text-[11px] font-medium text-rose-800"
                    >
                      ⚡ {trig} {count > 1 ? `(${count}x)` : ""}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                Core Themes:
              </span>
              {stats.topThemes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {stats.topThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="px-3 py-0.5 rounded-full bg-white/60 border border-white/40 text-xs font-medium text-slate-700"
                    >
                      #{theme}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Themes will emerge as Gemini reflects on your reflections.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/30 text-xs text-slate-500">
            Synthesized across {stats.total} entries for personalized mindfulness.
          </div>
        </div>
      </div>

      {/* Longitudinal Trends & Coping Strategies Section */}
      {trendsError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-xs">
          {trendsError}
        </div>
      )}

      {trendsAnalysis && (
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white/80 to-cyan-50/70 border border-indigo-200/60 shadow-lg space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-indigo-200/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Longitudinal Sentiment & Emotional Trajectory
                </h3>
                <p className="text-[11px] text-slate-500">
                  Synthesized across {trendsAnalysis.analyzedEntriesCount} chronological entries with Gemini
                </p>
              </div>
            </div>

            {/* Trend Direction Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Trajectory:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  trendsAnalysis.trendDirection === "improving"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : trendsAnalysis.trendDirection === "stable"
                    ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                    : trendsAnalysis.trendDirection === "fluctuating"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-rose-100 text-rose-800 border border-rose-300"
                }`}
              >
                {trendsAnalysis.trendDirection}
              </span>
            </div>
          </div>

          {/* Emotional Trajectory Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Sentiment Arc Over Time</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/70 p-4 rounded-2xl border border-indigo-100/80">
              {trendsAnalysis.summary}
            </p>
            <p className="text-xs text-indigo-900 font-medium italic px-2">
              Key Trajectory Note: "{trendsAnalysis.emotionalTrajectory}"
            </p>
          </div>

          {/* Recurring Emotional Triggers */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Recurring Emotional Triggers Mentioned in Reflections</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trendsAnalysis.recurringTriggers.map((trig, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/80 border border-rose-200/70 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      {trig.trigger}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {trig.frequency}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          trig.impact === "high"
                            ? "bg-rose-100 text-rose-700"
                            : trig.impact === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {trig.impact}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {trig.context}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Personalized Evidence-Based Coping Strategies */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Personalized, Evidence-Based Coping Strategies</span>
            </div>
            <div className="space-y-2.5">
              {trendsAnalysis.evidenceBasedCopingStrategies.map((strat, idx) => {
                const isExpanded = expandedStrategyIdx === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-white/80 border border-emerald-200/80 overflow-hidden shadow-xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedStrategyIdx(isExpanded ? null : idx)}
                      className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-emerald-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                          {strat.category}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800">
                          {strat.title}
                        </span>
                      </div>
                      <div className="p-1 rounded-full text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-emerald-100/60 space-y-3 text-xs">
                        <p className="text-slate-600 leading-relaxed italic">
                          Why this helps: {strat.description}
                        </p>
                        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/50">
                          <span className="font-bold text-emerald-900 block mb-1">
                            Step-by-Step Practice:
                          </span>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                            {strat.stepByStepPractice}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resilience Insights */}
          {trendsAnalysis.resilienceInsights && (
            <div className="p-4 rounded-2xl bg-white/70 border border-purple-200/60 text-xs">
              <span className="font-bold text-purple-900 block mb-1">
                ✦ Observed Adaptability & Inner Strengths:
              </span>
              <p className="text-slate-700 leading-relaxed">
                {trendsAnalysis.resilienceInsights}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
