"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AlertCircle, Lock, ShieldCheck, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  getDictionary,
  type LanguageCode,
  type TranslationDictionary,
} from "@/lib/i18n";
import {
  DEMO_LOCALITIES,
  DEMO_PROFILES,
} from "@/lib/seed-data";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import type {
  Locality,
  NotificationItem,
  UserProfile,
  UserRole,
} from "@/types/pethri";

export type AuthMode = "visitor" | "supabase" | "demo";

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
  staffPermissions: {
    publish: boolean;
    media: boolean;
    live: boolean;
    breaking: boolean;
    moderate_comments: boolean;
    events: boolean;
    tip_review: boolean;
  };
  isAuthenticated: boolean;
  authMode: AuthMode;
  authLoading: boolean;
  authEmail: string | null;
  supabaseConfigError: string | null;
  authConnectionError: string | null;
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
const LANGUAGE_STORAGE_KEY = "pethri-language";
const LANGUAGE_CHANGE_EVENT = "pethri-language-change";
const PRIVACY_PREFERENCE_KEY = "pethri-locality-only-default";
const PRIVACY_PREFERENCE_EVENT = "pethri-privacy-preference-change";

function subscribeToLanguage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onChange);
  };
}

function getLanguageSnapshot(): LanguageCode {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "kn"
      ? "kn"
      : "en";
  } catch {
    return "en";
  }
}

function getServerLanguageSnapshot(): LanguageCode {
  return "en";
}

function subscribeToPrivacyPreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(PRIVACY_PREFERENCE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PRIVACY_PREFERENCE_EVENT, onChange);
  };
}

function getPrivacyPreferenceSnapshot() {
  try {
    return window.localStorage.getItem(PRIVACY_PREFERENCE_KEY) !== "false";
  } catch {
    return true;
  }
}

function getServerPrivacyPreferenceSnapshot() {
  return true;
}

const DEFAULT_VISITOR_PROFILE: UserProfile =
  DEMO_PROFILES.find((p) => p.id === "user-kavitha") ?? DEMO_PROFILES[0];

