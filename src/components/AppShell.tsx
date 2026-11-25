"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  Camera,
  ChevronDown,
  Compass,
  Film,
  Home,
  MapPin,
  Newspaper,
  Search,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import { PethriLogo } from "@/components/PethriLogo";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { DEMO_PROFILES } from "@/lib/seed-data";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/moments", label: "Moments", icon: Film },
  { href: "/explore", label: "Explore Map", icon: Compass },
  { href: "/directory", label: "Directory", icon: Building2 },
  { href: "/editorial", label: "Editorial Desk", icon: ShieldAlert },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    localities,
    activeLocalityId,
    setActiveLocalityId,
    activeLocality,
    currentUser,
    switchDemoUser,
    notifications,
    unreadCount,
    markNotificationsRead,
    supabaseReady,
  } = usePethri();

  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    setMobileSearchOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      {/* Top Breaking / Mode Strip */}
      <div className="bg-[#06183B] text-white text-xs border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#D91E2A] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
            <p className="truncate text-slate-200">
              Pethri Junction Express Bus Timings Expanded • Parish Feast
              Procession Advisory Active
            </p>
          </div>
          <div className="hidden sm:flex shrink-0 items-center gap-3 text-[11px] text-slate-300">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                supabaseReady
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "bg-amber-500/20 text-amber-200"
              )}
            >
              {supabaseReady ? "Supabase Connected" : "Demo Data Mode"}
            </span>
            <Link
              href="/auth"
              className="font-semibold text-white hover:text-amber-200 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
          {/* Logo + Locality Selector */}
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Pethri.com Home">
              <PethriLogo variant="light" size="sm" />
            </Link>

            <div className="hidden sm:flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
              <MapPin className="mr-1.5 h-3.5 w-3.5 text-[#D91E2A]" />
              <select
                aria-label="Filter by locality"
                value={activeLocalityId}
                onChange={(e) => setActiveLocalityId(e.target.value)}
                className="bg-transparent font-semibold text-[#0A2E6E] outline-none cursor-pointer pr-1"
              >
                <option value="all">All Pethri Belt</option>
                {localities.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.pincode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-1"
          >
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-[#0A2E6E] text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100 hover:text-[#0A2E6E]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Search, Notifications, Profile/Role, Report CTA */}
          <div className="flex items-center gap-2">
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 focus-within:border-[#0A2E6E] focus-within:bg-white transition-all"
            >
              <Search className="h-3.5 w-3.5 text-slate-400 mr-2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search local news..."
                className="w-36 xl:w-44 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
              />
            </form>

            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Search"
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
            >
              {mobileSearchOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  setAccountOpen(false);
                }}
                aria-label="Notifications"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:border-[#0A2E6E]/30 hover:text-[#0A2E6E] transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D91E2A] text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <p className="text-xs font-bold text-[#0A2E6E]">
                        Locality Alerts
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {activeLocality ? activeLocality.name : "All Pethri Belt"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={markNotificationsRead}
                      className="text-[11px] font-semibold text-[#D91E2A] hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setNotifOpen(false)}
                        className={cn(
                          "block rounded-xl p-2.5 transition-colors",
                          n.isRead
                            ? "bg-slate-50/70 hover:bg-slate-100"
                            : "bg-[#0A2E6E]/5 ring-1 ring-[#0A2E6E]/10 hover:bg-[#0A2E6E]/10"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-[#0A2E6E]">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            <RelativeTime iso={n.createdAt} />
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-700">
                          {n.message}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Active Demo / Account Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAccountOpen((prev) => !prev);
                  setNotifOpen(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 text-xs font-semibold text-slate-800 hover:border-[#0A2E6E]/30"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span className="hidden sm:inline max-w-24 truncate">
                  {currentUser.fullName.split(" ")[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl z-50">
                  <div className="border-b border-slate-100 pb-2.5">
                    <p className="text-xs font-bold text-[#0A2E6E]">
                      {currentUser.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      @{currentUser.username} • Role:{" "}
                      <span className="font-semibold uppercase text-[#D91E2A]">
                        {currentUser.role}
                      </span>
                    </p>
                  </div>
                  <div className="mt-2 space-y-1">
                    <Link
                      href="/profile"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <User className="h-3.5 w-3.5 text-[#0A2E6E]" />
                      My Reporter Profile & Saved
                    </Link>
                    <Link
                      href="/editorial"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-[#D91E2A]" />
                      Editorial Review Dashboard
                    </Link>
                  </div>
                  <div className="mt-2.5 border-t border-slate-100 pt-2.5">
                    <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Demo Role Switcher
                    </p>
                    <div className="mt-1.5 space-y-1">
                      {DEMO_PROFILES.map((prof) => (
                        <button
                          key={prof.id}
                          type="button"
                          onClick={() => {
                            switchDemoUser(prof.id);
                            setAccountOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors",
                            currentUser.id === prof.id
                              ? "bg-[#0A2E6E] text-white"
                              : "hover:bg-slate-100 text-slate-700"
                          )}
                        >
                          <span className="font-medium truncate">
                            {prof.fullName}
                          </span>
                          <span className="text-[10px] uppercase opacity-80">
                            {prof.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Citizen Reporter Quick Capture CTA */}
            <Link
              href="/report"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#D91E2A] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#D91E2A]/25 hover:bg-[#B81621] transition-all active:scale-95"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Report</span>
            </Link>
          </div>
        </div>

        {/* Mobile Expandable Search + Locality Bar */}
        {mobileSearchOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-2.5 md:hidden">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Pethri stories, churches, businesses..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#0A2E6E]"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#0A2E6E] px-4 py-2 text-xs font-bold text-white"
              >
                Go
              </button>
            </form>
            <div className="mt-2 flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => setActiveLocalityId("all")}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                  activeLocalityId === "all"
                    ? "bg-[#0A2E6E] text-white"
                    : "bg-slate-100 text-slate-700"
                )}
              >
                All Belt
              </button>
              {localities.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setActiveLocalityId(loc.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                    activeLocalityId === loc.id
                      ? "bg-[#D91E2A] text-white"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>

      {/* Editorial Footer (Desktop & Tablet) */}
      <footer className="hidden lg:block border-t border-slate-200 bg-[#06183B] text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-8 px-4 py-12">
          <div className="col-span-1 space-y-3">
            <PethriLogo variant="dark" size="md" />
            <p className="text-xs leading-relaxed text-slate-300">
              Hyperlocal social journalism built for Pethri, Brahmavar, Barkur,
              Cherkady, and neighbouring coastal wards.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Explore Network
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              <li>
                <Link href="/feed" className="hover:text-white">
                  Social News Feed
                </Link>
              </li>
              <li>
                <Link href="/moments" className="hover:text-white">
                  Pethri Moments Reels
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-white">
                  Interactive Locality Map
                </Link>
              </li>
              <li>
                <Link href="/directory" className="hover:text-white">
                  Local Business Directory
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Trust & Verification
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              <li>Citizen submissions never auto-verify</li>
              <li>3-tier verification transparency</li>
              <li>Privacy-first GPS consent controls</li>
              <li>
                <Link href="/editorial" className="hover:text-white underline">
                  Editorial Desk Queue
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Witnessing Local News?
            </p>
            <p className="text-xs text-slate-300">
              Capture a moment or civic update in two quick steps.
            </p>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-full bg-[#D91E2A] px-4 py-2 text-xs font-bold text-white hover:bg-[#B91420]"
            >
              <Camera className="h-3.5 w-3.5" />
              Submit Citizen Report
            </Link>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-[11px] text-slate-400">
          Pethri.com • Hyperlocal Social News & Community Network • Sample demo
          stories are labeled when Supabase is not connected.
        </div>
      </footer>

      {/* Native-App-Quality Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-center py-1.5 px-2">
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-semibold",
              pathname === "/" ? "text-[#0A2E6E]" : "text-slate-500"
            )}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/feed"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-semibold",
              pathname.startsWith("/feed") ? "text-[#0A2E6E]" : "text-slate-500"
            )}
          >
            <Newspaper className="h-5 w-5" />
            <span>Feed</span>
          </Link>
          <Link
            href="/report"
            className="flex flex-col items-center justify-center -mt-5"
            aria-label="Capture or Report Local News"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D91E2A] text-white shadow-lg shadow-[#D91E2A]/35 ring-4 ring-white active:scale-95 transition-transform">
              <Camera className="h-5 w-5" />
            </span>
            <span className="mt-0.5 text-[10px] font-bold text-[#D91E2A]">
              Capture
            </span>
          </Link>
          <Link
            href="/moments"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-semibold",
              pathname.startsWith("/moments")
                ? "text-[#0A2E6E]"
                : "text-slate-500"
            )}
          >
            <Film className="h-5 w-5" />
            <span>Moments</span>
          </Link>
          <Link
            href="/explore"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-semibold",
              pathname.startsWith("/explore")
                ? "text-[#0A2E6E]"
                : "text-slate-500"
            )}
          >
            <Compass className="h-5 w-5" />
            <span>Explore</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
