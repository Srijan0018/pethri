import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getPostsRepository } from "@/lib/repositories/posts";
import { SITE_URL } from "@/lib/site";
import { ArticleReaderClient } from "./ArticleReaderClient";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export const instant = false;

const getArticle = cache(async (id: string) => {
  const { posts } = await getPostsRepository({ postId: id, limit: 1 });
  return posts[0] ?? null;
});

function getPublicImageUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, SITE_URL);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getArticle(id);
  if (!post) {
    return {
      title: "Article not found",
      robots: { index: false, follow: false },
    };
  }

  const canonical = `/article/${encodeURIComponent(post.id)}`;
  const description =
    post.body.replace(/\s+/g, " ").trim().slice(0, 160) ||
    "Verified local reporting from Pethri.com.";
  const imageUrl = getPublicImageUrl(post.media[0]?.url);

  return {
    title: post.headline,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: post.headline,
      description,
      siteName: "Pethri.com",
      publishedTime: post.createdAt,
      authors: [post.author.fullName],
      section: post.category,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: post.headline }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.headline,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const post = await getArticle(id);
  if (!post) notFound();
  const articleUrl = new URL(
    `/article/${encodeURIComponent(id)}`,
    SITE_URL
  ).toString();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: post.headline,
            description: post.body.replace(/\s+/g, " ").trim().slice(0, 160),
            datePublished: post.createdAt,
            dateModified: post.createdAt,
            mainEntityOfPage: articleUrl,
            author: {
              "@type": "Person",
              name: post.author.fullName,
            },
            publisher: {
              "@type": "Organization",
              name: "Pethri.com",
              url: SITE_URL.toString(),
            },
            ...(getPublicImageUrl(post.media[0]?.url)
              ? { image: [getPublicImageUrl(post.media[0]?.url)] }
              : {}),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <ArticleReaderClient />
    </>
  );
}
