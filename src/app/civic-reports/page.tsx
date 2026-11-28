"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, FileText, MapPin } from "lucide-react";
import { usePethri } from "@/components/PethriProvider";

interface CivicReportRecord {
  id: string;
  localityName: string;
  title: string;
  description: string;
  status: string;
  isPublicVerified: boolean;
  verifiedAt: string | null;
  officialAcknowledgedAt: string | null;
  authorityName: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  history: Array<{
    id: string;
    previous_status: string | null;
    new_status: string;
    resolution_notes: string | null;
    created_at: string;
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    url: string;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  verified: "Pethri Verified",
  forwarded: "Forwarded for Follow-up",
  in_progress: "In Progress",
  resolved: "Resolved",
  open: "Submitted",
  triaged: "Under Review",
};

export default function CivicReportsPage() {
  const router = useRouter();
  const { authLoading, isAuthenticated } = usePethri();
  const [reports, setReports] = useState<CivicReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth?next=/civic-reports");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    fetch("/api/civic-reports")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load reports.");
        if (active) setReports(data.reports ?? []);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Unable to load reports.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-[#5B6472]">
        Checking your secure session…
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-3 border-b border-[#E2E7F0] pb-5">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#173FBE]">
            PRIVATE CIVIC REPORTS
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-[#111318]">
            Your report history
          </h1>
          <p className="mt-1 text-sm text-[#5B6472]">
            Visible only to you and authorised Pethri staff.
          </p>
        </div>
        <Link
          href="/report"
          className="rounded-full bg-[#173FBE] px-4 py-2 text-xs font-bold text-white hover:bg-[#315CFF]"
        >
          New report
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-[#D94E34]/30 bg-white p-4 text-sm text-[#D94E34]">
          {error}
        </p>
      )}
      {loading ? (
        <div className="h-48 animate-pulse rounded-3xl border border-[#E2E7F0] bg-white" />
      ) : !error && reports.length === 0 ? (
        <div className="rounded-3xl border border-[#E2E7F0] bg-white p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-[#173FBE]" />
          <p className="mt-3 font-bold text-[#111318]">No civic reports yet</p>
          <p className="mt-1 text-sm text-[#5B6472]">
            Reports you submit privately will appear here with status updates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <article
              key={report.id}
              className="rounded-3xl border border-[#E2E7F0] bg-white p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-1 text-xs font-bold text-[#173FBE]">
                    <MapPin className="h-3.5 w-3.5" />
                    {report.localityName}
                  </p>
                  <h2 className="mt-1 font-editorial text-xl text-[#111318]">
                    {report.title}
                  </h2>
                </div>
                <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-extrabold text-[#173FBE]">
                  {STATUS_LABELS[report.status] ?? report.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#5B6472]">
                {report.description}
              </p>
              <p className="mt-2 text-[11px] text-[#5B6472]">
                Submitted {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(report.createdAt))}
              </p>

              {report.isPublicVerified && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#EEF2FF] px-3 py-2 text-xs font-bold text-[#173FBE]">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified by Pethri editorial staff
                </p>
              )}
              {report.officialAcknowledgedAt && (
                <p className="mt-2 text-xs font-bold text-[#173FBE]">
                  Official acknowledgement confirmed by {report.authorityName}.
                </p>
              )}
              {report.resolutionNotes && (
                <p className="mt-3 rounded-xl bg-[#FFFFFF] p-3 text-xs text-[#5B6472]">
                  Editorial update: {report.resolutionNotes}
                </p>
              )}

              {report.attachments.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {report.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[#E2E7F0] px-3 py-1.5 text-xs font-bold text-[#173FBE] hover:border-[#315CFF]"
                    >
                      {attachment.fileName}
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-5 border-t border-[#E2E7F0] pt-4">
                <h3 className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#111318]">
                  <Clock3 className="h-3.5 w-3.5 text-[#173FBE]" />
                  Status history
                </h3>
                <ol className="mt-3 space-y-2">
                  {report.history.map((item) => (
                    <li key={item.id} className="flex flex-wrap justify-between gap-2 text-xs">
                      <span className="font-bold text-[#173FBE]">
                        {STATUS_LABELS[item.new_status] ?? item.new_status.replaceAll("_", " ")}
                      </span>
                      <time className="text-[#5B6472]">
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(item.created_at))}
                      </time>
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          ))}
        </div>
      )}

      <Link href="/profile" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#315CFF] hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to profile
      </Link>
    </main>
  );
}
