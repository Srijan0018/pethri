import { NextRequest, NextResponse } from "next/server";
import { listPosts } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { posts } = await listPosts({ includePending: true });
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const related = posts
    .filter(
      (p) =>
        p.id !== post.id &&
        p.moderationStatus === "approved" &&
        (p.localityId === post.localityId || p.category === post.category)
    )
    .slice(0, 3);

  return NextResponse.json({ post, related });
}