function setDemoCookie(uid: string | null) {
  if (typeof document === "undefined") return;
  if (uid) {
    document.cookie = `${AUTH_STORAGE_KEY}=${encodeURIComponent(uid)}; path=/; SameSite=Lax`;
  } else {
    document.cookie = `${AUTH_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
  }
}

function mapSupabaseUserToProfile(
  user: User,
  fallback: UserProfile,
  role: UserRole = "citizen",
  isVerifiedReporter = false,
  isSuspended = false
): UserProfile {
  const emailName = user.email?.split("@")[0] ?? "member";
  const fullName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || emailName;
  const username =
    (user.user_metadata?.username as string | undefined)?.trim() ||
    emailName.toLowerCase().replace(/[^a-z0-9_]/g, "_");

  return {
    ...fallback,
    id: user.id,
    username,
    fullName,
    role,
    isVerifiedReporter,
    isSuspended,
  };
}

export function PethriProvider({ children }: { children: React.ReactNode }) {
  const [localities, setLocalities] = useState<Locality[]>(
    process.env.NODE_ENV === "production" ? [] : DEMO_LOCALITIES
  );
  const [activeLocalityId, setActiveLocalityState] = useState<string>("all");
  const [currentUser, setCurrentUser] = useState<UserProfile>(
    DEFAULT_VISITOR_PROFILE
  );
  const [staffPermissions, setStaffPermissions] = useState({
    publish: false,
    media: false,
    live: false,
    breaking: false,
    moderate_comments: false,
    events: false,
    tip_review: false,
  });
  const [authMode, setAuthMode] = useState<AuthMode>("visitor");
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authConnectionError, setAuthConnectionError] = useState<string | null>(
    null
  );
  const [authModalReason, setAuthModalReason] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot
  );
  const privacyLocalityOnlyDefault = useSyncExternalStore(
    subscribeToPrivacyPreference,
    getPrivacyPreferenceSnapshot,
    getServerPrivacyPreferenceSnapshot
  );
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);

  const supabaseConfigError = getSupabaseConfigError();
  const supabaseReady = isSupabaseConfigured();
  const isAuthenticated = authMode !== "visitor";

  const dict = getDictionary(language);

  const showToast = (
    title: string,
    tone: ToastMessage["tone"] = "success"
  ) => {
    const id = String(Date.now());
    setToast({ id, title, tone });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3800);
  };

  const savePreferences = async (
    nextLanguage: LanguageCode,
    localityId: string
  ) => {
    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: nextLanguage,
          localityId: localityId === "all" ? null : localityId,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Unable to save preferences.");
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to save preferences.",
        "error"
      );
    }
  };

  const setLanguage = (nextLanguage: LanguageCode) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
        window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
      } catch {
        // Ignore storage errors in restricted environments
      }
    }
    if (authMode === "supabase") {
      void savePreferences(nextLanguage, activeLocalityId);
    }
  };

  const setActiveLocalityId = (id: string) => {
    setActiveLocalityState(id);
    if (authMode === "supabase") {
      void savePreferences(language, id);
    }
  };

  const updatePrivacyLocalityOnlyDefault = (value: boolean) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(PRIVACY_PREFERENCE_KEY, String(value));
        window.dispatchEvent(new Event(PRIVACY_PREFERENCE_EVENT));
      } catch {
        showToast(
          "Unable to save the privacy preference on this device.",
          "error"
        );
      }
    }
  };

  const refreshNotifications = async () => {
    try {
      const response = await fetch("/api/directory");
      if (!response.ok) {
        throw new Error("Unable to load public directory data.");
      }
      const data = await response.json();
      if (Array.isArray(data.localities) && data.localities.length > 0) {
        setLocalities(data.localities);
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to load directory.",
        "error"
      );
    }

    if (authMode === "supabase") {
      try {
        const response = await fetch("/api/notifications");
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Unable to load notifications.");
        }
        const data = await response.json();
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load notifications.",
          "error"
        );
      }
    }
  };

  useEffect(() => {
    setNowMs(Date.now());
    let unsubscribe: (() => void) | undefined;

    const hydrateAuth = async () => {
      setAuthLoading(true);
      setAuthConnectionError(null);
      const applyVerifiedUser = async (user: User) => {
        let profile = mapSupabaseUserToProfile(user, DEFAULT_VISITOR_PROFILE);
        const emptyPermissions = {
          publish: false,
          media: false,
          live: false,
          breaking: false,
          moderate_comments: false,
          events: false,
          tip_review: false,
        };
        try {
          const response = await fetch("/api/me", { cache: "no-store" });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error ?? "Unable to load account permissions.");
          }
          const roleValue = data.profile?.role;
          const roles: UserRole[] = [
            "citizen",
            "correspondent",
            "journalist",
            "editor",
            "admin",
          ];
          const role = roles.includes(roleValue) ? roleValue : "citizen";
          profile = {
            ...profile,
            role,
            isVerifiedReporter: data.profile?.isVerifiedReporter === true,
            isSuspended: data.profile?.isSuspended === true,
            homeLocalityId:
              data.profile?.homeLocalityId ?? profile.homeLocalityId,
            homeLocalityName:
              data.profile?.homeLocalityName ?? profile.homeLocalityName,
          };
          const p = data.permissions ?? {};
          setStaffPermissions({
            publish: p.publish === true,
            media: p.media === true,
            live: p.live === true,
            breaking: p.breaking === true,
            moderate_comments: p.moderate_comments === true,
            events: p.events === true,
            tip_review: p.tip_review === true,
          });
        } catch (error) {
          setStaffPermissions(emptyPermissions);
          setAuthConnectionError(
            error instanceof Error
              ? error.message
              : "Unable to load account permissions."
          );
        }
        setCurrentUser(profile);
        setAuthEmail(user.email ?? null);
        setAuthMode("supabase");
        setAuthModalReason(null);
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
          setDemoCookie(null);
        }
      };

      // 1. Check real Supabase session first if configured
      if (supabaseReady) {
        const client = getSupabaseBrowserClient();
        if (client) {
          try {
            const { data, error } = await client.auth.getUser();
            if (error) {
              // AuthSessionMissingError simply means visitor (not logged in)
              if (
                error.name !== "AuthSessionMissingError" &&
                !error.message.toLowerCase().includes("auth session missing")
              ) {
                setAuthConnectionError(error.message);
              }
            } else if (data?.user) {
              await applyVerifiedUser(data.user);
              setAuthLoading(false);
            }

            const { data: listener } = client.auth.onAuthStateChange(
              (event, session) => {
                if (session?.user) {
                  void applyVerifiedUser(session.user).then(() => {
                    setAuthConnectionError(null);
                    setAuthLoading(false);
                  });
                } else if (event === "SIGNED_OUT") {
                  setAuthMode("visitor");
                  setAuthEmail(null);
                  setCurrentUser(DEFAULT_VISITOR_PROFILE);
                  setStaffPermissions({
                    publish: false,
                    media: false,
                    live: false,
                    breaking: false,
                    moderate_comments: false,
                    events: false,
                    tip_review: false,
                  });
                  if (typeof window !== "undefined") {
                    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
                    setDemoCookie(null);
                  }
                }
                setAuthLoading(false);
              }
            );
            unsubscribe = () => listener.subscription.unsubscribe();
          } catch (err) {
            setAuthConnectionError(
              err instanceof Error
                ? err.message
                : "Unable to connect to Supabase authentication service."
            );
          }
        }
      }

      // 2. Separately check explicit local Demo preview session ONLY if no Supabase session exists
      if (typeof window !== "undefined") {
        const savedUid = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (savedUid && process.env.NODE_ENV !== "production") {
          const found = DEMO_PROFILES.find((p) => p.id === savedUid);
          if (found) {
            setAuthMode((prev) => (prev === "supabase" ? prev : "demo"));
            setCurrentUser((prev) =>
              prev.id !== DEFAULT_VISITOR_PROFILE.id ? prev : found
            );
            setDemoCookie(found.id);
          }
        }
      }

      setAuthLoading(false);
    };

    hydrateAuth();

    return () => {
      unsubscribe?.();
    };
  }, [supabaseReady]);

  useEffect(() => {
    if (authMode !== "supabase") {
      setNotifications([]);
      return;
    }
    let active = true;
    const loadPersonalData = async () => {
      try {
        const [preferencesResponse, notificationsResponse] = await Promise.all([
          fetch("/api/preferences"),
          fetch("/api/notifications"),
        ]);
        if (!preferencesResponse.ok || !notificationsResponse.ok) {
          throw new Error("Unable to load your personal settings.");
        }
        const [preferences, notificationData] = await Promise.all([
          preferencesResponse.json(),
          notificationsResponse.json(),
        ]);
        if (!active) return;
        if (preferences.language === "en" || preferences.language === "kn") {
          window.localStorage.setItem(
            LANGUAGE_STORAGE_KEY,
            preferences.language
          );
          window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
        }
        if (
          typeof preferences.localityId === "string" &&
          localities.some((locality) => locality.id === preferences.localityId)
        ) {
          setActiveLocalityState(preferences.localityId);
        }
        if (Array.isArray(notificationData.notifications)) {
          setNotifications(notificationData.notifications);
        }
      } catch (error) {
        if (active) {
          showToast(
            error instanceof Error
              ? error.message
              : "Unable to load your personal settings.",
            "error"
          );
        }
      }
    };
    void loadPersonalData();
    return () => {
      active = false;
    };
  }, [authMode, currentUser.id, localities]);

  useEffect(() => {
    void refreshNotifications();
  }, [authMode]);

  const signInDemoUser = (userId: string) => {
    if (process.env.NODE_ENV === "production") return;
    const found = DEMO_PROFILES.find((p) => p.id === userId);
    if (!found) return;
    setCurrentUser(found);
    setAuthEmail(null);
    setAuthMode("demo");
    setAuthModalReason(null);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(AUTH_STORAGE_KEY, found.id);
      setDemoCookie(found.id);
    }
    showToast(`Demo Preview signed in as ${found.fullName}`, "info");
  };

  const switchDemoUser = (userId: string) => {
    signInDemoUser(userId);
  };

  const signOut = async () => {
    if (authMode === "supabase" || supabaseReady) {
      const client = getSupabaseBrowserClient();
      if (client) {
        const { error } = await client.auth.signOut().catch((err) => ({
          error: err instanceof Error ? err : new Error("Sign out failed"),
        }));
        if (error) {
          showToast(error.message, "error");
          return;
        }
      }
    }
    setAuthMode("visitor");
    setAuthEmail(null);
    setCurrentUser(DEFAULT_VISITOR_PROFILE);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      setDemoCookie(null);
    }
    showToast("Signed out — browsing in visitor mode", "info");
  };

  const requireAuth = (actionLabel = "interact with Pethri") => {
    if (isAuthenticated) return true;
    setAuthModalReason(actionLabel);
    return false;
  };

  const markNotificationsRead = async () => {
    try {
      const response = await fetch("/api/notifications", { method: "PATCH" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Unable to update notifications.");
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to update notifications.",
        "error"
      );
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
          staffPermissions,
          isAuthenticated,
          authMode,
          authLoading,
          authEmail,
          supabaseConfigError,
          authConnectionError,
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
          setPrivacyLocalityOnlyDefault: updatePrivacyLocalityOnlyDefault,
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
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/45 p-4 backdrop-blur-xs"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                className="w-full max-w-md rounded-3xl border border-[#E2E7F0] bg-white p-6 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#173FBE]">
                    <Lock className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    aria-label="Close sign in prompt"
                    onClick={() => setAuthModalReason(null)}
                    className="rounded-full p-1.5 bg-[#FFFFFF] border border-[#E2E7F0] text-[#111318] hover:border-[#315CFF] hover:text-[#315CFF]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <h2 className="mt-4 font-display text-xl font-extrabold text-[#111318]">
                  Sign in to {authModalReason}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[#5B6472]">
                  Browsing Pethri news, events, and live broadcasts is always
                  open. Sign in with your Pethri account to comment, react,
                  bookmark stories, or submit private news tips.
                </p>

                {supabaseConfigError && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#D94E34]/35 bg-[#D94E34]/10 p-2.5 text-[11px] text-[#D94E34]">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{supabaseConfigError}</span>
                  </div>
                )}

                <div className="mt-5 space-y-2.5">
                  <Link
                    href="/auth"
                    onClick={() => setAuthModalReason(null)}
                    className="flex w-full items-center justify-center rounded-full bg-[#173FBE] py-3 text-xs font-extrabold text-white transition-all hover:bg-[#315CFF]"
                  >
                    Sign In / Create Account
                  </Link>
                  {!supabaseReady && (
                    <button
                      type="button"
                      onClick={() => signInDemoUser("user-kavitha")}
                      className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#E2E7F0] bg-[#EEF2FF] py-2.5 text-xs font-extrabold text-[#173FBE] transition-colors hover:border-[#315CFF] hover:text-[#315CFF]"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Demo Preview Sign-In (Offline Mode)
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
                    ? "border-[#315CFF]/40 bg-[#173FBE] text-white"
                    : "border-[#E2E7F0] bg-white text-[#111318]"
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
    throw new Error("usePethri must be used inside PethriProvider");
  }
  return ctx;
}
