import { createSupabaseServerClient, isServerSupabaseConfigured } from "@/lib/supabase/server";
import { isDemoModeEnabled } from "@/lib/server-config";
import {
  engageRuntimePost as engageStorePost,
  toggleFollowLocality as toggleStoreFollowLocality,
  toggleFollowProfile as toggleStoreFollowProfile,
} from "@/lib/store";
import { sanitizeText } from "@/lib/repositories/validation";
import { getPostsRepository } from "@/lib/repositories/posts";

export async function engagePostRepository(
  postId: string,
  action: "like" | "bookmark" | "share" | "comment",
  params: {
    userId?: string;
    content?: string;
    authorName?: string;
    authorUsername?: string;
  }
) {
  let supabaseClient = null;
  if (isServerSupabaseConfigured()) {
    try {
      supabaseClient = await createSupabaseServerClient();
    } catch {
      supabaseClient = null;
    }
  }

  if (supabaseClient && params.userId) {
    if (action === "comment") {
      const text = sanitizeText(params.content, 1000);
      if (!text) throw new Error("Comment cannot be empty");
      const { error } = await supabaseClient.from("comments").insert({
        post_id: postId,
        author_id: params.userId,
        content: text,
      });
      if (error) throw new Error(error.message);
    } else if (action === "bookmark" || action === "like") {
      const table = action === "bookmark" ? "bookmarks" : "post_likes";
      const { data: existing, error: lookupError } = await supabaseClient
        .from(table)
        .select("post_id")
        .eq("post_id", postId)
        .eq("user_id", params.userId)
        .maybeSingle();
      if (lookupError) throw new Error(lookupError.message);

      const result = existing
        ? await supabaseClient
            .from(table)
            .delete()
            .eq("post_id", postId)
            .eq("user_id", params.userId)
        : await supabaseClient
            .from(table)
            .insert({ post_id: postId, user_id: params.userId });
      if (result.error) throw new Error(result.error.message);
    } else if (action === "share") {
      const { error } = await supabaseClient.rpc("increment_post_shares", {
        target_post_id: postId,
      });
      if (error) throw new Error(error.message);
    }

    const refreshed = await getPostsRepository({
      postId,
      viewerId: params.userId,
      limit: 1,
    });
    const post = refreshed.posts[0];
    if (!post) throw new Error("Article not found or no longer available.");
    return { post, isDatabaseConnected: true };
  }

  if (supabaseClient && action === "share") {
    const refreshed = await getPostsRepository({ postId, limit: 1 });
    const post = refreshed.posts[0];
    if (!post) throw new Error("Article not found or no longer available.");
    return { post, isDatabaseConnected: true, shareCountTracked: false };
  }

  if (supabaseClient && action !== "share" && !params.userId) {
    throw new Error("Authentication is required for this interaction.");
  }

  if (!isDemoModeEnabled()) {
    throw new Error(
      "Service Unavailable: Database connection failed and DEMO_MODE is disabled in this environment."
    );
  }

  const post = engageStorePost(postId, action, {
    content: params.content,
    authorName: params.authorName,
    authorUsername: params.authorUsername,
  });

  return { post, isDatabaseConnected: false, isDemoFallback: true };
}

export async function toggleFollowLocalityRepository(localityId: string, userId: string) {
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
      .from("locality_follows")
      .select("locality_id")
      .eq("locality_id", localityId)
      .eq("user_id", userId)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);

    const result = existing
      ? await supabaseClient
          .from("locality_follows")
          .delete()
          .eq("locality_id", localityId)
          .eq("user_id", userId)
      : await supabaseClient
          .from("locality_follows")
          .insert({ locality_id: localityId, user_id: userId });
    if (result.error) throw new Error(result.error.message);
    return {
      following: !existing,
      isDatabaseConnected: true,
    };
  }

  if (!isDemoModeEnabled()) {
    throw new Error(
      "Service Unavailable: Database connection failed and DEMO_MODE is disabled in this environment."
    );
  }

  const loc = toggleStoreFollowLocality(localityId);
  return { following: Boolean(loc?.followedByMe), locality: loc, isDatabaseConnected: false, isDemoFallback: true };
}

export async function toggleFollowReporterRepository(reporterId: string, userId: string) {
  let supabaseClient = null;
  if (isServerSupabaseConfigured()) {
    try {
      supabaseClient = await createSupabaseServerClient();
    } catch {
      supabaseClient = null;
    }
  }

  if (supabaseClient) {
    const { data: reporter, error: reporterError } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("id", reporterId)
      .eq("is_verified_reporter", true)
      .maybeSingle();
    if (reporterError) throw new Error(reporterError.message);
    if (!reporter) throw new Error("Reporter not found.");
    const { data: existing, error: lookupError } = await supabaseClient
      .from("user_follows")
      .select("target_profile_id")
      .eq("follower_id", userId)
      .eq("target_profile_id", reporterId)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);

    const result = existing
      ? await supabaseClient
          .from("user_follows")
          .delete()
          .eq("follower_id", userId)
          .eq("target_profile_id", reporterId)
      : await supabaseClient
          .from("user_follows")
          .insert({ follower_id: userId, target_profile_id: reporterId });
    if (result.error) throw new Error(result.error.message);
    return {
      following: !existing,
      isDatabaseConnected: true,
    };
  }

  if (!isDemoModeEnabled()) {
    throw new Error(
      "Service Unavailable: Database connection failed and DEMO_MODE is disabled in this environment."
    );
  }

  const prof = toggleStoreFollowProfile(reporterId);
  return { following: Boolean(prof?.followedByMe), profile: prof, isDatabaseConnected: false, isDemoFallback: true };
}

export async function toggleFollowTopicRepository(
  categorySlug: string,
  userId: string
) {
  let supabaseClient = null;
  if (isServerSupabaseConfigured()) {
    supabaseClient = await createSupabaseServerClient();
  }
  if (supabaseClient) {
    const { data: existing, error: lookupError } = await supabaseClient
      .from("topic_follows")
      .select("category_slug")
      .eq("category_slug", categorySlug)
      .eq("user_id", userId)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);

    const result = existing
      ? await supabaseClient
          .from("topic_follows")
          .delete()
          .eq("category_slug", categorySlug)
          .eq("user_id", userId)
      : await supabaseClient
          .from("topic_follows")
          .insert({ category_slug: categorySlug, user_id: userId });
    if (result.error) throw new Error(result.error.message);
    return { following: !existing, isDatabaseConnected: true };
  }
  if (!isDemoModeEnabled()) {
    throw new Error("Service Unavailable: topic follows require a database.");
  }
  return { following: true, isDatabaseConnected: false, isDemoFallback: true };
}
