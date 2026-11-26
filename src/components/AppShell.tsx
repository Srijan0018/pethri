"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Bookmark,
  Building2,
  Camera,
  Compass,
  FilePlus2,
  Film,
  Home,
  Languages,
  MapPin,
  Menu,
  Newspaper,
  Plus,
  Radio,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  User,
  Users,
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
    notifications,
    unreadCount,
    markNotificationsRead,
    language,
    setLanguage,
    dict,
    supabaseReady,
  } = usePethri();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Close drawers on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setNotifOpen(false);
        setCreateSheetOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setNotifOpen(false);
    setCreateSheetOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    setMobileSearchOpen(false);
  };

  const DRAWER_PRIMARY = [
    { href: "/", label: dict.drawer.home, icon: Home },
    {
      href: "/feed?sourceKind=newsroom",
      label: dict.drawer.localNews,
      icon: Newspaper,
    },
    { href: "/feed", label: dict.drawer.communityFeed, icon: Users },
    { href: "/explore", label: dict.drawer.explore, icon: Compass },
    {
      href: "/report?mode=moment",
      label: dict.drawer.shareMoment,
      icon: Sparkles,
      accent: true,
    },
    {
      href: "/live",
      label: dict.drawer.goLive,
      icon: Radio,
      badge: "LIVE",
    },
    {
      href: "/report",
      label: dict.drawer.submitNews,
      icon: FilePlus2,
    },
    { href: "/profile", label: dict.drawer.profile, icon: User },
    { href: "/profile?tab=saved", label: dict.drawer.saved, icon: Bookmark },
    { href: "/settings", label: dict.drawer.settings, icon: Settings },
  ];

  const DRAWER_SECONDARY = [
    { href: "/moments", label: "Channels & Shorts", icon: Film },
    {
      href: "/directory",
      label: dict.drawer.eventsDirectory,
      icon: Building2,
    },
    { href: "/editorial", label: dict.drawer.editorialDesk, icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6EF] text-[#202820]">
      <ScrollProgressBar />

      {/* UNCROWDED TOP BAR: Hamburger + Pethri Logo + Locality Selector + Search + Notifications */}
      <header className="sticky top-0 z-40 border-b border-[#202820]/10 bg-[#F7F6EF]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3">
          {/* Left: Three-line Hamburger + Logo + Locality Selector */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#202820]/15 bg-white text-[#202820] hover:bg-[#DCEBCB] transition-colors active:scale-95"
            >
              {drawerOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <Link href="/" aria-label="Pethri.com Home" className="shrink-0">
              <PethriLogo variant="light" size="sm" />
            </Link>

            <div className="hidden sm:flex items-center rounded-full border border-[#202820]/15 bg-[#DCEBCB]/60 px-3 py-1.5 text-xs">
              <MapPin className="mr-1.5 h-3.5 w-3.5 text-[#202820]" />
              <select
                aria-label="Filter by Karavali locality"
                value={activeLocalityId}
                onChange={(e) => setActiveLocalityId(e.target.value)}
                className="bg-transparent font-bold text-[#202820] outline-none cursor-pointer pr-1"
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

          {/* Right: Search + Notifications */}
          <div className="flex items-center gap-2.5">
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center rounded-full border border-[#202820]/15 bg-white px-3.5 py-2 focus-within:border-[#202820] transition-colors"
            >
              <Search className="h-3.5 w-3.5 text-[#525F52] mr-2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={dict.searchPlaceholder}
                className="w-48 lg:w-64 bg-transparent text-xs text-[#202820] placeholder:text-[#525F52]/70 outline-none"
              />
            </form>

            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Search"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#202820]/15 bg-white text-[#202820]"
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
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#202820]/15 bg-white text-[#202820] hover:bg-[#DCEBCB] transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#B7F36B] ring-2 ring-[#F7F6EF] text-[10px] font-extrabold text-[#202820]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#202820]/15 bg-[#F7F6EF] p-3.5 shadow-2xl z-50">
                  <div className="flex items-center justify-between border-b border-[#202820]/10 pb-2">
                    <div>
                      <p className="text-xs font-extrabold text-[#202820]">
                        Karavali Alerts
                      </p>
                      <p className="text-[11px] text-[#525F52]">
                        {activeLocality ? activeLocality.name : dict.allRegion}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={markNotificationsRead}
                      className="text-[11px] font-bold text-[#202820] underline"
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
                          "block rounded-xl p-2.5 transition-colors",
                          n.isRead
                            ? "bg-white/70 hover:bg-white"
                            : "bg-[#DCEBCB]/80 border border-[#202820]/10 hover:bg-[#DCEBCB]"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold text-[#202820]">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-[#525F52]">
                            <RelativeTime iso={n.createdAt} />
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#202820]/85">
                          {n.message}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Expandable Search + Locality Strip */}
        {mobileSearchOpen && (
          <div className="border-t border-[#202820]/10 bg-white px-4 py-2.5 md:hidden space-y-2">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={dict.searchPlaceholder}
                className="flex-1 rounded-xl border border-[#202820]/15 bg-[#F7F6EF] px-3 py-2 text-sm outline-none focus:border-[#202820]"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#202820] px-4 py-2 text-xs font-bold text-[#B7F36B]"
              >
                Go
              </button>
            </form>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveLocalityId("all")}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
                  activeLocalityId === "all"
                    ? "bg-[#202820] text-[#B7F36B]"
                    : "bg-[#DCEBCB]/60 text-[#202820]"
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
                    "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                    activeLocalityId === loc.id
                      ? "bg-[#B7F36B] text-[#202820]"
                      : "bg-[#DCEBCB]/50 text-[#202820]"
                  )}
                >
                  {language === "kn" && loc.nameKn ? loc.nameKn : loc.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ANIMATED COLLAPSIBLE SIDEBAR (Desktop) & FULL-HEIGHT DRAWER (Mobile) */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-[#202820]/45 backdrop-blur-xs"
            />
            <motion.aside
              aria-label="Pethri navigation drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 flex w-full max-w-[330px] flex-col border-r border-[#202820]/15 bg-[#F7F6EF] shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#202820]/10 px-5 py-4">
                <PethriLogo variant="light" size="sm" />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#202820]/15 bg-white text-[#202820] hover:bg-[#DCEBCB]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Links with Stagger */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                <nav className="space-y-1">
                  {DRAWER_PRIMARY.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname === item.href.split("?")[0];
                    return (
                      <motion.div
                        key={item.href + item.label}
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * idx, duration: 0.24 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setDrawerOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all",
                            isActive
                              ? "bg-[#202820] text-[#B7F36B]"
                              : item.accent
                                ? "bg-[#DCEBCB] text-[#202820] hover:bg-[#B7F36B]"
                                : "text-[#202820] hover:bg-[#DCEBCB]/60"
                          )}
                        >
                          <span className="inline-flex items-center gap-3">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </span>
                          {item.badge && (
                            <span className="rounded-full bg-[#B7F36B] px-2 py-0.5 text-[10px] font-extrabold text-[#202820]">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                <div className="border-t border-[#202820]/10 pt-4 space-y-1">
                  <p className="px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-[#525F52]">
                    Channels &amp; Governance
                  </p>
                  {DRAWER_SECONDARY.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#525F52] hover:bg-[#DCEBCB]/50 hover:text-[#202820]"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Language Switcher inside Drawer */}
                <div className="rounded-2xl border border-[#202820]/10 bg-white p-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#202820]">
                    <Languages className="h-4 w-4" />
                    <span>Language / ಭಾಷೆ</span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className={cn(
                        "rounded-lg py-1.5 text-xs font-bold transition-colors",
                        language === "en"
                          ? "bg-[#202820] text-[#B7F36B]"
                          : "bg-[#F7F6EF] text-[#202820]"
                      )}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("kn")}
                      className={cn(
                        "rounded-lg py-1.5 text-xs font-bold transition-colors",
                        language === "kn"
                          ? "bg-[#202820] text-[#B7F36B]"
                          : "bg-[#F7F6EF] text-[#202820]"
                      )}
                    >
                      ಕನ್ನಡ
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Account Card */}
              <div className="border-t border-[#202820]/10 bg-[#DCEBCB]/40 p-4">
                <Link
                  href="/profile"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3"
                >
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-[#202820]/15"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-[#202820] truncate">
                      {currentUser.fullName}
                    </p>
                    <p className="text-[11px] text-[#525F52] truncate">
                      @{currentUser.username} • {currentUser.role}
                    </p>
                  </div>
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Page Content */}
      <main className="flex-1 pb-20 lg:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Clean Minimal Karavali Footer (Desktop) */}
      <footer className="hidden lg:block border-t border-[#202820]/10 bg-[#202820] text-[#F7F6EF]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-4 gap-8 px-6 py-10">
          <div className="space-y-3">
            <PethriLogo variant="dark" size="md" />
            <p className="text-xs leading-relaxed text-[#C9E8D5]/80">
              {dict.tagline}. Serving Mangaluru, Udupi, Manipal, Kundapura,
              Pethri, Brahmavar &amp; Barkur.
            </p>
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] text-[#B7F36B]">
              {supabaseReady ? "Supabase Connected" : "Karavali Demo Edition"}
            </span>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#B7F36B]">
              Discover Karavali
            </p>
            <ul className="mt-3 space-y-2 text-xs text-[#C9E8D5]">
              <li>
                <Link href="/feed" className="hover:text-[#B7F36B]">
                  Community &amp; News Feed
                </Link>
              </li>
              <li>
                <Link href="/live" className="hover:text-[#B7F36B]">
                  Pethri Live Broadcasts
                </Link>
              </li>
              <li>
                <Link href="/moments" className="hover:text-[#B7F36B]">
                  Moments &amp; Video Channels
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-[#B7F36B]">
                  Regional Map Explorer
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#B7F36B]">
              Create &amp; Contribute
            </p>
            <ul className="mt-3 space-y-2 text-xs text-[#C9E8D5]">
              <li>
                <Link href="/report?mode=moment" className="hover:text-[#B7F36B]">
                  Share a Moment
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-[#B7F36B]">
                  Submit Citizen News
                </Link>
              </li>
              <li>
                <Link href="/live?start=true" className="hover:text-[#B7F36B]">
                  Go Live Broadcast
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-[#B7F36B]">
                  Language &amp; Privacy Settings
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#B7F36B]">
              Editorial Integrity
            </p>
            <p className="text-xs text-[#C9E8D5]/80">
              Verified newsroom journalism is strictly separated from citizen
              submissions. Transparent correction logs &amp; privacy-first GPS.
            </p>
            <Link
              href="/editorial"
              className="inline-flex items-center gap-2 rounded-full bg-[#B7F36B] px-4 py-2 text-xs font-extrabold text-[#202820] hover:bg-[#DCEBCB]"
            >
              Editorial Desk
            </Link>
          </div>
        </div>
      </footer>

      {/* Mobile Create Sheet */}
      <AnimatePresence>
        {createSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateSheetOpen(false)}
              className="fixed inset-0 z-50 bg-[#202820]/50 backdrop-blur-xs lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-[#202820]/15 bg-[#F7F6EF] p-5 pb-8 shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="font-display text-lg font-extrabold text-[#202820]">
                  Create on Pethri
                </p>
                <button
                  type="button"
                  onClick={() => setCreateSheetOpen(false)}
                  className="rounded-full p-1.5 bg-white border border-[#202820]/15"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/report?mode=moment"
                  className="rounded-2xl bg-[#DCEBCB] p-4 border border-[#202820]/10"
                >
                  <Sparkles className="h-5 w-5 text-[#202820]" />
                  <p className="mt-2 text-sm font-extrabold text-[#202820]">
                    Share a Moment
                  </p>
                  <p className="text-[11px] text-[#525F52]">
                    Photo or short video story
                  </p>
                </Link>
                <Link
                  href="/live?start=true"
                  className="rounded-2xl bg-[#202820] p-4 text-[#B7F36B]"
                >
                  <Radio className="h-5 w-5" />
                  <p className="mt-2 text-sm font-extrabold">Go Live</p>
                  <p className="text-[11px] text-[#C9E8D5]">
                    Stream match, fest or event
                  </p>
                </Link>
                <Link
                  href="/report"
                  className="rounded-2xl bg-white p-4 border border-[#202820]/15"
                >
                  <Camera className="h-5 w-5 text-[#202820]" />
                  <p className="mt-2 text-sm font-extrabold text-[#202820]">
                    Community Post
                  </p>
                  <p className="text-[11px] text-[#525F52]">
                    Local update or photo
                  </p>
                </Link>
                <Link
                  href="/report"
                  className="rounded-2xl bg-[#C9E8D5] p-4 border border-[#202820]/10"
                >
                  <FilePlus2 className="h-5 w-5 text-[#202820]" />
                  <p className="mt-2 text-sm font-extrabold text-[#202820]">
                    Submit News Tip
                  </p>
                  <p className="text-[11px] text-[#525F52]">
                    Sent for editorial verification
                  </p>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Persistent Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-[#202820]/10 bg-[#F7F6EF]/95 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-center py-1.5 px-2">
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold",
              pathname === "/" ? "text-[#202820]" : "text-[#525F52]"
            )}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/feed"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold",
              pathname.startsWith("/feed") ? "text-[#202820]" : "text-[#525F52]"
            )}
          >
            <Newspaper className="h-5 w-5" />
            <span>Feed</span>
          </Link>
          <button
            type="button"
            onClick={() => setCreateSheetOpen(true)}
            className="flex flex-col items-center justify-center -mt-4"
            aria-label="Create post, moment, news or go live"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#202820] text-[#B7F36B] shadow-lg ring-4 ring-[#F7F6EF] active:scale-95 transition-transform">
              <Plus className="h-5 w-5" />
            </span>
            <span className="mt-0.5 text-[10px] font-extrabold text-[#202820]">
              Create
            </span>
          </button>
          <Link
            href="/live"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold",
              pathname.startsWith("/live") ? "text-[#202820]" : "text-[#525F52]"
            )}
          >
            <Radio className="h-5 w-5" />
            <span>Live</span>
          </Link>
          <Link
            href="/explore"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold",
              pathname.startsWith("/explore")
                ? "text-[#202820]"
                : "text-[#525F52]"
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
