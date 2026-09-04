import { useState, useEffect, useRef, type KeyboardEvent, type FormEvent } from "react";
import {
  Sparkles,
  X,
  Save,
  Tag,
  Loader2,
  Compass,
  HeartHandshake,
  Lightbulb,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Mic,
  MicOff,
  Image as ImageIcon,
} from "lucide-react";
import { JournalEntry, MOOD_PRESETS, GeminiAnalysisResponse } from "../types.ts";

interface JournalEditorProps {
  initialEntry?: JournalEntry | null;
  onSave: (entryData: {
    title: string;
    content: string;
    mood: string;
    moodScore: number;
    tags: string[];
    coverImageUrl?: string;
    coverImagePrompt?: string;
    reflectionInsight?: string;
    sentimentAnalysis?: string;
    keyThemes?: string[];
    emotionalTriggers?: string[];
    copingStrategies?: string[];
    followUpPrompt?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export function JournalEditor({ initialEntry, onSave, onClose }: JournalEditorProps) {
  const [title, setTitle] = useState(initialEntry?.title || "");
  const [content, setContent] = useState(initialEntry?.content || "");
  const [selectedMood, setSelectedMood] = useState(initialEntry?.mood || "Reflective");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || []);
  
  // Cover Image (Imagen / Gemini) state
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(initialEntry?.coverImageUrl);
  const [coverImagePrompt, setCoverImagePrompt] = useState<string | undefined>(initialEntry?.coverImagePrompt);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  // Voice-to-Text (Web Speech API) state
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Gemini Reflection state
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<GeminiAnalysisResponse | null>(
    initialEntry?.reflectionInsight
      ? {
          mood: initialEntry.mood,
          moodScore: initialEntry.moodScore,
          sentimentAnalysis: initialEntry.sentimentAnalysis || "",
          reflectionInsight: initialEntry.reflectionInsight,
          keyThemes: initialEntry.keyThemes || [],
          emotionalTriggers: initialEntry.emotionalTriggers || [],
          copingStrategies: initialEntry.copingStrategies || [],
          followUpPrompt: initialEntry.followUpPrompt,
        }
      : null
  );
  const [error, setError] = useState<string | null>(null);

  // Web Speech API Initialization
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";

      recognition.onresult = (event: any) => {
        let finalChunk = "";
        let interimChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript;
          } else {
            interimChunk += transcript;
          }
        }

        if (finalChunk) {
          setContent((prev) => {
            const trimmed = prev.trim();
            const formatted = finalChunk.trim();
            if (!trimmed) {
              return formatted.charAt(0).toUpperCase() + formatted.slice(1);
            }
            return `${trimmed} ${formatted}`;
          });
          setInterimTranscript("");
        } else {
          setInterimTranscript(interimChunk);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setSpeechNotice("Microphone permission was denied. Please allow microphone access in your browser settings.");
          setIsListening(false);
          isListeningRef.current = false;
        } else if (event.error === "network") {
          setSpeechNotice("Network connectivity issue encountered during speech transcription.");
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognition.onend = () => {
        // If user is still supposed to be listening (some browsers stop on brief silence), restart
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
          setInterimTranscript("");
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn("Could not instantiate SpeechRecognition:", err);
      setSpeechSupported(false);
    }

    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const toggleListening = () => {
    if (!speechSupported) {
      setSpeechNotice("Web Speech API is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    setSpeechNotice(null);

    if (isListening) {
      isListeningRef.current = false;
      setIsListening(false);
      setInterimTranscript("");
      try {
        recognitionRef.current?.stop();
      } catch (err) {
        console.error("Error stopping speech recognition:", err);
      }
    } else {
      isListeningRef.current = true;
      setIsListening(true);
      setInterimTranscript("");
      try {
        recognitionRef.current?.start();
      } catch (err: any) {
        console.error("Error starting speech recognition:", err);
        setIsListening(false);
        isListeningRef.current = false;
        setSpeechNotice(err.message || "Failed to start speech dictation. Check microphone permissions.");
      }
    }
  };

  useEffect(() => {
    if (initialEntry) {
      setTitle(initialEntry.title);
      setContent(initialEntry.content);
      setSelectedMood(initialEntry.mood);
      setTags(initialEntry.tags || []);
      setCoverImageUrl(initialEntry.coverImageUrl);
      setCoverImagePrompt(initialEntry.coverImagePrompt);
      if (initialEntry.reflectionInsight) {
        setAnalysis({
          mood: initialEntry.mood,
          moodScore: initialEntry.moodScore,
          sentimentAnalysis: initialEntry.sentimentAnalysis || "",
          reflectionInsight: initialEntry.reflectionInsight,
          keyThemes: initialEntry.keyThemes || [],
          emotionalTriggers: initialEntry.emotionalTriggers || [],
          copingStrategies: initialEntry.copingStrategies || [],
          followUpPrompt: initialEntry.followUpPrompt,
        });
      }
    }
  }, [initialEntry]);

  const handleAddTag = (e: KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/^#/, "");
      if (cleanTag && !tags.includes(cleanTag) && tags.length < 8) {
        setTags([...tags, cleanTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Generate Mood-Inspired Cover Image with Imagen / Gemini
  const handleGenerateCover = async () => {
    if (!content.trim()) {
      setError("Please write some reflection content first so Imagen can design a personalized mood cover.");
      return;
    }
    setGeneratingCover(true);
    setCoverError(null);

    try {
      const response = await fetch("/api/journal/generate-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Reflection",
          content: content.trim(),
          mood: selectedMood,
          moodScore: analysis?.moodScore || MOOD_PRESETS.find((m) => m.name === selectedMood)?.score || 5,
          tags,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate mood cover image.");
      }

      setCoverImageUrl(data.imageUrl);
      setCoverImagePrompt(data.prompt);
    } catch (err: any) {
      console.error("Cover image generation failed:", err);
      setCoverError(err.message || "Failed to generate mood-inspired cover image.");
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleAnalyzeWithGemini = async () => {
    if (!content.trim()) {
      setError("Please write your journal entry thoughts before requesting a reflection.");
      return;
    }
    setError(null);
    setAnalyzing(true);

    try {
      const response = await fetch("/api/journal/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled Journal Entry",
          content: content.trim(),
          userMood: selectedMood,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gemini reflection request failed.");
      }

      setAnalysis(data.analysis);
      if (data.analysis.mood) {
        // Find closest preset or match
        const matched = MOOD_PRESETS.find(
          (m) => m.name.toLowerCase() === data.analysis.mood.toLowerCase()
        );
        if (matched) {
          setSelectedMood(matched.name);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze reflection with Gemini.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write some content for your entry.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Find mood score from preset or fallback to analysis score
      const currentPreset = MOOD_PRESETS.find((m) => m.name === selectedMood);
      const score = analysis?.moodScore || currentPreset?.score || 5;

      await onSave({
        title: title.trim() || "Untitled Entry",
        content: content.trim(),
        mood: selectedMood,
        moodScore: score,
        tags,
        coverImageUrl,
        coverImagePrompt,
        reflectionInsight: analysis?.reflectionInsight,
        sentimentAnalysis: analysis?.sentimentAnalysis,
        keyThemes: analysis?.keyThemes,
        emotionalTriggers: analysis?.emotionalTriggers,
        copingStrategies: analysis?.copingStrategies,
        followUpPrompt: analysis?.followUpPrompt,
      });
      onClose();
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Could not save entry to Firestore.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/20 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-[36px] p-6 sm:p-10 flex flex-col shadow-2xl overflow-y-auto my-auto bg-white/40 backdrop-blur-2xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/30 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-sm shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-800">
                {initialEntry ? "Edit Reflection" : "New Journal Entry"}
              </h2>
              <p className="text-xs text-slate-500">
                Encrypted in isolated Firestore & evaluated by Gemini AI
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
          <div className="mb-5 p-4 rounded-2xl bg-white/70 border border-rose-200 text-rose-800 text-xs shadow-sm">
            {error}
          </div>
        )}

        {/* Content Form */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Mood-Inspired Cover Image Section (Imagen) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Mood Cover Canvas
              </label>
              {coverImagePrompt && !coverImageUrl && (
                <span className="text-[11px] text-purple-700 font-medium">
                  Artwork prompt stored
                </span>
              )}
            </div>

            {coverImageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/60 shadow-sm group bg-slate-900/10">
                <img
                  src={coverImageUrl}
                  alt="Mood-inspired cover"
                  referrerPolicy="no-referrer"
                  className="w-full aspect-[21/9] sm:aspect-[16/9] max-h-56 object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none" />

                {/* Cover Prompt Pill */}
                {coverImagePrompt && (
                  <div className="absolute bottom-3 left-3 right-28 text-[11px] text-white/90 font-medium truncate backdrop-blur-md bg-black/40 px-3 py-1 rounded-full border border-white/20">
                    <span className="text-purple-300 mr-1">✦</span> {coverImagePrompt}
                  </div>
                )}

                {/* Actions overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateCover}
                    disabled={generatingCover}
                    className="px-3 py-1.5 rounded-full bg-white/85 hover:bg-white text-slate-800 text-xs font-semibold backdrop-blur-md shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                    title="Regenerate mood artwork with Imagen"
                  >
                    {generatingCover ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    )}
                    <span>{generatingCover ? "Regenerating..." : "Regenerate"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCoverImageUrl(undefined);
                      setCoverImagePrompt(undefined);
                    }}
                    className="p-1.5 rounded-full bg-black/50 hover:bg-rose-600 text-white backdrop-blur-md shadow-sm transition-all hover:scale-105 active:scale-95"
                    title="Remove cover image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/35 border border-white/50 backdrop-blur-md transition-all hover:bg-white/45">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500/15 via-cyan-500/15 to-indigo-500/15 text-purple-700 flex items-center justify-center border border-purple-200/30">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Mood-Inspired Cover Art (Imagen)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Generates unique 16:9 canvas artwork reflecting your emotion
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-generate-cover"
                  onClick={handleGenerateCover}
                  disabled={generatingCover}
                  className="px-3.5 py-2 rounded-full bg-gradient-to-r from-purple-600/10 to-indigo-600/10 hover:from-purple-600/20 hover:to-indigo-600/20 text-purple-900 border border-purple-300/40 text-xs font-semibold shadow-2xs transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 shrink-0"
                >
                  {generatingCover ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                      <span>Generating Art...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Generate Cover</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {coverError && (
              <p className="text-xs text-rose-600 px-1">{coverError}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="entry-title" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Entry Title
            </label>
            <input
              type="text"
              id="entry-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. A morning of quiet breakthroughs, Thoughts by the water..."
              className="glass-input w-full px-4 py-3 rounded-2xl text-slate-800 placeholder-slate-400 text-base font-medium"
              maxLength={200}
            />
          </div>

          {/* Mood Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Current Emotion / Tone
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_PRESETS.map((preset) => {
                const isSelected = selectedMood === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setSelectedMood(preset.name)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                        : "bg-white/40 text-slate-700 hover:bg-white/60 border border-white/40"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body Content */}
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <label htmlFor="entry-content" className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Journal Reflection
              </label>
              
              <div className="flex items-center gap-3">
                {/* Voice-to-Text Button */}
                <button
                  type="button"
                  id="btn-dictate-speech"
                  onClick={toggleListening}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isListening
                      ? "bg-rose-500 text-white shadow-md animate-pulse"
                      : "bg-white/50 hover:bg-white/70 text-slate-700 border border-white/50 shadow-2xs hover:scale-[1.02] active:scale-95"
                  }`}
                  title={isListening ? "Stop voice dictation" : "Dictate your reflection using speech"}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Listening... (Click to stop)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Dictate with Voice</span>
                    </>
                  )}
                </button>

                <span className="text-xs text-slate-400">
                  {content.length}/20,000 characters
                </span>
              </div>
            </div>

            {/* Active Speech Transcription Feedback */}
            {isListening && (
              <div className="mb-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-200 text-xs text-rose-950 flex items-center justify-between gap-3 shadow-xs transition-all">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                  <div className="truncate text-xs">
                    <span className="font-semibold text-rose-900 mr-1.5">Transcribing:</span>
                    <span className="italic text-slate-700">
                      {interimTranscript ? `"${interimTranscript}"` : "Listening... speak freely into your microphone"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleListening}
                  className="px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] shrink-0 transition-colors"
                >
                  Stop Dictation
                </button>
              </div>
            )}

            {speechNotice && (
              <div className="mb-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between shadow-2xs">
                <span>{speechNotice}</span>
                <button
                  type="button"
                  onClick={() => setSpeechNotice(null)}
                  className="text-amber-800 font-bold ml-2 hover:text-amber-950 text-sm"
                >
                  ✕
                </button>
              </div>
            )}

            <textarea
              id="entry-content"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write freely and honestly, or tap 'Dictate with Voice' above to speak your thoughts. What's on your mind? What gave you joy, created friction, or invited curiosity today?..."
              className="glass-input w-full px-4 py-3.5 rounded-2xl text-slate-800 placeholder-slate-400 text-sm leading-relaxed resize-y min-h-[160px]"
              maxLength={20000}
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Tags & Themes (Press Enter to add)
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/50 border border-white/40 text-xs font-medium text-slate-700 shadow-xs"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-indigo-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {tags.length < 8 && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add tag..."
                    className="glass-input px-3 py-1 rounded-full text-xs w-28 text-slate-700 placeholder-slate-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Gemini AI Reflection Trigger Bar */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Gemini Reflection & Mood Assistant
                </p>
                <p className="text-[11px] text-slate-500">
                  Receive intelligent empathetic perspective, mood scoring, and introspective guidance.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-gemini-reflect"
              disabled={analyzing || !content.trim()}
              onClick={handleAnalyzeWithGemini}
              className="w-full sm:w-auto px-5 py-2 rounded-full text-xs font-medium text-slate-800 bg-white/50 hover:bg-white/80 border border-white/50 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Reflecting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{analysis ? "Regenerate Reflection" : "Reflect with Gemini"}</span>
                </>
              )}
            </button>
          </div>

          {/* Gemini Output Box if Available */}
          {analysis && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-200/50 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-indigo-200/40">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-700">
                    Gemini Mood & Reflection Analysis
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-white/60 text-indigo-800 border border-white/50">
                    Detected: {analysis.mood}
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-white/60 text-cyan-800 border border-white/50">
                    Valence: {analysis.moodScore}/10
                  </span>
                </div>
              </div>

              {/* Sentiment arc */}
              <p className="text-xs text-slate-700 italic bg-white/50 p-3 rounded-2xl border border-white/40">
                "{analysis.sentimentAnalysis}"
              </p>

              {/* Insight */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                  <Compass className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Perspective & Thought Reframing</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                  {analysis.reflectionInsight}
                </p>
              </div>

              {/* Emotional Triggers Identified */}
              {analysis.emotionalTriggers && analysis.emotionalTriggers.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-200/50 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Identified Emotional Triggers / Stressors:</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {analysis.emotionalTriggers.map((trig, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-white/70 border border-rose-200/60 text-xs font-medium text-rose-800 shadow-2xs"
                      >
                        ⚡ {trig}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence-Based Coping Strategies */}
              {analysis.copingStrategies && analysis.copingStrategies.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-200/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Personalized Evidence-Based Coping Practice:</span>
                  </div>
                  <div className="space-y-1.5">
                    {analysis.copingStrategies.map((strat, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-white/60 border border-emerald-200/40 text-xs text-slate-700 leading-relaxed"
                      >
                        {strat}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Themes */}
              {analysis.keyThemes && analysis.keyThemes.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[11px] font-medium text-slate-400">Themes:</span>
                  {analysis.keyThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="px-3 py-0.5 rounded-full bg-white/60 text-purple-700 border border-white/40 text-[11px] font-medium"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              )}

              {/* Follow-up Prompt */}
              {analysis.followUpPrompt && (
                <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-200/50 text-xs text-slate-800 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[11px] text-cyan-800 uppercase tracking-wider mb-0.5">
                      Introspective Seed for Tomorrow:
                    </span>
                    <span>{analysis.followUpPrompt}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/30">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-full text-xs font-medium text-slate-700 hover:text-slate-900 bg-white/40 hover:bg-white/60 border border-white/40 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-entry"
              disabled={saving}
              className="px-8 py-3 rounded-full text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Firestore...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Journal Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
