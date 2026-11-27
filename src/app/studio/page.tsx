"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  FileEdit,
  FileText,
  Image as ImageIcon,
  Inbox,
  Lock,
  MessageSquare,
  Newspaper,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatedLiveIndicator } from "@/components/MotionPrimitives";
import { PethriLogo } from "@/components/PethriLogo";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { VerificationBadge } from "@/components/VerificationBadge";
import { DEMO_PROFILES } from "@/lib/seed-data";
import { CATEGORY_META, cn } from "@/lib/utils";
import type {
  CommunityAnnouncement,
  ContentReport,
  LiveBroadcast,
  LocalEvent,
  ModerationStatus,
  PostCategory,
  PostItem,
  UserProfile,
  UserRole,
  VerificationTier,
} from "@/types/pethri";

type StudioTab =
  | "overview"
  | "articles"
  | "tips"
  | "media"
  | "events"
  | "live"
  | "civic"
  | "comments"
  | "staff";

interface StaffPermissions {
  canPublishArticles: boolean;
  canUploadOfficialMedia: boolean;
  canStartBroadcasts: boolean;
}

const DEFAULT_PERMISSIONS: Record<string, StaffPermissions> = {
  "user-editor": {
    canPublishArticles: true,
    canUploadOfficialMedia: true,
    canStartBroadcasts: true,
  },
  "user-ananya": {
    canPublishArticles: true,
    canUploadOfficialMedia: true,
    canStartBroadcasts: false,
  },
  "user-roshan": {
    canPublishArticles: false,
    canUploadOfficialMedia: false,
    canStartBroadcasts: false,
  },
};

const OFFICIAL_MEDIA_ASSETS = [
  {
    id: "om-1",
    label: "Pethri Junction Express Bus Bay",
    url: "/images/photos/pethri-town.jpg",
    tag: "Transit",
  },
  {
    id: "om-2",
    label: "Coastal Parish Feast Courtyard",
    url: "/images/photos/church-feast.jpg",
    tag: "Faith & Culture",
  },
  {
    id: "om-3",
    label: "Udupi–Cherkady Paddy Harvest",
    url: "/images/photos/paddy-harvest.jpg",
    tag: "Agriculture",
  },
  {
    id: "om-4",
    label: "Karavali Floodlit Kabaddi Arena",
    url: "/images/photos/local-sports.jpg",
    tag: "Sports",
  },
  {
    id: "om-5",
    label: "Village Tarmac & Laterite Junction",
    url: "/images/photos/civic-road.jpg",
    tag: "Civic",
  },
  {
    id: "om-6",
    label: "Traditional Jasmine Wedding Mandap",
    url: "/images/photos/coastal-wedding.jpg",
    tag: "Celebrations",
  },
];

function getStudioRoleLabel(role: UserRole): "Website Manager" | "Editor" | "Reporter" | "Public" {
  if (role === "admin") return "Website Manager";
  if (role === "editor") return "Editor";
  if (role === "journalist" || role === "correspondent") return "Reporter";
  return "Public";
}

