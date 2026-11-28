"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  LocateFixed,
  Lock,
  MapPin,
  ShieldCheck,
  Trash2,
  Video,
} from "lucide-react";
import { usePethri } from "@/components/PethriProvider";
import { CATEGORY_META, cn } from "@/lib/utils";
import { useHydrated } from "@/lib/use-hydrated";
import type { PostCategory, PostMediaItem } from "@/types/pethri";

function PrivateTipContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialLocality = searchParams.get("locality");
  const pageHydrated = useHydrated();

  const {
    localities,
    currentUser,
    isAuthenticated,
    authLoading,
    requireAuth,
    showToast,
    privacyLocalityOnlyDefault,
  } = usePethri();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth?next=/report");
    }
  }, [authLoading, isAuthenticated, router]);
  const [tipType, setTipType] = useState<"news_tip" | "civic_issue">("news_tip");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<PostCategory>("news");
  const [localityId, setLocalityId] = useState(
    initialLocality ?? localities[0]?.id ?? "loc-pethri"
  );
  const [approxLandmark, setApproxLandmark] = useState("");
  const [mediaItems, setMediaItems] = useState<Omit<PostMediaItem, "id">[]>([]);

  const [gpsCoords, setGpsCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [sharePreciseLocation, setSharePreciseLocation] = useState(false);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submittedPost, setSubmittedPost] = useState<{
    id: string;
    title: string;
    localityId: string;
    category: PostCategory;
    status: string;
    submissionType: "news_tip" | "civic_issue";
  } | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

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
        "Live camera API is unavailable here. Use optional evidence upload below."
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
        "Camera permission declined or no camera found. You can still attach photo/video evidence below."
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
        caption: "Private evidence photo",
      },
    ]);
    stopCameraStream();
    showToast("Evidence photo attached privately");
  };

  const toggleVideoRecord = () => {
    if (!streamRef.current) return;
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(streamRef.current, {
      videoBitsPerSecond: 512000,
    });
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setMediaItems((prev) => [
            ...prev,
            {
              mediaType: "video",
              url: reader.result as string,
              aspectRatio: "9:16",
              caption: "Private evidence clip.webm",
              durationSeconds: 10,
            },
          ]);
        }
      };
      reader.readAsDataURL(blob);
      stopCameraStream();
      showToast("Evidence video attached privately");
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, 10000);
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
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRequestGps = () => {
    if (!navigator.geolocation) {
      setGpsMessage("GPS is unavailable here. Please choose locality manually.");
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
    if (!requireAuth("submit a private news tip or civic report")) return;
    if (!headline.trim() || !body.trim()) return;
    setSubmissionError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/civic-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionType: tipType,
          localityId,
          category: tipType === "civic_issue" ? "civic" : category,
          title: headline.trim(),
          details: body.trim(),
          sharePreciseLocation,
          preciseLat: sharePreciseLocation ? gpsCoords?.lat ?? null : null,
          preciseLng: sharePreciseLocation ? gpsCoords?.lng ?? null : null,
          approxLandmark: approxLandmark.trim(),
          attachments: mediaItems.map((item) => ({
            fileName: item.caption ?? "evidence",
            dataUrl: item.url,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmittedPost(data.submission);
        showToast(
          tipType === "civic_issue"
            ? "Private civic report received"
            : "Private news tip received"
        );
      } else {
        const message = data.error ?? "Failed to submit private report.";
        setSubmissionError(message);
        showToast(message, "error");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit privately.";
      setSubmissionError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedPost) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl border border-[#E2E7F0] bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF2FF] text-[#173FBE]">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-[#111318]">
            Private Submission Received
          </h1>
          <p className="mt-2 text-sm text-[#5B6472]">
            Thank you, <span className="font-bold">{currentUser.fullName}</span>.
            Your {submittedPost.submissionType === "civic_issue" ? "civic report" : "news tip"} has been routed privately to the Pethri Editorial Desk. Public submissions never appear automatically on Pethri.com.
          </p>
          <div className="mt-5 rounded-2xl border border-[#E2E7F0] bg-[#FFFFFF] p-4 text-left">
            <p className="text-xs font-bold text-[#173FBE]">
              {localities.find((locality) => locality.id === submittedPost.localityId)?.name ?? "Karavali"} •{" "}
              {CATEGORY_META[submittedPost.category].label}
            </p>
            <p className="mt-1 font-editorial text-xl text-[#111318]">
              {submittedPost.title}
            </p>
            <p className="mt-1 text-xs text-[#5B6472]">
              Status: {submittedPost.status.replaceAll("_", " ")} (Not Publicly Visible)
            </p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={
                submittedPost.submissionType === "civic_issue"
                  ? "/civic-reports"
                  : "/profile"
              }
              className="rounded-full bg-[#173FBE] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#315CFF] transition-colors"
            >
              {submittedPost.submissionType === "civic_issue"
                ? "Track Civic Report"
                : "Track Tip in Profile"}
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmittedPost(null);
                setHeadline("");
                setBody("");
                setMediaItems([]);
              }}
              className="rounded-full border border-[#E2E7F0] px-5 py-2.5 text-xs font-bold text-[#111318] hover:border-[#315CFF] hover:text-[#315CFF] transition-colors"
            >
              Submit Another Tip
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!pageHydrated || authLoading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14">
        <div className="rounded-3xl border border-[#E2E7F0] bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#173FBE]">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-[#111318]">
            {!pageHydrated || authLoading
              ? "Checking your session..."
              : "Sign in to Submit Private News Tips"}
          </h1>
          <p className="mt-2 text-sm text-[#5B6472]">
            Private news tip intake is protected so Pethri editors can verify
            leads securely.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth?next=/report"
              className="rounded-full bg-[#173FBE] px-6 py-3 text-xs font-extrabold text-white hover:bg-[#315CFF] transition-colors"
            >
              Sign In with Pethri Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E7F0] pb-5">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#173FBE]">
            PRIVATE NEWSROOM INTAKE • KARAVALI
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#111318]">
            Submit Private News Tip or Civic Issue
          </h1>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] border border-[#E2E7F0] px-3.5 py-1 text-xs font-bold text-[#173FBE]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Private Review • Never Auto-Published
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-12 items-start"
      >
        {submissionError && (
          <div
            role="alert"
            className="lg:col-span-12 rounded-2xl border border-[#D94E34]/30 bg-[#D94E34]/10 p-3 text-sm text-[#D94E34]"
          >
            {submissionError}
          </div>
        )}
        {/* Optional Private Evidence */}
        <div className="lg:col-span-5 space-y-4 rounded-3xl border border-[#E2E7F0] bg-white p-5">
          <div>
            <h2 className="text-sm font-extrabold text-[#111318]">
              1. Optional Evidence (Private to Editors)
            </h2>
            <p className="mt-1 text-[11px] text-[#5B6472]">
              Uploaded media stays confidential inside the editorial inbox and
              is never published automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openCamera(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E2E7F0] bg-[#FFFFFF] px-3 py-2.5 text-xs font-bold text-[#111318] hover:border-[#315CFF] hover:text-[#315CFF] transition-colors"
            >
              <Camera className="h-4 w-4" />
              Take Photo
            </button>
            <button
              type="button"
              onClick={() => openCamera(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E2E7F0] bg-[#FFFFFF] px-3 py-2.5 text-xs font-bold text-[#111318] hover:border-[#315CFF] hover:text-[#315CFF] transition-colors"
            >
              <Video className="h-4 w-4" />
              Record Clip
            </button>
          </div>

          {cameraError && (
            <p className="rounded-xl border border-[#E2E7F0] bg-[#FFFFFF] p-2.5 text-[11px] text-[#111318]">
              {cameraError}
            </p>
          )}

          {cameraOpen && (
            <div className="space-y-2 rounded-2xl bg-[#111318] p-2">
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
                  className="rounded-full bg-[#315CFF] px-4 py-1.5 text-xs font-extrabold text-white"
                >
                  Snap Photo
                </button>
                <button
                  type="button"
                  onClick={toggleVideoRecord}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-bold text-white",
                    recording ? "bg-[#D94E34] animate-pulse" : "bg-white/20"
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

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E2E7F0] bg-[#FFFFFF] p-5 text-center hover:border-[#315CFF] transition-colors">
            <ImagePlus className="h-6 w-6 text-[#173FBE]" />
            <span className="mt-1.5 text-xs font-bold text-[#111318]">
              Attach Photo or Video Evidence
            </span>
            <span className="text-[11px] text-[#5B6472]">
              Optional • Reviewed privately by Pethri editors
            </span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {mediaItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B6472]">
                Attached Evidence ({mediaItems.length})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {mediaItems.map((m, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-xl border border-[#E2E7F0] bg-[#FFFFFF]"
                  >
                    {m.mediaType === "video" ? (
                      <video src={m.url} className="h-24 w-full object-cover" />
                    ) : (
                      <img
                        src={m.url}
                        alt={m.caption ?? "Evidence"}
                        className="h-24 w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      aria-label="Remove attachment"
                      onClick={() =>
                        setMediaItems((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="absolute right-1.5 top-1.5 rounded-full bg-[#111318]/80 p-1 text-white hover:bg-[#D94E34]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tip Details */}
        <div className="lg:col-span-7 space-y-4 rounded-3xl border border-[#E2E7F0] bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-[#111318]">
              2. Tip Summary, Locality &amp; Privacy
            </h2>
            <div className="flex rounded-full border border-[#E2E7F0] bg-[#FFFFFF] p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTipType("news_tip")}
                className={cn(
                  "rounded-full px-3 py-1 transition-colors",
                  tipType === "news_tip"
                    ? "bg-[#173FBE] text-white"
                    : "text-[#5B6472]"
                )}
              >
                News Tip
              </button>
              <button
                type="button"
                onClick={() => setTipType("civic_issue")}
                className={cn(
                  "rounded-full px-3 py-1 transition-colors",
                  tipType === "civic_issue"
                    ? "bg-[#173FBE] text-white"
                    : "text-[#5B6472]"
                )}
              >
                Civic Issue
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#111318] mb-1">
                Subject / Headline *
              </label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Brief factual summary for our editorial desk..."
                className="w-full rounded-xl border border-[#E2E7F0] px-3.5 py-2.5 text-sm outline-none focus:border-[#315CFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111318] mb-1">
                Details &amp; Context *
              </label>
              <textarea
                rows={4}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What happened, when, who is affected, and any source details for verification..."
                className="w-full rounded-xl border border-[#E2E7F0] px-3.5 py-2.5 text-sm outline-none focus:border-[#315CFF]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#111318] mb-1">
                  Topic *
                </label>
                <select
                  value={tipType === "civic_issue" ? "civic" : category}
                  onChange={(e) => setCategory(e.target.value as PostCategory)}
                  disabled={tipType === "civic_issue"}
                  className="w-full rounded-xl border border-[#E2E7F0] px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#315CFF] disabled:bg-[#FFFFFF]"
                >
                  {(Object.keys(CATEGORY_META) as PostCategory[]).map((key) => (
                    <option key={key} value={key}>
                      {CATEGORY_META[key].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111318] mb-1">
                  Karavali Locality *
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={localityId}
                    onChange={(e) => setLocalityId(e.target.value)}
                    className="flex-1 rounded-xl border border-[#E2E7F0] px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#315CFF]"
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
                    className="inline-flex items-center gap-1 rounded-xl border border-[#E2E7F0] bg-[#FFFFFF] px-3 text-xs font-bold text-[#173FBE] hover:border-[#315CFF] hover:text-[#315CFF] transition-colors"
                  >
                    <LocateFixed className="h-3.5 w-3.5" />
                    GPS
                  </button>
                </div>
              </div>
            </div>

            {gpsMessage && (
              <p className="rounded-xl border border-[#E2E7F0] bg-[#EEF2FF] px-3 py-2 text-[11px] font-medium text-[#173FBE]">
                {gpsMessage}
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-[#111318] mb-1">
                Nearest Landmark (Optional)
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[#E2E7F0] px-3 py-2 focus-within:border-[#315CFF]">
                <MapPin className="h-4 w-4 text-[#173FBE]" />
                <input
                  type="text"
                  value={approxLandmark}
                  onChange={(e) => setApproxLandmark(e.target.value)}
                  placeholder="e.g., Hampankatta Junction, Manipal End Point, Pethri Cross"
                  className="flex-1 bg-transparent text-xs outline-none"
                />
              </div>
            </div>

            {privacyLocalityOnlyDefault ? (
              <p className="rounded-2xl border border-[#E2E7F0] bg-[#FFFFFF] p-3.5 text-[11px] text-[#5B6472]">
                Precise GPS is disabled by your Locality-Only preference. You
                can enable per-tip GPS consent in{" "}
                <Link href="/settings" className="font-bold text-[#173FBE] underline">
                  Settings
                </Link>
                .
              </p>
            ) : (
              <div className="rounded-2xl border border-[#E2E7F0] bg-[#FFFFFF] p-3.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sharePreciseLocation}
                    onChange={(e) => setSharePreciseLocation(e.target.checked)}
                    className="mt-0.5 accent-[#173FBE]"
                  />
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#111318]">
                      <Lock className="h-3.5 w-3.5 text-[#173FBE]" />
                      Allow editors to see exact GPS coordinates (Optional)
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#5B6472]">
                      Off by default. Your exact street coordinates are never
                      exposed publicly without explicit consent.
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#E2E7F0] pt-4">
            <span className="text-[11px] text-[#5B6472]">
              {isAuthenticated
                ? `Submitting as ${currentUser.fullName}`
                : "Sign in required on submission"}
            </span>
            <button
              type="submit"
              disabled={submitting || !headline.trim() || !body.trim()}
              className="rounded-full bg-[#173FBE] px-6 py-3 text-xs font-extrabold text-white hover:bg-[#315CFF] disabled:opacity-50 transition-colors"
            >
              {submitting ? "Sending..." : "Send Confidentially to Newsroom"}
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
        <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-[#5B6472]">
          Loading Private Tip Intake...
        </div>
      }
    >
      <PrivateTipContent />
    </Suspense>
  );
}
