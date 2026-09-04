import { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import {
  Sparkles,
  Search,
  BookOpen,
  Plus,
  ShieldCheck,
  Heart,
  Loader2,
  Lock,
  Download,
} from "lucide-react";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  handleFirestoreError,
  testFirestoreConnection,
} from "./lib/firebase.ts";
import { Navbar } from "./components/Navbar.tsx";
import { EntryCard } from "./components/EntryCard.tsx";
import { JournalEditor } from "./components/JournalEditor.tsx";
import { MoodAnalytics } from "./components/MoodAnalytics.tsx";
import { EntryDetailModal } from "./components/EntryDetailModal.tsx";
import { ExportModal } from "./components/ExportModal.tsx";
import { JournalEntry, MOOD_PRESETS, OperationType } from "./types.ts";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>("All");

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  // Errors & Feedback
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Initial Firestore Connection Validation
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // 2. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (!currentUser) {
        setEntries([]);
        setLoadingEntries(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. Firestore Snapshot Listener (strictly isolated by request.auth.uid)
  useEffect(() => {
    if (!authReady || !user) {
      setLoadingEntries(false);
      return;
    }

    setLoadingEntries(true);
    const collectionPath = `users/${user.uid}/entries`;
    const entriesQuery = query(
      collection(db, collectionPath),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      entriesQuery,
      (snapshot) => {
        const docs: JournalEntry[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<JournalEntry, "id">),
        }));
        setEntries(docs);
        setLoadingEntries(false);
      },
      (error) => {
        setLoadingEntries(false);
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );

    return () => unsubscribe();
  }, [user, authReady]);

  // Auth Handlers
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Sign in failed:", err);
      setAuthError(err.message || "Failed to sign in with Google.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error("Sign out failed:", err);
    }
  };

  // CRUD Operations
  const handleSaveEntry = async (entryData: {
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
  }) => {
    if (!user) return;

    if (editingEntry) {
      // Update existing entry
      const path = `users/${user.uid}/entries/${editingEntry.id}`;
      const payload: Partial<JournalEntry> = {
        title: entryData.title,
        content: entryData.content,
        mood: entryData.mood,
        moodScore: entryData.moodScore,
        tags: entryData.tags,
        ...(entryData.coverImageUrl !== undefined ? { coverImageUrl: entryData.coverImageUrl } : {}),
        ...(entryData.coverImagePrompt !== undefined ? { coverImagePrompt: entryData.coverImagePrompt } : {}),
        reflectionInsight: entryData.reflectionInsight || "",
        sentimentAnalysis: entryData.sentimentAnalysis || "",
        keyThemes: entryData.keyThemes || [],
        emotionalTriggers: entryData.emotionalTriggers || [],
        copingStrategies: entryData.copingStrategies || [],
        followUpPrompt: entryData.followUpPrompt || "",
        updatedAt: new Date().toISOString(),
      };

      try {
        await updateDoc(doc(db, `users/${user.uid}/entries`, editingEntry.id), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } else {
      // Create new entry
      const newDocRef = doc(collection(db, `users/${user.uid}/entries`));
      const path = `users/${user.uid}/entries/${newDocRef.id}`;
      const now = new Date().toISOString();

      const newEntryPayload: JournalEntry = {
        id: newDocRef.id,
        userId: user.uid,
        title: entryData.title,
        content: entryData.content,
        mood: entryData.mood,
        moodScore: entryData.moodScore,
        tags: entryData.tags,
        ...(entryData.coverImageUrl ? { coverImageUrl: entryData.coverImageUrl } : {}),
        ...(entryData.coverImagePrompt ? { coverImagePrompt: entryData.coverImagePrompt } : {}),
        reflectionInsight: entryData.reflectionInsight || "",
        sentimentAnalysis: entryData.sentimentAnalysis || "",
        keyThemes: entryData.keyThemes || [],
        emotionalTriggers: entryData.emotionalTriggers || [],
        copingStrategies: entryData.copingStrategies || [],
        followUpPrompt: entryData.followUpPrompt || "",
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(newDocRef, newEntryPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/entries/${entryId}`;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/entries`, entryId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Filter and Search logic
  const filteredEntries = entries.filter((entry) => {
    const matchesMood =
      selectedMoodFilter === "All" || entry.mood === selectedMoodFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      entry.title.toLowerCase().includes(q) ||
      entry.content.toLowerCase().includes(q) ||
      (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(q))) ||
      (entry.reflectionInsight && entry.reflectionInsight.toLowerCase().includes(q));

    return matchesMood && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E0E7FF] to-[#A5F3FC] pb-20 font-sans antialiased text-slate-800">
      {/* Clean Navbar */}
      <Navbar
        user={user}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        onExport={() => setIsExportOpen(true)}
        onNewEntry={() => {
          setEditingEntry(null);
          setIsEditorOpen(true);
        }}
      />

      <main className="max-w-6xl mx-auto px-6 sm:px-12">
        {authError && (
          <div className="mb-6 p-4 rounded-2xl bg-white/70 border border-rose-200 text-rose-800 text-xs shadow-sm flex items-center justify-between">
            <span>{authError}</span>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="text-rose-600 hover:text-rose-900 font-bold ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Not Logged In State */}
        {!user && authReady && (
          <div className="py-12 sm:py-16 text-center max-w-2xl mx-auto">
            <div className="rounded-[40px] bg-white/40 backdrop-blur-2xl border border-white/50 p-8 sm:p-12 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-white mx-auto mb-6 shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-3">
                Your Mindful Reflection Space
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-8 max-w-lg mx-auto">
                A personal sanctuary powered by Gemini AI. Express your thoughts freely, receive compassionate reflection insights, and track emotional valence over time.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left mb-8">
                <div className="p-4 rounded-2xl bg-white/40 border border-white/30">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2.5">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 block">Strict Isolation</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Firestore rules restrict access solely to request.auth.uid.
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/40 border border-white/30">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-2.5">
                    <Heart className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 block">Mood Tracking</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Empathetic mood scoring & longitudinal emotional trajectory.
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/40 border border-white/30">
                  <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center mb-2.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 block">Zero Hardcoded Keys</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Dynamically retrieved via Google Cloud Secret Manager.
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="btn-hero-sign-in"
                onClick={handleGoogleSignIn}
                className="bg-slate-900 text-white px-10 py-4 rounded-full font-semibold text-sm shadow-xl hover:scale-[1.02] transition-transform active:scale-95 inline-flex items-center gap-2.5"
              >
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>Begin with Google Sign-In</span>
              </button>
            </div>
          </div>
        )}

        {/* Logged In Dashboard */}
        {user && (
          <div>
            {/* Mood Analytics Banner */}
            <MoodAnalytics entries={entries} />

            {/* Controls Bar: Search & Mood Filters */}
            <div className="rounded-[32px] bg-white/30 backdrop-blur-xl border border-white/40 p-4 sm:p-5 shadow-lg mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="input-search-journal"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries by keywords, topics, reflections, or #tags..."
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-white/40"
                />
              </div>

              {/* Mood Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedMoodFilter("All")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedMoodFilter === "All"
                      ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                      : "bg-white/40 text-slate-700 hover:bg-white/60 border border-white/40"
                  }`}
                >
                  All Moods
                </button>
                {MOOD_PRESETS.map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setSelectedMoodFilter(m.name)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      selectedMoodFilter === m.name
                        ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                        : "bg-white/40 text-slate-700 hover:bg-white/60 border border-white/40"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Entries Grid */}
            {loadingEntries ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
                <span className="text-xs font-medium">Loading your encrypted reflections...</span>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="rounded-[36px] bg-white/30 backdrop-blur-xl border border-white/40 p-10 text-center max-w-lg mx-auto shadow-lg">
                <div className="w-12 h-12 rounded-full bg-white/60 text-slate-700 flex items-center justify-center mx-auto mb-3 border border-white/40">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-1">
                  {searchQuery || selectedMoodFilter !== "All"
                    ? "No matching reflections found"
                    : "Your journal is ready for your story"}
                </h3>
                <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
                  {searchQuery || selectedMoodFilter !== "All"
                    ? "Try clearing your filters or searching for different keywords."
                    : "Jot down your observations, triumphs, or gentle reflections. Gemini will accompany you with empathetic insights."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEntry(null);
                    setIsEditorOpen(true);
                  }}
                  className="bg-slate-900 text-white px-8 py-3 rounded-full font-semibold text-xs shadow-xl hover:scale-[1.02] transition-transform active:scale-95 inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Write First Reflection</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-medium text-slate-500">
                    Showing {filteredEntries.length} {filteredEntries.length === 1 ? "reflection" : "reflections"}
                  </span>
                  {entries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsExportOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white/40 hover:bg-white/60 border border-white/40 px-3.5 py-1 rounded-full shadow-2xs transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Export All ({entries.length})</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEntries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={(e) => {
                        setEditingEntry(e);
                        setIsEditorOpen(true);
                      }}
                      onDelete={handleDeleteEntry}
                      onViewDetail={(e) => setViewingEntry(e)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Editor Modal */}
      {isEditorOpen && (
        <JournalEditor
          initialEntry={editingEntry}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingEntry(null);
          }}
          onSave={handleSaveEntry}
        />
      )}

      {/* Entry Detail Modal */}
      {viewingEntry && (
        <EntryDetailModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
          onEdit={(e) => {
            setViewingEntry(null);
            setEditingEntry(e);
            setIsEditorOpen(true);
          }}
        />
      )}

      {/* Journal Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        entries={entries}
        userEmail={user?.email}
      />
    </div>
  );
}
