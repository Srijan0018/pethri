"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { PethriLogo } from "@/components/PethriLogo";
import { usePethri } from "@/components/PethriProvider";
import { DEMO_PROFILES } from "@/lib/seed-data";
import { hasMinimumPasswordLength } from "@/lib/repositories/validation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function formatSupabaseAuthError(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : "Authentication request failed.";
  const lower = raw.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email address using the link sent to your inbox before signing in.";
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Unable to reach Supabase Auth. Check your internet connection and Supabase Project URL.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email is already registered. Please sign in instead.";
  }
  return raw;
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "/profile";
  const nextPath =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/profile";
  const callbackError = searchParams.get("error");

  const {
    supabaseReady,
    supabaseConfigError,
    authConnectionError,
    currentUser,
    isAuthenticated,
    authMode,
    authEmail,
    signInDemoUser,
    signOut,
    showToast,
  } = usePethri();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot_password">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(callbackError);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(
    null
  );

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setConfirmationMessage(null);

    const client = getSupabaseBrowserClient();
    if (!client) {
      const msg =
        supabaseConfigError ??
        "Supabase credentials are not configured in environment variables.";
      setFormError(msg);
      showToast(msg, "error");
      return;
    }

    setLoading(true);
    try {
      if (mode === "forgot_password") {
        const redirectTo = `${window.location.origin}/auth/update-password`;
        const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });
        if (error) throw error;
        const msg =
          "If an account exists for that email, password recovery instructions will be sent.";
        setConfirmationMessage(msg);
        showToast("Password reset link dispatched", "info");
      } else if (mode === "signup") {
        if (!hasMinimumPasswordLength(password)) {
          setFormError("Use a password with at least 12 characters.");
          setLoading(false);
          return;
        }

        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: fullName.trim() || email.trim().split("@")[0],
            },
          },
        });
        if (error) throw error;

        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setConfirmationMessage(
            "If an account can be created with that email, you will receive the next steps by email. You can also sign in or reset your password."
          );
          return;
        }

        if (data.session) {
          showToast("Account created and signed in via Supabase!");
          router.push(nextPath);
          router.refresh();
        } else {
          const msg =
            "Check your email inbox to confirm your Pethri.com account before signing in.";
          setConfirmationMessage(msg);
          showToast(msg, "info");
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (!data.session) {
          throw new Error("No active session returned by Supabase Auth.");
        }
        showToast("Signed in to Pethri.com!");
        router.push(nextPath);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = formatSupabaseAuthError(err);
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-6 md:grid-cols-2 items-stretch">
        {/* REAL SUPABASE AUTHENTICATION PANEL */}
        <div className="rounded-3xl border border-[#E2E7F0] bg-white p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <PethriLogo variant="light" size="md" />
            <div className="mt-4 flex items-center justify-between gap-2">
              <h1 className="font-display text-2xl font-extrabold text-[#111318]">
                {mode === "signin"
                  ? "Sign in to Pethri.com"
                  : mode === "signup"
                    ? "Create Community Account"
                    : "Reset Password"}
              </h1>
              {supabaseReady && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[10px] font-extrabold text-[#173FBE]">
                  <ShieldCheck className="h-3 w-3" />
                  Supabase Auth
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[#5B6472]">
              {mode === "forgot_password"
                ? "Enter your account email to receive a password recovery link."
                : "Sign in with your verified email and password to access your private profile, saved bookmarks, and private news tip intake."}
            </p>

            {/* Missing Config / Connection Errors */}
            {(supabaseConfigError || authConnectionError) && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#D94E34]/35 bg-[#D94E34]/10 p-3 text-xs text-[#D94E34]">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Supabase Connection Status</p>
                  <p className="mt-0.5">
                    {supabaseConfigError ?? authConnectionError}
                  </p>
                </div>
              </div>
            )}

            {/* Form Validation / Auth Errors */}
            {formError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-2xl border border-[#D94E34]/35 bg-[#D94E34]/10 p-3 text-xs font-semibold text-[#D94E34]"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Status / Confirmation Banner */}
            {confirmationMessage && (
              <div
                role="status"
                className="mt-4 flex items-start gap-2 rounded-2xl border border-[#173FBE]/30 bg-[#EEF2FF] p-3 text-xs font-semibold text-[#173FBE]"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{confirmationMessage}</span>
              </div>
            )}

            {/* Active Real Supabase Session Summary */}
            {authMode === "supabase" && isAuthenticated ? (
              <div className="mt-6 space-y-4 rounded-2xl border border-[#E2E7F0] bg-[#FFFFFF] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#173FBE] text-white font-bold">
                    {currentUser.fullName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-[#111318] truncate">
                      {currentUser.fullName}
                    </p>
                    <p className="text-xs text-[#5B6472] truncate">
                      {authEmail ?? `@${currentUser.username}`} • Supabase Active
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={nextPath}
                    className="flex-1 rounded-full bg-[#173FBE] py-2.5 text-center text-xs font-extrabold text-white hover:bg-[#315CFF] transition-colors"
                  >
                    Continue to App
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E7F0] bg-white px-4 py-2.5 text-xs font-bold text-[#111318] hover:border-[#D94E34] hover:text-[#D94E34] transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSupabaseAuth} className="mt-5 space-y-3">
                {mode === "signup" && (
                  <div>
                    <label htmlFor="signup-full-name" className="block text-xs font-bold text-[#111318] mb-1">
                      Full Name
                    </label>
                    <input
                      id="signup-full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-[#E2E7F0] px-3.5 py-2.5 text-sm outline-none focus:border-[#315CFF]"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="auth-email" className="block text-xs font-bold text-[#111318] mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-[#E2E7F0] px-3.5 py-2.5 focus-within:border-[#315CFF]">
                    <Mail className="h-4 w-4 text-[#5B6472]" />
                    <input
                      id="auth-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
                {mode !== "forgot_password" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="auth-password" className="block text-xs font-bold text-[#111318]">
                        Password
                      </label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormError(null);
                            setConfirmationMessage(null);
                            setMode("forgot_password");
                          }}
                          className="text-[11px] font-bold text-[#315CFF] hover:underline"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-[#E2E7F0] px-3.5 py-2.5 focus-within:border-[#315CFF]">
                      <Lock className="h-4 w-4 text-[#5B6472]" />
                      <input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete={
                          mode === "signin" ? "current-password" : "new-password"
                        }
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 12 characters"
                        className="flex-1 bg-transparent text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-[#5B6472] hover:text-[#111318]"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || !supabaseReady}
                  className="w-full rounded-full bg-[#173FBE] py-3 text-xs font-extrabold text-white hover:bg-[#315CFF] transition-colors disabled:opacity-50"
                >
                  {loading
                    ? "Processing..."
                    : mode === "signin"
                      ? "Sign In with Email"
                      : mode === "signup"
                        ? "Create Supabase Account"
                        : "Send Password Reset Link"}
                </button>
              </form>
            )}
          </div>

          {authMode !== "supabase" && (
            <div className="mt-4 flex flex-col gap-1.5 text-xs font-bold text-[#315CFF]">
              {mode === "forgot_password" ? (
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setConfirmationMessage(null);
                    setMode("signin");
                  }}
                  className="text-left hover:underline"
                >
                  ← Back to Sign In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setConfirmationMessage(null);
                    setMode((m) => (m === "signin" ? "signup" : "signin"));
                  }}
                  className="text-left hover:underline"
                >
                  {mode === "signin"
                    ? "New to Pethri? Create an account"
                    : "Already have an account? Sign in"}
                </button>
              )}
            </div>
          )}
        </div>

        {process.env.NODE_ENV !== "production" && (
        <div className="rounded-3xl bg-[#173FBE] p-6 sm:p-8 text-white flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-[#173FBE]">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Local Development Sandbox</span>
            </div>
            <h2 className="mt-3 font-display text-xl font-extrabold">
              Preview with Sample Personas
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#EEF2FF]/85">
              Available in development preview mode. In production, real email authentication is required and demo identities are disabled.
            </p>

            <div className="mt-5 space-y-2.5">
              {DEMO_PROFILES.filter((p) => p.role === "citizen").map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => {
                    signInDemoUser(prof.id);
                    router.push(nextPath);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all",
                    authMode === "demo" && currentUser.id === prof.id
                      ? "border-[#315CFF] bg-white text-[#111318]"
                      : "border-white/20 bg-white/10 text-white hover:border-[#315CFF] hover:bg-white/15"
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
                          authMode === "demo" && currentUser.id === prof.id
                            ? "text-[#5B6472]"
                            : "text-[#EEF2FF]/80"
                        )}
                      >
                        {prof.homeLocalityName} • @{prof.username}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#173FBE]">
                    Sandbox
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-[11px] text-[#EEF2FF]/80">
            Public readers can browse verified news and directory events without creating an account.
          </p>
        </div>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-[#5B6472]">
          Loading Pethri authentication...
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
