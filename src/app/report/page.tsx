"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  Clock,
  ImagePlus,
  LocateFixed,
  Lock,
  MapPin,
  ShieldAlert,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";
import { usePethri } from "@/components/PethriProvider";
import { CATEGORY_META, cn } from "@/lib/utils";
import type { PostCategory, PostItem, PostMediaItem } from "@/types/pethri";

const SAMPLE_PRESET_MEDIA = [
  { label: "Town & Bus", url: "/images/scenes/pethri-town.svg" },
  { label: "Church Feast", url: "/images/scenes/church-feast.svg" },
  { label: "Paddy Harvest", url: "/images/scenes/paddy-harvest.svg" },
  { label: "Civic Road", url: "/images/scenes/civic-road.svg" },
];

function ReporterContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "moment";
  const initialLocality = searchParams.get("locality");

  const { localities, currentUser, showToast } = usePethri();
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<PostCategory>("news");
  const [localityId, setLocalityId] = useState(
    initialLocality ?? localities[0]?.id ?? "loc-pethri"
  );
  const [approxLandmark, setApproxLandmark] = useState("");
  const [isMoment, setIsMoment] = useState(initialMode);
  const [mediaItems, setMediaItems] = useState<Omit<PostMediaItem, "id">[]>([
    {
      mediaType: "image",
      url: "/images/scenes/pethri-town.svg",
      aspectRatio: "16:9",
      caption: "Captured in Pethri",
    },
  ]);

  // Privacy-first GPS consent state
  const [gpsCoords, setGpsCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [sharePreciseLocation, setSharePreciseLocation] = useState(false);

  // On-demand Camera capture state (permission requested ONLY when user clicks Open Camera)
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submittedPost, setSubmittedPost] = useState<PostItem | null>(null);

  const stopCameraStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setRecording(false);
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const openCamera = async (withAudio: boolean) => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Live camera API is unavailable here. Use photo/video upload below."
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: withAudio,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      setCameraError(
        "Camera permission declined or no camera found. You can still upload media files below."
      );
    }
  };

  const snapPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 960;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setMediaItems((prev) => [
      ...prev,
      {
        mediaType: "image",
        url: dataUrl,
        aspectRatio: "4:5",
        caption: "Live camera capture",
      },
    ]);
    stopCameraStream();
    showToast("Photo captured and attached!");
  };

  const toggleVideoRecord = () => {
    if (!streamRef.current) return;
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(streamRef.current);
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setMediaItems((prev) => [
        ...prev,
        {
          mediaType: "video",
          url,
          aspectRatio: "9:16",
          caption: "Captured video moment",
          durationSeconds: 10,
        },
      ]);
      setIsMoment(true);
      stopCameraStream();
      showToast("Short video moment attached!");
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    files.forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setMediaItems((prev) => [
            ...prev,
            {
              mediaType: isVideo ? "video" : "image",
              url: reader.result as string,
              aspectRatio: isVideo ? "9:16" : "4:5",
              caption: file.name,
            },
          ]);
          if (isVideo) setIsMoment(true);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRequestGps = () => {
    if (!navigator.geolocation) {
      setGpsMessage("GPS is unavailable in this browser. Please choose locality manually.");
      return;
    }
    setGpsMessage("Checking GPS only for locality match...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        let closest = localities[0];
        let minDist = Infinity;
        for (const loc of localities) {
          const d = Math.hypot(
            loc.centerLat - latitude,
            loc.centerLng - longitude
          );
          if (d < minDist) {
            minDist = d;
            closest = loc;
          }
        }
        if (closest) {
          setLocalityId(closest.id);
          setGpsMessage(
            `Detected near ${closest.name}. Exact coordinates remain private unless you toggle consent below.`
          );
        }
      },
      () => {
        setGpsMessage("GPS permission declined — select your locality manually.");
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: currentUser.id,
          authorName: currentUser.fullName,
          authorUsername: currentUser.username,
          localityId,
          category,
          headline: headline.trim(),
          body: body.trim(),
          isMoment,
          sharePreciseLocation,
          preciseLat: sharePreciseLocation ? gpsCoords?.lat ?? null : null,
          preciseLng: sharePreciseLocation ? gpsCoords?.lng ?? null : null,
          approxLandmark: approxLandmark.trim(),
          media: mediaItems,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmittedPost(data.post);
        showToast("Submitted to Pethri Editorial Review Queue!");
      } else {
        showToast("Failed to submit report", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedPost) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-[#0A2E6E]">
            Submission Sent for Editorial Review
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Thank you, <span className="font-bold">{currentUser.fullName}</span>!
            To protect community trust, citizen reports always enter as{" "}
            <span className="font-semibold text-amber-700">
              Community Submission (Pending Review)
            </span>{" "}
            and are never auto-verified.
          </p>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
            <p className="text-xs font-bold text-[#D91E2A]">
              {submittedPost.localityName} •{" "}
              {CATEGORY_META[submittedPost.category].label}
            </p>
            <p className="mt-1 font-editorial text-xl text-[#0B1426]">
              {submittedPost.headline}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Location privacy:{" "}
              {submittedPost.sharePreciseLocation
                ? "Approximate coordinate shared with consent"
                : "Locality-only (exact GPS hidden)"}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/profile"
              className="rounded-full bg-[#0A2E6E] px-5 py-2.5 text-xs font-bold text-white"
            >
              View in My Profile
            </Link>
            <Link
              href="/editorial"
              className="rounded-full border border-[#D91E2A] px-5 py-2.5 text-xs font-bold text-[#D91E2A] hover:bg-red-50"
            >
              Review in Editorial Desk →
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmittedPost(null);
                setHeadline("");
                setBody("");
              }}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#D91E2A]">
            Citizen Reporter Desk
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0A2E6E]">
            Capture &amp; Submit Local News
          </h1>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          <Clock className="h-3.5 w-3.5" />
          Reviewed by editors before verification
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-12 items-start"
      >
        {/* STEP 1: Media Capture / Upload */}
        <div className="lg:col-span-5 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#0A2E6E]">
              1. Photo or Short Video
            </h2>
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D91E2A] cursor-pointer">
              <input
                type="checkbox"
                checked={isMoment}
                onChange={(e) => setIsMoment(e.target.checked)}
                className="accent-[#D91E2A]"
              />
              <Sparkles className="h-3.5 w-3.5" />
              Share as Moment
            </label>
          </div>

          {/* On-Demand Camera Controls */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openCamera(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[#0A2E6E]/20 bg-[#0A2E6E]/5 px-3 py-2.5 text-xs font-bold text-[#0A2E6E] hover:bg-[#0A2E6E] hover:text-white transition-colors"
            >
              <Camera className="h-4 w-4" />
              Open Camera
            </button>
            <button
              type="button"
              onClick={() => openCamera(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[#D91E2A]/20 bg-[#D91E2A]/5 px-3 py-2.5 text-xs font-bold text-[#D91E2A] hover:bg-[#D91E2A] hover:text-white transition-colors"
            >
              <Video className="h-4 w-4" />
              Record Clip
            </button>
          </div>

          {cameraError && (
            <p className="rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-800 border border-amber-200">
              {cameraError}
            </p>
          )}

          {cameraOpen && (
            <div className="space-y-2 rounded-2xl bg-black p-2">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-52 w-full rounded-xl object-cover"
              />
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={snapPhoto}
                  className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#0A2E6E]"
                >
                  Snap Photo
                </button>
                <button
                  type="button"
                  onClick={toggleVideoRecord}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-bold text-white",
                    recording ? "bg-red-600 animate-pulse" : "bg-[#D91E2A]"
                  )}
                >
                  {recording ? "Stop Recording" : "Start Video"}
                </button>
                <button
                  type="button"
                  onClick={stopCameraStream}
                  className="rounded-full bg-white/15 px-3 py-1.5 text-xs text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* File Picker */}
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center hover:border-[#0A2E6E]">
            <ImagePlus className="h-6 w-6 text-[#0A2E6E]" />
            <span className="mt-1.5 text-xs font-bold text-slate-800">
              Upload Photos or Video
            </span>
            <span className="text-[11px] text-slate-500">
              Supports multiple images for carousels
            </span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Attached Media Preview */}
          {mediaItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Attached ({mediaItems.length})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {mediaItems.map((m, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    {m.mediaType === "video" ? (
                      <video
                        src={m.url}
                        className="h-24 w-full object-cover"
                      />
                    ) : (
                      <img
                        src={m.url}
                        alt={m.caption ?? "Upload"}
                        className="h-24 w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      aria-label="Remove media"
                      onClick={() =>
                        setMediaItems((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="absolute right-1.5 top-1.5 rounded-full bg-black/65 p-1 text-white hover:bg-[#D91E2A]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Scene Picker for Demo */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Or pick sample local scene
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SAMPLE_PRESET_MEDIA.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() =>
                    setMediaItems([
                      {
                        mediaType: "image",
                        url: preset.url,
                        aspectRatio: "16:9",
                        caption: preset.label,
                      },
                    ])
                  }
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-[#0A2E6E] hover:text-white"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 2: Story Details & Privacy-First Location */}
        <div className="lg:col-span-7 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-extrabold text-[#0A2E6E]">
            2. Headline, Locality &amp; Privacy
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Headline *
              </label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Clear, factual headline (e.g., Water pipe maintenance near Pethri Cross)..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#0A2E6E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                What happened? *
              </label>
              <textarea
                rows={4}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share what you witnessed, timings, who is affected, or helpful details for neighbours..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#0A2E6E]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PostCategory)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#0A2E6E]"
                >
                  {(Object.keys(CATEGORY_META) as PostCategory[]).map((key) => (
                    <option key={key} value={key}>
                      {CATEGORY_META[key].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Locality *
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={localityId}
                    onChange={(e) => setLocalityId(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#0A2E6E]"
                  >
                    {localities.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.pincode})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleRequestGps}
                    title="Auto-detect locality via GPS"
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-[#0A2E6E] hover:bg-[#0A2E6E] hover:text-white"
                  >
                    <LocateFixed className="h-3.5 w-3.5" />
                    GPS
                  </button>
                </div>
              </div>
            </div>

            {gpsMessage && (
              <p className="rounded-xl bg-[#0A2E6E]/5 px-3 py-2 text-[11px] font-medium text-[#0A2E6E]">
                {gpsMessage}
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nearest Public Landmark (Optional)
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                <MapPin className="h-4 w-4 text-[#D91E2A]" />
                <input
                  type="text"
                  value={approxLandmark}
                  onChange={(e) => setApproxLandmark(e.target.value)}
                  placeholder="e.g., Church Junction, Dairy Booth, School Turn"
                  className="flex-1 bg-transparent text-xs outline-none"
                />
              </div>
            </div>

            {/* Explicit Location Privacy Consent */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sharePreciseLocation}
                  onChange={(e) => setSharePreciseLocation(e.target.checked)}
                  className="mt-0.5 accent-[#0A2E6E]"
                />
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#0A2E6E]">
                    <Lock className="h-3.5 w-3.5" />
                    Explicitly consent to attach GPS pin on public map
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    Unchecked by default to protect your privacy. Only your
                    selected locality name is published unless you check this
                    box.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>Posting as {currentUser.fullName}</span>
            </div>
            <button
              type="submit"
              disabled={submitting || !headline.trim() || !body.trim()}
              className="rounded-full bg-[#D91E2A] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-[#D91E2A]/25 hover:bg-[#B81621] disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit for Editorial Review"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-slate-500">
          Opening Citizen Reporter Desk...
        </div>
      }
    >
      <ReporterContent />
    </Suspense>
  );
}
