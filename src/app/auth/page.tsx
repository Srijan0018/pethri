"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, UserCheck } from "lucide-react";
import { PethriLogo } from "@/components/PethriLogo";
import { usePethri } from "@/components/PethriProvider";
import { DEMO_PROFILES } from "@/lib/seed-data";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  const router = useRouter();
  const { supabaseReady, currentUser, isAuthenticated, signInDemoUser, showToast } =
    usePethri();
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
        "Supabase env vars not set — use Demo Member Sign-In on the right!",
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
        router.push("/profile");
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
        <div className="rounded-3xl border border-[#E5E3DC] bg-white p-6 sm:p-8">
          <PethriLogo variant="light" size="md" />
          <h1 className="mt-4 font-display text-2xl font-extrabold text-[#181917]">
            {mode === "signin"
              ? "Sign in to Pethri.com"
              : "Create Community Account"}
          </h1>
          <p className="mt-1 text-xs text-[#5A605C]">
            {supabaseReady
              ? "Supabase Authentication is active."
              : "Sign in to comment, react, bookmark, follow localities, and submit private news tips."}
          </p>

          <form onSubmit={handleSupabaseAuth} className="mt-5 space-y-3">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold text-[#181917] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-[#E5E3DC] px-3.5 py-2.5 text-sm outline-none focus:border-[#398BFF]"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-[#181917] mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[#E5E3DC] px-3.5 py-2.5 focus-within:border-[#398BFF]">
                <Mail className="h-4 w-4 text-[#5A605C]" />
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
              <label className="block text-xs font-bold text-[#181917] mb-1">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[#E5E3DC] px-3.5 py-2.5 focus-within:border-[#398BFF]">
                <Lock className="h-4 w-4 text-[#5A605C]" />
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
              className="w-full rounded-full bg-[#1B5E43] py-3 text-xs font-extrabold text-white hover:bg-[#398BFF] transition-colors disabled:opacity-50"
            >
              {loading
                ? "Authenticating..."
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() =>
              setMode((m) => (m === "signin" ? "signup" : "signin"))
            }
            className="mt-4 text-xs font-bold text-[#398BFF] hover:underline"
          >
            {mode === "signin"
              ? "New to Pethri? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>

        {/* Public Member Demo Sign-In */}
        <div className="rounded-3xl bg-[#1B5E43] p-6 sm:p-8 text-white flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-[#1B5E43]">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Quick Community Sign-In</span>
            </div>
            <h2 className="mt-3 font-display text-xl font-extrabold">
              Sign in as a Karavali Member
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#EAF2EE]/85">
              Choose a member profile below to unlock commenting, reactions,
              bookmarks, event RSVPs, and private news tip submissions.
            </p>

            <div className="mt-5 space-y-2.5">
              {DEMO_PROFILES.filter((p) => p.role === "citizen").map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => {
                    signInDemoUser(prof.id);
                    router.push("/profile");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all",
                    isAuthenticated && currentUser.id === prof.id
                      ? "border-[#398BFF] bg-white text-[#181917]"
                      : "border-white/20 bg-white/10 text-white hover:border-[#398BFF] hover:bg-white/15"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prof.avatarUrl}
                      alt={prof.fullName}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold">{prof.fullName}</p>
                      <p
                        className={cn(
                          "text-[11px]",
                          isAuthenticated && currentUser.id === prof.id
                            ? "text-[#5A605C]"
                            : "text-[#EAF2EE]/80"
                        )}
                      >
                        {prof.homeLocalityName} • @{prof.username}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#EAF2EE] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#1B5E43]">
                    Member
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-[11px] text-[#EAF2EE]/80">
            Visitors can browse all published articles, highlights, events, and
            live streams without signing in.
          </p>
        </div>
      </div>
    </div>
  );
}
