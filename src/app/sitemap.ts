import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { isServerSupabaseConfigured } from "@/lib/supabase/server";
import { getPostsRepository } from "@/lib/repositories/posts";
import { getEventsRepository } from "@/lib/repositories/events";
import { SITE_URL } from "@/lib/site";

const publicPaths = ["/", "/feed", "/explore", "/directory", "/editorial"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const pages: MetadataRoute.Sitemap = publicPaths.map((path) => ({
    url: new URL(path, SITE_URL).toString(),
  }));

  if (!isServerSupabaseConfigured()) return pages;

  const [{ posts }, { events }] = await Promise.all([
    getPostsRepository({ limit: 1000 }),
    getEventsRepository({ time: "all", limit: 1000 }),
  ]);
  return [
    ...pages,
    ...posts.map((post) => ({
      url: new URL(`/article/${encodeURIComponent(post.id)}`, SITE_URL).toString(),
      lastModified: new Date(post.createdAt),
    })),
    ...events.map((event) => ({
      url: new URL(`/events/${encodeURIComponent(event.id)}`, SITE_URL).toString(),
    })),
  ];
}
