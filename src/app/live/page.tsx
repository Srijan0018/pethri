"use client";

import React, { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Eye,
  Flame,
  Heart,
  MapPin,
  MessageSquare,
  Play,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  AnimatedLiveIndicator,
  EditorialReveal,
  MaskedHeadlineReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/MotionPrimitives";
import { usePethri } from "@/components/PethriProvider";
import { RelativeTime } from "@/components/RelativeTime";
import { cn } from "@/lib/utils";
import type { LiveBroadcast } from "@/types/pethri";

function LiveContent() {
  const { activeLocalityId, currentUser, requireAuth } = usePethri();
  const [streams, setStreams] = useState<LiveBroadcast[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);

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

  const activeStream =
    streams.find((s) => s.id === activeId) ?? streams[0] ?? null;

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStream || !chatText.trim()) return;
    if (!requireAuth("join the live chat")) return;

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
    if (!requireAuth("send live reactions")) return;

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
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E5E3DC] pb-5">
        <div>
          <AnimatedLiveIndicator
            label="OFFICIAL PETHRI LIVE & REPLAYS"
            showWaveform
          />
          <MaskedHeadlineReveal>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181917]">
              Karavali Live Broadcasts
            </h1>
          </MaskedHeadlineReveal>
          <p className="mt-1 text-sm text-[#5A605C]">
            Official Pethri broadcasts, civic briefings, Kambala &amp; Kabaddi
            coverages, and curated event replays across Mangaluru, Udupi &amp;
            Manipal.
          </p>
        </div>
      </div>

      {activeStream && (
        <EditorialReveal>
          <div className="grid gap-6 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-8 overflow-hidden rounded-3xl border border-[#E5E3DC] bg-[#1B5E43] text-white flex flex-col shadow-sm">
              <div className="relative h-[300px] sm:h-[440px] bg-[#181917] overflow-hidden">
                <img
                  src={activeStream.posterUrl}
                  alt={activeStream.title}
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1B5E43] via-transparent to-black/35" />

                <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AnimatedLiveIndicator
                      label={activeStream.isLive ? "LIVE" : "REPLAY"}
                    />
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#181917]/80 px-3 py-1 text-[11px] font-bold text-[#EAF2EE]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#398BFF]" />
                      Pethri Broadcast
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#181917]/75 px-3 py-1 font-mono text-xs font-bold text-white">
                    <Eye className="h-3.5 w-3.5 text-[#398BFF]" />
                    {activeStream.viewerCount} watching
                  </span>
                </div>

                <div className="pointer-events-none absolute bottom-16 right-6 flex flex-col items-center">
                  <AnimatePresence>
                    {floatingHearts.map((fid) => (
                      <motion.div
                        key={fid}
                        initial={{ opacity: 1, y: 0, scale: 0.7 }}
                        animate={{ opacity: 0, y: -90, scale: 1.3 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.85 }}
                        className="absolute text-[#398BFF]"
                      >
                        <Heart className="h-7 w-7 fill-[#398BFF]" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="absolute bottom-4 right-4">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.85 }}
                    onClick={handleReaction}
                    className="inline-flex items-center gap-2 rounded-full bg-[#398BFF] px-4 py-2 text-xs font-extrabold text-white shadow-lg electric-glow hover:bg-white hover:text-[#1B5E43] transition-colors"
                  >
                    <Flame className="h-4 w-4" />
                    <span>{activeStream.reactionsCount}</span>
                  </motion.button>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#EAF2EE]/85">
                  <span className="inline-flex items-center gap-1 font-bold text-white">
                    <MapPin className="h-3.5 w-3.5 text-[#398BFF]" />
                    {activeStream.localityName}
                  </span>
                  <span>•</span>
                  <span>{activeStream.channelName}</span>
                  <span>•</span>
                  <span>
                    Started <RelativeTime iso={activeStream.startedAt} />
                  </span>
                </div>
                <h2 className="mt-2 font-editorial text-2xl sm:text-3xl leading-snug text-white">
                  {activeStream.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#EAF2EE]/85">
                  {activeStream.summary}
                </p>
                <p className="mt-3 text-xs font-semibold text-[#EAF2EE]">
                  Host: {activeStream.hostName} (@{activeStream.hostUsername})
                </p>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col rounded-3xl border border-[#E5E3DC] bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#E5E3DC] bg-[#EAF2EE] px-4 py-3.5">
                <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1B5E43]">
                  <MessageSquare className="h-4 w-4" />
                  Live Viewer Chat
                </span>
                <span className="font-mono text-[11px] font-bold text-[#5A605C]">
                  {activeStream.chatMessages.length} msgs
                </span>
              </div>

              <div className="flex-1 max-h-[380px] overflow-y-auto p-4 space-y-3">
                {activeStream.chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-2xl bg-[#F8F7F4] p-3 border border-[#E5E3DC]"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-[#181917]">
                        {msg.senderName}
                      </span>
                      <span className="text-[#5A605C]">
                        <RelativeTime iso={msg.sentAt} />
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#5A605C]">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSendChat}
                className="border-t border-[#E5E3DC] p-3 flex gap-2 bg-[#F8F7F4]"
              >
                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Join the live chat (sign in required)..."
                  className="flex-1 rounded-full border border-[#E5E3DC] bg-white px-4 py-2 text-xs outline-none focus:border-[#398BFF]"
                />
                <button
                  type="submit"
                  disabled={!chatText.trim()}
                  aria-label="Send live chat message"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1B5E43] text-white hover:bg-[#398BFF] disabled:opacity-40 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </EditorialReveal>
      )}

      <section className="space-y-4 pt-2">
        <h2 className="font-display text-xl font-extrabold text-[#181917]">
          Broadcasts &amp; Replays ({streams.length})
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
                    ? "border-[#398BFF] bg-[#EAF2EE] ring-2 ring-[#398BFF]/30"
                    : "border-[#E5E3DC] bg-white hover:border-[#398BFF]/50"
                )}
              >
                <div className="relative h-40 bg-[#181917]">
                  <img
                    src={st.posterUrl}
                    alt={st.title}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={cn(
                      "absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold text-white",
                      st.isLive ? "bg-[#D94E34]" : "bg-[#1B5E43]"
                    )}
                  >
                    <Play className="h-2.5 w-2.5 fill-current" />
                    {st.isLive ? `LIVE • ${st.viewerCount}` : "REPLAY"}
                  </span>
                  <span className="absolute bottom-2.5 left-2.5 rounded-full bg-[#181917]/80 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    {st.localityName}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B5E43]">
                    {st.channelName}
                  </p>
                  <h3 className="mt-1 font-editorial text-xl leading-snug text-[#181917] line-clamp-2">
                    {st.title}
                  </h3>
                  <p className="mt-1.5 text-[11px] text-[#5A605C]">
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
        <div className="mx-auto max-w-5xl px-4 py-12 text-center text-sm text-[#5A605C]">
          Loading Pethri Live broadcasts...
        </div>
      }
    >
      <LiveContent />
    </Suspense>
  );
}
