"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Lock, ShieldCheck, X } from "lucide-react";
import {
  getDictionary,
  type LanguageCode,
  type TranslationDictionary,
} from "@/lib/i18n";
import {
  DEMO_LOCALITIES,
  DEMO_NOTIFICATIONS,
  DEMO_PROFILES,
} from "@/lib/seed-data";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import type { Locality, NotificationItem, UserProfile } from "@/types/pethri";

interface ToastMessage {
  id: string;
  title: string;
  tone: "success" | "info" | "error";
}

interface PethriContextValue {
  localities: Locality[];
  activeLocalityId: string;
  setActiveLocalityId: (id: string) => void;
  activeLocality: Locality | null;
  currentUser: UserProfile;
  isAuthenticated: boolean;
  signInDemoUser: (userId: string) => void;
  signOut: () => Promise<void>;
  requireAuth: (actionLabel?: string) => boolean;
  switchDemoUser: (userId: string) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  dict: TranslationDictionary;
  privacyLocalityOnlyDefault: boolean;
  setPrivacyLocalityOnlyDefault: (v: boolean) => void;
  supabaseReady: boolean;
  nowMs: number | null;
  toast: ToastMessage | null;
  showToast: (title: string, tone?: ToastMessage["tone"]) => void;
}

const PethriContext = createContext<PethriContextValue | null>(null);

const AUTH_STORAGE_KEY = "pethri_demo_uid";

export function PethriProvider({ children }: { children: React.ReactNode }) {
  const [localities, setLocalities] = useState<Locality[]>(DEMO_LOCALITIES);
  const [activeLocalityId, setActiveLocalityId] = useState<string>("all");
  const [currentUser, setCurrentUser] = useState<UserProfile>(
    DEMO_PROFILES.find((p) => p.id === "user-kavitha") ?? DEMO_PROFILES[0]
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authModalReason, setAuthModalReason] = useState<string | null>(null);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(DEMO_NOTIFICATIONS);
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [privacyLocalityOnlyDefault, setPrivacyLocalityOnlyDefault] =
    useState<boolean>(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const supabaseReady = isSupabaseConfigured();

  const dict = getDictionary(language);

  const showToast = (
    title: string,
    tone: ToastMessage["tone"] = "success"
  ) => {
    const id = String(Date.now());
    setToast({ id, title, tone });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3600);
  };

  const refreshNotifications = async () => {
    try {
      const res = await fetch("/api/directory");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.localities) && data.localities.length > 0) {
          setLocalities(data.localities);
        }
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      }
    } catch {
      // Keep cached notifications cleanly
    }
  };

  useEffect(() => {
    setNowMs(Date.now());
    refreshNotifications();

    if (typeof window !== "undefined") {
      const savedUid = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUid) {
        const found = DEMO_PROFILES.find((p) => p.id === savedUid);
        if (found) {
          setCurrentUser(found);
          setIsAuthenticated(true);
        }
      }
    }

    if (supabaseReady) {
      const client = createSupabaseBrowserClient();
      client?.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setIsAuthenticated(true);
          setCurrentUser((prev) => ({
            ...prev,
            id: data.user.id,
            fullName:
              (data.user.user_metadata?.full_name as string) ??
              data.user.email?.split("@")[0] ??
              prev.fullName,
            username:
              (data.user.user_metadata?.username as string) ??
              data.user.email?.split("@")[0] ??
              prev.username,
          }));
        }
      });
    }
  }, [supabaseReady]);

  const signInDemoUser = (userId: string) => {
    const found = DEMO_PROFILES.find((p) => p.id === userId);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      setAuthModalReason(null);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, found.id);
      }
      showToast(`Signed in as ${found.fullName}`, "info");
    }
  };

  const switchDemoUser = (userId: string) => {
    signInDemoUser(userId);
  };

  const signOut = async () => {
    if (supabaseReady) {
      const client = createSupabaseBrowserClient();
      await client?.auth.signOut().catch(() => {});
    }
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
    showToast("Signed out — browsing in visitor mode", "info");
  };

  const requireAuth = (actionLabel = "interact with Pethri") => {
    if (isAuthenticated) return true;
    setAuthModalReason(actionLabel);
    return false;
  };

  const markNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_notifications_read" }),
      });
    } catch {
      // Updated locally
    }
  };

  const activeLocality =
    localities.find((l) => l.id === activeLocalityId) ?? null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <MotionConfig reducedMotion="user">
      <PethriContext.Provider
        value={{
          localities,
          activeLocalityId,
          setActiveLocalityId,
          activeLocality,
          currentUser,
          isAuthenticated,
          signInDemoUser,
          signOut,
          requireAuth,
          switchDemoUser,
          notifications,
          unreadCount,
          markNotificationsRead,
          refreshNotifications,
          language,
          setLanguage,
          dict,
          privacyLocalityOnlyDefault,
          setPrivacyLocalityOnlyDefault,
          supabaseReady,
          nowMs,
          toast,
          showToast,
        }}
      >
        {children}

        {/* Login Required Gate Modal */}
        <AnimatePresence>
          {authModalReason && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Sign in required"
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#181917]/45 p-4 backdrop-blur-xs"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                className="w-full max-w-md rounded-3xl border border-[#E5E3DC] bg-white p-6 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF2EE] text-[#1B5E43]">
                    <Lock className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    aria-label="Close sign in prompt"
                    onClick={() => setAuthModalReason(null)}
                    className="rounded-full p-1.5 bg-[#F8F7F4] border border-[#E5E3DC] text-[#181917] hover:border-[#398BFF] hover:text-[#398BFF]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <h2 className="mt-4 font-display text-xl font-extrabold text-[#181917]">
                  Sign in to {authModalReason}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[#5A605C]">
                  Browsing Pethri news, events, and live broadcasts is always
                  open. Sign in to comment, react, bookmark stories, or submit
                  private news tips.
                </p>

                <div className="mt-5 space-y-2.5">
                  <Link
                    href="/auth"
                    onClick={() => setAuthModalReason(null)}
                    className="flex w-full items-center justify-center rounded-full bg-[#1B5E43] py-3 text-xs font-extrabold text-white transition-all hover:bg-[#181917]"
                  >
                    Sign In / Create Account
                  </Link>
                  {!supabaseReady && (
                    <button
                      type="button"
                      onClick={() => signInDemoUser("user-kavitha")}
                      className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#E5E3DC] bg-[#EAF2EE] py-2.5 text-xs font-extrabold text-[#1B5E43] transition-colors hover:border-[#398BFF] hover:text-[#398BFF]"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Quick Demo Sign-In (Karavali Member)
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {toast && (
          <div className="fixed bottom-20 right-4 z-50 max-w-sm md:bottom-6">
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl transition-all ${
                toast.tone === "error"
                  ? "border-[#D94E34] bg-[#D94E34] text-white"
                  : toast.tone === "info"
                    ? "border-[#398BFF]/40 bg-[#1B5E43] text-white"
                    : "border-[#E5E3DC] bg-white text-[#181917]"
              }`}
            >
              {toast.title}
            </div>
          </div>
        )}
      </PethriContext.Provider>
    </MotionConfig>
  );
}

export function usePethri() {
  const ctx = useContext(PethriContext);
  if (!ctx) {
    throw new Error("usePethri must be used within PethriProvider");
  }
  return ctx;
}
