"use client";

import React, { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { PethriLogo } from "@/components/PethriLogo";
import { usePethri } from "@/components/PethriProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasMinimumPasswordLength } from "@/lib/repositories/validation";

function UpdatePasswordContent() {
  const router = useRouter();
  const { showToast } = usePethri();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinimumPasswordLength(password)) {
      setError("Use a password with at least 12 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Supabase client is not available.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await client.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;

      setSuccess(true);
      showToast("Password updated successfully!");
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl border border-[#E2E7F0] bg-white p-7 shadow-sm">
        <PethriLogo variant="light" size="md" />
        <div className="mt-5 flex items-center justify-between">
          <h1 className="font-display text-2xl font-extrabold text-[#111318]">
            Set New Password
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[10px] font-extrabold text-[#173FBE]">
            <ShieldCheck className="h-3 w-3" />
            Security
          </span>
        </div>
        <p className="mt-1 text-xs text-[#5B6472]">
          Use at least 12 characters for your Pethri.com password.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-2xl border border-[#D94E34]/35 bg-[#D94E34]/10 p-3 text-xs font-semibold text-[#D94E34]"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-2xl border border-[#173FBE]/30 bg-[#EEF2FF] p-3 text-xs font-semibold text-[#173FBE]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Password successfully updated! Redirecting to your profile...</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleUpdate} className="mt-5 space-y-3.5">
            <div>
              <label htmlFor="new-password" className="block text-xs font-bold text-[#111318] mb-1">
                New Password
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[#E2E7F0] px-3.5 py-2.5 focus-within:border-[#315CFF]">
                <Lock className="h-4 w-4 text-[#5B6472]" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="block text-xs font-bold text-[#111318] mb-1">
                Confirm New Password
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[#E2E7F0] px-3.5 py-2.5 focus-within:border-[#315CFF]">
                <Lock className="h-4 w-4 text-[#5B6472]" />
                <input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#173FBE] py-3 text-xs font-extrabold text-white hover:bg-[#315CFF] transition-colors disabled:opacity-50"
            >
              {loading ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-[#5B6472]">
          Loading password update...
        </div>
      }
    >
      <UpdatePasswordContent />
    </Suspense>
  );
}
