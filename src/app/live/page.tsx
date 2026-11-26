"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Eye,
  Flame,
  Heart,
  MapPin,
  MessageSquare,
  Radio,
  Send,
  ShieldCheck,
  Video,
  VideoOff,
} from "lucide-react";
import { EditorialReveal, StaggerGroup, StaggerItem } from "@/components/MotionPrimitives";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { CATEGORY_META, cn } from "@/lib/utils";
import type { LiveBroadcast, PostCategory } from "@/types/pethri";

function LiveContent() {
  const searchParams = useSearchParams();
  const autoStart = searchParams.get("start") === "true";

  const { localities, activeLocalityId, currentUser, showToast } = usePethri();
  const [streams, setStreams] = useState<LiveBroadcast[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);
  const [studioOpen, setStudioOpen] = useState(autoStart);

  // Go Live Studio state
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newLocalityId, setNewLocalityId] = useState("loc-mangaluru");
  const [newCategory, setNewCategory] = useState<PostCategory>("sports");
  const [camActive, setCamActive] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const param =
      activeLocalityId !== "all" ? `?locality=${activeLocalityId}` : "";
    fetch(`/api/broadcast${param}`)
      .then((r) => r.json())
      .then((d) => {
        const list: LiveBroadcast[] = d.liveStreams ?? [];
        setStreams(list);
        if (list.length > 0) {
          setActiveId((prev) => prev ?? list[0].id);
        }
      });
  }, [activeLocalityId]);

  useEffect(() => {
    return () => {
      camStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const activeStream =
    streams.find((s) => s.id === activeId) ?? streams[0] ?? null;

  const enableStudioCamera = async () => {
    setCamError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError("Camera preview unavailable — stream will use event poster.");
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      camStreamRef.current = media;
      setCamActive(true);
      setTimeout(() => {
        if (camVideoRef.current) {
          camVideoRef.current.srcObject = media;
        }
      }, 60);
    } catch {
      setCamError(
        "Camera permission declined. You can still start a community live broadcast room."
      );
    }
  };

  const stopStudioCamera = () => {
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current = null;
    setCamActive(false);
  };

  const handleStartBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_community_stream",
        hostId: currentUser.id,
        hostName: currentUser.fullName,
        hostUsername: currentUser.username,
        title: newTitle.trim(),
        summary: newSummary.trim() || "Live Karavali community broadcast",
        localityId: newLocalityId,
        category: newCategory,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setStreams((prev) => [data.stream, ...prev]);
      setActiveId(data.stream.id);
      setStudioOpen(false);
      setNewTitle("");
      setNewSummary("");
      stopStudioCamera();
      showToast("Your Pethri Live broadcast is now ON AIR!");
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStream || !chatText.trim()) return;
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_live_chat",
        streamId: activeStream.id,
        senderName: currentUser.fullName,
        senderHandle: currentUser.username,
        text: chatText.trim(),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setStreams((prev) =>
        prev.map((s) => (s.id === activeStream.id ? data.stream : s))
      );
      setChatText("");
    }
  };

  const handleReaction = async () => {
    if (!activeStream) return;
    const fid = Date.now();
    setFloatingHearts((prev) => [...prev, fid]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((x) => x !== fid));
    }, 900);

    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_live_reaction",
        streamId: activeStream.id,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setStreams((prev) =>
        prev.map((s) => (s.id === activeStream.id ? data.stream : s))
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#202820]/10 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCEBCB] px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#202820]">
            <span className="h-2 w-2 rounded-full bg-[#202820] animate-ping" />
            PETHRI LIVE NETWORK
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#202820]">
            Karavali Live Broadcasts
          </h1>
          <p className="mt-1 text-sm text-[#525F52]">
            Watch official newsroom desks, Kabaddi tournaments, college
            festivals, and local events across Mangaluru, Udupi &amp; Manipal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setStudioOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-[#202820] px-5 py-3 text-xs font-extrabold text-[#B7F36B] hover:opacity-90 transition-all active:scale-95"
        >
          <Radio className="h-4 w-4" />
          <span>{studioOpen ? "Close Go Live Studio" : "Go Live Now"}</span>
        </button>
      </div>

      {/* Go Live Studio Panel */}
      <AnimatePresence>
        {studioOpen && (
          <motion.form
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onSubmit={handleStartBroadcast}
            className="grid gap-6 rounded-3xl border border-[#202820]/15 bg-[#DCEBCB]/45 p-6 lg:grid-cols-12"
          >
            <div className="lg:col-span-5 space-y-3">
              <div className="relative h-56 overflow-hidden rounded-2xl bg-[#202820] flex items-center justify-center text-[#C9E8D5]">
                {camActive ? (
                  <video
                    ref={camVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Camera className="mx-auto h-8 w-8 text-[#B7F36B]" />
                    <p className="mt-2 text-xs font-semibold">
                      Camera stays off until you enable it
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!camActive ? (
                  <button
                    type="button"
                    onClick={enableStudioCamera}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#202820] px-4 py-2 text-xs font-bold text-[#B7F36B]"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Enable Camera &amp; Mic
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopStudioCamera}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#202820]"
                  >
                    <VideoOff className="h-3.5 w-3.5" />
                    Stop Preview
                  </button>
                )}
              </div>
              {camError && (
                <p className="text-[11px] text-[#525F52]">{camError}</p>
              )}
            </div>

            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-extrabold text-[#202820]">
                  Start a Broadcast Room
                </p>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#202820]">
                  Host: {currentUser.fullName} ({currentUser.role})
                </span>
              </div>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Broadcast title (e.g., Manipal Inter-College Finals / Udupi Rathotsava)..."
                className="w-full rounded-xl border border-[#202820]/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#202820]"
              />
              <textarea
                rows={3}
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="Describe what viewers will see live..."
                className="w-full rounded-xl border border-[#202820]/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#202820]"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={newLocalityId}
                  onChange={(e) => setNewLocalityId(e.target.value)}
                  className="rounded-xl border border-[#202820]/15 bg-white px-3 py-2.5 text-xs font-bold outline-none"
                >
                  {localities.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <select
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as PostCategory)
                  }
                  className="rounded-xl border border-[#202820]/15 bg-white px-3 py-2.5 text-xs font-bold outline-none"
                >
                  {(Object.keys(CATEGORY_META) as PostCategory[]).map((k) => (
                    <option key={k} value={k}>
                      {CATEGORY_META[k].label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="rounded-full bg-[#B7F36B] border border-[#202820]/20 px-6 py-3 text-xs font-extrabold text-[#202820] hover:bg-[#DCEBCB]"
              >
                Launch Live Broadcast Room
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main Live Player + Live Chat Split */}
      {activeStream && (
        <EditorialReveal>
          <div className="grid gap-6 lg:grid-cols-12 items-stretch">
            {/* Live Video Stage */}
            <div className="lg:col-span-8 overflow-hidden rounded-3xl border border-[#202820]/15 bg-[#202820] text-[#F7F6EF] flex flex-col">
              <div className="relative h-[300px] sm:h-[440px] bg-black overflow-hidden">
                <img
                  src={activeStream.posterUrl}
                  alt={activeStream.title}
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#202820] via-transparent to-black/35" />

                {/* Live Indicators */}
                <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B7F36B] px-3 py-1 text-[11px] font-extrabold uppercase text-[#202820]">
                      <span className="h-2 w-2 rounded-full bg-[#202820] animate-ping" />
                      LIVE
                    </span>
                    {activeStream.streamSourceKind === "official_newsroom" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#202820]/85 px-3 py-1 text-[11px] font-bold text-[#C9E8D5]">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#B7F36B]" />
                        Official Newsroom
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white">
                        Community Live
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 font-mono text-xs font-bold text-white">
                      <Eye className="h-3.5 w-3.5 text-[#B7F36B]" />
                      {activeStream.viewerCount} watching
                    </span>
                  </div>
                </div>

                {/* Floating Reactions */}
                <div className="pointer-events-none absolute bottom-16 right-6 flex flex-col items-center">
                  <AnimatePresence>
                    {floatingHearts.map((fid) => (
                      <motion.div
                        key={fid}
                        initial={{ opacity: 1, y: 0, scale: 0.7 }}
                        animate={{ opacity: 0, y: -90, scale: 1.3 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.85 }}
                        className="absolute text-[#B7F36B]"
                      >
                        <Heart className="h-7 w-7 fill-[#B7F36B]" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Reaction Trigger */}
                <div className="absolute bottom-4 right-4">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.85 }}
                    onClick={handleReaction}
                    className="inline-flex items-center gap-2 rounded-full bg-[#B7F36B] px-4 py-2 text-xs font-extrabold text-[#202820] shadow-lg"
                  >
                    <Flame className="h-4 w-4" />
                    <span>{activeStream.reactionsCount}</span>
                  </motion.button>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#C9E8D5]">
                  <span className="inline-flex items-center gap-1 font-bold text-[#B7F36B]">
                    <MapPin className="h-3.5 w-3.5" />
                    {activeStream.localityName}
                  </span>
                  <span>•</span>
                  <span>{activeStream.channelName}</span>
                  <span>•</span>
                  <span>
                    Started <RelativeTime iso={activeStream.startedAt} />
                  </span>
                </div>
                <h2 className="mt-2 font-editorial text-2xl sm:text-3xl leading-snug text-[#F7F6EF]">
                  {activeStream.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#C9E8D5]/85">
                  {activeStream.summary}
                </p>
                <p className="mt-3 text-xs font-semibold text-[#B7F36B]">
                  Host: {activeStream.hostName} (@{activeStream.hostUsername})
                </p>
              </div>
            </div>

            {/* Real-Time Live Chat Sidebar */}
            <div className="lg:col-span-4 flex flex-col rounded-3xl border border-[#202820]/15 bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#202820]/10 bg-[#DCEBCB]/45 px-4 py-3.5">
                <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#202820]">
                  <MessageSquare className="h-4 w-4" />
                  Live Stream Chat
                </span>
                <span className="font-mono text-[11px] font-bold text-[#525F52]">
                  {activeStream.chatMessages.length} msgs
                </span>
              </div>

              <div className="flex-1 max-h-[380px] overflow-y-auto p-4 space-y-3">
                {activeStream.chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-2xl bg-[#F7F6EF] p-3 border border-[#202820]/5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-[#202820]">
                        {msg.senderName}
                      </span>
                      <span className="text-[#525F52]">
                        <RelativeTime iso={msg.sentAt} />
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#202820]/90">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSendChat}
                className="border-t border-[#202820]/10 p-3 flex gap-2 bg-[#F7F6EF]"
              >
                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder={`Chat as ${currentUser.fullName}...`}
                  className="flex-1 rounded-full border border-[#202820]/15 bg-white px-4 py-2 text-xs outline-none focus:border-[#202820]"
                />
                <button
                  type="submit"
                  disabled={!chatText.trim()}
                  aria-label="Send live chat message"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#202820] text-[#B7F36B] disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </EditorialReveal>
      )}

      {/* Other Live Broadcasts Across Karavali */}
      <section className="space-y-4 pt-2">
        <h2 className="font-display text-xl font-extrabold text-[#202820]">
          Active Streams Across Karavali ({streams.length})
        </h2>
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {streams.map((st) => (
            <StaggerItem key={st.id}>
              <button
                type="button"
                onClick={() => setActiveId(st.id)}
                className={cn(
                  "w-full text-left overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5",
                  activeStream?.id === st.id
                    ? "border-[#202820] bg-[#DCEBCB]/60 ring-2 ring-[#B7F36B]"
                    : "border-[#202820]/10 bg-white hover:border-[#202820]/40"
                )}
              >
                <div className="relative h-40 bg-[#202820]">
                  <img
                    src={st.posterUrl}
                    alt={st.title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-[#B7F36B] px-2.5 py-0.5 text-[10px] font-extrabold text-[#202820]">
                    LIVE • {st.viewerCount}
                  </span>
                  <span className="absolute bottom-2.5 left-2.5 rounded-full bg-[#202820]/85 px-2.5 py-0.5 text-[10px] font-bold text-[#F7F6EF]">
                    {st.localityName}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#525F52]">
                    {st.streamSourceKind === "official_newsroom"
                      ? "Official Newsroom"
                      : "Community Live"}{" "}
                    • {st.channelName}
                  </p>
                  <h3 className="mt-1 font-editorial text-xl leading-snug text-[#202820] line-clamp-2">
                    {st.title}
                  </h3>
                  <p className="mt-1.5 text-[11px] text-[#525F52]">
                    Host: {st.hostName}
                  </p>
                </div>
              </button>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>
    </div>
  );
}

export default function LivePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-12 text-center text-sm text-[#525F52]">
          Loading Pethri Live streams...
        </div>
      }
    >
      <LiveContent />
    </Suspense>
  );
}
