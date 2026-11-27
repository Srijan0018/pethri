"use client";

import React, { useEffect, useState } from "react";
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
  AnimatedLiveIndicator,
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setNotifOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    setMobileSearchOpen(false);
  };

  if (isStudioRoute) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] text-[#181917]">
        <ScrollProgressBar />
        {children}
      </div>
    );
  }

  const DRAWER_LINKS = [
    { href: "/", label: "Home • Pethri Pulse", icon: Home },
    {
      href: "/feed?sourceKind=newsroom",
      label: dict.drawer.localNews,
      icon: Newspaper,
    },
    { href: "/feed", label: "Community Discussions", icon: MessageSquare },
    { href: "/directory", label: "Events & Directory", icon: Calendar },
    { href: "/live", label: "Live Broadcasts", icon: Radio, isLive: true },
    { href: "/explore", label: dict.drawer.explore, icon: Compass },
    { href: "/moments", label: "Visual Highlights", icon: Film },
    { href: "/report", label: "Submit Private News Tip", icon: FileText },
    { href: "/profile", label: dict.drawer.profile, icon: User },
    { href: "/profile?tab=saved", label: dict.drawer.saved, icon: Bookmark },
    { href: "/settings", label: dict.drawer.settings, icon: Settings },
  ];

  const BOTTOM_NAV = [
    { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
    {
      href: "/feed",
      label: "News",
      icon: Newspaper,
      match: (p: string) => p.startsWith("/feed"),
    },
    {
      href: "/directory",
      label: "Events",
      icon: Calendar,
      match: (p: string) => p.startsWith("/directory"),
    },
    {
      href: "/live",
      label: "Live",
      icon: Radio,
      match: (p: string) => p.startsWith("/live"),
    },
    {
      href: "/profile",
      label: "Profile",
      icon: User,
      match: (p: string) => p.startsWith("/profile"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] text-[#181917]">
      <ScrollProgressBar />

      {/* PURE WHITE NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#E5E3DC] bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3">
          {/* Left: Logo & Locality Selector */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" aria-label="Pethri.com Home" className="shrink-0">
              <PethriLogo variant="light" size="sm" />
            </Link>

            <div className="hidden sm:flex items-center rounded-full border border-[#E5E3DC] bg-[#EAF2EE] px-3 py-1.5 text-xs transition-colors hover:border-[#398BFF]">
              <MapPin className="mr-1.5 h-3.5 w-3.5 text-[#1B5E43]" />
              <select
                aria-label="Filter by Karavali locality"
                value={activeLocalityId}
                onChange={(e) => setActiveLocalityId(e.target.value)}
                className="bg-transparent font-bold text-[#181917] outline-none cursor-pointer pr-1"
              >
                <option value="all">{dict.allRegion}</option>
                {localities.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {language === "kn" && loc.nameKn ? loc.nameKn : loc.name} (
                    {loc.pincode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Search + Notifications + Hamburger Menu */}
          <div className="flex items-center gap-2.5">
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center rounded-full border border-[#E5E3DC] bg-[#F8F7F4] px-3.5 py-2 transition-all focus-within:border-[#398BFF] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#398BFF]/20"
            >
              <Search className="h-3.5 w-3.5 text-[#5A605C] mr-2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={dict.searchPlaceholder}
                className="w-48 lg:w-64 bg-transparent text-xs text-[#181917] placeholder:text-[#5A605C]/70 outline-none"
              />
            </form>

            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Search"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E3DC] bg-white text-[#181917] hover:border-[#398BFF] hover:text-[#398BFF] transition-colors"
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
                  "relative inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white text-[#181917] transition-all hover:border-[#398BFF] hover:text-[#398BFF]",
                  notifOpen
                    ? "border-[#398BFF] text-[#398BFF] electric-glow"
                    : "border-[#E5E3DC]"
                )}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#398BFF] ring-2 ring-white text-[10px] font-extrabold text-white">
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
                    className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-[#E5E3DC] bg-white p-3.5 shadow-2xl z-50"
                  >
                    <div className="flex items-center justify-between border-b border-[#E5E3DC] pb-2">
                      <div>
                        <p className="text-xs font-extrabold text-[#181917]">
                          Karavali Alerts
                        </p>
                        <p className="text-[11px] text-[#5A605C]">
                          {activeLocality ? activeLocality.name : dict.allRegion}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={markNotificationsRead}
                        className="text-[11px] font-bold text-[#398BFF] hover:underline"
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
                              ? "bg-[#F8F7F4] border-transparent hover:border-[#E5E3DC]"
                              : "bg-[#EAF2EE] border-[#1B5E43]/20 hover:border-[#398BFF]/40"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold text-[#181917]">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-[#5A605C]">
                              <RelativeTime iso={n.createdAt} />
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-[#5A605C]">
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
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B5E43] text-white shadow-xs transition-all hover:bg-[#181917] active:scale-95"
            >
              {drawerOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
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
              className="overflow-hidden border-t border-[#E5E3DC] bg-white md:hidden"
            >
              <div className="px-4 py-2.5 space-y-2">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={dict.searchPlaceholder}
                    className="flex-1 rounded-xl border border-[#E5E3DC] bg-[#F8F7F4] px-3 py-2 text-sm outline-none focus:border-[#398BFF]"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#1B5E43] px-4 py-2 text-xs font-bold text-white"
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
                        ? "bg-[#1B5E43] text-white border-[#1B5E43]"
                        : "bg-[#EAF2EE] text-[#181917] border-[#E5E3DC]"
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
                          ? "bg-[#398BFF] text-white border-[#398BFF]"
                          : "bg-white text-[#181917] border-[#E5E3DC]"
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
              className="fixed inset-0 z-50 bg-[#181917]/40 backdrop-blur-[1px]"
            />
            <motion.aside
              aria-label="Pethri public navigation drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[340px] flex-col border-l border-[#E5E3DC] bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#E5E3DC] px-5 py-4">
                <PethriLogo variant="light" size="sm" />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E3DC] bg-[#F8F7F4] text-[#181917] hover:border-[#398BFF] hover:text-[#398BFF] transition-colors"
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
                              ? "bg-[#EAF2EE] text-[#1B5E43]"
                              : "text-[#181917] hover:bg-[#F8F7F4] hover:text-[#1B5E43]"
                          )}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="drawer-active-indicator"
                              transition={{ type: "spring", stiffness: 450, damping: 34 }}
                              className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#398BFF]"
                            />
                          )}
                          <span className="inline-flex items-center gap-3">
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isActive ? "text-[#398BFF]" : "text-[#5A605C]"
                              )}
                            />
                            <span>{item.label}</span>
                          </span>
                          {item.isLive && (
                            <AnimatedLiveIndicator label="LIVE" showWaveform />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Language Toggle */}
                <div className="rounded-2xl border border-[#E5E3DC] bg-[#F8F7F4] p-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#181917]">
                    <Languages className="h-4 w-4 text-[#1B5E43]" />
                    <span>Language / ಭಾಷೆ</span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className={cn(
                        "rounded-lg py-1.5 text-xs font-bold transition-all",
                        language === "en"
                          ? "bg-[#1B5E43] text-white"
                          : "bg-white border border-[#E5E3DC] text-[#181917] hover:border-[#398BFF]"
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
                          ? "bg-[#1B5E43] text-white"
                          : "bg-white border border-[#E5E3DC] text-[#181917] hover:border-[#398BFF]"
                      )}
                    >
                      ಕನ್ನಡ
                    </button>
                  </div>
                </div>
              </div>

              {/* Visitor vs Signed-In Account Footer */}
              <div className="border-t border-[#E5E3DC] bg-[#EAF2EE] p-4">
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
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-[#1B5E43]/30"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-[#181917] truncate">
                          {currentUser.fullName}
                        </p>
                        <p className="text-[11px] text-[#5A605C] truncate">
                          @{currentUser.username}
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
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#E5E3DC] text-[#181917] hover:border-[#D94E34] hover:text-[#D94E34] transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-full bg-[#1B5E43] py-2.5 text-xs font-extrabold text-white transition-all hover:bg-[#181917]"
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
      <main className="flex-1 pb-20 lg:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Civic Forest Footer (NO Studio link in public navigation) */}
      <footer className="hidden lg:block border-t border-[#E5E3DC] bg-[#1B5E43] text-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-4 gap-8 px-6 py-11">
          <div className="space-y-3">
            <PethriLogo variant="dark" size="md" />
            <p className="text-xs leading-relaxed text-[#EAF2EE]/85">
              {dict.tagline}. Verified local reporting for Mangaluru, Udupi,
              Manipal, Kundapura, and Pethri.
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#EAF2EE]/75">
              Sections
            </p>
            <ul className="mt-3 space-y-2 text-xs text-white/90">
              <li>
                <Link href="/" className="hover:text-[#398BFF] transition-colors">
                  Home • Pethri Pulse
                </Link>
              </li>
              <li>
                <Link
                  href="/feed?sourceKind=newsroom"
                  className="hover:text-[#398BFF] transition-colors"
                >
                  Verified News
                </Link>
              </li>
              <li>
                <Link href="/feed" className="hover:text-[#398BFF] transition-colors">
                  Community Discussions
                </Link>
              </li>
              <li>
                <Link
                  href="/directory"
                  className="hover:text-[#398BFF] transition-colors"
                >
                  Karavali Events &amp; Directory
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#EAF2EE]/75">
              Discover &amp; Watch
            </p>
            <ul className="mt-3 space-y-2 text-xs text-white/90">
              <li>
                <Link href="/live" className="hover:text-[#398BFF] transition-colors">
                  Official Pethri Live
                </Link>
              </li>
              <li>
                <Link
                  href="/moments"
                  className="hover:text-[#398BFF] transition-colors"
                >
                  Visual Highlights
                </Link>
              </li>
              <li>
                <Link
                  href="/explore"
                  className="hover:text-[#398BFF] transition-colors"
                >
                  Localities &amp; Reporters
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="hover:text-[#398BFF] transition-colors"
                >
                  Language &amp; Privacy
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#EAF2EE]/75">
              Confidential News Tips
            </p>
            <p className="text-xs text-[#EAF2EE]/85">
              Share verified leads or civic issues privately with the Pethri
              editorial desk. Submissions are never published automatically.
            </p>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#1B5E43] transition-all hover:bg-[#EAF2EE] hover:shadow-md"
            >
              Submit Private Tip
            </Link>
          </div>
        </div>
      </footer>

      {/* COMPACT MOBILE BOTTOM NAVIGATION WITH ANIMATED ACTIVE INDICATOR */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-[#E5E3DC] bg-white/95 backdrop-blur-xs lg:hidden"
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
                  active ? "text-[#1B5E43]" : "text-[#5A605C]"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-bottom-indicator"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-x-2 top-0 h-[2.5px] rounded-full bg-[#398BFF]"
                  />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    active && "stroke-[2.4px] text-[#398BFF]"
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
