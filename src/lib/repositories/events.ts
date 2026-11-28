import { createSupabaseServerClient, isServerSupabaseConfigured } from "@/lib/supabase/server";
import { isDemoModeEnabled } from "@/lib/server-config";
import { listEvents as listStoreEvents, toggleEventRsvp as toggleStoreEventRsvp } from "@/lib/store";
import type { LocalEvent, PostCategory } from "@/types/pethri";

export async function getEventsRepository(query: {
  eventId?: string;
  locality?: string;
  category?: string;
  time?: "upcoming" | "past" | "all";
  includeDrafts?: boolean;
  limit?: number;
  offset?: number;
  userId?: string;
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
      let req = supabaseClient
        .from("local_events")
        .select(
          `
          id,
          locality_id,
          title,
          description,
          category,
          starts_at,
          ends_at,
          venue,
          organizer,
          image_url,
          status,
          rsvp_count,
          created_at,
          locality:localities(name)
        `,
          { count: "exact" }
        )
        .order("starts_at", { ascending: true });

      if (query.locality && query.locality !== "all") {
        req = req.eq("locality_id", query.locality);
      }
      if (query.eventId) req = req.eq("id", query.eventId);
      if (query.category) req = req.eq("category", query.category);
      if (!query.includeDrafts) req = req.eq("status", "published");
      if (query.time === "upcoming") req = req.gte("starts_at", new Date().toISOString());
      if (query.time === "past") req = req.lt("starts_at", new Date().toISOString());
      if (query.time !== "all") req = req.neq("status", "cancelled");

      const limit = query.limit ?? 20;
      const offset = query.offset ?? 0;
      req = req.range(offset, offset + limit - 1);

      const { data, error, count } = await req;
      if (error) throw new Error(error.message);

      if (Array.isArray(data)) {
        const rsvpIds = new Set<string>();
        if (query.userId && data.length > 0) {
          const { data: rsvps, error: rsvpError } = await supabaseClient
            .from("event_rsvps")
            .select("event_id")
            .eq("user_id", query.userId)
            .in("event_id", data.map((row: any) => row.id))
            .neq("status", "cancelled");
          if (rsvpError) throw new Error(rsvpError.message);
          rsvps?.forEach((row) => rsvpIds.add(row.event_id));
        }
        const events: LocalEvent[] = data.map((row: any) => ({
          id: row.id,
          localityId: row.locality_id,
          localityName: row.locality?.name ?? "Karavali",
          title: row.title,
          description: row.description ?? "",
          category: row.category as PostCategory,
          startsAt: row.starts_at,
          endsAt: row.ends_at,
          venue: row.venue,
          organizer: row.organizer,
          imageUrl: row.image_url,
          status: row.status,
          rsvpCount: row.rsvp_count ?? 0,
          rsvpedByMe: rsvpIds.has(row.id),
          isDemoData: false,
        }));

        return { events, total: count ?? events.length, isDatabaseConnected: true };
      }
    } catch (error) {
      if (!isDemoModeEnabled()) throw error;
    }
  }

  if (!isDemoModeEnabled()) {
    throw new Error(
      "Service Unavailable: Database connection failed and DEMO_MODE is disabled in this environment."
    );
  }

  let all = listStoreEvents(query.locality);
  if (query.category) all = all.filter((event) => event.category === query.category);
  if (query.time === "upcoming") {
    all = all.filter((event) => new Date(event.startsAt).getTime() >= Date.now());
  } else if (query.time === "past") {
    all = all.filter((event) => new Date(event.startsAt).getTime() < Date.now());
  }
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 20;
  const paged = all.slice(offset, offset + limit);

  return { events: paged, total: all.length, isDatabaseConnected: false, isDemoFallback: true };
}

export interface EventWriteInput {
  localityId: string;
  title: string;
  description: string;
  category: PostCategory;
  startsAt: string;
  endsAt?: string | null;
  venue: string;
  organizer: string;
  imageUrl?: string | null;
  status: "draft" | "published";
}

export async function createEventRepository(
  input: EventWriteInput,
  actorId: string
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Events service unavailable.");
  }
  const { data, error } = await supabase
    .from("local_events")
    .insert({
      locality_id: input.localityId,
      title: input.title,
      description: input.description,
      category: input.category,
      starts_at: input.startsAt,
      ends_at: input.endsAt ?? null,
      venue: input.venue,
      organizer: input.organizer,
      image_url: input.imageUrl ?? null,
      status: input.status,
      created_by: actorId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const result = await getEventsRepository({
    eventId: data.id,
    includeDrafts: true,
    time: "all",
    limit: 1,
  });
  if (!result.events[0]) throw new Error("Created event could not be reloaded.");
  return result.events[0];
}

export async function updateEventRepository(
  eventId: string,
  input: Partial<EventWriteInput>
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Events service unavailable.");
  }
  const update: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };
  if (input.localityId !== undefined) update.locality_id = input.localityId;
  if (input.title !== undefined) update.title = input.title;
  if (input.description !== undefined) update.description = input.description;
  if (input.category !== undefined) update.category = input.category;
  if (input.startsAt !== undefined) update.starts_at = input.startsAt;
  if (input.endsAt !== undefined) update.ends_at = input.endsAt;
  if (input.venue !== undefined) update.venue = input.venue;
  if (input.organizer !== undefined) update.organizer = input.organizer;
  if (input.imageUrl !== undefined) update.image_url = input.imageUrl;
  if (input.status !== undefined) update.status = input.status;

  const { error } = await supabase
    .from("local_events")
    .update(update)
    .eq("id", eventId);
  if (error) throw new Error(error.message);
  const result = await getEventsRepository({
    eventId,
    includeDrafts: true,
    time: "all",
    limit: 1,
  });
  if (!result.events[0]) throw new Error("Event not found.");
  return result.events[0];
}

export async function cancelEventRepository(eventId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Events service unavailable.");
  const { error } = await supabase
    .from("local_events")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw new Error(error.message);
  return { cancelled: true };
}

export async function toggleEventRsvpRepository(eventId: string, userId: string) {
  let supabaseClient = null;
  if (isServerSupabaseConfigured()) {
    try {
      supabaseClient = await createSupabaseServerClient();
    } catch {
      supabaseClient = null;
    }
  }

  if (supabaseClient) {
    const { data: existing, error: lookupError } = await supabaseClient
        .from("event_rsvps")
        .select("event_id")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    const result = existing
      ? await supabaseClient
          .from("event_rsvps")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", userId)
      : await supabaseClient
          .from("event_rsvps")
          .insert({ event_id: eventId, user_id: userId, status: "going" });
    if (result.error) throw new Error(result.error.message);
    const refreshed = await getEventsRepository({ time: "all", userId, limit: 50 });
    return {
      event: refreshed.events.find((event) => event.id === eventId),
      rsvped: !existing,
      isDatabaseConnected: true,
    };
  }

  if (!isDemoModeEnabled()) {
    throw new Error(
      "Service Unavailable: Database connection failed and DEMO_MODE is disabled in this environment."
    );
  }

  const evt = toggleStoreEventRsvp(eventId);
  return { event: evt, rsvped: Boolean(evt?.rsvpedByMe), isDatabaseConnected: false, isDemoFallback: true };
}
