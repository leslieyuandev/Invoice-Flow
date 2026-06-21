"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { CanvaElement, AnimationType, ElementAnimation } from "@/types/canva";
import { getAnimKeyframeName, getAnimDuration } from "./PageRenderer";

interface AnimDef {
  type: AnimationType;
  label: string;
  cssAnimation: string;
}

function makeDef(type: AnimationType, label: string, speed = 0.5, direction?: ElementAnimation["direction"]): AnimDef {
  const anim: ElementAnimation = { type, trigger: "both", speed, direction };
  const kf = getAnimKeyframeName(anim);
  const dur = getAnimDuration(speed);
  return { type, label, cssAnimation: `${kf} ${dur}s ease both` };
}

const GENERAL: AnimDef[] = [
  makeDef("pop", "Pop"),
  makeDef("wipe", "Wipe"),
  makeDef("blur", "Blur"),
  makeDef("succession", "Succession"),
  makeDef("breathe", "Breathe"),
  makeDef("baseline", "Baseline"),
  makeDef("drift", "Drift"),
  makeDef("tectonic", "Tectonic"),
  makeDef("tumble", "Tumble"),
  makeDef("neon", "Neon"),
  makeDef("scrapbook", "Scrapbook"),
  makeDef("stomp", "Stomp"),
];

const SUGGESTED: AnimDef[] = [
  makeDef("photo-flow", "Photo Flow"),
  makeDef("photo-rise", "Photo Rise"),
  makeDef("photo-zoom", "Photo Zoom"),
];

const ADDON: AnimDef[] = [
  makeDef("rotate", "Rotate"),
  makeDef("flicker", "Flicker"),
  makeDef("pulse", "Pulse"),
  makeDef("wiggle", "Wiggle"),
];

function AnimSquare({ cssAnimation }: { cssAnimation: string }) {
  return (
    <div style={{ width: 32, height: 32, borderRadius: 6, background: "#7c3aed", animation: cssAnimation }} />
  );
}

function AnimThumbnail({ def, selected, onClick }: { def: AnimDef; selected: boolean; onClick: () => void }) {
  const [animKey, setAnimKey] = useState(0);
  return (
    <button
      type="button"
      title={def.label}
      onClick={onClick}
      onMouseEnter={() => setAnimKey((k) => k + 1)}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-colors",
        selected ? "border-brand-500 bg-brand-50" : "border-surface-200 hover:border-surface-300"
      )}
    >
      {animKey > 0 ? (
        <AnimSquare key={animKey} cssAnimation={def.cssAnimation} />
      ) : (
        <div style={{ width: 32, height: 32, borderRadius: 6, background: "#7c3aed" }} />
      )}
      <span className="text-[10px] text-surface-600 text-center leading-tight">{def.label}</span>
    </button>
  );
}

interface Props {
  el: CanvaElement | null;
  onPatch: (patch: Partial<CanvaElement>) => void;
}

export function AnimationPanel({ el, onPatch }: Props) {
  const anim = el?.animation ?? null;

  function setAnim(type: AnimationType) {
    if (anim?.type === type) return;
    onPatch({
      animation: {
        type,
        trigger: anim?.trigger ?? "both",
        speed: anim?.speed ?? 0.5,
        direction: anim?.direction,
        reverseExit: anim?.reverseExit,
      },
    });
  }

  function patchAnim(patch: Partial<ElementAnimation>) {
    if (!anim) return;
    onPatch({ animation: { ...anim, ...patch } });
  }

  function renderGroup(label: string, defs: AnimDef[]) {
    return (
      <div key={label}>
        <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">{label}</p>
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {defs.map((def) => (
            <AnimThumbnail
              key={def.type}
              def={def}
              selected={anim?.type === def.type}
              onClick={() => setAnim(def.type)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-surface-700">Animate</p>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0 space-y-1">
        {renderGroup("General", GENERAL)}
        {renderGroup("Suggested", SUGGESTED)}
        {renderGroup("Add-on effects", ADDON)}

        {anim && (
          <div className="space-y-3 pt-1 border-t border-surface-100">
            <div>
              <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">When to play</p>
              <div className="flex gap-1">
                {(["both", "enter", "exit"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => patchAnim({ trigger: t })}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded-md text-[10px] font-medium border transition-colors",
                      anim.trigger === t
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-surface-200 text-surface-500 hover:bg-surface-50"
                    )}
                  >
                    {t === "both" ? "Both" : t === "enter" ? "On enter" : "On exit"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-surface-500 mb-1">
                <span className="font-semibold uppercase tracking-wide">Speed</span>
                <span>{anim.speed === 0 ? "Fast" : anim.speed === 1 ? "Slow" : anim.speed < 0.4 ? "Faster" : anim.speed > 0.6 ? "Slower" : "Normal"}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={anim.speed}
                onChange={(e) => patchAnim({ speed: Number(e.target.value) })}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-[9px] text-surface-400 mt-0.5">
                <span>Fast</span>
                <span>Slow</span>
              </div>
            </div>

            {anim.type === "pan" && (
              <div>
                <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">Direction</p>
                <div className="grid grid-cols-2 gap-1">
                  {(["left", "right", "up", "down"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => patchAnim({ direction: d })}
                      className={cn(
                        "px-2 py-1.5 rounded-md text-[10px] border capitalize transition-colors",
                        anim.direction === d
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-surface-200 text-surface-500 hover:bg-surface-50"
                      )}
                    >
                      {d === "left" ? "← Left" : d === "right" ? "→ Right" : d === "up" ? "↑ Up" : "↓ Down"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-surface-600 cursor-pointer">
              <input
                type="checkbox"
                checked={anim.reverseExit ?? false}
                onChange={(e) => patchAnim({ reverseExit: e.target.checked })}
                className="accent-brand-600"
              />
              Reverse exit animation
            </label>
          </div>
        )}

        {anim && (
          <button
            type="button"
            onClick={() => onPatch({ animation: undefined })}
            className="w-full mt-2 px-3 py-2 rounded-lg border border-surface-200 text-xs text-red-600 hover:bg-red-50 transition-colors"
          >
            Remove animation
          </button>
        )}
      </div>
    </div>
  );
}
