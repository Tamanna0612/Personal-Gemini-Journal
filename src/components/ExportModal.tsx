import { useState } from "react";
import { Download, FileText, File, X, Check, Calendar, AlertCircle } from "lucide-react";
import { JournalEntry } from "../types.ts";
import { exportAsPdf, exportAsPlainText } from "../utils/exportJournal.ts";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  userEmail?: string | null;
}

export function ExportModal({ isOpen, onClose, entries, userEmail }: ExportModalProps) {
  const [format, setFormat] = useState<"pdf" | "txt">("pdf");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [includeAiReflections, setIncludeAiReflections] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (entries.length === 0) {
      setError("You don't have any journal reflections to export yet.");
      return;
    }

    try {
      setIsExporting(true);
      setError(null);

      // Allow UI to render loading state
      await new Promise((resolve) => setTimeout(resolve, 150));

      if (format === "pdf") {
        exportAsPdf(entries, {
          sortOrder,
          userEmail,
          includeAiReflections,
        });
      } else {
        exportAsPlainText(entries, {
          sortOrder,
          userEmail,
          includeAiReflections,
        });
      }

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error("Export failure:", err);
      setError(err.message || "Failed to generate export file. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const earliestDate = entries.length > 0
    ? new Date(Math.min(...entries.map((e) => new Date(e.createdAt).getTime()))).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const latestDate = entries.length > 0
    ? new Date(Math.max(...entries.map((e) => new Date(e.createdAt).getTime()))).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/20 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-[36px] p-6 sm:p-8 flex flex-col shadow-2xl overflow-y-auto my-auto bg-white/50 backdrop-blur-2xl border border-white/60">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/40 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Export Reflections
              </h2>
              <p className="text-xs text-slate-500">
                Download your complete journal history
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-white/70 border border-rose-200 text-rose-800 text-xs shadow-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Overview pill */}
        <div className="p-4 rounded-2xl bg-white/40 border border-white/40 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>
              {entries.length} {entries.length === 1 ? "reflection" : "reflections"}
              {earliestDate && latestDate ? ` (${earliestDate} – ${latestDate})` : ""}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-white/60 px-2.5 py-0.5 rounded-full border border-white/40">
            All Entries
          </span>
        </div>

        {/* Format Selection */}
        <div className="space-y-3 mb-5">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* PDF Option */}
            <button
              type="button"
              onClick={() => setFormat("pdf")}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                format === "pdf"
                  ? "bg-white/90 border-slate-900 shadow-md scale-[1.01]"
                  : "bg-white/30 border-white/40 hover:bg-white/50 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${format === "pdf" ? "bg-rose-100 text-rose-700" : "bg-white/60 text-slate-600"}`}>
                  <File className="w-4 h-4" />
                </div>
                {format === "pdf" && (
                  <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-800">PDF Document</span>
                <span className="text-[11px] text-slate-500">Formatted with typography & headers</span>
              </div>
            </button>

            {/* Plain Text Option */}
            <button
              type="button"
              onClick={() => setFormat("txt")}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                format === "txt"
                  ? "bg-white/90 border-slate-900 shadow-md scale-[1.01]"
                  : "bg-white/30 border-white/40 hover:bg-white/50 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${format === "txt" ? "bg-cyan-100 text-cyan-700" : "bg-white/60 text-slate-600"}`}>
                  <FileText className="w-4 h-4" />
                </div>
                {format === "txt" && (
                  <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-800">Plain Text (.txt)</span>
                <span className="text-[11px] text-slate-500">Lightweight, portable plaintext</span>
              </div>
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
            Export Options
          </label>

          {/* Chronological Sorting */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/40 border border-white/40">
            <span className="text-xs text-slate-700 font-medium">Sort Order</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSortOrder("newest")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  sortOrder === "newest"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white/40 text-slate-600 hover:bg-white/70"
                }`}
              >
                Newest First
              </button>
              <button
                type="button"
                onClick={() => setSortOrder("oldest")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  sortOrder === "oldest"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white/40 text-slate-600 hover:bg-white/70"
                }`}
              >
                Oldest First
              </button>
            </div>
          </div>

          {/* Include Gemini Reflections */}
          <label className="flex items-center justify-between p-3 rounded-2xl bg-white/40 border border-white/40 cursor-pointer hover:bg-white/50 transition-colors">
            <div>
              <span className="text-xs text-slate-700 font-medium block">
                Include Gemini Reflections & Triggers
              </span>
              <span className="text-[11px] text-slate-500">
                Exports AI insights, coping strategies, and sentiment summaries
              </span>
            </div>
            <input
              type="checkbox"
              checked={includeAiReflections}
              onChange={(e) => setIncludeAiReflections(e.target.checked)}
              className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 accent-slate-900"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-medium text-slate-700 hover:text-slate-900 bg-white/40 hover:bg-white/60 border border-white/40 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || entries.length === 0}
            className="px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            {exportSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Exported!</span>
              </>
            ) : isExporting ? (
              <span>Preparing Archive...</span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
