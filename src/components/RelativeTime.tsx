"use client";

import React from "react";
import { usePethri } from "@/components/PethriProvider";
import { formatRelativeTime } from "@/lib/utils";

export function RelativeTime({ iso }: { iso: string }) {
  const { nowMs } = usePethri();
  return <>{formatRelativeTime(iso, nowMs)}</>;
}
