import { NextRequest, NextResponse } from "next/server";
import { resolveRequestActor, hasActorPermission } from "@/lib/server-auth";
import {
  cancelEventRepository,
  createEventRepository,
  getEventsRepository,
  updateEventRepository,
  type EventWriteInput,
} from "@/lib/repositories/events";
import { isValidCategory, parsePagination, sanitizeText } from "@/lib/repositories/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function canManageEvents(actor: Awaited<ReturnType<typeof resolveRequestActor>>) {
  return Boolean(actor && hasActorPermission(actor, "events"));
}

function validateEventInput(body: Record<string, unknown>, partial = false) {
  const localityId = sanitizeText(body.localityId, 80);
  const title = sanitizeText(body.title, 200);
  const description = sanitizeText(body.description, 5000);
  const category = sanitizeText(body.category, 40);
  const startsAt = sanitizeText(body.startsAt, 64);
  const endsAt = body.endsAt === null ? null : sanitizeText(body.endsAt, 64);
  const venue = sanitizeText(body.venue, 300);
  const organizer = sanitizeText(body.organizer, 200);
  const imageUrl = body.imageUrl === null ? null : sanitizeText(body.imageUrl, 2048);
  const status = body.status === "draft" ? "draft" : body.status === "published" ? "published" : null;

  if (!partial && (!localityId || !title || !category || !startsAt || !venue || !organizer)) {
    return { error: "Locality, title, category, start date, venue, and organiser are required." };
  }
  if (category && !isValidCategory(category)) {
    return { error: "Invalid event category." };
  }
  if (startsAt && !Number.isFinite(Date.parse(startsAt))) {
    return { error: "Invalid event start date." };
  }
  if (endsAt && !Number.isFinite(Date.parse(endsAt))) {
    return { error: "Invalid event end date." };
  }
  if (
    startsAt &&
    endsAt &&
    Date.parse(endsAt) < Date.parse(startsAt)
  ) {
    return { error: "Event end date must be after its start date." };
  }
  if (
    imageUrl &&
    !imageUrl.startsWith("/") &&
    !/^https:\/\//i.test(imageUrl)
  ) {
    return { error: "Event image must use a local path or HTTPS URL." };
  }
  if (body.status !== undefined && !status) {
    return { error: "Event status must be draft or published." };
  }

  const input: Partial<EventWriteInput> = {};
  if (body.localityId !== undefined) input.localityId = localityId;
  if (body.title !== undefined) input.title = title;
  if (body.description !== undefined) input.description = description;
  if (body.category !== undefined) input.category = category as EventWriteInput["category"];
  if (body.startsAt !== undefined) input.startsAt = startsAt;
  if (body.endsAt !== undefined) input.endsAt = endsAt;
  if (body.venue !== undefined) input.venue = venue;
  if (body.organizer !== undefined) input.organizer = organizer;
  if (body.imageUrl !== undefined) input.imageUrl = imageUrl;
  if (status) input.status = status;
  return { input };
}

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveRequestActor(req);
    const includeDrafts = req.nextUrl.searchParams.get("includeDrafts") === "true";
    if (includeDrafts && !canManageEvents(actor)) {
      return NextResponse.json({ error: "Authorised staff access required." }, { status: actor ? 403 : 401 });
    }

    const timeValue = req.nextUrl.searchParams.get("time");
    const time =
      timeValue === "upcoming" || timeValue === "past" || timeValue === "all"
        ? timeValue
        : "upcoming";
    const category = req.nextUrl.searchParams.get("category") ?? undefined;
    if (category && !isValidCategory(category)) {
      return NextResponse.json({ error: "Invalid event category." }, { status: 400 });
    }
    const { limit, offset } = parsePagination(req.nextUrl.searchParams);
    const result = await getEventsRepository({
      locality: req.nextUrl.searchParams.get("locality") ?? undefined,
      category,
      time,
      includeDrafts,
      limit,
      offset,
      userId: actor?.profile.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load events." },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`events-write:${ip}`, 20, 60).success) {
    return NextResponse.json({ error: "Too many event updates. Try again shortly." }, { status: 429 });
  }
  const actor = await resolveRequestActor(req);
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canManageEvents(actor)) {
    return NextResponse.json({ error: "Event management permission required." }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const validated = validateEventInput(body);
  if (validated.error || !validated.input) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  try {
    const event = await createEventRepository(
      validated.input as EventWriteInput,
      actor.profile.id
    );
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create event." },
      { status: 503 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const actor = await resolveRequestActor(req);
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canManageEvents(actor)) {
    return NextResponse.json({ error: "Event management permission required." }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const eventId = sanitizeText(body.eventId, 80);
  if (!eventId) return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
  const validated = validateEventInput(body, true);
  if (validated.error || !validated.input || Object.keys(validated.input).length === 0) {
    return NextResponse.json({ error: validated.error ?? "No event changes provided." }, { status: 400 });
  }
  try {
    const event = await updateEventRepository(eventId, validated.input);
    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update event." },
      { status: 503 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const actor = await resolveRequestActor(req);
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!canManageEvents(actor)) {
    return NextResponse.json({ error: "Event management permission required." }, { status: 403 });
  }
  const eventId = sanitizeText(req.nextUrl.searchParams.get("id"), 80);
  if (!eventId) return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
  try {
    return NextResponse.json(await cancelEventRepository(eventId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to cancel event." },
      { status: 503 }
    );
  }
}
