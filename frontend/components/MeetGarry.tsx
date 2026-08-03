"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GarryMark } from "@/components/ui/Logo";

/**
 * The intro sequence, per Figma nodes 9:80 → 9:69 → 9:65 → 15:92.
 *
 * The source gif ships black-on-white, so public/meet-garry.gif is a
 * pre-decomposed copy: pop green on transparency, laid over the dark-green
 * field. Same "fill + mask" idea as node 9:65, but resolved once at build time
 * rather than in CSS, so it animates reliably as a plain <img>. Regenerate
 * from the original with:
 *
 *   ffmpeg -i meet-garry-final.gif -filter_complex \
 *     "[0:v]negate,colorchannelmixer=rr=0.843:gg=0.949:bb=0.243,split[a][b];\
 *      [a]palettegen=reserve_transparent=1[p];[b][p]paletteuse=alpha_threshold=110" \
 *     -loop -1 public/meet-garry.gif
 *
 * (negate → lines white on black; the mixer tints white to #D7F23E; the
 * palette step drops black to transparent; -loop -1 plays once and parks on
 * the final frame.)
 *
 * The gif's last frame parks the mark at a known spot on its canvas, measured
 * once from the source: dead centre horizontally, 48.84% down, 12.56% of the
 * canvas height. That lets the vector mark be placed exactly on top of where
 * the gif ends, so the handoff from raster to vector is invisible — and the
 * vector is then FLIPped into the real header logo.
 */
const GIF_SRC = "/meet-garry.gif";
const GIF_ASPECT = 2360 / 1640;
const MARK_CENTRE_X = 0.4998;
const MARK_CENTRE_Y = 0.4884;
const MARK_HEIGHT_FRACTION = 0.1256;
const MARK_ASPECT = 38.983 / 52;

/** first-page hold — the gif runs 4.56s and parks on its final frame. */
const PLAY_MS = 5000;
/** second/third page — static Gary, before it flies to the header. */
const HOLD_MS = 800;
const MORPH_MS = 700;

type Phase = "play" | "hold" | "morph" | "done";

type MarkBox = { left: number; top: number; height: number };

export function MeetGarry() {
  const [phase, setPhase] = useState<Phase>("play");
  const [mark, setMark] = useState<MarkBox | null>(null);
  const [transform, setTransform] = useState<string>();
  const gifRef = useRef<HTMLImageElement>(null);

  const finish = useCallback(() => setPhase("done"), []);

  // Lock scrolling only while the overlay is up.
  useEffect(() => {
    if (phase === "done") return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  // play → hold: place the vector exactly where the gif parked its mark.
  // A reduced-motion preference skips the whole sequence.
  useEffect(() => {
    if (phase !== "play") return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const timer = setTimeout(() => {
      if (reduced) {
        setPhase("done");
        return;
      }

      const gif = gifRef.current;

      if (gif) {
        const rect = gif.getBoundingClientRect();
        const height = MARK_HEIGHT_FRACTION * rect.height;

        setMark({
          height,
          left:
            rect.left +
            MARK_CENTRE_X * rect.width -
            (height * MARK_ASPECT) / 2,
          top: rect.top + MARK_CENTRE_Y * rect.height - height / 2,
        });
      }

      setPhase("hold");
    }, reduced ? 0 : PLAY_MS);

    return () => clearTimeout(timer);
  }, [phase]);

  // hold → morph: FLIP the vector onto the real header logo.
  useEffect(() => {
    if (phase !== "hold") return;

    const timer = setTimeout(() => {
      const target = document
        .querySelector("[data-garry-target]")
        ?.querySelector("svg");

      if (target && mark) {
        const to = target.getBoundingClientRect();

        setTransform(
          `translate(${to.left - mark.left}px, ${to.top - mark.top}px) scale(${to.height / mark.height})`
        );
      }

      setPhase("morph");
    }, HOLD_MS);

    return () => clearTimeout(timer);
  }, [phase, mark]);

  useEffect(() => {
    if (phase !== "morph") return;

    const timer = setTimeout(finish, MORPH_MS);

    return () => clearTimeout(timer);
  }, [phase, finish]);

  if (phase === "done") return null;

  return (
    <div
      className="fixed inset-0 z-60 cursor-pointer bg-brand"
      onClick={finish}
      role="presentation"
    >
      <div className="flex h-full items-center justify-center">
        {/* Deliberately a plain <img>: next/image would need `unoptimized`
            to keep the gif animating, so it buys nothing here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={gifRef}
          src={GIF_SRC}
          alt="Meet Garry"
          className="transition-opacity duration-200"
          style={{
            // The writing spans ~48% of the gif canvas, so the canvas has to
            // run wide for "Meet Garry" to read at a comfortable size.
            width: "min(92vw, 1400px)",
            aspectRatio: GIF_ASPECT,
            opacity: phase === "play" ? 1 : 0,
          }}
        />
      </div>

      {mark && phase !== "play" ? (
        <div
          className="pointer-events-none fixed text-pop"
          style={{
            left: mark.left,
            top: mark.top,
            transform,
            transformOrigin: "top left",
            transition: `transform ${MORPH_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`,
          }}
        >
          {/* The animation's Gary has an eye; the wordmark's glyph doesn't, so
              it drops as the mark settles into the header. */}
          <GarryMark size={mark.height} withEye={phase === "hold"} />
        </div>
      ) : null}
    </div>
  );
}
