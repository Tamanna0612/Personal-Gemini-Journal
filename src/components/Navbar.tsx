import { Sparkles, Plus, LogOut, LogIn, ShieldCheck, Download } from "lucide-react";
import { User } from "firebase/auth";

interface NavbarProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onNewEntry: () => void;
  onExport: () => void;
}

export function Navbar({ user, onSignIn, onSignOut, onNewEntry, onExport }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full px-6 sm:px-12 h-20 flex items-center justify-between bg-white/20 backdrop-blur-md border-b border-white/30 mb-8">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-sm shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-slate-800">
            Gemini Journal
          </h1>
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Isolated Firestore & Reflection</span>
          </div>
        </div>
      </div>

      {/* Actions & Authentication - Strictly Clean, ZERO placeholder avatars */}
      <div className="flex items-center gap-3 sm:gap-4">
        {user ? (
          <>
            <button
              type="button"
              id="btn-export-journal"
              onClick={onExport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/30 hover:bg-white/50 text-slate-700 text-xs sm:text-sm font-medium border border-white/30 transition-all hover:scale-[1.02] active:scale-95"
              title="Export Journal Entries (PDF or Plain Text)"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export</span>
            </button>

            <button
              type="button"
              id="btn-new-entry"
              onClick={onNewEntry}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/40 hover:bg-white/60 text-slate-800 text-xs sm:text-sm font-medium border border-white/40 shadow-sm transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>

            {/* Verified User Email badge - Plain, clean text only, without any avatar placeholder */}
            <div
              id="user-identity-badge"
              className="hidden md:flex items-center px-4 py-1.5 rounded-full bg-white/30 border border-white/30 text-xs font-medium text-slate-700 max-w-[200px] truncate"
              title={user.email || user.displayName || "Authenticated"}
            >
              {user.email || user.displayName || "Account"}
            </div>

            <button
              type="button"
              id="btn-sign-out"
              onClick={onSignOut}
              className="text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/30"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            id="btn-google-sign-in"
            onClick={onSignIn}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-sm font-medium shadow-md transition-all hover:scale-[1.02] active:scale-95"
          >
            <LogIn className="w-4 h-4 text-cyan-300" />
            <span>Sign In with Google</span>
          </button>
        )}
      </div>
    </header>
  );
}
