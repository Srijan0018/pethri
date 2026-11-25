import { NextRequest, NextResponse } from "next/server";
import { engageRuntimePost } from "@/lib/store";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const action = body.action as "like" | "bookmark" | "share" | "comment";

    if (!["like", "bookmark", "share", "comment"].includes(action)) {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const updated = engageRuntimePost(id, action, {
      content: body.content,
      authorName: body.authorName,
      authorUsername: body.authorUsername,
    });

    if (!updated) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post: updated });
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }
}
