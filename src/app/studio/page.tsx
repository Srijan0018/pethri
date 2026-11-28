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
  | "civic"
  | "comments"
  | "staff"
  | "audit";

interface StaffPermissions {
  canPublishArticles: boolean;
  canUploadOfficialMedia: boolean;
  canStartBroadcasts: boolean;
  canPublishBreaking: boolean;
  canModerateComments: boolean;
  canManageEvents: boolean;
  canReviewTips: boolean;
}

interface StudioCivicReport {
  id: string;
  localityName: string;
  title: string;
  description: string;
  status: string;
  assignedTo: string | null;
  isPublicVerified: boolean;
  officialAcknowledgedAt: string | null;
  authorityName: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  history: Array<{ id: string; new_status: string; created_at: string }>;
  attachments: Array<{ id: string; fileName: string; url: string }>;
}

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
    tag: "Religion & Culture",
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
  const {
    currentUser,
    isAuthenticated,
    signInDemoUser,
    localities,
    showToast,
    staffPermissions,
  } = usePethri();

  const [activeTab, setActiveTab] = useState<StudioTab>("overview");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [civicReports, setCivicReports] = useState<StudioCivicReport[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>(
    []
  );
  const [broadcast, setBroadcast] = useState<LiveBroadcast | null>(null);
  const [loading, setLoading] = useState(true);

  // Per-staff permission matrix (managed by Website Manager)
  const [permissionsMap, setPermissionsMap] =
    useState<Record<string, StaffPermissions>>({});

  // Audit and Governance logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [permissionHistory, setPermissionHistory] = useState<any[]>([]);
  const [articleRevisions, setArticleRevisions] = useState<any[]>([]);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);

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
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocalityId, setEventLocalityId] = useState("");
  const [eventCategory, setEventCategory] = useState<PostCategory>("celebrations");
  const [eventStartsAt, setEventStartsAt] = useState("");
  const [eventEndsAt, setEventEndsAt] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventOrganizer, setEventOrganizer] = useState("");
  const [eventImageUrl, setEventImageUrl] = useState("");
  const [eventStatus, setEventStatus] = useState<"draft" | "published">("published");
  const [eventEditingId, setEventEditingId] = useState<string | null>(null);
  const [authorityByReport, setAuthorityByReport] = useState<Record<string, string>>({});
  const [referenceByReport, setReferenceByReport] = useState<Record<string, string>>({});
  const [assignmentByReport, setAssignmentByReport] = useState<Record<string, string>>({});

  // Broadcast controls
  const [liveTitle, setLiveTitle] = useState("");
  const [liveSummary, setLiveSummary] = useState("");
  const [liveLocalityId, setLiveLocalityId] = useState("loc-pethri");

  // Comment moderation state
  const [hiddenCommentIds, setHiddenCommentIds] = useState<
    Record<string, boolean>
  >({});

  const studioRole = getStudioRoleLabel(currentUser.role);
  const isStaff =
    isAuthenticated &&
    currentUser.role !== "citizen" &&
    currentUser.isSuspended !== true;
  const isManager = studioRole === "Website Manager";
  const isEditor = studioRole === "Editor";

  const myPerms: StaffPermissions =
    isManager || isEditor
      ? {
          canPublishArticles: true,
          canUploadOfficialMedia: true,
          canStartBroadcasts: true,
          canPublishBreaking: true,
          canModerateComments: true,
          canManageEvents: true,
          canReviewTips: true,
        }
      : permissionsMap[currentUser.id] ?? {
          canPublishArticles: staffPermissions.publish,
          canUploadOfficialMedia: staffPermissions.media,
          canStartBroadcasts: staffPermissions.live,
          canPublishBreaking: staffPermissions.breaking,
          canModerateComments: staffPermissions.moderate_comments,
          canManageEvents: staffPermissions.events,
          canReviewTips: staffPermissions.tip_review,
        };

  const loadStudioData = useCallback(async () => {
    try {
      const eventQuery = new URLSearchParams({ time: "all", limit: "50" });
      if (myPerms.canManageEvents) eventQuery.set("includeDrafts", "true");
      const [postsRes, edRes, brRes, dirRes, eventsRes, civicRes] =
        await Promise.all([
        fetch("/api/posts?includePending=true"),
        fetch("/api/editorial"),
        fetch("/api/broadcast"),
        fetch("/api/directory"),
        fetch(`/api/events?${eventQuery.toString()}`),
        fetch("/api/civic-reports"),
      ]);
      if (postsRes.ok) {
        const pd = await postsRes.json();
        setPosts(pd.posts ?? []);
      } else {
        const data = await postsRes.json();
        throw new Error(data.error ?? "Unable to load editorial articles.");
      }
      if (edRes.ok) {
        const ed = await edRes.json();
        setReports(ed.reports ?? []);
        if (Array.isArray(ed.profiles)) setProfiles(ed.profiles);
        if (ed.reporterPermissions && typeof ed.reporterPermissions === "object") {
          setPermissionsMap(ed.reporterPermissions);
        }
        if (Array.isArray(ed.auditLogs)) setAuditLogs(ed.auditLogs);
        if (Array.isArray(ed.permissionHistory)) setPermissionHistory(ed.permissionHistory);
        if (Array.isArray(ed.articleRevisions)) setArticleRevisions(ed.articleRevisions);
        if (Array.isArray(ed.moderationLogs)) setModerationLogs(ed.moderationLogs);
      } else {
        const data = await edRes.json();
        throw new Error(data.error ?? "Unable to load editorial desk data.");
      }
      if (brRes.ok) {
        const bd = await brRes.json();
        if (bd.broadcast) {
          setBroadcast(bd.broadcast);
          setLiveTitle(bd.broadcast.title);
          setLiveSummary(bd.broadcast.summary);
          setLiveLocalityId(bd.broadcast.localityId);
        }
      } else {
        const data = await brRes.json();
        throw new Error(data.error ?? "Unable to load newsroom data.");
      }
      if (dirRes.ok) {
        const dd = await dirRes.json();
        setAnnouncements(dd.announcements ?? []);
      } else {
        const data = await dirRes.json();
        throw new Error(data.error ?? "Unable to load bulletins.");
      }
      if (eventsRes.ok) {
        const eventData = await eventsRes.json();
        setEvents(eventData.events ?? []);
      } else {
        const data = await eventsRes.json();
        throw new Error(data.error ?? "Unable to load events.");
      }
      if (civicRes.ok) {
        const civicData = await civicRes.json();
        setCivicReports(civicData.reports ?? []);
      } else {
        const data = await civicRes.json();
        throw new Error(data.error ?? "Unable to load civic reports.");
      }
      setLoadError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load Studio data.";
      setLoadError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [myPerms.canManageEvents, showToast]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadStudioData();
    });
    return () => {
      active = false;
    };
  }, [loadStudioData]);

  // Studio Access Gate (for non-staff or signed-out visitors)
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#173FBE] text-white flex items-center justify-center p-4 bg-primary-grid">
        <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-[#111318] p-7 sm:p-9 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <PethriLogo variant="dark" size="sm" />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EEF2FF] hover:text-[#315CFF]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Public Site
            </Link>
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#315CFF] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#111318]">
              <Lock className="h-3 w-3" />
              PRIVATE NEWSROOM STUDIO
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              Authorised Staff Access Only
            </h1>
            <p className="text-xs leading-relaxed text-[#EEF2FF]">
              Pethri Studio is restricted to accredited Reporters, Editors, and
              the Website Manager. Sign in with an authorised staff account.
            </p>
          </div>

          {process.env.NODE_ENV !== "production" ? (
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
                  className="flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/5 p-3.5 text-left hover:border-[#315CFF] hover:bg-white/10 transition-all"
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
                      <p className="text-[11px] text-[#EEF2FF]">
                        {prof.homeLocalityName} • @{prof.username}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#315CFF] px-3 py-1 text-[10px] font-extrabold uppercase text-[#111318]">
                    {roleName}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => signInDemoUser("user-editor")}
              className="w-full rounded-full border border-[#315CFF]/50 py-2.5 text-xs font-bold text-[#315CFF] hover:bg-[#315CFF]/15"
            >
              Sign in as Editor / Newsroom Lead
            </button>
          </div>
          ) : (
            <p className="rounded-2xl border border-white/15 bg-white/5 p-4 text-xs text-[#EEF2FF]">
              Access is granted by a Pethri Manager. If you have a staff account,
              sign in through the secure account page.
            </p>
          )}
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

  const resetEventForm = () => {
    setEventEditingId(null);
    setEventTitle("");
    setEventDescription("");
    setEventLocalityId(localities[0]?.id ?? "");
    setEventCategory("celebrations");
    setEventStartsAt("");
    setEventEndsAt("");
    setEventVenue("");
    setEventOrganizer("");
    setEventImageUrl("");
    setEventStatus("published");
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myPerms.canManageEvents) {
      showToast("Event management permission required.", "error");
      return;
    }
    const body = {
      localityId: eventLocalityId,
      title: eventTitle.trim(),
      description: eventDescription.trim(),
      category: eventCategory,
      startsAt: new Date(eventStartsAt).toISOString(),
      endsAt: eventEndsAt ? new Date(eventEndsAt).toISOString() : null,
      venue: eventVenue.trim(),
      organizer: eventOrganizer.trim(),
      imageUrl: eventImageUrl.trim() || null,
      status: eventStatus,
    };
    try {
      const response = await fetch("/api/events", {
        method: eventEditingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          eventEditingId ? { eventId: eventEditingId, ...body } : body
        ),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save event.");
      showToast(eventEditingId ? "Event updated." : "Event created.");
      resetEventForm();
      await loadStudioData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to save event.",
        "error"
      );
    }
  };

  const handleEditEvent = (event: LocalEvent) => {
    setEventEditingId(event.id);
    setEventTitle(event.title);
    setEventDescription(event.description ?? "");
    setEventLocalityId(event.localityId);
    setEventCategory(event.category);
    setEventStartsAt(new Date(event.startsAt).toISOString().slice(0, 16));
    setEventEndsAt(
      event.endsAt ? new Date(event.endsAt).toISOString().slice(0, 16) : ""
    );
    setEventVenue(event.venue);
    setEventOrganizer(event.organizer);
    setEventImageUrl(event.imageUrl ?? "");
    setEventStatus(event.status === "draft" ? "draft" : "published");
  };

  const handleCancelEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events?id=${encodeURIComponent(eventId)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to cancel event.");
      showToast("Event cancelled; its record has been retained.");
      await loadStudioData();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to cancel event.",
        "error"
      );
    }
  };

  const handleCivicStatus = async (reportId: string, status: string) => {
    if (!myPerms.canReviewTips) {
      showToast("Civic report review permission required.", "error");
      return;
    }
    try {
      const response = await fetch("/api/civic-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          status,
          resolutionNotes: notesByPost[reportId] ?? "",
          assignedTo: assignmentByReport[reportId] || null,
          officialAcknowledged:
            Boolean(authorityByReport[reportId]?.trim()) &&
            Boolean(referenceByReport[reportId]?.trim()),
          authorityName: authorityByReport[reportId]?.trim() ?? "",
          officialReference: referenceByReport[reportId]?.trim() ?? "",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to update report.");
      setCivicReports((previous) =>
        previous.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: data.report.status,
                assignedTo: data.report.assigned_to,
                isPublicVerified: data.report.is_public_verified,
                officialAcknowledgedAt:
                  data.report.official_acknowledged_at,
                authorityName: data.report.authority_name,
                resolutionNotes: notesByPost[reportId] ?? null,
              }
            : report
        )
      );
      showToast("Civic report status updated and recorded.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to update report.",
        "error"
      );
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
    if (!isManager) return;
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
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error ?? "Role update denied", "error");
    }
  };

  const handleStaffSuspension = async (profile: UserProfile) => {
    if (!isManager) return;
    const res = await fetch("/api/editorial", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "profile_governance",
        userId: profile.id,
        role: profile.role,
        isVerifiedReporter: profile.isVerifiedReporter,
        isSuspended: !profile.isSuspended,
      }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      showToast(error.error ?? "Unable to update staff access.", "error");
      return;
    }
    const data = await res.json();
    setProfiles((previous) =>
      previous.map((item) => (item.id === profile.id ? data.profile : item))
    );
    showToast(profile.isSuspended ? "Staff account reactivated." : "Staff account suspended.");
  };

  const toggleStaffPermission = async (
    userId: string,
    key: keyof StaffPermissions
  ) => {
    const curr = permissionsMap[userId] ?? {
      canPublishArticles: false,
      canUploadOfficialMedia: false,
      canStartBroadcasts: false,
      canPublishBreaking: false,
      canModerateComments: false,
      canManageEvents: false,
      canReviewTips: false,
    };
    const nextVal = !curr[key];
    const res = await fetch("/api/editorial", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "reporter_permissions",
        userId,
        [key]: nextVal,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reporterPermissions) {
        setPermissionsMap(data.reporterPermissions);
      }
      showToast("Reporter permission updated & logged", "info");
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error ?? "Permission update denied", "error");
    }
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
    {
      id: "civic",
      label: "Civic Reports",
      icon: AlertTriangle,
      badge: openReports.length,
    },
    { id: "comments", label: "Comment Moderation", icon: MessageSquare },
    { id: "staff", label: "Staff & Permissions", icon: Users },
    { id: "audit", label: "Audit & Governance Logs", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111318] flex flex-col lg:flex-row">
      {loadError && (
        <div role="alert" className="fixed bottom-4 right-4 z-50 max-w-md rounded-2xl border border-[#D94E34]/30 bg-white p-4 text-sm text-[#D94E34] shadow-lg">
          {loadError}
        </div>
      )}
      {/* Studio Sidebar */}
      <aside className="lg:w-72 shrink-0 bg-[#173FBE] text-white flex flex-col border-r border-white/10">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <PethriLogo variant="dark" size="sm" />
            <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#EEF2FF]">
              PRIVATE PETHRI STUDIO
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-[#EEF2FF] hover:bg-white/20"
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
            <span className="rounded-full bg-[#315CFF] px-2 py-0.5 text-[10px] font-extrabold text-[#111318]">
              {studioRole}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
            <span
              className={cn(
                "rounded px-1.5 py-0.5",
                myPerms.canPublishArticles
                  ? "bg-[#EEF2FF] text-[#173FBE]"
                  : "bg-white/10 text-white/50"
              )}
            >
              Publish: {myPerms.canPublishArticles ? "ON" : "LOCKED"}
            </span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5",
                myPerms.canUploadOfficialMedia
                  ? "bg-[#EEF2FF] text-[#173FBE]"
                  : "bg-white/10 text-white/50"
              )}
            >
              Media: {myPerms.canUploadOfficialMedia ? "ON" : "LOCKED"}
            </span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5",
                myPerms.canStartBroadcasts
                  ? "bg-[#EEF2FF] text-[#173FBE]"
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
                    ? "bg-[#315CFF] text-white"
                    : "text-[#EEF2FF] hover:bg-white/10 hover:text-white"
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
                        ? "bg-[#173FBE] text-white"
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
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#EEF2FF]/75">
            Test Staff Role
          </p>
          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => signInDemoUser("user-roshan")}
              className="rounded-lg bg-white/10 py-1.5 hover:bg-[#315CFF] hover:text-white"
            >
              Reporter
            </button>
            <button
              type="button"
              onClick={() => signInDemoUser("user-ananya")}
              className="rounded-lg bg-white/10 py-1.5 hover:bg-[#315CFF] hover:text-white"
            >
              Journalist
            </button>
            <button
              type="button"
              onClick={() => signInDemoUser("user-editor")}
              className="rounded-lg bg-white/10 py-1.5 hover:bg-[#315CFF] hover:text-white"
            >
              Editor
            </button>
          </div>
          <button
            type="button"
            onClick={() => signInDemoUser("user-editor")}
            className="w-full rounded-lg bg-white/15 py-1.5 text-[10px] font-bold text-white hover:bg-[#315CFF]"
          >
            Switch to Website Manager Demo
          </button>
        </div>
      </aside>

      {/* Studio Main Workspace */}
      <div className="flex-1 p-5 sm:p-8 space-y-6 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E7F0] pb-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#5B6472]">
              PETHRI NEWSROOM OPERATIONS
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#111318]">
              {STUDIO_NAV.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>
          {broadcast?.isLive && <AnimatedLiveIndicator label="LIVE ON AIR" />}
        </div>

        {loading ? (
          <div className="h-64 animate-pulse rounded-3xl bg-white border border-[#E2E7F0]" />
        ) : activeTab === "overview" ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[#E2E7F0] bg-white p-5">
                <p className="text-xs font-bold text-[#5B6472]">
                  Published Articles
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-[#111318]">
                  {publishedArticles.length}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E2E7F0] bg-[#EEF2FF] p-5">
                <p className="text-xs font-bold text-[#111318]">
                  Pending Private Tips
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-[#111318]">
                  {pendingTips.length}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E2E7F0] bg-white p-5">
                <p className="text-xs font-bold text-[#5B6472]">
                  Open Civic / User Reports
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-[#111318]">
                  {openReports.length}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E2E7F0] bg-[#173FBE] p-5 text-white">
                <p className="text-xs font-bold text-[#EEF2FF]">
                  Live Broadcast Viewers
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-white">
                  {broadcast?.isLive ? broadcast.viewerCount : 0}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#E2E7F0] bg-white p-5 space-y-3">
                <h2 className="font-display text-base font-extrabold text-[#111318]">
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
                        <div className="h-2 rounded-full bg-[#FFFFFF] overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full rounded-full bg-[#173FBE]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E2E7F0] bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-extrabold text-[#111318]">
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
                  <p className="text-xs text-[#5B6472]">
                    All private tips have been reviewed.
                  </p>
                ) : (
                  pendingTips.map((tip) => (
                    <div
                      key={tip.id}
                      className="rounded-xl bg-[#FFFFFF] p-3 border border-[#E2E7F0]"
                    >
                      <p className="text-[10px] font-bold uppercase text-[#5B6472]">
                        {tip.localityName} • @{tip.author.username}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-[#111318]">
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
              className="lg:col-span-7 rounded-2xl border border-[#E2E7F0] bg-white p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-extrabold text-[#111318]">
                  Article Composer
                </h2>
                {!myPerms.canPublishArticles && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFFFF] px-3 py-1 text-[10px] font-bold text-[#111318]">
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
                      ? "bg-[#173FBE] text-white"
                      : "bg-[#FFFFFF] text-[#111318]"
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
                      ? "bg-[#FFFFFF] text-[#111318]"
                      : "bg-[#FFFFFF] text-[#5B6472]"
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
                  className="w-full rounded-xl border border-[#E2E7F0] px-3.5 py-2.5 text-xs outline-none"
                />
              )}

              <input
                type="text"
                required
                value={artHeadline}
                onChange={(e) => setArtHeadline(e.target.value)}
                placeholder="Article Headline *"
                className="w-full rounded-xl border border-[#E2E7F0] px-3.5 py-2.5 text-sm outline-none focus:border-[#315CFF]"
              />

              <textarea
                rows={5}
                required
                value={artBody}
                onChange={(e) => setArtBody(e.target.value)}
                placeholder="Write verified journalism copy..."
                className="w-full rounded-xl border border-[#E2E7F0] px-3.5 py-2.5 text-sm outline-none focus:border-[#315CFF]"
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  value={artCategory}
                  onChange={(e) =>
                    setArtCategory(e.target.value as PostCategory)
                  }
                  className="rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs font-semibold outline-none"
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
                  className="rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs font-semibold outline-none"
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
                  className="rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs font-semibold outline-none"
                >
                  {mediaLibrary.map((m) => (
                    <option key={m.id} value={m.url}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {artMode === "newsroom" && (
                <label className="flex items-center gap-2 text-xs font-bold text-[#111318] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={artBreaking}
                    onChange={(e) => setArtBreaking(e.target.checked)}
                    className="accent-[#173FBE]"
                  />
                  Mark as Official Breaking News
                </label>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="rounded-full border border-[#E2E7F0] bg-[#FFFFFF] px-5 py-2.5 text-xs font-bold text-[#111318]"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={!myPerms.canPublishArticles}
                  className="rounded-full bg-[#173FBE] px-6 py-2.5 text-xs font-extrabold text-white disabled:opacity-40"
                >
                  {myPerms.canPublishArticles
                    ? "Publish to Live Site"
                    : "Publish Locked (Reporter Draft Mode)"}
                </button>
              </div>
            </form>

            {/* Drafts & Corrections */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-[#E2E7F0] bg-white p-5 space-y-3">
                <h3 className="font-display text-sm font-extrabold text-[#111318]">
                  Reporter Drafts ({localDrafts.length})
                </h3>
                {localDrafts.length === 0 ? (
                  <p className="text-xs text-[#5B6472]">
                    Saved article drafts appear here for editor review.
                  </p>
                ) : (
                  localDrafts.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-xl bg-[#FFFFFF] p-3 text-xs space-y-1"
                    >
                      <p className="font-bold text-[#111318]">{d.headline}</p>
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

              <div className="rounded-2xl border border-[#E2E7F0] bg-white p-5 space-y-3">
                <h3 className="font-display text-sm font-extrabold text-[#111318]">
                  Log Correction on Published Story
                </h3>
                {publishedArticles.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="border-b border-[#E2E7F0] pb-3 last:border-b-0 space-y-2"
                  >
                    <p className="text-xs font-bold text-[#111318] line-clamp-1">
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
                        className="flex-1 rounded-lg border border-[#E2E7F0] px-2.5 py-1.5 text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleLogCorrection(p.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#173FBE] px-3 py-1.5 text-[11px] font-bold text-white"
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
                className="rounded-2xl border border-[#E2E7F0] bg-white p-5"
              >
                <div className="grid gap-5 lg:grid-cols-12">
                  {post.media[0] && (
                    <div className="lg:col-span-4 overflow-hidden rounded-xl bg-[#FFFFFF]">
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
                        <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#111318]">
                          {post.moderationStatus}
                        </span>
                        <span className="font-bold text-[#111318]">
                          {post.localityName}
                        </span>
                        <span className="text-[#5B6472]">
                          • @{post.author.username} •{" "}
                          <RelativeTime iso={post.createdAt} />
                        </span>
                      </div>
                      <VerificationBadge tier={post.verificationTier} />
                    </div>

                    <h2 className="font-editorial text-2xl text-[#111318]">
                      {post.headline}
                    </h2>
                    <p className="text-xs leading-relaxed text-[#5B6472]">
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
                      className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs outline-none"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!myPerms.canPublishArticles}
                        onClick={() =>
                          handleReviewTip(post.id, "approved", "reviewed")
                        }
                        className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-3.5 py-1.5 text-xs font-bold text-[#111318] disabled:opacity-40"
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
                        className="inline-flex items-center gap-1 rounded-full bg-[#173FBE] px-3.5 py-1.5 text-xs font-extrabold text-white disabled:opacity-40"
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
            <div className="rounded-2xl border border-[#E2E7F0] bg-white p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-extrabold text-[#111318]">
                  Official Newsroom Media Library
                </h2>
                <p className="text-xs text-[#5B6472]">
                  {myPerms.canUploadOfficialMedia
                    ? "Upload verified field photography for articles and broadcasts."
                    : "Locked: Website Manager has not granted official media upload permission to your Reporter account."}
                </p>
              </div>
              <label
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold transition-opacity",
                  myPerms.canUploadOfficialMedia
                    ? "cursor-pointer bg-[#173FBE] text-white hover:opacity-90"
                    : "cursor-not-allowed bg-[#FFFFFF] text-[#5B6472]"
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
                  className="overflow-hidden rounded-2xl border border-[#E2E7F0] bg-white"
                >
                  <img
                    src={item.url}
                    alt={item.label}
                    className="h-44 w-full object-cover"
                  />
                  <div className="p-4 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#111318]">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-[#5B6472]">{item.tag}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setArtImageUrl(item.url);
                        setActiveTab("articles");
                        showToast("Selected media for article composer");
                      }}
                      className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[10px] font-bold text-[#111318]"
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
              <h2 className="font-display text-base font-extrabold text-[#111318]">
                Scheduled Karavali Events ({events.length})
              </h2>
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-2xl border border-[#E2E7F0] bg-white p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#5B6472]">
                      {evt.localityName} • {evt.venue}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-[#111318]">
                      {evt.title}
                    </p>
                    <p className="mt-1 text-xs text-[#5B6472]">
                      {evt.organizer} • {evt.rsvpCount} RSVPs •{" "}
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(evt.startsAt))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[10px] font-bold capitalize text-[#111318]">
                      {evt.status ?? "published"}
                    </span>
                    <button
                      type="button"
                      disabled={!myPerms.canManageEvents}
                      onClick={() => handleEditEvent(evt)}
                      className="rounded-full border border-[#E2E7F0] px-3 py-1 text-[10px] font-bold text-[#111318] disabled:opacity-40"
                    >
                      Edit
                    </button>
                    {evt.status !== "cancelled" && (
                      <button
                        type="button"
                        disabled={!myPerms.canManageEvents}
                        onClick={() => handleCancelEvent(evt.id)}
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-bold text-red-700 disabled:opacity-40"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <h3 className="pt-2 font-display text-sm font-extrabold text-[#111318]">
                Published Civic Bulletins ({announcements.length})
              </h3>
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-[#E2E7F0] bg-white p-4"
                >
                  <p className="text-[10px] font-bold uppercase text-[#5B6472]">
                    {a.localityName} • {a.urgency}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#111318]">
                    {a.title}
                  </p>
                  <p className="mt-1 text-xs text-[#5B6472]">{a.summary}</p>
                </div>
              ))}
            </div>

            <div className="lg:col-span-5 space-y-4">
              <form
                onSubmit={handleSaveEvent}
                className="rounded-2xl border border-[#E2E7F0] bg-white p-5 space-y-3"
              >
                <h2 className="font-display text-base font-extrabold text-[#111318]">
                  {eventEditingId ? "Edit Local Event" : "Create Local Event"}
                </h2>
                {!myPerms.canManageEvents && (
                  <p className="text-xs text-[#5B6472]">
                    Event management permission has not been granted to your account.
                  </p>
                )}
                <input required value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Event title" className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs outline-none" />
                <textarea required rows={3} value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="Description" className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs outline-none" />
                <select required value={eventLocalityId} onChange={(e) => setEventLocalityId(e.target.value)} className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs">
                  <option value="">Select locality</option>
                  {localities.map((locality) => <option key={locality.id} value={locality.id}>{locality.name}</option>)}
                </select>
                <select value={eventCategory} onChange={(e) => setEventCategory(e.target.value as PostCategory)} className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs">
                  {(Object.keys(CATEGORY_META) as PostCategory[]).map((category) => <option key={category} value={category}>{CATEGORY_META[category].label}</option>)}
                </select>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-[11px] font-bold text-[#5B6472]">Starts
                    <input type="datetime-local" required value={eventStartsAt} onChange={(e) => setEventStartsAt(e.target.value)} className="mt-1 w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs" />
                  </label>
                  <label className="text-[11px] font-bold text-[#5B6472]">Ends (optional)
                    <input type="datetime-local" value={eventEndsAt} onChange={(e) => setEventEndsAt(e.target.value)} className="mt-1 w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs" />
                  </label>
                </div>
                <input required value={eventVenue} onChange={(e) => setEventVenue(e.target.value)} placeholder="Venue" className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs outline-none" />
                <input required value={eventOrganizer} onChange={(e) => setEventOrganizer(e.target.value)} placeholder="Organiser" className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs outline-none" />
                <input type="url" value={eventImageUrl} onChange={(e) => setEventImageUrl(e.target.value)} placeholder="Cover image URL (optional)" className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs outline-none" />
                <select value={eventStatus} onChange={(e) => setEventStatus(e.target.value as "draft" | "published")} className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs">
                  <option value="draft">Save as draft</option>
                  <option value="published">Publish event</option>
                </select>
                <div className="flex gap-2">
                  <button type="submit" disabled={!myPerms.canManageEvents} className="flex-1 rounded-full bg-[#173FBE] py-2.5 text-xs font-extrabold text-white disabled:opacity-40">
                    {eventEditingId ? "Save Changes" : "Save Event"}
                  </button>
                  {eventEditingId && <button type="button" onClick={resetEventForm} className="rounded-full border border-[#E2E7F0] px-4 py-2 text-xs font-bold">Cancel edit</button>}
                </div>
              </form>
              <form onSubmit={handlePublishBulletin} className="rounded-2xl border border-[#E2E7F0] bg-white p-5 space-y-3">
                <h3 className="font-display text-sm font-extrabold text-[#111318]">Publish Civic Bulletin</h3>
                <input type="text" required value={evtTitle} onChange={(e) => setEvtTitle(e.target.value)} placeholder="Notice title" className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs outline-none" />
                <textarea rows={3} required value={evtSummary} onChange={(e) => setEvtSummary(e.target.value)} placeholder="Notice details" className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs outline-none" />
                <input type="text" required value={evtIssuer} onChange={(e) => setEvtIssuer(e.target.value)} placeholder="Issuer" className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs outline-none" />
                <select value={evtUrgency} onChange={(e) => setEvtUrgency(e.target.value as "notice" | "advisory" | "urgent")} className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs outline-none">
                  <option value="notice">Notice</option><option value="advisory">Advisory</option><option value="urgent">Urgent Alert</option>
                </select>
                <button type="submit" className="w-full rounded-full bg-[#173FBE] py-2.5 text-xs font-extrabold text-white">Publish Bulletin</button>
              </form>
            </div>
          </div>
        ) : activeTab === "audit" ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#E2E7F0] bg-white p-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E7F0]">
                <div>
                  <h2 className="font-display text-base font-extrabold text-[#111318]">
                    Security &amp; Publishing Audit Trail
                  </h2>
                  <p className="text-xs text-[#5B6472]">
                    Immutable audit records of all editorial operations, staff permission changes, and publishing events.
                  </p>
                </div>
                <span className="rounded-full bg-[#EEF2FF] px-3 py-1 font-mono text-[10px] font-extrabold text-[#173FBE]">
                  {auditLogs.length} Records
                </span>
              </div>

              {auditLogs.length === 0 ? (
                <p className="mt-4 text-xs text-[#5B6472]">
                  No audit log entries recorded yet.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-[#E2E7F0]">
                  {auditLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="py-3 first:pt-0 last:pb-0 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold uppercase rounded bg-[#FFFFFF] px-2 py-0.5 text-[#173FBE] border border-[#E2E7F0]">
                            {log.action}
                          </span>
                          <span className="font-bold text-[#111318]">
                            {log.entityTable} • ID: {String(log.entityId).slice(0, 16)}
                          </span>
                        </div>
                        <p className="text-[#5B6472] text-[11px]">
                          {log.summary || JSON.stringify(log.metadata || {})}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-[10px] text-[#5B6472]">
                          <RelativeTime iso={log.createdAt} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#E2E7F0] bg-white p-5 space-y-3">
                <h3 className="font-display text-sm font-extrabold text-[#111318]">
                  Permission Grant History ({permissionHistory.length})
                </h3>
                {permissionHistory.length === 0 ? (
                  <p className="text-xs text-[#5B6472]">No permission changes recorded.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {permissionHistory.map((ph: any) => (
                      <div
                        key={ph.id}
                        className="rounded-xl bg-[#FFFFFF] p-3 border border-[#E2E7F0] text-xs space-y-1"
                      >
                        <p className="font-bold text-[#111318]">{ph.summary}</p>
                        <p className="text-[10px] text-[#5B6472] font-mono">
                          <RelativeTime iso={ph.createdAt} />
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#E2E7F0] bg-white p-5 space-y-3">
                <h3 className="font-display text-sm font-extrabold text-[#111318]">
                  Article Revision &amp; Review Logs ({articleRevisions.length})
                </h3>
                {articleRevisions.length === 0 ? (
                  <p className="text-xs text-[#5B6472]">No article revisions recorded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {articleRevisions.map((rev: any) => (
                      <div
                        key={rev.id}
                        className="rounded-xl bg-[#FFFFFF] p-3 border border-[#E2E7F0] text-xs space-y-1"
                      >
                        <p className="font-bold text-[#111318]">{rev.headline}</p>
                        <p className="text-[11px] text-[#5B6472]">
                          Rev #{rev.revisionNumber} • Status: {rev.moderationStatus} • Tier: {rev.verificationTier}
                        </p>
                        <p className="text-[10px] text-[#5B6472] font-mono">
                          <RelativeTime iso={rev.createdAt} />
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === "civic" ? (
          <div className="space-y-4">
            <section className="space-y-3">
              <div>
                <h2 className="font-display text-base font-extrabold text-[#111318]">
                  Private Civic Reports ({civicReports.length})
                </h2>
                <p className="text-xs text-[#5B6472]">
                  Reports are private. “Verified” means checked by Pethri; “Forwarded” does not imply official acknowledgement.
                </p>
              </div>
              {myPerms.canReviewTips ? (
                civicReports.map((report) => {
                  const nextStatus: Record<string, string> = {
                    submitted: "under_review",
                    open: "under_review",
                    under_review: "verified",
                    triaged: "verified",
                    verified: "forwarded",
                    forwarded: "in_progress",
                    in_progress: "resolved",
                  };
                  const next = nextStatus[report.status];
                  return (
                  <article key={report.id} className="rounded-2xl border border-[#E2E7F0] bg-white p-5 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-[#173FBE]">{report.localityName}</p>
                        <h3 className="mt-1 text-sm font-extrabold text-[#111318]">{report.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-[#5B6472]">{report.description}</p>
                      </div>
                      <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[10px] font-extrabold capitalize text-[#173FBE]">{report.status.replaceAll("_", " ")}</span>
                    </div>
                    {report.isPublicVerified && <p className="text-xs font-bold text-[#173FBE]">Pethri editorial verification recorded.</p>}
                    {report.officialAcknowledgedAt && <p className="text-xs font-bold text-[#173FBE]">Official acknowledgement confirmed by {report.authorityName}.</p>}
                    {report.attachments.map((attachment) => (
                      <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="mr-2 inline-flex rounded-full border border-[#E2E7F0] px-3 py-1 text-[10px] font-bold text-[#173FBE] hover:border-[#315CFF]">{attachment.fileName}</a>
                    ))}
                    <label className="block text-[11px] font-bold text-[#5B6472]">
                      Assigned reporter
                      <select
                        value={assignmentByReport[report.id] ?? report.assignedTo ?? ""}
                        onChange={(event) => setAssignmentByReport((previous) => ({ ...previous, [report.id]: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs"
                      >
                        <option value="">Unassigned</option>
                        {profiles.filter((profile) => ["correspondent", "journalist", "editor", "admin"].includes(profile.role) && !profile.isSuspended).map((profile) => (
                          <option key={profile.id} value={profile.id}>{profile.fullName}</option>
                        ))}
                      </select>
                    </label>
                    <textarea
                      rows={2}
                      value={notesByPost[report.id] ?? report.resolutionNotes ?? ""}
                      onChange={(event) => setNotesByPost((previous) => ({ ...previous, [report.id]: event.target.value }))}
                      placeholder="Private status update / resolution note"
                      className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs"
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={authorityByReport[report.id] ?? ""}
                        onChange={(event) => setAuthorityByReport((previous) => ({ ...previous, [report.id]: event.target.value }))}
                        placeholder="Authority name (only after confirmed response)"
                        className="rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs"
                      />
                      <input
                        value={referenceByReport[report.id] ?? ""}
                        onChange={(event) => setReferenceByReport((previous) => ({ ...previous, [report.id]: event.target.value }))}
                        placeholder="Official confirmation reference"
                        className="rounded-xl border border-[#E2E7F0] px-3 py-2 text-xs"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {next && (
                        <button type="button" onClick={() => handleCivicStatus(report.id, next)} className="rounded-full border border-[#E2E7F0] px-3 py-1.5 text-[10px] font-bold capitalize text-[#173FBE] hover:border-[#315CFF]">
                          Move to {next.replaceAll("_", " ")}
                        </button>
                      )}
                    </div>
                    {report.history.length > 0 && (
                      <p className="text-[10px] text-[#5B6472]">
                        Latest update: {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.history[report.history.length - 1].created_at))}
                      </p>
                    )}
                  </article>
                );
              })
              ) : (
                <div className="rounded-2xl border border-[#E2E7F0] bg-white p-4 text-xs text-[#5B6472]">
                  Civic report review permission has not been granted to your account.
                </div>
              )}
            </section>
            {reports.length === 0 ? (
              <div className="rounded-2xl border border-[#E2E7F0] bg-white p-10 text-center text-sm text-[#5B6472]">
                No civic or user flags open.
              </div>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-2xl border border-[#E2E7F0] bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase",
                          rep.status === "open"
                            ? "bg-[#315CFF] text-white"
                            : "bg-[#EEF2FF] text-[#173FBE]"
                        )}
                      >
                        {rep.status}
                      </span>
                      <span className="text-xs font-bold text-[#111318]">
                        {rep.reason}
                      </span>
                      <span className="text-[11px] text-[#5B6472]">
                        by @{rep.reporterUsername} •{" "}
                        <RelativeTime iso={rep.createdAt} />
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#111318]">
                      {rep.postHeadline}
                    </p>
                    {rep.details && (
                      <p className="text-xs text-[#5B6472]">{rep.details}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleResolveReport(rep.id, "resolved")}
                      className="rounded-full bg-[#173FBE] px-4 py-1.5 text-xs font-bold text-white"
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolveReport(rep.id, "dismissed")}
                      className="rounded-full border border-[#E2E7F0] px-4 py-1.5 text-xs font-bold text-[#111318]"
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
              <div className="rounded-2xl border border-[#E2E7F0] bg-white p-10 text-center text-sm text-[#5B6472]">
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
                        : "border-[#E2E7F0] bg-white"
                    )}
                  >
                    <div className="space-y-1 max-w-2xl">
                      <p className="text-[10px] font-bold uppercase text-[#5B6472]">
                        On: {c.postHeadline}
                      </p>
                      <p className="text-xs font-bold text-[#111318]">
                        {c.authorName} (@{c.authorUsername}) •{" "}
                        <RelativeTime iso={c.createdAt} />
                      </p>
                      <p className="text-sm text-[#111318]/85">{c.content}</p>
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
                          ? "bg-[#EEF2FF] text-[#173FBE]"
                          : "bg-[#173FBE] text-white"
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
              <div className="rounded-2xl border border-[#E2E7F0] bg-[#FFFFFF] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#111318]">
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
                  canPublishBreaking:
                    prof.role === "editor" || prof.role === "admin",
                  canModerateComments:
                    prof.role === "editor" || prof.role === "admin",
                  canManageEvents:
                    prof.role === "editor" || prof.role === "admin",
                  canReviewTips:
                    prof.role === "editor" || prof.role === "admin",
                };
                return (
                  <div
                    key={prof.id}
                    className="rounded-2xl border border-[#E2E7F0] bg-white p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={prof.avatarUrl}
                          alt={prof.fullName}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-bold text-[#111318]">
                            {prof.fullName}
                          </p>
                          <p className="text-xs text-[#5B6472]">
                            @{prof.username} • {prof.homeLocalityName}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#111318]">
                        {getStudioRoleLabel(prof.role)}
                      </span>
                    </div>

                    <div className="border-t border-[#E2E7F0] pt-3 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#5B6472]">
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
                          className="rounded-lg border border-[#E2E7F0] bg-[#FFFFFF] px-2.5 py-1 text-xs font-bold outline-none disabled:opacity-50"
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
                      <button
                        type="button"
                        disabled={!isManager || prof.id === currentUser.id}
                        onClick={() => handleStaffSuspension(prof)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-[10px] font-bold disabled:opacity-40",
                          prof.isSuspended
                            ? "bg-[#EEF2FF] text-[#173FBE]"
                            : "border border-red-200 bg-red-50 text-red-700"
                        )}
                      >
                        {prof.isSuspended ? "Reactivate Account" : "Suspend Account"}
                      </button>

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
                            {
                              key: "canPublishBreaking",
                              label: "Publish Breaking News",
                            },
                            {
                              key: "canModerateComments",
                              label: "Moderate Comments",
                            },
                            {
                              key: "canManageEvents",
                              label: "Manage Events",
                            },
                            {
                              key: "canReviewTips",
                              label: "Review Tips & Reports",
                            },
                          ] as const
                        ).map((perm) => (
                          <button
                            key={perm.key}
                            type="button"
                            disabled={
                              !isManager ||
                              (prof.role !== "correspondent" &&
                                prof.role !== "journalist")
                            }
                            onClick={() =>
                              toggleStaffPermission(prof.id, perm.key)
                            }
                            className={cn(
                              "rounded-full px-3 py-1 text-[10px] font-bold transition-colors disabled:opacity-40",
                              perms[perm.key]
                                ? "bg-[#173FBE] text-white"
                                : "bg-[#FFFFFF] text-[#5B6472] border border-[#E2E7F0]"
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
