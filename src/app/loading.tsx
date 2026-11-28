export default function Loading() {
  return (
    <main
      aria-label="Loading page"
      aria-busy="true"
      className="mx-auto min-h-[50vh] w-full max-w-5xl space-y-5 px-4 py-10"
    >
      <div className="h-6 w-40 animate-pulse rounded bg-[#EEF2FF]" />
      <div className="h-12 w-3/4 animate-pulse rounded bg-[#EEF2FF]/70" />
      <div className="h-64 w-full animate-pulse rounded-2xl bg-[#E2E7F0]" />
      <div className="h-4 w-full animate-pulse rounded bg-[#EEF2FF]/70" />
    </main>
  );
}
