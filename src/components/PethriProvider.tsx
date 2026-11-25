"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DEMO_LOCALITIES, DEMO_NOTIFICATIONS, DEMO_PROFILES } from "@/lib/seed-data";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
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
  switchDemoUser: (userId: string) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  supabaseReady: boolean;
  nowMs: number | null;
  toast: ToastMessage | null;
  showToast: (title: string, tone?: ToastMessage["tone"]) => void;
}

const PethriContext = createContext<PethriContextValue | null>(null);

export function PethriProvider({ children }: { children: React.ReactNode }) {
  const [localities, setLocalities] = useState<Locality[]>(DEMO_LOCALITIES);
  const [activeLocalityId, setActiveLocalityId] = useState<string>("all");
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_PROFILES[1]); // Kavitha (Citizen) default; switchable in UI
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(DEMO_NOTIFICATIONS);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const supabaseReady = isSupabaseConfigured();

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
      // Keep cached demo notifications cleanly
    }
  };

  useEffect(() => {
    setNowMs(Date.now());
    refreshNotifications();

    if (supabaseReady) {
      const client = createSupabaseBrowserClient();
      client?.auth.getUser().then(({ data }) => {
        if (data?.user) {
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

  const switchDemoUser = (userId: string) => {
    const found = DEMO_PROFILES.find((p) => p.id === userId);
    if (found) {
      setCurrentUser(found);
      showToast(`Switched active demo profile to ${found.fullName} (${found.role})`, "info");
    }
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
      // Local state already updated
    }
  };

  const activeLocality =
    localities.find((l) => l.id === activeLocalityId) ?? null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <PethriContext.Provider
      value={{
        localities,
        activeLocalityId,
        setActiveLocalityId,
        activeLocality,
        currentUser,
        switchDemoUser,
        notifications,
        unreadCount,
        markNotificationsRead,
        refreshNotifications,
        supabaseReady,
        nowMs,
        toast,
        showToast,
      }}
    >
      {children}
      {toast && (
        <div className="fixed bottom-20 right-4 z-50 max-w-sm md:bottom-6">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-md transition-all ${
              toast.tone === "error"
                ? "border-red-300 bg-[#D91E2A] text-white"
                : toast.tone === "info"
                  ? "border-[#0A2E6E]/30 bg-[#0A2E6E] text-white"
                  : "border-emerald-300 bg-emerald-700 text-white"
            }`}
          >
            {toast.title}
          </div>
        </div>
      )}
    </PethriContext.Provider>
  );
}

export function usePethri() {
  const ctx = useContext(PethriContext);
  if (!ctx) {
    throw new Error("usePethri must be used within PethriProvider");
  }
  return ctx;
}
