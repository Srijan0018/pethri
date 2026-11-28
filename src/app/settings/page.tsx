"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Languages,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  UserCheck,
} from "lucide-react";
import { EditorialReveal } from "@/components/MotionPrimitives";
import { usePethri } from "@/components/PethriProvider";
import { LANGUAGE_OPTIONS } from "@/lib/i18n";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const pageHydrated = useHydrated();
  const {
    language,
    setLanguage,
    localities,
    activeLocalityId,
    setActiveLocalityId,
    privacyLocalityOnlyDefault,
    setPrivacyLocalityOnlyDefault,
    currentUser,
    isAuthenticated,
    authMode,
    authLoading,
    authEmail,
    signOut,
    showToast,
  } = usePethri();
  const sessionReady = pageHydrated && !authLoading;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#173FBE]">
          PREFERENCES &amp; REGIONAL SETUP
        </span>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-[#111318]">
          Pethri Settings
        </h1>
      </div>

      {/* 1. Karavali Language Support */}
      <EditorialReveal>
        <section className="rounded-3xl border border-[#E2E7F0] bg-white p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#173FBE]">
              <Languages className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold text-[#111318]">
                Language &amp; Regional Script
              </h2>
              <p className="text-xs text-[#5B6472]">
                Switch between English and Kannada live. Architecture is ready
                for Tulu and other Karavali editions.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                disabled={!opt.available}
                onClick={() => {
                  setLanguage(opt.code);
                  showToast(`Language updated to ${opt.label}`);
                }}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all",
                  language === opt.code
                    ? "border-[#315CFF] bg-[#EEF2FF] ring-2 ring-[#315CFF]/25"
                    : opt.available
                      ? "border-[#E2E7F0] bg-[#FFFFFF] hover:border-[#315CFF]"
                      : "border-dashed border-[#E2E7F0] bg-[#FFFFFF]/50 opacity-65 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#111318]">
                    {opt.nativeLabel}
                  </span>
                  {language === opt.code && (
                    <CheckCircle2 className="h-4 w-4 text-[#315CFF]" />
                  )}
                </div>
                <p className="mt-1 text-[11px] text-[#5B6472]">{opt.label}</p>
              </button>
            ))}
          </div>
        </section>
      </EditorialReveal>

      {/* 2. Home Karavali Locality */}
      <EditorialReveal delay={0.05}>
        <section className="rounded-3xl border border-[#E2E7F0] bg-white p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#173FBE]">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold text-[#111318]">
                Default Karavali Locality Feed
              </h2>
              <p className="text-xs text-[#5B6472]">
                Choose your preferred city or ward across Mangaluru, Udupi,
                Manipal, Kundapura, and Pethri.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveLocalityId("all")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold border transition-colors",
                activeLocalityId === "all"
                  ? "bg-[#173FBE] border-[#173FBE] text-white"
                  : "bg-[#FFFFFF] text-[#111318] border-[#E2E7F0] hover:border-[#315CFF]"
              )}
            >
              All Karavali
            </button>
            {localities.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setActiveLocalityId(loc.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold border transition-colors",
                  activeLocalityId === loc.id
                    ? "bg-[#315CFF] border-[#315CFF] text-white"
                    : "bg-[#FFFFFF] text-[#111318] border-[#E2E7F0] hover:border-[#315CFF]"
                )}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </section>
      </EditorialReveal>

      {/* 3. Privacy Default */}
      <EditorialReveal delay={0.08}>
        <section className="rounded-3xl border border-[#E2E7F0] bg-white p-6 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFFFFF] border border-[#E2E7F0] text-[#173FBE]">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-extrabold text-[#111318]">
                  Privacy-First GPS Default
                </h2>
                <p className="text-xs text-[#5B6472]">
                  Locality-Only blocks precise GPS. Ask Every Tip lets you
                  explicitly opt in on each submission. This preference is
                  saved on this device.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={!pageHydrated}
              onClick={() => {
                setPrivacyLocalityOnlyDefault(!privacyLocalityOnlyDefault);
                showToast("Privacy preference saved on this device");
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-extrabold transition-colors border",
                pageHydrated && privacyLocalityOnlyDefault
                  ? "bg-[#173FBE] border-[#173FBE] text-white"
                  : "bg-[#EEF2FF] border-[#E2E7F0] text-[#173FBE]"
              )}
            >
              {!pageHydrated
                ? "Privacy Preference"
                : privacyLocalityOnlyDefault
                  ? "Locality-Only ON"
                  : "Ask Every Tip"}
            </button>
          </div>
        </section>
      </EditorialReveal>

      {/* 4. Public Member Session */}
      <EditorialReveal delay={0.1}>
        <section className="rounded-3xl border border-[#E2E7F0] bg-[#173FBE] p-6 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#173FBE]">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold">
                {!sessionReady
                  ? "Checking session..."
                  : isAuthenticated
                    ? currentUser.fullName
                    : "Visitor Mode"}
              </h2>
              <p className="text-xs text-[#EEF2FF]/85">
                {!sessionReady
                  ? "Checking your sign-in status."
                  : authMode === "supabase"
                  ? `Signed in via Supabase Auth (${authEmail ?? currentUser.fullName})`
                  : authMode === "demo"
                    ? `Local Demo Preview (@${currentUser.username})`
                    : "Sign in to comment, react, bookmark, and submit private news tips."}
              </p>
            </div>
          </div>

          {!sessionReady ? (
            <span className="text-xs font-bold">Checking session...</span>
          ) : isAuthenticated ? (
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-xs font-bold text-white hover:bg-[#D94E34] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          ) : (
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-[#315CFF] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-white hover:text-[#173FBE] transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          )}
        </section>
      </EditorialReveal>
    </div>
  );
}
