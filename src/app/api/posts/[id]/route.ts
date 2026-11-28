import { NextRequest, NextResponse } from "next/server";
import { resolveRequestActor } from "@/lib/server-auth";
import { getPostsRepository } from "@/lib/repositories/posts";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const actor = await resolveRequestActor(req);

    const { posts } = await getPostsRepository({
      postId: id,
      includePending: Boolean(actor),
      viewerId: actor?.profile.id,
      limit: 1,
    });
    const post = posts[0];

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
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load article." },
      { status: 503 }
    );
  }
}
