"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Languages,
  Lock,
  MapPin,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { EditorialReveal } from "@/components/MotionPrimitives";
import { usePethri } from "@/components/PethriProvider";
import { LANGUAGE_OPTIONS } from "@/lib/i18n";
import { DEMO_PROFILES } from "@/lib/seed-data";
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
    switchDemoUser,
    supabaseReady,
    showToast,
  } = usePethri();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#525F52]">
          PREFERENCES &amp; REGIONAL SETUP
        </span>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-[#202820]">
          Pethri Settings
        </h1>
      </div>

      {/* 1. Karavali Language Support */}
      <EditorialReveal>
        <section className="rounded-3xl border border-[#202820]/12 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCEBCB] text-[#202820]">
              <Languages className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold text-[#202820]">
                Language &amp; Regional Script
              </h2>
              <p className="text-xs text-[#525F52]">
                Switch between English and Kannada live. Architecture is ready
                for Tulu and Konkani editions.
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
                    ? "border-[#202820] bg-[#DCEBCB] ring-2 ring-[#B7F36B]"
                    : opt.available
                      ? "border-[#202820]/15 bg-[#F7F6EF] hover:border-[#202820]"
                      : "border-dashed border-[#202820]/15 bg-[#F7F6EF]/50 opacity-65 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#202820]">
                    {opt.nativeLabel}
                  </span>
                  {language === opt.code && (
                    <CheckCircle2 className="h-4 w-4 text-[#202820]" />
                  )}
                </div>
                <p className="mt-1 text-[11px] text-[#525F52]">{opt.label}</p>
              </button>
            ))}
          </div>
        </section>
      </EditorialReveal>

      {/* 2. Home Karavali Locality */}
      <EditorialReveal delay={0.05}>
        <section className="rounded-3xl border border-[#202820]/12 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C9E8D5] text-[#202820]">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold text-[#202820]">
                Default Karavali Locality Feed
              </h2>
              <p className="text-xs text-[#525F52]">
                Choose your primary city or ward across Mangaluru, Udupi,
                Manipal, Kundapura, and Pethri.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveLocalityId("all")}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold transition-colors",
                activeLocalityId === "all"
                  ? "bg-[#202820] text-[#B7F36B]"
                  : "bg-[#F7F6EF] text-[#202820] border border-[#202820]/15"
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
                  "rounded-full px-4 py-2 text-xs font-bold transition-colors",
                  activeLocalityId === loc.id
                    ? "bg-[#B7F36B] text-[#202820] border border-[#202820]/25"
                    : "bg-[#F7F6EF] text-[#202820] border border-[#202820]/15"
                )}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </section>
      </EditorialReveal>

      {/* 3. Privacy & Location Consent */}
      <EditorialReveal delay={0.08}>
        <section className="rounded-3xl border border-[#202820]/12 bg-white p-6 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F6EF] border border-[#202820]/15 text-[#202820]">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-extrabold text-[#202820]">
                  Privacy-First GPS Default
                </h2>
                <p className="text-xs text-[#525F52]">
                  Keep exact street GPS hidden on citizen uploads unless you
                  explicitly consent per post.
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
                "rounded-full px-4 py-1.5 text-xs font-extrabold transition-colors",
                privacyLocalityOnlyDefault
                  ? "bg-[#202820] text-[#B7F36B]"
                  : "bg-[#DCEBCB] text-[#202820]"
              )}
            >
              {privacyLocalityOnlyDefault ? "Locality-Only ON" : "Ask Every Post"}
            </button>
          </div>
        </section>
      </EditorialReveal>

      {/* 4. Demo Role & Account Switcher */}
      <EditorialReveal delay={0.1}>
        <section className="rounded-3xl border border-[#202820]/12 bg-[#202820] p-6 text-[#F7F6EF] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#B7F36B]" />
              <h2 className="font-display text-base font-extrabold">
                Active Account &amp; Editorial Role
              </h2>
            </div>
            <Link
              href="/auth"
              className="text-xs font-bold text-[#B7F36B] underline"
            >
              {supabaseReady ? "Supabase Auth" : "Sign In Page"}
            </Link>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {DEMO_PROFILES.map((prof) => (
              <button
                key={prof.id}
                type="button"
                onClick={() => switchDemoUser(prof.id)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border p-3 text-left transition-all",
                  currentUser.id === prof.id
                    ? "border-[#B7F36B] bg-white/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={prof.avatarUrl}
                    alt={prof.fullName}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{prof.fullName}</p>
                    <p className="text-[11px] text-[#C9E8D5] truncate">
                      {prof.homeLocalityName} • @{prof.username}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#B7F36B] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#202820]">
                  {prof.isVerifiedReporter && (
                    <ShieldCheck className="h-3 w-3" />
                  )}
                  {prof.role}
                </span>
              </button>
            ))}
          </div>
        </section>
      </EditorialReveal>
    </div>
  );
}