export default function PrivatePethriStudioPage() {
  const { currentUser, isAuthenticated, signInDemoUser, localities, showToast } =
    usePethri();

  const [activeTab, setActiveTab] = useState<StudioTab>("overview");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>(DEMO_PROFILES);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>(
    []
  );
  const [broadcast, setBroadcast] = useState<LiveBroadcast | null>(null);
  const [loading, setLoading] = useState(true);

  // Per-staff permission matrix (managed by Website Manager)
  const [permissionsMap, setPermissionsMap] =
    useState<Record<string, StaffPermissions>>(DEFAULT_PERMISSIONS);

  // Article drafting & publishing state
  const [artHeadline, setArtHeadline] = useState("");
  const [artBody, setArtBody] = useState("");
  const [artCategory, setArtCategory] = useState<PostCategory>("news");
  const [artLocalityId, setArtLocalityId] = useState("loc-pethri");
  const [artImageUrl, setArtImageUrl] = useState("/images/photos/pethri-town.jpg");
  const [artBreaking, setArtBreaking] = useState(false);
  const [artMode, setArtMode] = useState<"newsroom" | "sponsored">("newsroom");
  const [sponsorName, setSponsorName] = useState("");
  const [localDrafts, setLocalDrafts] = useState<
    { id: string; headline: string; localityId: string; category: PostCategory; body: string }[]
  >([]);

  // Tip review & correction notes
  const [notesByPost, setNotesByPost] = useState<Record<string, string>>({});
  const [correctionByPost, setCorrectionByPost] = useState<
    Record<string, string>
  >({});

  // Official Media Library custom uploads
  const [mediaLibrary, setMediaLibrary] = useState(OFFICIAL_MEDIA_ASSETS);

  // Event & Bulletin composer
  const [evtTitle, setEvtTitle] = useState("");
  const [evtSummary, setEvtSummary] = useState("");
  const [evtIssuer, setEvtIssuer] = useState("Pethri Newsroom Events Desk");
  const [evtUrgency, setEvtUrgency] = useState<"notice" | "advisory" | "urgent">(
    "notice"
  );

  // Broadcast controls
  const [liveTitle, setLiveTitle] = useState("");
  const [liveSummary, setLiveSummary] = useState("");
  const [liveLocalityId, setLiveLocalityId] = useState("loc-pethri");

  // Comment moderation state
  const [hiddenCommentIds, setHiddenCommentIds] = useState<
    Record<string, boolean>
  >({});

  const studioRole = getStudioRoleLabel(currentUser.role);
  const isStaff = isAuthenticated && studioRole !== "Public";
  const isManager = studioRole === "Website Manager";
  const isEditor = studioRole === "Editor";

  const myPerms: StaffPermissions =
    isManager || isEditor
      ? {
          canPublishArticles: true,
          canUploadOfficialMedia: true,
          canStartBroadcasts: true,
        }
      : permissionsMap[currentUser.id] ?? {
          canPublishArticles: false,
          canUploadOfficialMedia: false,
          canStartBroadcasts: false,
        };

  const loadStudioData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { "x-pethri-actor-id": currentUser.id };
      const [postsRes, edRes, brRes, dirRes] = await Promise.all([
        fetch("/api/posts?includePending=true", { headers }),
        fetch("/api/editorial", { headers }),
        fetch("/api/broadcast"),
        fetch("/api/directory"),
      ]);
      if (postsRes.ok) {
        const pd = await postsRes.json();
        setPosts(pd.posts ?? []);
      }
      if (edRes.ok) {
        const ed = await edRes.json();
        setReports(ed.reports ?? []);
        if (Array.isArray(ed.profiles)) setProfiles(ed.profiles);
      }
      if (brRes.ok) {
        const bd = await brRes.json();
        if (bd.broadcast) {
          setBroadcast(bd.broadcast);
          setLiveTitle(bd.broadcast.title);
          setLiveSummary(bd.broadcast.summary);
          setLiveLocalityId(bd.broadcast.localityId);
        }
        if (Array.isArray(bd.events)) setEvents(bd.events);
      }
      if (dirRes.ok) {
        const dd = await dirRes.json();
        setAnnouncements(dd.announcements ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadStudioData();
  }, [loadStudioData]);

  // Studio Access Gate (for non-staff or signed-out visitors)
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#1B5E43] text-white flex items-center justify-center p-4 bg-forest-grid">
        <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-[#181917] p-7 sm:p-9 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <PethriLogo variant="dark" size="sm" />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EAF2EE] hover:text-[#398BFF]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Public Site
            </Link>
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#398BFF] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#181917]">
              <Lock className="h-3 w-3" />
              PRIVATE NEWSROOM STUDIO
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              Authorised Staff Access Only
            </h1>
            <p className="text-xs leading-relaxed text-[#EAF2EE]">
              Pethri Studio is restricted to accredited Reporters, Editors, and
              the Website Manager. Select a staff profile below to enter Studio
              in demo mode.
            </p>
          </div>

          <div className="space-y-2.5">
            {DEMO_PROFILES.filter((p) => p.role !== "citizen").map((prof) => {
              const roleName =
                prof.role === "editor"
                  ? "Editor"
                  : prof.role === "admin"
                    ? "Website Manager"
                    : "Reporter";
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => signInDemoUser(prof.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/5 p-3.5 text-left hover:border-[#398BFF] hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prof.avatarUrl}
                      alt={prof.fullName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">
                        {prof.fullName}
                      </p>
                      <p className="text-[11px] text-[#EAF2EE]">
                        {prof.homeLocalityName} • @{prof.username}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#398BFF] px-3 py-1 text-[10px] font-extrabold uppercase text-[#181917]">
                    {roleName}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                // Promote Roshan or sign in as Website Manager demo
                signInDemoUser("user-editor");
              }}
              className="w-full rounded-full border border-[#398BFF]/50 py-2.5 text-xs font-bold text-[#398BFF] hover:bg-[#398BFF]/15"
            >
              Sign in as Editor / Newsroom Lead
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingTips = posts.filter((p) => p.moderationStatus === "pending");
  const publishedArticles = posts.filter(
    (p) => p.moderationStatus === "approved"
  );
  const openReports = reports.filter((r) => r.status === "open");
  const allComments = posts.flatMap((p) =>
    p.comments.map((c) => ({ ...c, postHeadline: p.headline }))
  );

  const handleSaveDraft = () => {
    if (!artHeadline.trim()) return;
    setLocalDrafts((prev) => [
      {
        id: `draft-${Date.now()}`,
        headline: artHeadline.trim(),
        localityId: artLocalityId,
        category: artCategory,
        body: artBody.trim(),
      },
      ...prev,
    ]);
    setArtHeadline("");
    setArtBody("");
    showToast("Saved to Reporter Drafts");
  };

  const handlePublishArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPerms.canPublishArticles) {
      showToast(
        "Website Manager permission required to publish articles directly",
        "error"
      );
      return;
    }
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publishMode: artMode,
        authorId: currentUser.id,
        localityId: artLocalityId,
        category: artCategory,
        headline: artHeadline,
        body: artBody,
        isBreaking: artMode === "newsroom" ? artBreaking : false,
        isMoment: false,
        sponsorInfo:
          artMode === "sponsored"
            ? {
                advertiserName: sponsorName || "Karavali Partner",
                disclosure: "Sponsored Local Partner • Paid Notice",
              }
            : undefined,
        media: [
          {
            mediaType: "image",
            url: artImageUrl,
            aspectRatio: "16:9",
            caption: "Official Pethri Studio Dispatch",
          },
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setPosts((prev) => [data.post, ...prev]);
      setArtHeadline("");
      setArtBody("");
      setArtBreaking(false);
      showToast("Article published to live Pethri network");
    } else {
      const err = await res.json();
      showToast(err.error ?? "Unable to publish article", "error");
    }
  };

  const handleReviewTip = async (
    postId: string,
    moderationStatus: ModerationStatus,
    verificationTier: VerificationTier
  ) => {
    const res = await fetch("/api/editorial", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-pethri-actor-id": currentUser.id,
      },
      body: JSON.stringify({
        type: "post_review",
        postId,
        moderationStatus,
        verificationTier,
        moderationNotes: notesByPost[postId] ?? undefined,
        reviewerId: currentUser.id,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
      showToast(`Tip updated: ${moderationStatus} (${verificationTier})`);
    }
  };

  const handleLogCorrection = async (postId: string) => {
    const summary = correctionByPost[postId]?.trim();
    if (!summary) return;
    const res = await fetch("/api/editorial", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-pethri-actor-id": currentUser.id,
      },
      body: JSON.stringify({
        type: "post_correction",
        postId,
        summary,
        correctedBy: currentUser.fullName,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
      setCorrectionByPost((prev) => ({ ...prev, [postId]: "" }));
      showToast("Public correction history updated");
    }
  };

  const handleToggleBroadcast = async (nextLive: boolean) => {
    if (!myPerms.canStartBroadcasts) {
      showToast(
        "Website Manager permission required to operate live broadcasts",
        "error"
      );
      return;
    }
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_broadcast",
        actorId: currentUser.id,
        isLive: nextLive,
        title: liveTitle,
        summary: liveSummary,
        localityId: liveLocalityId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setBroadcast(data.broadcast);
      showToast(
        nextLive
          ? "Official Pethri Live Broadcast is ON AIR"
          : "Live Broadcast ended",
        "info"
      );
    } else {
      const err = await res.json();
      showToast(err.error ?? "Broadcast update denied", "error");
    }
  };

  const handleUploadOfficialMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!myPerms.canUploadOfficialMedia) {
      showToast("Upload permission not granted to your role", "error");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setMediaLibrary((prev) => [
          {
            id: `om-${Date.now()}`,
            label: file.name,
            url: reader.result as string,
            tag: "Official Upload",
          },
          ...prev,
        ]);
        setArtImageUrl(reader.result as string);
        showToast("Official media added to Studio Library");
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublishBulletin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitle.trim() || !evtSummary.trim()) return;
    const res = await fetch("/api/directory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pethri-actor-id": currentUser.id,
      },
      body: JSON.stringify({
        action: "create_announcement",
        actorId: currentUser.id,
        localityId: artLocalityId,
        title: evtTitle.trim(),
        summary: evtSummary.trim(),
        issuer: evtIssuer.trim(),
        urgency: evtUrgency,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setAnnouncements((prev) => [data.announcement, ...prev]);
      setEvtTitle("");
      setEvtSummary("");
      showToast("Official bulletin published");
    }
  };

  const handleResolveReport = async (
    reportId: string,
    status: ContentReport["status"]
  ) => {
    const res = await fetch("/api/editorial", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-pethri-actor-id": currentUser.id,
      },
      body: JSON.stringify({
        type: "report_resolve",
        reportId,
        status,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? data.report : r))
      );
      showToast(`Report marked ${status}`);
    }
  };

  const handleStaffRoleUpdate = async (userId: string, role: UserRole) => {
    if (!isManager && !isEditor) return;
    const res = await fetch("/api/editorial", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-pethri-actor-id": currentUser.id,
      },
      body: JSON.stringify({
        type: "profile_governance",
        actorId: currentUser.id,
        userId,
        role,
        isVerifiedReporter: role !== "citizen",
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? data.profile : p))
      );
      showToast(`Updated ${data.profile.fullName} role`);
    }
  };

  const toggleStaffPermission = (
    userId: string,
    key: keyof StaffPermissions
  ) => {
    setPermissionsMap((prev) => {
      const curr = prev[userId] ?? {
        canPublishArticles: false,
        canUploadOfficialMedia: false,
        canStartBroadcasts: false,
      };
      return {
        ...prev,
        [userId]: { ...curr, [key]: !curr[key] },
      };
    });
    showToast("Staff permission updated", "info");
  };

  const STUDIO_NAV: {
    id: StudioTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: "overview", label: "Dashboard & Analytics", icon: BarChart3 },
    { id: "articles", label: "Articles & Publishing", icon: Newspaper },
    {
      id: "tips",
      label: "News Tip Inbox",
      icon: Inbox,
      badge: pendingTips.length,
    },
    { id: "media", label: "Official Media Library", icon: ImageIcon },
    { id: "events", label: "Event Management", icon: Calendar },
    { id: "live", label: "Live Broadcasts", icon: Radio },
    {
      id: "civic",
      label: "Civic Reports",
      icon: AlertTriangle,
      badge: openReports.length,
    },
    { id: "comments", label: "Comment Moderation", icon: MessageSquare },
    { id: "staff", label: "Staff & Permissions", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#181917] flex flex-col lg:flex-row">
      {/* Studio Sidebar */}
      <aside className="lg:w-72 shrink-0 bg-[#1B5E43] text-white flex flex-col border-r border-white/10">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <PethriLogo variant="dark" size="sm" />
            <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#398BFF]">
              PRIVATE PETHRI STUDIO
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-[#EAF2EE] hover:bg-white/20"
          >
            Public Site
          </Link>
        </div>

        {/* Active Staff Role Banner */}
        <div className="mx-4 mt-4 rounded-2xl border border-white/10 bg-white/5 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold truncate">
              {currentUser.fullName}
            </span>
            <span className="rounded-full bg-[#398BFF] px-2 py-0.5 text-[10px] font-extrabold text-[#181917]">
              {studioRole}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
            <span
              className={cn(
                "rounded px-1.5 py-0.5",
                myPerms.canPublishArticles
                  ? "bg-[#EAF2EE] text-[#1B5E43]"
                  : "bg-white/10 text-white/50"
              )}
            >
              Publish: {myPerms.canPublishArticles ? "ON" : "LOCKED"}
            </span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5",
                myPerms.canUploadOfficialMedia
                  ? "bg-[#EAF2EE] text-[#1B5E43]"
                  : "bg-white/10 text-white/50"
              )}
            >
              Media: {myPerms.canUploadOfficialMedia ? "ON" : "LOCKED"}
            </span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5",
                myPerms.canStartBroadcasts
                  ? "bg-[#EAF2EE] text-[#1B5E43]"
                  : "bg-white/10 text-white/50"
              )}
            >
              Live: {myPerms.canStartBroadcasts ? "ON" : "LOCKED"}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {STUDIO_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors",
                  activeTab === item.id
                    ? "bg-[#398BFF] text-white"
                    : "text-[#EAF2EE] hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="inline-flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                      activeTab === item.id
                        ? "bg-[#1B5E43] text-white"
                        : "bg-white/15 text-white"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Demo Staff Switcher (Test Reporter vs Editor vs Website Manager) */}
        <div className="border-t border-white/10 p-4 space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#EAF2EE]/75">
            Test Staff Role
          </p>
          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => signInDemoUser("user-roshan")}
              className="rounded-lg bg-white/10 py-1.5 hover:bg-[#398BFF] hover:text-white"
            >
              Reporter
            </button>
            <button
              type="button"
              onClick={() => signInDemoUser("user-ananya")}
              className="rounded-lg bg-white/10 py-1.5 hover:bg-[#398BFF] hover:text-white"
            >
              Journalist
            </button>
            <button
              type="button"
              onClick={() => signInDemoUser("user-editor")}
              className="rounded-lg bg-white/10 py-1.5 hover:bg-[#398BFF] hover:text-white"
            >
              Editor
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              handleStaffRoleUpdate(currentUser.id, "admin");
            }}
            className="w-full rounded-lg bg-white/15 py-1.5 text-[10px] font-bold text-white hover:bg-[#398BFF]"
          >
            Elevate Current to Website Manager
          </button>
        </div>
      </aside>

      {/* Studio Main Workspace */}
      <div className="flex-1 p-5 sm:p-8 space-y-6 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E3DC] pb-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#5A605C]">
              PETHRI NEWSROOM OPERATIONS
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#181917]">
              {STUDIO_NAV.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>
          {broadcast?.isLive && <AnimatedLiveIndicator label="LIVE ON AIR" />}
        </div>

        {loading ? (
          <div className="h-64 animate-pulse rounded-3xl bg-white border border-[#E5E3DC]" />
        ) : activeTab === "overview" ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5">
                <p className="text-xs font-bold text-[#5A605C]">
                  Published Articles
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-[#181917]">
                  {publishedArticles.length}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E5E3DC] bg-[#EAF2EE] p-5">
                <p className="text-xs font-bold text-[#181917]">
                  Pending Private Tips
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-[#181917]">
                  {pendingTips.length}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5">
                <p className="text-xs font-bold text-[#5A605C]">
                  Open Civic / User Reports
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-[#181917]">
                  {openReports.length}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E5E3DC] bg-[#1B5E43] p-5 text-white">
                <p className="text-xs font-bold text-[#EAF2EE]">
                  Live Broadcast Viewers
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-[#398BFF]">
                  {broadcast?.isLive ? broadcast.viewerCount : 0}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5 space-y-3">
                <h2 className="font-display text-base font-extrabold text-[#181917]">
                  Karavali Coverage by Locality
                </h2>
                <div className="space-y-2.5">
                  {localities.slice(0, 6).map((loc) => {
                    const count = posts.filter(
                      (p) => p.localityId === loc.id
                    ).length;
                    const pct = Math.min(100, Math.max(12, count * 22));
                    return (
                      <div key={loc.id} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold">
                          <span>{loc.name}</span>
                          <span>{count} stories</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#F8F7F4] overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full rounded-full bg-[#1B5E43]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-extrabold text-[#181917]">
                    Latest Tip Inbox
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("tips")}
                    className="text-xs font-bold underline"
                  >
                    Open Inbox →
                  </button>
                </div>
                {pendingTips.length === 0 ? (
                  <p className="text-xs text-[#5A605C]">
                    All private tips have been reviewed.
                  </p>
                ) : (
                  pendingTips.map((tip) => (
                    <div
                      key={tip.id}
                      className="rounded-xl bg-[#F8F7F4] p-3 border border-[#E5E3DC]"
                    >
                      <p className="text-[10px] font-bold uppercase text-[#5A605C]">
                        {tip.localityName} • @{tip.author.username}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-[#181917]">
                        {tip.headline}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : activeTab === "articles" ? (
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            <form
              onSubmit={handlePublishArticle}
              className="lg:col-span-7 rounded-2xl border border-[#E5E3DC] bg-white p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-extrabold text-[#181917]">
                  Article Composer
                </h2>
                {!myPerms.canPublishArticles && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F8F7F4] px-3 py-1 text-[10px] font-bold text-[#181917]">
                    <Lock className="h-3 w-3" />
                    Draft Only (Manager approval needed to publish)
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setArtMode("newsroom")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-bold",
                    artMode === "newsroom"
                      ? "bg-[#1B5E43] text-white"
                      : "bg-[#F8F7F4] text-[#181917]"
                  )}
                >
                  Verified Newsroom Article
                </button>
                <button
                  type="button"
                  onClick={() => setArtMode("sponsored")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-bold",
                    artMode === "sponsored"
                      ? "bg-[#F8F7F4] text-[#181917]"
                      : "bg-[#F8F7F4] text-[#5A605C]"
                  )}
                >
                  Sponsored Partner Notice
                </button>
              </div>

              {artMode === "sponsored" && (
                <input
                  type="text"
                  required
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="Sponsor / Partner Name *"
                  className="w-full rounded-xl border border-[#E5E3DC] px-3.5 py-2.5 text-xs outline-none"
                />
              )}

              <input
                type="text"
                required
                value={artHeadline}
                onChange={(e) => setArtHeadline(e.target.value)}
                placeholder="Article Headline *"
                className="w-full rounded-xl border border-[#E5E3DC] px-3.5 py-2.5 text-sm outline-none focus:border-[#398BFF]"
              />

              <textarea
                rows={5}
                required
                value={artBody}
                onChange={(e) => setArtBody(e.target.value)}
                placeholder="Write verified journalism copy..."
                className="w-full rounded-xl border border-[#E5E3DC] px-3.5 py-2.5 text-sm outline-none focus:border-[#398BFF]"
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  value={artCategory}
                  onChange={(e) =>
                    setArtCategory(e.target.value as PostCategory)
                  }
                  className="rounded-xl border border-[#E5E3DC] px-3 py-2 text-xs font-semibold outline-none"
                >
                  {(Object.keys(CATEGORY_META) as PostCategory[]).map((k) => (
                    <option key={k} value={k}>
                      {CATEGORY_META[k].label}
                    </option>
                  ))}
                </select>
                <select
                  value={artLocalityId}
                  onChange={(e) => setArtLocalityId(e.target.value)}
                  className="rounded-xl border border-[#E5E3DC] px-3 py-2 text-xs font-semibold outline-none"
                >
                  {localities.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <select
                  value={artImageUrl}
                  onChange={(e) => setArtImageUrl(e.target.value)}
                  className="rounded-xl border border-[#E5E3DC] px-3 py-2 text-xs font-semibold outline-none"
                >
                  {mediaLibrary.map((m) => (
                    <option key={m.id} value={m.url}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {artMode === "newsroom" && (
                <label className="flex items-center gap-2 text-xs font-bold text-[#181917] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={artBreaking}
                    onChange={(e) => setArtBreaking(e.target.checked)}
                    className="accent-[#1B5E43]"
                  />
                  Mark as Official Breaking News
                </label>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="rounded-full border border-[#E5E3DC] bg-[#F8F7F4] px-5 py-2.5 text-xs font-bold text-[#181917]"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={!myPerms.canPublishArticles}
                  className="rounded-full bg-[#1B5E43] px-6 py-2.5 text-xs font-extrabold text-[#398BFF] disabled:opacity-40"
                >
                  {myPerms.canPublishArticles
                    ? "Publish to Live Site"
                    : "Publish Locked (Reporter Draft Mode)"}
                </button>
              </div>
            </form>

            {/* Drafts & Corrections */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5 space-y-3">
                <h3 className="font-display text-sm font-extrabold text-[#181917]">
                  Reporter Drafts ({localDrafts.length})
                </h3>
                {localDrafts.length === 0 ? (
                  <p className="text-xs text-[#5A605C]">
                    Saved article drafts appear here for editor review.
                  </p>
                ) : (
                  localDrafts.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-xl bg-[#F8F7F4] p-3 text-xs space-y-1"
                    >
                      <p className="font-bold text-[#181917]">{d.headline}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setArtHeadline(d.headline);
                          setArtBody(d.body);
                          setArtCategory(d.category);
                          setArtLocalityId(d.localityId);
                        }}
                        className="text-[11px] font-bold underline"
                      >
                        Load into editor
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5 space-y-3">
                <h3 className="font-display text-sm font-extrabold text-[#181917]">
                  Log Correction on Published Story
                </h3>
                {publishedArticles.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="border-b border-[#E5E3DC] pb-3 last:border-b-0 space-y-2"
                  >
                    <p className="text-xs font-bold text-[#181917] line-clamp-1">
                      {p.headline}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={correctionByPost[p.id] ?? ""}
                        onChange={(e) =>
                          setCorrectionByPost((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        placeholder="Correction summary..."
                        className="flex-1 rounded-lg border border-[#E5E3DC] px-2.5 py-1.5 text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleLogCorrection(p.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#1B5E43] px-3 py-1.5 text-[11px] font-bold text-[#398BFF]"
                      >
                        <FileEdit className="h-3 w-3" />
                        Log
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === "tips" ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl border border-[#E5E3DC] bg-white p-5"
              >
                <div className="grid gap-5 lg:grid-cols-12">
                  {post.media[0] && (
                    <div className="lg:col-span-4 overflow-hidden rounded-xl bg-[#F8F7F4]">
                      <img
                        src={post.media[0].url}
                        alt={post.headline}
                        className="h-44 w-full object-cover"
                      />
                    </div>
                  )}
                  <div
                    className={cn(
                      "space-y-3",
                      post.media[0] ? "lg:col-span-8" : "lg:col-span-12"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded-full bg-[#EAF2EE] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#181917]">
                          {post.moderationStatus}
                        </span>
                        <span className="font-bold text-[#181917]">
                          {post.localityName}
                        </span>
                        <span className="text-[#5A605C]">
                          • @{post.author.username} •{" "}
                          <RelativeTime iso={post.createdAt} />
                        </span>
                      </div>
                      <VerificationBadge tier={post.verificationTier} />
                    </div>

                    <h2 className="font-editorial text-2xl text-[#181917]">
                      {post.headline}
                    </h2>
                    <p className="text-xs leading-relaxed text-[#5A605C]">
                      {post.body}
                    </p>

                    <input
                      type="text"
                      value={notesByPost[post.id] ?? post.moderationNotes ?? ""}
                      onChange={(e) =>
                        setNotesByPost((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      placeholder="Verification source or editorial review note..."
                      className="w-full rounded-xl border border-[#E5E3DC] px-3 py-2 text-xs outline-none"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!myPerms.canPublishArticles}
                        onClick={() =>
                          handleReviewTip(post.id, "approved", "reviewed")
                        }
                        className="inline-flex items-center gap-1 rounded-full bg-[#EAF2EE] px-3.5 py-1.5 text-xs font-bold text-[#181917] disabled:opacity-40"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve (Reviewed)
                      </button>
                      <button
                        type="button"
                        disabled={!myPerms.canPublishArticles}
                        onClick={() =>
                          handleReviewTip(post.id, "approved", "verified")
                        }
                        className="inline-flex items-center gap-1 rounded-full bg-[#1B5E43] px-3.5 py-1.5 text-xs font-extrabold text-[#398BFF] disabled:opacity-40"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Officially Verify
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleReviewTip(post.id, "rejected", "community")
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-700"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "media" ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-extrabold text-[#181917]">
                  Official Newsroom Media Library
                </h2>
                <p className="text-xs text-[#5A605C]">
                  {myPerms.canUploadOfficialMedia
                    ? "Upload verified field photography for articles and broadcasts."
                    : "Locked: Website Manager has not granted official media upload permission to your Reporter account."}
                </p>
              </div>
              <label
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold transition-opacity",
                  myPerms.canUploadOfficialMedia
                    ? "cursor-pointer bg-[#1B5E43] text-white hover:opacity-90"
                    : "cursor-not-allowed bg-[#F8F7F4] text-[#5A605C]"
                )}
              >
                <Upload className="h-4 w-4" />
                <span>
                  {myPerms.canUploadOfficialMedia
                    ? "Upload Official Media"
                    : "Upload Locked"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={!myPerms.canUploadOfficialMedia}
                  onChange={handleUploadOfficialMedia}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mediaLibrary.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white"
                >
                  <img
                    src={item.url}
                    alt={item.label}
                    className="h-44 w-full object-cover"
                  />
                  <div className="p-4 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#181917]">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-[#5A605C]">{item.tag}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setArtImageUrl(item.url);
                        setActiveTab("articles");
                        showToast("Selected media for article composer");
                      }}
                      className="rounded-full bg-[#EAF2EE] px-3 py-1 text-[10px] font-bold text-[#181917]"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === "events" ? (
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            <div className="lg:col-span-7 space-y-4">
              <h2 className="font-display text-base font-extrabold text-[#181917]">
                Scheduled Karavali Events ({events.length})
              </h2>
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-2xl border border-[#E5E3DC] bg-white p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#5A605C]">
                      {evt.localityName} • {evt.venue}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-[#181917]">
                      {evt.title}
                    </p>
                    <p className="mt-1 text-xs text-[#5A605C]">
                      {evt.organizer} • {evt.rsvpCount} RSVPs
                    </p>
                  </div>
                  <span className="rounded-full bg-[#EAF2EE] px-3 py-1 text-[10px] font-bold text-[#181917]">
                    Active
                  </span>
                </div>
              ))}

              <h3 className="pt-2 font-display text-sm font-extrabold text-[#181917]">
                Published Civic Bulletins ({announcements.length})
              </h3>
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-[#E5E3DC] bg-white p-4"
                >
                  <p className="text-[10px] font-bold uppercase text-[#5A605C]">
                    {a.localityName} • {a.urgency}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#181917]">
                    {a.title}
                  </p>
                  <p className="mt-1 text-xs text-[#5A605C]">{a.summary}</p>
                </div>
              ))}
            </div>

            <form
              onSubmit={handlePublishBulletin}
              className="lg:col-span-5 rounded-2xl border border-[#E5E3DC] bg-white p-5 space-y-3"
            >
              <h2 className="font-display text-base font-extrabold text-[#181917]">
                Publish Official Event / Notice
              </h2>
              <input
                type="text"
                required
                value={evtTitle}
                onChange={(e) => setEvtTitle(e.target.value)}
                placeholder="Event or notice title *"
                className="w-full rounded-xl border border-[#E5E3DC] px-3 py-2 text-xs outline-none"
              />
              <textarea
                rows={3}
                required
                value={evtSummary}
                onChange={(e) => setEvtSummary(e.target.value)}
                placeholder="Schedule, venue & organizer details *"
                className="w-full rounded-xl border border-[#E5E3DC] px-3 py-2 text-xs outline-none"
              />
              <input
                type="text"
                required
                value={evtIssuer}
                onChange={(e) => setEvtIssuer(e.target.value)}
                placeholder="Issuer"
                className="w-full rounded-xl border border-[#E5E3DC] px-3 py-2 text-xs outline-none"
              />
              <select
                value={evtUrgency}
                onChange={(e) =>
                  setEvtUrgency(
                    e.target.value as "notice" | "advisory" | "urgent"
                  )
                }
                className="w-full rounded-xl border border-[#E5E3DC] px-3 py-2 text-xs outline-none"
              >
                <option value="notice">Notice</option>
                <option value="advisory">Advisory</option>
                <option value="urgent">Urgent Alert</option>
              </select>
              <button
                type="submit"
                className="w-full rounded-full bg-[#1B5E43] py-2.5 text-xs font-extrabold text-[#398BFF]"
              >
                Publish Official Bulletin
              </button>
            </form>
          </div>
        ) : activeTab === "live" ? (
          <div className="max-w-2xl rounded-3xl border border-[#E5E3DC] bg-[#1B5E43] p-6 text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-[#398BFF]" />
                <h2 className="font-display text-lg font-extrabold">
                  Official Broadcast Control Room
                </h2>
              </div>
              <AnimatedLiveIndicator
                label={broadcast?.isLive ? "ON AIR" : "OFF AIR"}
              />
            </div>

            {!myPerms.canStartBroadcasts && (
              <div className="rounded-xl bg-white/10 p-3 text-xs text-[#EAF2EE] flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0 text-[#398BFF]" />
                <span>
                  Broadcast controls are locked for your Reporter role until the
                  Website Manager grants Live Broadcast permission.
                </span>
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                value={liveTitle}
                onChange={(e) => setLiveTitle(e.target.value)}
                placeholder="Broadcast title"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm text-white outline-none"
              />
              <textarea
                rows={3}
                value={liveSummary}
                onChange={(e) => setLiveSummary(e.target.value)}
                placeholder="Broadcast briefing description"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm text-white outline-none"
              />
              <select
                value={liveLocalityId}
                onChange={(e) => setLiveLocalityId(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#1B5E43] px-3.5 py-2.5 text-xs font-bold text-white outline-none"
              >
                {localities.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                disabled={!myPerms.canStartBroadcasts}
                onClick={() => handleToggleBroadcast(true)}
                className="flex-1 rounded-full bg-[#398BFF] py-3 text-xs font-extrabold text-[#181917] disabled:opacity-40"
              >
                Start Official Live Broadcast
              </button>
              <button
                type="button"
                disabled={!myPerms.canStartBroadcasts}
                onClick={() => handleToggleBroadcast(false)}
                className="rounded-full border border-white/25 px-5 py-3 text-xs font-bold text-white disabled:opacity-40"
              >
                End Stream
              </button>
            </div>
          </div>
        ) : activeTab === "civic" ? (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E3DC] bg-white p-10 text-center text-sm text-[#5A605C]">
                No civic or user flags open.
              </div>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-2xl border border-[#E5E3DC] bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase",
                          rep.status === "open"
                            ? "bg-[#398BFF] text-white"
                            : "bg-[#EAF2EE] text-[#1B5E43]"
                        )}
                      >
                        {rep.status}
                      </span>
                      <span className="text-xs font-bold text-[#181917]">
                        {rep.reason}
                      </span>
                      <span className="text-[11px] text-[#5A605C]">
                        by @{rep.reporterUsername} •{" "}
                        <RelativeTime iso={rep.createdAt} />
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#181917]">
                      {rep.postHeadline}
                    </p>
                    {rep.details && (
                      <p className="text-xs text-[#5A605C]">{rep.details}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleResolveReport(rep.id, "resolved")}
                      className="rounded-full bg-[#1B5E43] px-4 py-1.5 text-xs font-bold text-[#398BFF]"
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveReport(rep.id, "dismissed")}
                      className="rounded-full border border-[#E5E3DC] px-4 py-1.5 text-xs font-bold text-[#181917]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "comments" ? (
          <div className="space-y-3">
            {allComments.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E3DC] bg-white p-10 text-center text-sm text-[#5A605C]">
                No reader comments to moderate.
              </div>
            ) : (
              allComments.map((c) => {
                const isHidden = Boolean(hiddenCommentIds[c.id]);
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-4",
                      isHidden
                        ? "border-amber-200 bg-amber-50/50 opacity-75"
                        : "border-[#E5E3DC] bg-white"
                    )}
                  >
                    <div className="space-y-1 max-w-2xl">
                      <p className="text-[10px] font-bold uppercase text-[#5A605C]">
                        On: {c.postHeadline}
                      </p>
                      <p className="text-xs font-bold text-[#181917]">
                        {c.authorName} (@{c.authorUsername}) •{" "}
                        <RelativeTime iso={c.createdAt} />
                      </p>
                      <p className="text-sm text-[#181917]/85">{c.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setHiddenCommentIds((prev) => ({
                          ...prev,
                          [c.id]: !prev[c.id],
                        }));
                        showToast(
                          isHidden
                            ? "Comment restored"
                            : "Comment hidden in moderation view",
                          "info"
                        );
                      }}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-bold",
                        isHidden
                          ? "bg-[#EAF2EE] text-[#1B5E43]"
                          : "bg-[#1B5E43] text-white"
                      )}
                    >
                      {isHidden ? "Restore Comment" : "Hide Comment"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Staff & Permission Management (Website Manager full control) */
          <div className="space-y-4">
            {!isManager && (
              <div className="rounded-2xl border border-[#E5E3DC] bg-[#F8F7F4] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#181917]">
                  <ShieldAlert className="h-4 w-4" />
                  <span>
                    Only the <strong>Website Manager</strong> can grant or
                    revoke individual staff permissions.
                  </span>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {profiles.map((prof) => {
                const perms = permissionsMap[prof.id] ?? {
                  canPublishArticles:
                    prof.role === "editor" || prof.role === "admin",
                  canUploadOfficialMedia:
                    prof.role === "editor" || prof.role === "admin",
                  canStartBroadcasts:
                    prof.role === "editor" || prof.role === "admin",
                };
                return (
                  <div
                    key={prof.id}
                    className="rounded-2xl border border-[#E5E3DC] bg-white p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={prof.avatarUrl}
                          alt={prof.fullName}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-bold text-[#181917]">
                            {prof.fullName}
                          </p>
                          <p className="text-xs text-[#5A605C]">
                            @{prof.username} • {prof.homeLocalityName}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#EAF2EE] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#181917]">
                        {getStudioRoleLabel(prof.role)}
                      </span>
                    </div>

                    <div className="border-t border-[#E5E3DC] pt-3 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#5A605C]">
                          Assigned Role
                        </span>
                        <select
                          aria-label={`Role for ${prof.fullName}`}
                          disabled={!isManager}
                          value={prof.role}
                          onChange={(e) =>
                            handleStaffRoleUpdate(
                              prof.id,
                              e.target.value as UserRole
                            )
                          }
                          className="rounded-lg border border-[#E5E3DC] bg-[#F8F7F4] px-2.5 py-1 text-xs font-bold outline-none disabled:opacity-50"
                        >
                          <option value="citizen">Public Member</option>
                          <option value="correspondent">
                            Reporter (Correspondent)
                          </option>
                          <option value="journalist">
                            Reporter (Staff Journalist)
                          </option>
                          <option value="editor">Editor</option>
                          <option value="admin">Website Manager</option>
                        </select>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            {
                              key: "canPublishArticles",
                              label: "Publish Articles",
                            },
                            {
                              key: "canUploadOfficialMedia",
                              label: "Upload Official Media",
                            },
                            {
                              key: "canStartBroadcasts",
                              label: "Start Live Broadcasts",
                            },
                          ] as const
                        ).map((perm) => (
                          <button
                            key={perm.key}
                            type="button"
                            disabled={!isManager}
                            onClick={() =>
                              toggleStaffPermission(prof.id, perm.key)
                            }
                            className={cn(
                              "rounded-full px-3 py-1 text-[10px] font-bold transition-colors disabled:opacity-60",
                              perms[perm.key]
                                ? "bg-[#1B5E43] text-white"
                                : "bg-[#F8F7F4] text-[#5A605C] border border-[#E5E3DC]"
                            )}
                          >
                            {perms[perm.key] ? "✓ " : "+ "}
                            {perm.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
