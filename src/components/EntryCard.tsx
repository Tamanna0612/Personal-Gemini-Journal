import { useState } from "react";
import { Sparkles, Calendar, Trash2, Edit3, ChevronDown, ChevronUp, Lightbulb, Compass, Tag } from "lucide-react";
import { JournalEntry, MOOD_PRESETS } from "../types.ts";

interface EntryCardProps {
  key?: string;
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onViewDetail: (entry: JournalEntry) => void;
}

export function EntryCard({ entry, onEdit, onDelete, onViewDetail }: EntryCardProps) {
  const [expandedReflection, setExpandedReflection] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const preset = MOOD_PRESETS.find((p) => p.name === entry.mood) || MOOD_PRESETS[4];

  const formattedDate = new Date(entry.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = new Date(entry.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      id={`entry-card-${entry.id}`}
      className="p-6 rounded-3xl bg-white/30 hover:bg-white/45 backdrop-blur-xl border border-white/40 hover:border-white/60 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden"
    >
      {/* Mood-Inspired Cover Canvas Banner (Imagen) */}
      {entry.coverImageUrl && (
        <div
          onClick={() => onViewDetail(entry)}
          className="relative -mx-6 -mt-6 mb-4 h-44 overflow-hidden cursor-pointer group/img"
        >
          <img
            src={entry.coverImageUrl}
            alt={entry.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
          {entry.coverImagePrompt && (
            <div className="absolute bottom-2 left-3 right-3 text-[10px] text-white/95 font-medium truncate backdrop-blur-md bg-black/40 px-2.5 py-1 rounded-full border border-white/20">
              <span className="text-purple-300 mr-1">✦</span> {entry.coverImagePrompt}
            </div>
          )}
        </div>
      )}

      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${preset.badgeBg} ${preset.badgeText}`}
            >
              {entry.mood} ({entry.moodScore}/10)
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate} • {formattedTime}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(entry)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all"
              title="Edit Entry"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-full border border-rose-200 shadow-sm">
                <span className="text-[10px] font-medium text-rose-700">Delete?</span>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  className="text-[11px] font-bold text-rose-700 hover:underline"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] text-slate-500 hover:underline ml-1"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-white/60 transition-all"
                title="Delete Entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onViewDetail(entry)}
          className="text-base sm:text-lg font-semibold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer mb-2 line-clamp-1"
        >
          {entry.title}
        </h3>

        {/* Excerpt */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
          {entry.content}
        </p>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {entry.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/50 border border-white/40 text-[11px] font-medium text-slate-600"
              >
                <Tag className="w-2.5 h-2.5 opacity-60" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Gemini Reflection Section */}
      <div className="pt-3 border-t border-white/30 mt-auto">
        {entry.reflectionInsight ? (
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-200/50 p-3.5">
            <div
              onClick={() => setExpandedReflection(!expandedReflection)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  Gemini Reflection Insight
                </span>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                {expandedReflection ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Sentiment snippet */}
            {entry.sentimentAnalysis && !expandedReflection && (
              <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 italic">
                "{entry.sentimentAnalysis}"
              </p>
            )}

            {/* Expanded Content */}
            {expandedReflection && (
              <div className="mt-3 space-y-2.5 pt-2 border-t border-indigo-200/40 text-xs text-slate-600">
                {entry.sentimentAnalysis && (
                  <p className="italic text-slate-700 bg-white/60 p-2.5 rounded-xl border border-white/40">
                    "{entry.sentimentAnalysis}"
                  </p>
                )}
                <div>
                  <div className="flex items-center gap-1 font-semibold text-slate-800 text-[11px] mb-1">
                    <Compass className="w-3 h-3 text-indigo-500" />
                    <span>Mindful Perspective:</span>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed text-[11px] text-slate-600">
                    {entry.reflectionInsight}
                  </p>
                </div>

                {entry.followUpPrompt && (
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-200/50 text-[11px] text-slate-800 flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-[10px] text-cyan-800 uppercase tracking-wider">
                        Tomorrow's Prompt:
                      </span>
                      <span>{entry.followUpPrompt}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between py-1">
            <span className="text-[11px] text-slate-400">No AI reflection yet</span>
            <button
              type="button"
              onClick={() => onEdit(entry)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Reflect</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
