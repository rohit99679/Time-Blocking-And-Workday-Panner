"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useBlockStore } from "@/features/blocks/blockStore";
import AddBlockPopover from "./AddBlockPopover";
import BlockItem from "./BlockItem";
import { useWorkHoursStore } from "@/features/settings/workHoursStore";

const TRACK_HEIGHT = 2000;
const AUTO_SCROLL_TO_NOW = true; // set false if you don't want auto scroll

function fmtHHMM(mins: number) {
  const totalMinutes = ((mins % 1440) + 1440) % 1440;
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function currentMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export default function Timeline() {
  const { blocks } = useBlockStore();
  const { workStartMin, workEndMin } = useWorkHoursStore();

  const DAY_START = workStartMin;
  const DAY_END = workEndMin;

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const scrolledOnceRef = useRef(false);

  const [nowMin, setNowMin] = useState<number>(() => currentMinutes());

  useEffect(() => {
    // update every 30 seconds so it feels "live"
    const id = window.setInterval(() => setNowMin(currentMinutes()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const sorted = useMemo(
    () => [...blocks].sort((a, b) => a.startMin - b.startMin),
    [blocks],
  );

  const totalHours = Math.max(1, Math.ceil((DAY_END - DAY_START) / 60));

  // compute "now" line position (only if within working hours)
  const nowTop = useMemo(() => {
    if (nowMin < DAY_START || nowMin > DAY_END) return null;
    const ratio = (nowMin - DAY_START) / (DAY_END - DAY_START);
    return ratio * TRACK_HEIGHT;
  }, [nowMin, DAY_START, DAY_END]);

  // auto scroll to current time once
  useEffect(() => {
    if (!AUTO_SCROLL_TO_NOW) return;
    if (nowTop == null) return;
    if (!wrapRef.current) return;
    if (scrolledOnceRef.current) return;

    // center "now" line in the viewport
    const viewport = wrapRef.current;
    const target = Math.max(0, nowTop - viewport.clientHeight / 2);
    viewport.scrollTo({ top: target, behavior: "smooth" });

    scrolledOnceRef.current = true;
  }, [nowTop]);

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Timeline</div>
        <AddBlockPopover />
      </div>

      {/* Scroll viewport */}
      <div
        ref={wrapRef}
        className="relative h-[calc(100vh-200px)] overflow-auto rounded-xl border bg-white"
      >
        {/* Track (everything positions relative to this height) */}
        <div className="relative">
          {/* hour lines */}
          <div className="absolute inset-0">
            {Array.from({ length: totalHours + 1 }).map((_, i) => {
              const top = (i / totalHours) * TRACK_HEIGHT;
              const minuteAtLine = DAY_START + i * 60;

              return (
                <div
                  key={i}
                  className="absolute left-0 right-0"
                  style={{ top }}
                >
                  <div className="flex items-center gap-1">
                    <div className="w-14 text-xs text-neutral-500 px-2">
                      <span className="whitespace-nowrap">
                        {fmtHHMM(minuteAtLine)}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-neutral-200" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* NOW indicator */}
          {nowTop != null ? (
            <div
              className="absolute left-0 right-0 z-0 pointer-events-none"
              style={{ top: nowTop }}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center">
                  <span className="text-[8px] text-orange-600 font-semibold">
                    <span className="">NOW</span> <span>{fmtHHMM(nowMin)}</span>
                  </span>
                </div>
                <div className="h-1 flex-1 bg-orange-600" />
              </div>
            </div>
          ) : null}

          {/* blocks */}
          <div className="absolute inset-0">
            {sorted.map((b) => (
              <BlockItem
                key={b.id}
                block={b}
                dayStart={DAY_START}
                dayEnd={DAY_END}
                trackHeight={TRACK_HEIGHT}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
