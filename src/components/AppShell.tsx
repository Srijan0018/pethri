"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Bookmark,
  Calendar,
  Compass,
  FileText,
  Film,
  Home,
  Languages,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Newspaper,
  Radio,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import {
  PageTransition,
  ScrollProgressBar,
} from "@/components/MotionPrimitives";
import { PethriLogo } from "@/components/PethriLogo";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    localities,
    activeLocalityId,
    setActiveLocalityId,
    activeLocality,
    currentUser,
    isAuthenticated,
    authMode,
    authEmail,
    signOut,
    notifications,
    unreadCount,
    markNotificationsRead,
    language,
    setLanguage,
    dict,
  } = usePethri();

  // Studio uses its own dedicated workspace shell
  const isStudioRoute = pathname.startsWith("/studio");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerWasOpen = useRef(false);
  const [notifOpenPath, setNotifOpenPath] = useState<string | null>(null);
  const notifOpen = notifOpenPath === pathname;
  const setNotifOpen = (updater: boolean | ((prev: boolean) => boolean)) => {
    setNotifOpenPath((prevPath) => {
      const currentlyOpen = prevPath === pathname;
      const nextOpen =
        typeof updater === "function" ? updater(currentlyOpen) : updater;
      return nextOpen ? pathname : null;
    });
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setNotifOpenPath(null);
      }
      if (e.key === "Tab" && drawerOpen) {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  useEffect(() => {
    if (drawerOpen) {
      drawerRef.current
        ?.querySelector<HTMLElement>('button[aria-label="Close navigation menu"]')
        ?.focus();
    } else if (drawerWasOpen.current) {
      menuButtonRef.current?.focus();
    }
    drawerWasOpen.current = drawerOpen;
  }, [drawerOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    setMobileSearchOpen(false);
  };

  if (isStudioRoute) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#111318]">
        <ScrollProgressBar />
        <a
          href="#main-content"
          className="sr-only z-[100] rounded bg-white px-4 py-2 font-bold text-[#111318] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {children}
      </div>
    );
  }

  const DRAWER_LINKS = [
    { href: "/", label: `${dict.drawer.home} • ${dict.nav.pulse}`, icon: Home },
    {
      href: "/feed?sourceKind=newsroom",
      label: dict.drawer.localNews,
      icon: Newspaper,
    },
    { href: "/feed", label: dict.drawer.communityFeed, icon: MessageSquare },
    { href: "/directory", label: dict.drawer.eventsDirectory, icon: Calendar },
    { href: "/explore", label: dict.drawer.explore, icon: Compass },
    { href: "/report", label: dict.drawer.submitNews, icon: FileText },
    { href: "/editorial", label: dict.drawer.editorialDesk, icon: Newspaper },
    { href: "/profile", label: dict.drawer.profile, icon: User },
    { href: "/profile?tab=saved", label: dict.drawer.saved, icon: Bookmark },
    { href: "/settings", label: dict.drawer.settings, icon: Settings },
  ];

  const BOTTOM_NAV = [
    { href: "/", label: dict.drawer.home, icon: Home, match: (p: string) => p === "/" },
    {
      href: "/feed",
      label: dict.nav.news,
      icon: Newspaper,
      match: (p: string) => p.startsWith("/feed"),
    },
    {
      href: "/directory",
      label: dict.nav.events,
      icon: Calendar,
      match: (p: string) => p.startsWith("/directory"),
    },
    {
      href: "/report",
      label: dict.nav.submitTip,
      icon: FileText,
      match: (p: string) => p.startsWith("/report"),
    },
    {
      href: "/profile",
      label: dict.drawer.profile,
      icon: User,
      match: (p: string) => p.startsWith("/profile"),
    },
  ];

  const PRIMARY_NAV = [
    { href: "/", label: dict.nav.pulse, match: (p: string) => p === "/" },
    { href: "/feed", label: dict.nav.news, match: (p: string) => p.startsWith("/feed") },
    {
      href: "/explore",
      label: dict.nav.explore,
      match: (p: string) => p.startsWith("/explore"),
    },
    {
      href: "/directory",
      label: dict.nav.events,
      match: (p: string) => p.startsWith("/directory"),
    },
    {
      href: "/report",
      label: dict.nav.submitTip,
      match: (p: string) => p.startsWith("/report"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111318]">
      <ScrollProgressBar />

      {/* ARCHITECTURAL NAVIGATION MASTHEAD (Tall, Airy, Smoothly Dissolving into White Body) */}
      <header className="relative z-40 overflow-hidden bg-transparent text-white">
        {/* Coastal Photo + Blue Gradient that smoothly fades to pure white well before the bottom edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            maskImage:
              "linear-gradient(to bottom, black 0%, black 42%, transparent 94%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 42%, transparent 94%)",
          }}
        >
          <div
            className="absolute inset-0 bg-cover"
            style={{
              backgroundImage: "url('/images/coastal/malpe-header.jpg')",
              backgroundPosition: "center 38%",
              transform: "scale(1.14) rotate(-2.5deg)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120]/55 via-[#12224A]/35 to-[#173FBE]/45" />
        </div>
        {/* Deep soft bottom white feather for an invisible transition */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent via-white/70 to-white"
        />

        <div className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 pt-5 pb-4 sm:pt-6 sm:pb-5">
          {/* Left: Prominent Brand + Minimal Locality Pill */}
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              href="/"
              aria-label="Pethri.com Home"
              className="shrink-0 transition-opacity hover:opacity-90"
            >
              <PethriLogo variant="dark" size="md" />
            </Link>

            <div className="hidden sm:flex items-center rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs backdrop-blur-md transition-colors hover:border-white/40 hover:bg-white/18">
              <MapPin className="mr-1.5 h-3.5 w-3.5 text-[#C5A572] shrink-0" />
              <select
                aria-label="Filter by Karavali locality"
                value={activeLocalityId}
                onChange={(e) => setActiveLocalityId(e.target.value)}
                className="bg-transparent font-bold text-white outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-[#111318] text-white">
                  {dict.allRegion}
                </option>
                {localities.map((loc) => (
                  <option
                    key={loc.id}
                    value={loc.id}
                    className="bg-[#111318] text-white"
                  >
                    {language === "kn" && loc.nameKn ? loc.nameKn : loc.name} (
                    {loc.pincode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Center: Clean Architectural Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur-md lg:flex"
          >
            {PRIMARY_NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
                    active
                      ? "bg-white text-[#111318] shadow-xs"
                      : "text-white/85 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Search + Language + Notifications + Menu */}
          <div className="flex items-center gap-2">
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center rounded-full border border-white/20 bg-white/12 px-3.5 py-1.5 backdrop-blur-md transition-all focus-within:border-white/50 focus-within:bg-white/20"
            >
              <Search className="h-3.5 w-3.5 text-white/75 mr-2 shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={dict.searchPlaceholder}
                className="w-40 xl:w-56 bg-transparent text-xs text-white placeholder:text-white/65 outline-none"
              />
            </form>

            <button
              type="button"
              onClick={() => setLanguage(language === "en" ? "kn" : "en")}
              aria-label="Toggle language"
              className="hidden sm:inline-flex h-9 items-center justify-center rounded-full border border-white/20 bg-white/12 px-3 text-[11px] font-extrabold text-white backdrop-blur-md hover:border-white/45 hover:bg-white/20 transition-colors"
            >
              {language === "en" ? "ಕನ್ನಡ" : "EN"}
            </button>

            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Search"
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white backdrop-blur-md hover:border-white/45 hover:bg-white/20 transition-colors"
            >
              {mobileSearchOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label="Notifications"
                className={cn(
                  "relative inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-all",
                  notifOpen
                    ? "border-white bg-white text-[#111318]"
                    : "border-white/20 bg-white/12 text-white hover:border-white/45 hover:bg-white/20"
                )}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D94E34] ring-2 ring-[#12224A] text-[10px] font-extrabold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-[#E2E7F0] bg-white p-3.5 shadow-2xl z-50"
                  >
                    <div className="flex items-center justify-between border-b border-[#E2E7F0] pb-2">
                      <div>
                        <p className="text-xs font-extrabold text-[#111318]">
                          Karavali Alerts
                        </p>
                        <p className="text-[11px] text-[#5B6472]">
                          {activeLocality ? activeLocality.name : dict.allRegion}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={markNotificationsRead}
                        className="text-[11px] font-bold text-[#315CFF] hover:underline"
                      >
                        Mark read
                      </button>
                    </div>
                    <div className="mt-2.5 max-h-72 space-y-2 overflow-y-auto">
                      {notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.href}
                          onClick={() => setNotifOpen(false)}
                          className={cn(
                            "block rounded-xl p-2.5 transition-colors border",
                            n.isRead
                              ? "bg-[#FFFFFF] border-transparent hover:border-[#E2E7F0]"
                              : "bg-[#EEF2FF] border-[#173FBE]/20 hover:border-[#315CFF]/40"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold text-[#111318]">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-[#5B6472]">
                              <RelativeTime iso={n.createdAt} />
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-[#5B6472]">
                            {n.message}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              ref={menuButtonRef}
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={drawerOpen}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#111318] shadow-xs transition-all hover:bg-[#EEF2FF] active:scale-95"
            >
              {drawerOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search + Locality Strip */}
        <AnimatePresence initial={false}>
          {mobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-[#E2E7F0] bg-white md:hidden"
            >
              <div className="px-4 py-2.5 space-y-2">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={dict.searchPlaceholder}
                    className="flex-1 rounded-xl border border-[#E2E7F0] bg-[#FFFFFF] px-3 py-2 text-sm outline-none focus:border-[#315CFF]"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#173FBE] px-4 py-2 text-xs font-bold text-white"
                  >
                    Go
                  </button>
                </form>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveLocalityId("all")}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-xs font-bold border",
                      activeLocalityId === "all"
                        ? "bg-[#173FBE] text-white border-[#173FBE]"
                        : "bg-[#EEF2FF] text-[#111318] border-[#E2E7F0]"
                    )}
                  >
                    {dict.allRegion}
                  </button>
                  {localities.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setActiveLocalityId(loc.id)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-xs font-semibold border",
                        activeLocalityId === loc.id
                          ? "bg-[#315CFF] text-white border-[#315CFF]"
                          : "bg-white text-[#111318] border-[#E2E7F0]"
                      )}
                    >
                      {language === "kn" && loc.nameKn ? loc.nameKn : loc.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unified Interactive Locality & Channel Strip (Generous bottom breathing space before melt) */}
        <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col gap-2.5 px-4 pt-2 pb-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:pt-3 lg:pb-16">
          {/* Interactive Locality Switcher Rail */}
          <div
            role="group"
            aria-label="Filter by Karavali town"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
          >
            <button
              type="button"
              onClick={() => setActiveLocalityId("all")}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors border backdrop-blur-md",
                activeLocalityId === "all"
                  ? "border-white bg-white text-[#111318] shadow-xs"
                  : "border-white/25 bg-[#0B1120]/45 text-white hover:bg-white/20"
              )}
            >
              {dict.allRegion}
            </button>
            {localities.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setActiveLocalityId(loc.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors border backdrop-blur-md",
                  activeLocalityId === loc.id
                    ? "border-white bg-white text-[#111318] shadow-xs font-bold"
                    : "border-white/25 bg-[#0B1120]/45 text-white/95 hover:bg-white/20"
                )}
              >
                {language === "kn" && loc.nameKn ? loc.nameKn : loc.name}
              </button>
            ))}
          </div>

          {/* Interactive Channel Shortcuts */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <Link
              href="/live"
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors backdrop-blur-md",
                pathname.startsWith("/live")
                  ? "border-white bg-white text-[#111318]"
                  : "border-white/25 bg-[#0B1120]/45 text-white hover:bg-white/20"
              )}
            >
              <Radio className="h-3.5 w-3.5 text-[#D94E34]" />
              {dict.nav.liveDesk}
            </Link>
            <Link
              href="/moments"
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors backdrop-blur-md",
                pathname.startsWith("/moments")
                  ? "border-white bg-white text-[#111318]"
                  : "border-white/25 bg-[#0B1120]/45 text-white hover:bg-white/20"
              )}
            >
              <Film className="h-3.5 w-3.5 text-[#C5A572]" />
              {dict.nav.moments}
            </Link>
            <Link
              href="/civic-reports"
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors backdrop-blur-md",
                pathname.startsWith("/civic-reports")
                  ? "border-white bg-white text-[#111318]"
                  : "border-white/25 bg-[#0B1120]/45 text-white hover:bg-white/20"
              )}
            >
              <FileText className="h-3.5 w-3.5 text-[#EEF2FF]" />
              {dict.nav.civicReports}
            </Link>
          </div>
        </div>
      </header>

      {/* ANIMATED COLLAPSIBLE SIDEBAR / FULL-HEIGHT MOBILE DRAWER */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-[#111318]/40 backdrop-blur-[1px]"
            />
            <motion.aside
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Pethri public navigation drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[340px] flex-col border-l border-[#E2E7F0] bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#E2E7F0] px-5 py-4">
                <PethriLogo variant="light" size="sm" />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E7F0] bg-[#FFFFFF] text-[#111318] hover:border-[#315CFF] hover:text-[#315CFF] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                <nav className="space-y-1">
                  {DRAWER_LINKS.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname === item.href.split("?")[0];
                    return (
                      <motion.div
                        key={item.href + item.label}
                        initial={{ opacity: 0, x: 14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.02 * idx, duration: 0.2 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setDrawerOpen(false)}
                          className={cn(
                            "relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all hover:translate-x-0.5",
                            isActive
                              ? "bg-[#EEF2FF] text-[#173FBE]"
                              : "text-[#111318] hover:bg-[#FFFFFF] hover:text-[#173FBE]"
                          )}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="drawer-active-indicator"
                              transition={{ type: "spring", stiffness: 450, damping: 34 }}
                              className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#315CFF]"
                            />
                          )}
                          <span className="inline-flex items-center gap-3">
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isActive ? "text-[#315CFF]" : "text-[#5B6472]"
                              )}
                            />
                            <span>{item.label}</span>
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Language Toggle */}
                <div className="rounded-2xl border border-[#E2E7F0] bg-[#FFFFFF] p-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#111318]">
                    <Languages className="h-4 w-4 text-[#173FBE]" />
                    <span>Language / ಭಾಷೆ</span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className={cn(
                        "rounded-lg py-1.5 text-xs font-bold transition-all",
                        language === "en"
                          ? "bg-[#173FBE] text-white"
                          : "bg-white border border-[#E2E7F0] text-[#111318] hover:border-[#315CFF]"
                      )}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("kn")}
                      className={cn(
                        "rounded-lg py-1.5 text-xs font-bold transition-all",
                        language === "kn"
                          ? "bg-[#173FBE] text-white"
                          : "bg-white border border-[#E2E7F0] text-[#111318] hover:border-[#315CFF]"
                      )}
                    >
                      ಕನ್ನಡ
                    </button>
                  </div>
                </div>
              </div>

              {/* Visitor vs Signed-In Account Footer */}
              <div className="border-t border-[#E2E7F0] bg-[#EEF2FF] p-4">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href="/profile"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 min-w-0"
                    >
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.fullName}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-[#173FBE]/30"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-[#111318] truncate">
                          {currentUser.fullName}
                        </p>
                        <p className="text-[11px] text-[#5B6472] truncate">
                          {authMode === "supabase" && authEmail
                            ? `${authEmail} • Supabase`
                            : `@${currentUser.username} • Demo`}
                        </p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        setDrawerOpen(false);
                      }}
                      aria-label="Sign out"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#E2E7F0] text-[#111318] hover:border-[#D94E34] hover:text-[#D94E34] transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-full bg-[#173FBE] py-2.5 text-xs font-extrabold text-white transition-all hover:bg-[#111318]"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In to Comment &amp; Save</span>
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="flex-1 pb-20 lg:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Civic Forest Footer (NO Studio link in public navigation) */}
      <footer className="border-t border-white/10 bg-[#111318] text-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-7 px-4 py-8 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:grid-cols-2 sm:gap-8 sm:px-6 sm:py-11 lg:grid-cols-4 lg:pb-11">
          <div className="space-y-3">
            <PethriLogo variant="dark" size="md" />
            <p className="text-xs leading-relaxed text-[#EEF2FF]/85">
              {dict.tagline}. Verified local reporting for Mangaluru, Udupi,
              Manipal, Kundapura, and Pethri.
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#EEF2FF]/75">
              Sections
            </p>
            <ul className="mt-3 space-y-2 text-xs text-white/90">
              <li>
                <Link href="/" className="hover:text-[#315CFF] transition-colors">
                  Home • Pethri Pulse
                </Link>
              </li>
              <li>
                <Link
                  href="/feed?sourceKind=newsroom"
                  className="hover:text-[#315CFF] transition-colors"
                >
                  Verified News
                </Link>
              </li>
              <li>
                <Link href="/feed" className="hover:text-[#315CFF] transition-colors">
                  Community Discussions
                </Link>
              </li>
              <li>
                <Link
                  href="/directory"
                  className="hover:text-[#315CFF] transition-colors"
                >
                  Karavali Events &amp; Directory
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#EEF2FF]/75">
              Explore &amp; Engage
            </p>
            <ul className="mt-3 space-y-2 text-xs text-white/90">
              <li>
                <Link
                  href="/explore"
                  className="hover:text-[#315CFF] transition-colors"
                >
                  Localities &amp; Reporters
                </Link>
              </li>
              <li>
                <Link
                  href="/report"
                  className="hover:text-[#315CFF] transition-colors"
                >
                  Submit Private News Tip
                </Link>
              </li>
              <li>
                <Link
                  href="/profile?tab=saved"
                  className="hover:text-[#315CFF] transition-colors"
                >
                  Saved Bookmarks
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="hover:text-[#315CFF] transition-colors"
                >
                  Language &amp; Privacy
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#EEF2FF]/75">
              Confidential News Tips
            </p>
            <p className="text-xs text-[#EEF2FF]/85">
              Share verified leads or civic issues privately with the Pethri
              editorial desk. Submissions are never published automatically.
            </p>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#173FBE] transition-all hover:bg-[#EEF2FF] hover:shadow-md"
            >
              Submit Private Tip
            </Link>
          </div>
        </div>
      </footer>

      {/* COMPACT MOBILE BOTTOM NAVIGATION WITH ANIMATED ACTIVE INDICATOR */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-[#E2E7F0] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xs lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-center py-1.5 px-2">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-bold transition-colors",
                  active ? "text-[#173FBE]" : "text-[#5B6472]"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-bottom-indicator"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-x-2 top-0 h-[2.5px] rounded-full bg-[#315CFF]"
                  />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    active && "stroke-[2.4px] text-[#315CFF]"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
