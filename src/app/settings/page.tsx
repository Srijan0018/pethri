"use client";

import React from "react";
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
import { cn } from "@/lib/utils";

export default function SettingsPage() {
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
    signOut,
    showToast,
  } = usePethri();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1B5E43]">
          PREFERENCES &amp; REGIONAL SETUP
        </span>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-[#181917]">
          Pethri Settings
        </h1>
      </div>

      {/* 1. Karavali Language Support */}
      <EditorialReveal>
        <section className="rounded-3xl border border-[#E5E3DC] bg-white p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF2EE] text-[#1B5E43]">
              <Languages className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold text-[#181917]">
                Language &amp; Regional Script
              </h2>
              <p className="text-xs text-[#5A605C]">
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
                    ? "border-[#398BFF] bg-[#EAF2EE] ring-2 ring-[#398BFF]/25"
                    : opt.available
                      ? "border-[#E5E3DC] bg-[#F8F7F4] hover:border-[#398BFF]"
                      : "border-dashed border-[#E5E3DC] bg-[#F8F7F4]/50 opacity-65 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#181917]">
                    {opt.nativeLabel}
                  </span>
                  {language === opt.code && (
                    <CheckCircle2 className="h-4 w-4 text-[#398BFF]" />
                  )}
                </div>
                <p className="mt-1 text-[11px] text-[#5A605C]">{opt.label}</p>
              </button>
            ))}
          </div>
        </section>
      </EditorialReveal>

      {/* 2. Home Karavali Locality */}
      <EditorialReveal delay={0.05}>
        <section className="rounded-3xl border border-[#E5E3DC] bg-white p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF2EE] text-[#1B5E43]">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold text-[#181917]">
                Default Karavali Locality Feed
              </h2>
              <p className="text-xs text-[#5A605C]">
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
                  ? "bg-[#1B5E43] border-[#1B5E43] text-white"
                  : "bg-[#F8F7F4] text-[#181917] border-[#E5E3DC] hover:border-[#398BFF]"
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
                    ? "bg-[#398BFF] border-[#398BFF] text-white"
                    : "bg-[#F8F7F4] text-[#181917] border-[#E5E3DC] hover:border-[#398BFF]"
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
        <section className="rounded-3xl border border-[#E5E3DC] bg-white p-6 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8F7F4] border border-[#E5E3DC] text-[#1B5E43]">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-extrabold text-[#181917]">
                  Privacy-First GPS Default
                </h2>
                <p className="text-xs text-[#5A605C]">
                  Keep exact GPS hidden on private news tips unless you
                  explicitly consent per submission.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPrivacyLocalityOnlyDefault(!privacyLocalityOnlyDefault);
                showToast("Privacy default updated");
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-extrabold transition-colors border",
                privacyLocalityOnlyDefault
                  ? "bg-[#1B5E43] border-[#1B5E43] text-white"
                  : "bg-[#EAF2EE] border-[#E5E3DC] text-[#1B5E43]"
              )}
            >
              {privacyLocalityOnlyDefault ? "Locality-Only ON" : "Ask Every Tip"}
            </button>
          </div>
        </section>
      </EditorialReveal>

      {/* 4. Public Member Session */}
      <EditorialReveal delay={0.1}>
        <section className="rounded-3xl border border-[#E5E3DC] bg-[#1B5E43] p-6 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#1B5E43]">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold">
                {isAuthenticated ? currentUser.fullName : "Visitor Mode"}
              </h2>
              <p className="text-xs text-[#EAF2EE]/85">
                {isAuthenticated
                  ? `Signed in as @${currentUser.username}`
                  : "Sign in to comment, react, bookmark, and submit private news tips."}
              </p>
            </div>
          </div>

          {isAuthenticated ? (
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
              className="inline-flex items-center gap-2 rounded-full bg-[#398BFF] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-white hover:text-[#1B5E43] transition-colors"
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
