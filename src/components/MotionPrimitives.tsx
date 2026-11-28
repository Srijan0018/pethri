"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, isLocalImageSrc } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const EASE_EDITORIAL: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Motion for React: Reading progress bar in Electric Blue (#315CFF).
 */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 34,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 z-50 h-[2.5px] origin-left bg-[#315CFF] shadow-[0_0_12px_rgba(57,139,255,0.65)] pointer-events-none"
    />
  );
}

/**
 * Masked headline reveal using Motion for above-the-fold LCP headlines,
 * or GSAP ScrollTrigger clip-path wipe when `triggerOnScroll` is enabled.
 */
export function MaskedHeadlineReveal({
  children,
  delay = 0,
  triggerOnScroll = false,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  triggerOnScroll?: boolean;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!triggerOnScroll || prefersReduced) return;
    if (!containerRef.current || !innerRef.current) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        innerRef.current,
        {
          yPercent: 100,
          clipPath: "inset(0% 0% 100% 0%)",
          opacity: 0.2,
        },
        {
          yPercent: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          opacity: 1,
          duration: 0.72,
          delay,
          ease: "power4.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 90%",
            once: true,
          },
        }
      );
    });

    return () => mm.revert();
  }, [triggerOnScroll, delay, prefersReduced]);

  if (triggerOnScroll) {
    return (
      <div ref={containerRef} className="overflow-hidden">
        <div ref={innerRef} className={className}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <motion.div
        initial={
          prefersReduced
            ? false
            : { y: "100%", clipPath: "inset(0% 0% 100% 0%)", opacity: 0.25 }
        }
        animate={{ y: 0, clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
        transition={{ duration: 0.36, delay, ease: EASE_EDITORIAL }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Strictly uses Terracotta (#D94E34) for urgent live broadcast status only,
 * featuring concentric beacon + animated broadcast waveform bars.
 */
export function AnimatedLiveIndicator({
  label = "LIVE",
  showWaveform = false,
  className,
}: {
  label?: string;
  showWaveform?: boolean;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-[#D94E34] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-xs",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      <span>{label}</span>
      {showWaveform && !prefersReduced && (
        <span className="inline-flex items-end gap-[2px] h-2.5 ml-0.5" aria-hidden="true">
          {[0, 1, 2].map((bar) => (
            <motion.span
              key={bar}
              animate={{ height: ["35%", "100%", "45%"] }}
              transition={{
                duration: 0.75,
                repeat: Infinity,
                repeatType: "reverse",
                delay: bar * 0.16,
                ease: "easeInOut",
              }}
              className="w-[2px] rounded-full bg-white"
            />
          ))}
        </span>
      )}
    </span>
  );
}

/**
 * GSAP ScrollTrigger editorial reveal using directional clip-path curtain
 * and subtle lift rather than generic fade-ins.
 */
export function EditorialReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          y: 26,
          clipPath: "inset(0% 0% 8% 0%)",
        },
        {
          opacity: 1,
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.68,
          delay,
          ease: "power3.out",
          immediateRender: false,
          clearProps: "clipPath,transform,opacity",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 92%",
            once: true,
          },
        }
      );
    });

    return () => mm.revert();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * GSAP ScrollTrigger staggered wave container for grids and lists.
 * Re-checks child count cleanly for asynchronously fetched data.
 */
export function StaggerGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const childCount = React.Children.count(children);

  useEffect(() => {
    if (!containerRef.current || childCount === 0) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const items = containerRef.current?.querySelectorAll(
        ":scope > .pethri-stagger-item:not([data-gsap-done='1'])"
      );
      if (!items || items.length === 0) return;

      items.forEach((el) => el.setAttribute("data-gsap-done", "1"));

      gsap.fromTo(
        items,
        { opacity: 0, y: 24, scale: 0.975 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.56,
          stagger: 0.075,
          ease: "power3.out",
          immediateRender: false,
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 92%",
            once: true,
          },
        }
      );
      ScrollTrigger.refresh();
    });

    return () => mm.revert();
  }, [childCount]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("pethri-stagger-item", className)}>{children}</div>
  );
}

/**
 * GSAP ScrollTrigger scrubbed depth parallax layer for editorial sections.
 */
export function ScrollParallaxLayer({
  children,
  speed = 24,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        ref.current,
        { y: -speed * 0.5 },
        {
          y: speed * 0.5,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.65,
          },
        }
      );
    });

    return () => mm.revert();
  }, [speed]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}

/**
 * Motion for React: Shared-layout sliding navigation indicator.
 */
export function AnimatedNavPill({
  layoutId = "pethri-nav-pill",
  className,
}: {
  layoutId?: string;
  className?: string;
}) {
  return (
    <motion.span
      layoutId={layoutId}
      transition={{ type: "spring", stiffness: 460, damping: 36 }}
      className={cn(
        "absolute inset-0 rounded-full bg-[#173FBE] shadow-xs -z-10",
        className
      )}
    />
  );
}

/**
 * GSAP ScrollTrigger cinematic curtain reveal + scrubbed parallax image zoom.
 */
export function GsapImageMask({
  src,
  alt,
  immediate = false,
  className,
  sizes = "100vw",
  priority = false,
  children,
}: {
  src: string;
  alt: string;
  immediate?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  children?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !imgRef.current) return;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        containerRef.current,
        { clipPath: "inset(8% 0% 0% 0%)", opacity: 0.88 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          opacity: 1,
          duration: 0.42,
          ease: "power3.out",
          ...(immediate
            ? {}
            : {
                scrollTrigger: {
                  trigger: containerRef.current,
                  start: "top 90%",
                  once: true,
                },
              }),
        }
      );

      gsap.fromTo(
        imgRef.current,
        { scale: 1.11, yPercent: -3 },
        {
          scale: 1.02,
          yPercent: 3,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.55,
          },
        }
      );
    });

    return () => mm.revert();
  }, [immediate, src]);

  return (
    <div
      ref={containerRef}
      className={cn("group relative overflow-hidden bg-[#111318]", className)}
    >
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={!isLocalImageSrc(src)}
        className="object-cover will-change-transform transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {children}
    </div>
  );
}

export function HorizontalCarousel({
  children,
  title,
  subtitle,
  rightSlot,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (dir: -1 | 1) => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      {(title || rightSlot) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {subtitle && (
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#173FBE]">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#111318]">
                {title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {rightSlot}
            <div className="hidden sm:flex items-center gap-1.5">
              <motion.button
                type="button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                aria-label="Scroll carousel left"
                onClick={() => scrollByAmount(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E2E7F0] bg-white text-[#111318] transition-colors hover:border-[#315CFF] hover:text-[#315CFF]"
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                aria-label="Scroll carousel right"
                onClick={() => scrollByAmount(1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E2E7F0] bg-white text-[#111318] transition-colors hover:border-[#315CFF] hover:text-[#315CFF]"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2"
      >
        {children}
      </div>
    </div>
  );
}

export function ParallaxMediaFrame({
  src,
  alt,
  className,
  imgClassName,
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.img
        src={src}
        alt={alt}
        style={prefersReduced ? undefined : { y, scale: 1.07 }}
        className={cn(
          "h-full w-full object-cover transition-transform duration-700 will-change-transform",
          imgClassName
        )}
      />
      {children}
    </div>
  );
}

/**
 * Motion for React page transition paired with ScrollTrigger refresh on route changes.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <motion.div
      key={pathname}
      initial={prefersReduced ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: EASE_EDITORIAL }}
    >
      {children}
    </motion.div>
  );
}
