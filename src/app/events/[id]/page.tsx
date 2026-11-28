import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, MapPin } from "lucide-react";
import { EventShareButton } from "@/components/EventShareButton";
import { getEventsRepository } from "@/lib/repositories/events";
import { SITE_URL } from "@/lib/site";
import { isLocalImageSrc } from "@/lib/utils";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

const getEvent = cache(async (id: string) => {
  const { events } = await getEventsRepository({
    eventId: id,
    time: "all",
    limit: 1,
  });
  return events[0] ?? null;
});

function getPublicImageUrl(value?: string | null): string | undefined {
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
}: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) {
    return {
      title: "Event not found",
      robots: { index: false, follow: false },
    };
  }

  const canonical = `/events/${encodeURIComponent(event.id)}`;
  const description =
    (event.description ?? "").replace(/\s+/g, " ").trim().slice(0, 160) ||
    `${event.title} in ${event.localityName}.`;
  const image = getPublicImageUrl(event.imageUrl);
  return {
    title: event.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: event.title,
      description,
      siteName: "Pethri.com",
      ...(image ? { images: [{ url: image, alt: event.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const canonical = `/events/${encodeURIComponent(event.id)}`;
  const image = getPublicImageUrl(event.imageUrl);
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description ?? "",
    startDate: event.startsAt,
    ...(event.endsAt ? { endDate: event.endsAt } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: new URL(canonical, SITE_URL).toString(),
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.localityName,
        addressCountry: "IN",
      },
    },
    organizer: {
      "@type": "Organization",
      name: event.organizer,
    },
    ...(image ? { image: [image] } : {}),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventSchema).replace(/</g, "\\u003c"),
        }}
      />
      <Link
        href="/directory"
        className="text-sm font-bold text-[#173FBE] hover:text-[#315CFF]"
      >
        Back to events
      </Link>
      <article className="mt-5 rounded-3xl border border-[#E2E7F0] bg-white p-6 sm:p-9">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#173FBE]">
              {event.localityName}
            </p>
            <h1 className="mt-2 font-editorial text-4xl text-[#111318]">
              {event.title}
            </h1>
          </div>
          <EventShareButton title={event.title} url={canonical} />
        </header>
        {image && (
          <Image
            src={image}
            alt=""
            width={960}
            height={480}
            unoptimized={!isLocalImageSrc(image)}
            className="mt-6 max-h-[460px] w-full rounded-2xl object-cover"
          />
        )}
        <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-[#111318]">
          {event.description ?? ""}
        </p>
        <div className="mt-6 space-y-3 border-t border-[#E2E7F0] pt-5 text-sm text-[#5B6472]">
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#173FBE]" aria-hidden="true" />
            {new Intl.DateTimeFormat("en-IN", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Asia/Kolkata",
            }).format(new Date(event.startsAt))}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#173FBE]" aria-hidden="true" />
            {event.venue}, {event.localityName}
          </p>
          <p>Organised by {event.organizer}</p>
        </div>
      </article>
    </main>
  );
}
