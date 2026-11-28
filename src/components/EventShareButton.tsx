"use client";

import { Share2 } from "lucide-react";
import { usePethri } from "@/components/PethriProvider";
import { shareContent } from "@/lib/share";

export function EventShareButton({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const { showToast } = usePethri();

  const handleShare = async () => {
    try {
      const result = await shareContent({
        title,
        text: title,
        url: new URL(url, window.location.origin).toString(),
      });
      if (result === "cancelled") return;
      showToast(
        result === "shared" ? "Event shared" : "Event link copied to clipboard",
        "info"
      );
    } catch {
      showToast("Unable to share this event. Please try copying its URL.", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={`Share ${title}`}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[#E2E7F0] bg-white text-[#111318] hover:border-[#315CFF] hover:text-[#315CFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315CFF]"
    >
      <Share2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
