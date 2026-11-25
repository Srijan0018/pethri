"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck, UserCheck } from "lucide-react";
import { PethriLogo } from "@/components/PethriLogo";
import { usePethri } from "@/components/PethriProvider";
import { DEMO_PROFILES } from "@/lib/seed-data";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  const router = useRouter();
  const { supabaseReady, currentUser, switchDemoUser, showToast } = usePethri();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = createSupabaseBrowserClient();
    if (!client) {
      showToast(
        "Supabase env vars not set — use Demo Profiles below!",
        "info"
      );
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        showToast("Check your email to confirm your Pethri.com account!");
      } else {
        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        showToast("Signed in to Pethri.com!");
        router.push("/feed");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-6 md:grid-cols-2 items-stretch">
        {/* Supabase Production Auth Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <PethriLogo variant="light" size="md" />
          <h1 className="mt-4 font-display text-2xl font-extrabold text-[#0A2E6E]">
            {mode === "signin"
              ? "Sign in to Pethri.com"
              : "Join as a Citizen Reporter"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {supabaseReady
              ? "Supabase Authentication is active."
              : "Demo mode active — connect NEXT_PUBLIC_SUPABASE_URL & ANON_KEY for live Supabase auth."}
          </p>

          <form onSubmit={handleSupabaseAuth} className="mt-5 space-y-3">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#0A2E6E]"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@pethri.com"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5">
                <Lock className="h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#0A2E6E] py-3 text-xs font-bold text-white hover:bg-[#08245B] disabled:opacity-50"
            >
              {loading
                ? "Authenticating..."
                : mode === "signin"
                  ? "Sign In"
                  : "Create Reporter Account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() =>
              setMode((m) => (m === "signin" ? "signup" : "signin"))
            }
            className="mt-4 text-xs font-semibold text-[#D91E2A] hover:underline"
          >
            {mode === "signin"
              ? "New to Pethri? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>

        {/* Instant Demo Role Access */}
        <div className="rounded-3xl bg-[#06183B] p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-bold text-amber-200">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Interactive Demo Access</span>
            </div>
            <h2 className="mt-3 font-display text-xl font-extrabold">
              Test Citizen, Correspondent &amp; Editor Roles
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              Select a demo profile below to immediately test submitting a
              citizen report, bookmarking stories, or moderating the Editorial
              Desk queue.
            </p>

            <div className="mt-5 space-y-2.5">
              {DEMO_PROFILES.map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => {
                    switchDemoUser(prof.id);
                    router.push(
                      prof.role === "editor" ? "/editorial" : "/feed"
                    );
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all",
                    currentUser.id === prof.id
                      ? "border-[#D91E2A] bg-[#D91E2A]/20"
                      : "border-white/15 bg-white/5 hover:bg-white/15"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prof.avatarUrl}
                      alt={prof.fullName}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">
                        {prof.fullName}
                      </p>
                      <p className="text-[11px] text-slate-300">
                        {prof.homeLocalityName} • @{prof.username}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                    {prof.isVerifiedReporter && (
                      <ShieldCheck className="h-3 w-3" />
                    )}
                    {prof.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-[11px] text-slate-400">
            In production with Supabase configured, row-level security policies
            enforce editorial permissions directly in PostgreSQL.
          </p>
        </div>
      </div>
    </div>
  );
}
