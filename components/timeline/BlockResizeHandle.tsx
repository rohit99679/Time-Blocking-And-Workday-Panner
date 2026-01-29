"use client";

export default function BlockResizeHandle({
  edge,
  onPointerDown,
}: {
  edge: "top" | "bottom";
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  return (
    <div
      className={[
        "absolute left-0 right-0 h-3",
        edge === "top" ? "-top-1" : "-bottom-1",
      ].join(" ")}
      aria-label={edge === "top" ? "Resize start time" : "Resize end time"}
      role="slider"
    >
      {/* tiny grip */}
      <div
        onPointerDown={onPointerDown}
        className="
      mx-auto mt-1 h-1 w-10 rounded-full 
      bg-black/30
      cursor-ns-resize
      hover:bg-black/50
      transition-colors
    "
      />
    </div>
  );
}
