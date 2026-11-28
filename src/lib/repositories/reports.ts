import { createSupabaseServerClient, isServerSupabaseConfigured } from "@/lib/supabase/server";
import { isDemoModeEnabled } from "@/lib/server-config";
import { createContentReport as createStoreReport, listReports as listStoreReports } from "@/lib/store";
import { sanitizeText } from "@/lib/repositories/validation";

export async function submitNewsTipRepository(params: {
  submitterId: string;
  localityId: string;
  category: string;
  headline: string;
  details: string;
  approxLandmark?: string;
  sharePreciseLocation?: boolean;
  preciseLat?: number;
  preciseLng?: number;
  attachments?: Array<{
    fileName: string;
    fileSizeBytes?: number;
    mimeType?: string;
    storagePath: string;
  }>;
}) {
  let supabaseClient = null;
  if (isServerSupabaseConfigured()) {
    try {
      supabaseClient = await createSupabaseServerClient();
    } catch {
      supabaseClient = null;
    }
  }

  if (supabaseClient) {
    try {
      const { data: tip, error } = await supabaseClient
        .from("news_tips")
        .insert({
          submitter_id: params.submitterId,
          locality_id: params.localityId,
          category_slug: params.category,
          headline: sanitizeText(params.headline, 300),
          details: sanitizeText(params.details, 10000),
          approx_landmark: sanitizeText(params.approxLandmark, 200),
          share_precise_location: Boolean(params.sharePreciseLocation),
          precise_lat: params.sharePreciseLocation ? params.preciseLat : null,
          precise_lng: params.sharePreciseLocation ? params.preciseLng : null,
          status: "submitted",
        })
        .select()
        .single();

      if (!error && tip) {
        if (Array.isArray(params.attachments) && params.attachments.length > 0) {
          const attachmentRows = params.attachments.map((att) => ({
            tip_id: tip.id,
            uploaded_by: params.submitterId,
            file_name: att.fileName,
            file_size_bytes: att.fileSizeBytes ?? null,
            mime_type: att.mimeType ?? null,
            storage_path: att.storagePath,
            is_confidential: true,
          }));

          await supabaseClient.from("news_tip_attachments").insert(attachmentRows);
        }

        return { tip, isDatabaseConnected: true };
      }
    } catch {
      // Supabase insert failed
    }
  }

  if (!isDemoModeEnabled()) {
    throw new Error(
      "Service Unavailable: Database connection failed and DEMO_MODE is disabled in this environment."
    );
  }

  // Demo fallback
  return {
    tip: {
      id: `tip-${Date.now()}`,
      submitterId: params.submitterId,
      localityId: params.localityId,
      headline: params.headline,
      details: params.details,
      status: "submitted",
      createdAt: new Date().toISOString(),
    },
    isDatabaseConnected: false,
    isDemoFallback: true,
  };
}

export async function submitCivicReportRepository(params: {
  reporterId: string;
  localityId: string;
  title: string;
  description: string;
  severity?: "low" | "medium" | "high" | "critical";
  approxLandmark?: string;
  sharePreciseLocation?: boolean;
  preciseLat?: number;
  preciseLng?: number;
}) {
  let supabaseClient = null;
  if (isServerSupabaseConfigured()) {
    try {
      supabaseClient = await createSupabaseServerClient();
    } catch {
      supabaseClient = null;
    }
  }

  if (supabaseClient) {
    try {
      const { data: report, error } = await supabaseClient
        .from("civic_reports")
        .insert({
          reporter_id: params.reporterId,
          locality_id: params.localityId,
          category_slug: "civic",
          title: sanitizeText(params.title, 300),
          description: sanitizeText(params.description, 10000),
          severity: params.severity ?? "medium",
          approx_landmark: sanitizeText(params.approxLandmark, 200),
          share_precise_location: Boolean(params.sharePreciseLocation),
          precise_lat: params.sharePreciseLocation ? params.preciseLat : null,
          precise_lng: params.sharePreciseLocation ? params.preciseLng : null,
          status: "submitted",
        })
        .select()
        .single();

      if (!error && report) {
        // Record initial history
        await supabaseClient.from("civic_report_history").insert({
          report_id: report.id,
          changed_by: params.reporterId,
          previous_status: null,
          new_status: report.status ?? "submitted",
          resolution_notes: "Report submitted by citizen.",
        });

        return { report, isDatabaseConnected: true };
      }
    } catch {
      // Supabase insert failed
    }
  }

  if (!isDemoModeEnabled()) {
    throw new Error(
      "Service Unavailable: Database connection failed and DEMO_MODE is disabled in this environment."
    );
  }

  return {
    report: {
      id: `civic-${Date.now()}`,
      reporterId: params.reporterId,
      localityId: params.localityId,
      title: params.title,
      description: params.description,
      status: "open",
      createdAt: new Date().toISOString(),
    },
    isDatabaseConnected: false,
    isDemoFallback: true,
  };
}

export async function submitContentFlagRepository(params: {
  postId: string;
  reason: string;
  details?: string;
  reporterUsername: string;
}) {
  let supabaseClient = null;
  if (isServerSupabaseConfigured()) {
    try {
      supabaseClient = await createSupabaseServerClient();
    } catch {
      supabaseClient = null;
    }
  }

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("content_reports")
        .insert({
          post_id: params.postId,
          reason: sanitizeText(params.reason, 200),
          details: sanitizeText(params.details, 2000),
          status: "open",
        })
        .select()
        .single();

      if (!error && data) {
        return { report: data, isDatabaseConnected: true };
      }
    } catch {
      // Supabase insert failed
    }
  }

  if (!isDemoModeEnabled()) {
    throw new Error(
      "Service Unavailable: Database connection failed and DEMO_MODE is disabled in this environment."
    );
  }

  const report = createStoreReport({
    postId: params.postId,
    reason: params.reason,
    details: params.details ?? "",
    reporterUsername: params.reporterUsername,
  });

  return { report, isDatabaseConnected: false, isDemoFallback: true };
}

export async function listReportsRepository() {
  let supabaseClient = null;
  if (isServerSupabaseConfigured()) {
    try {
      supabaseClient = await createSupabaseServerClient();
    } catch {
      supabaseClient = null;
    }
  }

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("content_reports")
        .select("id, post_id, reason, details, status, created_at, post:posts(headline)")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const reports = data.map((r: any) => ({
          id: r.id,
          postId: r.post_id,
          postHeadline: r.post?.headline ?? "Unknown Article",
          reporterUsername: "Reporter",
          reason: r.reason,
          details: r.details,
          status: r.status,
          createdAt: r.created_at,
        }));
        return { reports, isDatabaseConnected: true };
      }
    } catch {
      // Supabase query failed
    }
  }

  if (!isDemoModeEnabled()) {
    throw new Error(
      "Service Unavailable: Database connection failed and DEMO_MODE is disabled in this environment."
    );
  }

  return { reports: listStoreReports(), isDatabaseConnected: false, isDemoFallback: true };
}
