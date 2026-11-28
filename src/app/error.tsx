"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
      <h1 className="font-editorial text-3xl text-[#111318]">
        This page could not be loaded
      </h1>
      <p className="mt-2 text-sm text-[#5B6472]">
        Please try again. Your private information has not been included in this message.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-full bg-[#173FBE] px-5 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315CFF]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full border border-[#E2E7F0] bg-white px-5 text-sm font-bold text-[#111318] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315CFF]"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
