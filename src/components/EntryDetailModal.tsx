import { X, Sparkles, Calendar, Compass, Lightbulb, Tag, HeartHandshake, Edit3, ShieldAlert, ShieldCheck } from "lucide-react";
import { JournalEntry, MOOD_PRESETS } from "../types.ts";

interface EntryDetailModalProps {
  entry: JournalEntry;
  onClose: () => void;
  onEdit: (entry: JournalEntry) => void;
}

export function EntryDetailModal({ entry, onClose, onEdit }: EntryDetailModalProps) {
  const preset = MOOD_PRESETS.find((p) => p.name === entry.mood) || MOOD_PRESETS[4];

  const formattedDate = new Date(entry.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = new Date(entry.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/20 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-[36px] p-6 sm:p-10 flex flex-col shadow-2xl overflow-y-auto my-auto bg-white/40 backdrop-blur-2xl border border-white/50">
        {/* Cover Image Banner (Imagen) */}
        {entry.coverImageUrl && (
          <div className="relative -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 mb-6 h-56 sm:h-72 overflow-hidden rounded-t-[36px] group shrink-0">
            <img
              src={entry.coverImageUrl}
              alt={entry.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/20" />

            {entry.coverImagePrompt && (
              <div className="absolute bottom-4 left-6 right-6 flex items-center gap-2">
                <div className="text-xs text-white/95 font-medium backdrop-blur-md bg-black/40 px-3 py-1.5 rounded-full border border-white/20 inline-flex items-center gap-1.5 max-w-full">
                  <span className="text-purple-300 font-bold">✦</span>
                  <span className="truncate">{entry.coverImagePrompt}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/30 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-3.5 py-1 rounded-full text-xs font-semibold border ${preset.badgeBg} ${preset.badgeText}`}
              >
                {entry.mood} • Valence {entry.moodScore}/10
              </span>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate} at {formattedTime}</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              {entry.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(entry);
              }}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all"
              title="Edit"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Entry Body */}
        <div className="mb-8">
          <div className="text-sm sm:text-base leading-relaxed text-slate-700 whitespace-pre-line font-normal">
            {entry.content}
          </div>

          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/30">
              {entry.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-white/50 border border-white/40 text-xs font-medium text-slate-600"
                >
                  <Tag className="w-3 h-3 opacity-60" />
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Gemini Reflection Section */}
        {entry.reflectionInsight && (
          <div className="rounded-3xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-200/50 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-200/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-700">
                    Gemini Mood & Reflection Analysis
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Intelligent reflection companion
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-medium bg-white/60 px-3.5 py-1 rounded-full border border-white/50">
                <HeartHandshake className="w-3.5 h-3.5 text-indigo-600" />
                <span>Empathetic Guidance</span>
              </div>
            </div>

            {/* Sentiment Summary */}
            {entry.sentimentAnalysis && (
              <p className="text-xs text-slate-700 italic bg-white/50 p-3 rounded-2xl border border-white/40 leading-relaxed">
                "{entry.sentimentAnalysis}"
              </p>
            )}

            {/* Reflection Insight */}
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs mb-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                <span>Philosophical Reframing & Perspective:</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600 whitespace-pre-line bg-white/40 p-3.5 rounded-2xl border border-white/40">
                {entry.reflectionInsight}
              </p>
            </div>

            {/* Emotional Triggers Identified */}
            {entry.emotionalTriggers && entry.emotionalTriggers.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-200/50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Identified Emotional Triggers / Catalysts:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {entry.emotionalTriggers.map((trig, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-white/70 border border-rose-200/60 text-xs font-medium text-rose-800 shadow-2xs"
                    >
                      ⚡ {trig}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence-Based Coping Strategies */}
            {entry.copingStrategies && entry.copingStrategies.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-200/50 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Personalized Evidence-Based Coping Strategies:</span>
                </div>
                <div className="space-y-2">
                  {entry.copingStrategies.map((strat, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/60 border border-emerald-200/40 text-xs sm:text-sm text-slate-700 leading-relaxed"
                    >
                      {strat}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Themes */}
            {entry.keyThemes && entry.keyThemes.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-xs font-semibold text-slate-500">Themes:</span>
                {entry.keyThemes.map((th, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-white/60 text-purple-700 border border-white/40 text-xs font-medium"
                  >
                    #{th}
                  </span>
                ))}
              </div>
            )}

            {/* Follow up prompt */}
            {entry.followUpPrompt && (
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-200/50 text-xs sm:text-sm text-slate-800 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-xs text-cyan-800 uppercase tracking-wider mb-1">
                    Tomorrow's Introspective Seed:
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {entry.followUpPrompt}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
