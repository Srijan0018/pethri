import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import {
  hasActorPermission,
  resolveRequestActor,
} from "@/lib/server-auth";
import {
  submitCivicReportRepository,
  submitNewsTipRepository,
} from "@/lib/repositories/reports";
import { isValidCategory, sanitizeText } from "@/lib/repositories/validation";
import {
  createSupabaseServerClient,
  isServerSupabaseConfigured,
} from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_BASE64_CHARS = 4 * Math.ceil(MAX_FILE_BYTES / 3);
const MAX_ATTACHMENTS = 4;
const MAX_REQUEST_BYTES =
  MAX_ATTACHMENTS * MAX_FILE_BASE64_CHARS + 128 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
]);
const CIVIC_STATUSES = new Set([
  "submitted",
  "under_review",
  "verified",
  "forwarded",
  "in_progress",
  "resolved",
]);

interface EvidenceInput {
  fileName: string;
  dataUrl: string;
}

function parseEvidence(value: unknown): EvidenceInput[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ATTACHMENTS) return null;
  const parsed: EvidenceInput[] = [];
  for (const item of value) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.fileName !== "string" ||
      typeof item.dataUrl !== "string"
    ) {
      return null;
    }
    const dataMatch =
      /^data:([a-z0-9/+.-]+);base64,([a-z0-9+/=]+)$/i.exec(item.dataUrl);
    if (
      !dataMatch ||
      !ALLOWED_MIME_TYPES.has(dataMatch[1].toLowerCase()) ||
      dataMatch[2].length > MAX_FILE_BASE64_CHARS
    ) {
      return null;
    }
    parsed.push({
      fileName: sanitizeText(item.fileName, 200),
      dataUrl: item.dataUrl,
    });
  }
  return parsed;
}

async function savePrivateEvidence(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  actorId: string,
  recordId: string,
  recordType: "tip" | "civic",
  evidence: EvidenceInput[]
) {
  const storedPaths: string[] = [];
  const rows: Array<Record<string, string | number>> = [];
  try {
    for (const file of evidence) {
      const match = /^data:([a-z0-9/+.-]+);base64,([a-z0-9+/=]+)$/i.exec(
        file.dataUrl
      );
      if (!match) throw new Error("Evidence must be a valid encoded image or video.");
      const mimeType = match[1].toLowerCase();
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        throw new Error("Unsupported evidence type. Upload an image or MP4/WebM video.");
      }
      const content = Buffer.from(match[2], "base64");
      if (
        content.byteLength === 0 ||
        content.byteLength > MAX_FILE_BYTES ||
        content.toString("base64") !== match[2]
      ) {
        throw new Error("Evidence must be valid and no larger than 5 MB.");
      }
      const extension = mimeType.split("/")[1].replace("jpeg", "jpg");
      const storagePath = `${actorId}/${recordType}/${recordId}/${randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("private-tip-evidence")
        .upload(storagePath, content, { contentType: mimeType, upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      storedPaths.push(storagePath);
      rows.push({
        uploaded_by: actorId,
        storage_path: storagePath,
        file_name: file.fileName || `evidence.${extension}`,
        mime_type: mimeType,
        file_size_bytes: content.byteLength,
        ...(recordType === "tip" ? { tip_id: recordId } : { report_id: recordId }),
      });
    }

    if (rows.length === 0) return;
    const table =
      recordType === "tip" ? "news_tip_attachments" : "civic_report_attachments";
    const { error } = await supabase.from(table).insert(rows);
    if (error) throw new Error(error.message);
  } catch (error) {
    if (storedPaths.length > 0) {
      const { error: cleanupError } = await supabase.storage
        .from("private-tip-evidence")
        .remove(storedPaths);
      if (cleanupError) {
        const cause = error instanceof Error ? error.message : "Evidence upload failed.";
        throw new Error(`${cause}; evidence cleanup failed: ${cleanupError.message}`);
      }
    }
    throw error;
  }
}

async function readBoundedJson(
  request: NextRequest
): Promise<{ body?: Record<string, unknown>; error?: string }> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { error: "Request is too large. Evidence uploads are limited to 5 MB per file." };
  }

  const reader = request.body?.getReader();
  if (!reader) return { error: "Invalid JSON body." };
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BYTES) {
        void reader.cancel();
        return { error: "Request is too large. Evidence uploads are limited to 5 MB per file." };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: "Invalid JSON body." };
    }
    return { body: parsed as Record<string, unknown> };
  } catch {
    return { error: "Invalid JSON body." };
  } finally {
    reader.releaseLock();
  }
}

export async function GET(req: NextRequest) {
  const actor = await resolveRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ reports: [] });
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Civic report service unavailable." }, { status: 503 });
  }
  let query = supabase
    .from("civic_reports")
    .select(
      "id, locality_id, assigned_to, title, description, severity, status, is_public_verified, verified_at, official_acknowledged_at, authority_name, resolution_notes, created_at, updated_at, history:civic_report_history(id, previous_status, new_status, resolution_notes, created_at), attachments:civic_report_attachments(id, file_name, mime_type, file_size_bytes, storage_path)"
    )
    .order("created_at", { ascending: false });
  if (!hasActorPermission(actor, "tip_review")) {
    query = query.eq("reporter_id", actor.profile.id);
  }
  const { data, error } = await query.limit(100);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const localityIds = [...new Set((data ?? []).map((report) => report.locality_id))];
  const { data: localities, error: localityError } = localityIds.length
    ? await supabase.from("localities").select("id, name").in("id", localityIds)
    : { data: [], error: null };
  if (localityError) {
    return NextResponse.json({ error: localityError.message }, { status: 503 });
  }
  const localityNames = new Map((localities ?? []).map((locality) => [locality.id, locality.name]));

  const reports = await Promise.all(
    (data ?? []).map(async (report) => {
      const attachments = await Promise.all(
        (report.attachments ?? []).map(async (attachment) => {
          const { data: signed, error: signedError } = await supabase.storage
            .from("private-tip-evidence")
            .createSignedUrl(attachment.storage_path, 60);
          if (signedError) throw new Error(signedError.message);
          return {
            id: attachment.id,
            fileName: attachment.file_name,
            mimeType: attachment.mime_type,
            fileSizeBytes: attachment.file_size_bytes,
            url: signed.signedUrl,
          };
        })
      );
      return {
        id: report.id,
        localityId: report.locality_id,
        assignedTo: report.assigned_to,
        localityName: localityNames.get(report.locality_id) ?? "",
        title: report.title,
        description: report.description,
        severity: report.severity,
        status: report.status,
        isPublicVerified: report.is_public_verified,
        verifiedAt: report.verified_at,
        officialAcknowledgedAt: report.official_acknowledged_at,
        authorityName: report.authority_name,
        resolutionNotes: report.resolution_notes,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
        history: report.history ?? [],
        attachments,
      };
    })
  );
  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`civic-submit:${ip}`, 8, 60).success) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  const actor = await resolveRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (actor.profile.isSuspended) {
    return NextResponse.json({ error: "Suspended accounts cannot submit reports." }, { status: 403 });
  }
  const parsedBody = await readBoundedJson(req);
  if (!parsedBody.body) {
    return NextResponse.json(
      { error: parsedBody.error },
      { status: parsedBody.error?.startsWith("Request is too large") ? 413 : 400 }
    );
  }
  const body = parsedBody.body;
  const submissionType = body.submissionType;
  const localityId = sanitizeText(body.localityId, 80);
  const title = sanitizeText(body.title, 300);
  const details = sanitizeText(body.details, 10000);
  const category = sanitizeText(body.category, 40);
  const landmark = sanitizeText(body.approxLandmark, 200);
  const evidence = parseEvidence(body.attachments);
  const sharePreciseLocation = body.sharePreciseLocation === true;
  const lat = typeof body.preciseLat === "number" ? body.preciseLat : undefined;
  const lng = typeof body.preciseLng === "number" ? body.preciseLng : undefined;
  if (
    (submissionType !== "news_tip" && submissionType !== "civic_issue") ||
    !localityId ||
    !title ||
    !details ||
    !category ||
    !isValidCategory(category) ||
    !evidence
  ) {
    return NextResponse.json({ error: "Complete the required fields with valid values." }, { status: 400 });
  }
  if (
    sharePreciseLocation &&
    (lat === undefined ||
      lng === undefined ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180)
  ) {
    return NextResponse.json({ error: "Precise location values are invalid." }, { status: 400 });
  }
  if (evidence.length > 0 && !isServerSupabaseConfigured()) {
    return NextResponse.json({ error: "Private evidence upload is unavailable." }, { status: 503 });
  }

  try {
    const submission =
      submissionType === "news_tip"
        ? await submitNewsTipRepository({
            submitterId: actor.profile.id,
            localityId,
            category,
            headline: title,
            details,
            approxLandmark: landmark,
            sharePreciseLocation,
            preciseLat: lat,
            preciseLng: lng,
          })
        : await submitCivicReportRepository({
            reporterId: actor.profile.id,
            localityId,
            title,
            description: details,
            severity:
              body.severity === "low" ||
              body.severity === "high" ||
              body.severity === "critical"
                ? body.severity
                : "medium",
            approxLandmark: landmark,
            sharePreciseLocation,
            preciseLat: lat,
            preciseLng: lng,
          });
    const record = "tip" in submission ? submission.tip : submission.report;
    if (evidence.length > 0) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) throw new Error("Private evidence upload is unavailable.");
      await savePrivateEvidence(
        supabase,
        actor.profile.id,
        record.id,
        submissionType === "news_tip" ? "tip" : "civic",
        evidence
      );
    }
    return NextResponse.json(
      {
        submission: {
          id: record.id,
          title: record.title ?? record.headline,
          status: record.status ?? "submitted",
          localityId,
          category,
          submissionType,
        },
        isDatabaseConnected: submission.isDatabaseConnected,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit privately." },
      { status: 503 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`civic-review:${ip}`, 30, 60).success) {
    return NextResponse.json(
      { error: "Too many report updates. Please try again shortly." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  const actor = await resolveRequestActor(req);
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasActorPermission(actor, "tip_review")) {
    return NextResponse.json({ error: "Civic report review permission required." }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const reportId = sanitizeText(body.reportId, 80);
  const status = sanitizeText(body.status, 40);
  if (!reportId || !CIVIC_STATUSES.has(status)) {
    return NextResponse.json({ error: "Valid report ID and status are required." }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Civic report service unavailable." }, { status: 503 });
  }
  const { data: current, error: currentError } = await supabase
    .from("civic_reports")
    .select("status")
    .eq("id", reportId)
    .maybeSingle();
  if (currentError) {
    return NextResponse.json({ error: currentError.message }, { status: 503 });
  }
  if (!current) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  const nextStatus: Record<string, string> = {
    submitted: "under_review",
    open: "under_review",
    under_review: "verified",
    triaged: "verified",
    verified: "forwarded",
    forwarded: "in_progress",
    in_progress: "resolved",
  };
  if (status !== current.status && nextStatus[current.status] !== status) {
    return NextResponse.json(
      {
        error: `Invalid status transition from ${current.status.replaceAll("_", " ")} to ${status.replaceAll("_", " ")}.`,
      },
      { status: 409 }
    );
  }
  const update: Record<string, string | boolean | null> = {
    status,
    updated_at: new Date().toISOString(),
    resolution_notes: sanitizeText(body.resolutionNotes, 2000) || null,
  };
  if (status === "verified") {
    update.is_public_verified = true;
    update.verified_by = actor.profile.id;
    update.verified_at = new Date().toISOString();
  }
  if (body.assignedTo === null) {
    update.assigned_to = null;
  } else if (typeof body.assignedTo === "string") {
    const assignedTo = sanitizeText(body.assignedTo, 80);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(assignedTo)) {
      return NextResponse.json({ error: "Assigned staff member ID is invalid." }, { status: 400 });
    }
    const { data: assignee, error: assigneeError } = await supabase
      .from("profiles")
      .select("id, role, is_suspended")
      .eq("id", assignedTo)
      .maybeSingle();
    if (assigneeError) {
      return NextResponse.json({ error: assigneeError.message }, { status: 503 });
    }
    if (
      !assignee ||
      assignee.is_suspended ||
      !["correspondent", "journalist", "editor", "admin"].includes(assignee.role)
    ) {
      return NextResponse.json({ error: "Reports can only be assigned to active editorial staff." }, { status: 400 });
    }
    update.assigned_to = assignedTo;
  }
  if (body.officialAcknowledged === true) {
    const authorityName = sanitizeText(body.authorityName, 200);
    const reference = sanitizeText(body.officialReference, 200);
    if (!authorityName || !reference) {
      return NextResponse.json(
        { error: "Authority name and a confirmation reference are required." },
        { status: 400 }
      );
    }
    update.official_acknowledged_at = new Date().toISOString();
    update.authority_name = authorityName;
    update.official_reference = reference;
  }
  const { data, error } = await supabase
    .from("civic_reports")
    .update(update)
    .eq("id", reportId)
    .select("id, status, is_public_verified, verified_at, official_acknowledged_at, authority_name, assigned_to")
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (!data) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  return NextResponse.json({ report: data });
}
