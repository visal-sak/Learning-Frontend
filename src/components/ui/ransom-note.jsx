/**
 * RansomNote — SmoothUI (smoothui.dev/r/ransom-note.json), ported from TSX to JSX.
 * Text built from cut-out paper scraps; animate: "assemble" | "jitter" | "none".
 */
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";

// mulberry32 constants
const MULBERRY32_INCREMENT = 0x6d_2b_79_f5;
const UINT32_DIVISOR = 4_294_967_296;

/**
 * Deterministic, seedable PRNG (mulberry32). Given the same seed it always
 * produces the same sequence of numbers in [0, 1), so layouts stay stable
 * across renders and are safe to compute during SSR.
 */
export const createSeededRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state + MULBERRY32_INCREMENT) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_DIVISOR;
  };
};

const DEFAULT_SEED = 1;
const DEFAULT_INTENSITY = 0.6;
const DEFAULT_ROTATION_MAX = 8;
const DEFAULT_STAGGER_SECONDS = 0.03;
const MIN_INTENSITY = 0;
const MAX_INTENSITY = 1;

const DEFAULT_FONTS = [
  "Georgia, 'Times New Roman', serif",
  "'Courier New', Courier, monospace",
  "Impact, 'Arial Narrow Bold', sans-serif",
  "'Brush Script MT', cursive",
  "Verdana, Geneva, sans-serif",
  "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
];

const DEFAULT_PALETTE = [
  "#f7f1e3",
  "#fdf6e3",
  "#f1e4c3",
  "#e9dcc0",
  "#fbeee0",
  "#eee2cf",
];

const SCRAP_TEXT_COLOR = "#1f1b16";

const FONT_SCALE_BASE = 0.85;
const FONT_SCALE_VARIANCE = 0.5;
const ENTRANCE_OFFSET_BASE = 24;
const ENTRANCE_OFFSET_VARIANCE = 60;
const ENTRANCE_ROTATION_VARIANCE = 30;
const SKEW_MAX = 6;
const JITTER_ROTATION_BASE = 1.5;
const JITTER_ROTATION_VARIANCE = 2.5;
const JITTER_DURATION_MIN_SECONDS = 0.6;
const JITTER_DURATION_VARIANCE_SECONDS = 0.6;

const SPRING_DURATION = 0.25;
const SPRING_BOUNCE = 0.1;
const STATIC_TRANSITION = { duration: 0 };
// ease-in-out cubic-bezier for the moving (idle wobble) loop, per the
// project's animation guidelines.
const JITTER_EASE = [0.645, 0.045, 0.355, 1];

const WHITESPACE_PATTERN = /\s/;

const randomInRange = (rand, min, max) =>
  min + rand() * (max - min);

const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max);

const RansomNote = ({
  animate = "assemble",
  className,
  fonts = DEFAULT_FONTS,
  intensity = DEFAULT_INTENSITY,
  palette = DEFAULT_PALETTE,
  rotation = DEFAULT_ROTATION_MAX,
  seed = DEFAULT_SEED,
  stagger = DEFAULT_STAGGER_SECONDS,
  text,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const clampedIntensity = clamp(intensity, MIN_INTENSITY, MAX_INTENSITY);

  const scraps = useMemo(() => {
    const rand = createSeededRandom(seed);
    const characters = Array.from(text);
    const fontStack = fonts.length > 0 ? fonts : DEFAULT_FONTS;
    const colorStack = palette.length > 0 ? palette : DEFAULT_PALETTE;

    return characters.map((char) => {
      const isWhitespace = WHITESPACE_PATTERN.test(char);
      const fontFamily = fontStack[Math.floor(rand() * fontStack.length)];
      const backgroundColor = isWhitespace
        ? undefined
        : colorStack[Math.floor(rand() * colorStack.length)];
      const fontScale =
        FONT_SCALE_BASE + rand() * FONT_SCALE_VARIANCE * clampedIntensity;
      const restRotation =
        randomInRange(rand, -rotation, rotation) * clampedIntensity;
      const entranceSpread =
        ENTRANCE_OFFSET_BASE + ENTRANCE_OFFSET_VARIANCE * clampedIntensity;
      const entranceOffsetX = randomInRange(
        rand,
        -entranceSpread,
        entranceSpread
      );
      const entranceOffsetY = randomInRange(
        rand,
        -entranceSpread,
        entranceSpread
      );
      const entranceRotation =
        randomInRange(
          rand,
          -ENTRANCE_ROTATION_VARIANCE,
          ENTRANCE_ROTATION_VARIANCE
        ) * clampedIntensity;
      const skew = randomInRange(rand, -SKEW_MAX, SKEW_MAX) * clampedIntensity;
      const jitterRotation =
        JITTER_ROTATION_BASE +
        rand() * JITTER_ROTATION_VARIANCE * clampedIntensity;
      const jitterDuration =
        JITTER_DURATION_MIN_SECONDS + rand() * JITTER_DURATION_VARIANCE_SECONDS;

      return {
        backgroundColor,
        char,
        entranceOffsetX,
        entranceOffsetY,
        entranceRotation,
        fontFamily,
        fontScale,
        isWhitespace,
        jitterDuration,
        jitterRotation,
        rotation: restRotation,
        skew,
      };
    });
    // fonts/palette/rotation are included because they change the derived
    // per-character values below; the layout otherwise stays stable for a
    // given text + seed + intensity combination.
  }, [text, seed, clampedIntensity, fonts, palette, rotation]);

  // One scrap (character) — entrance/jitter animation per scrap
  const renderScrap = ({ scrap, index }) => {
          const restState = {
            opacity: 1,
            rotate: scrap.rotation,
            x: 0,
            y: 0,
          };

          let initial = restState;
          let animateState = restState;
          let transition = STATIC_TRANSITION;

          if (!shouldReduceMotion && animate === "assemble") {
            initial = {
              opacity: 0,
              rotate: scrap.rotation + scrap.entranceRotation,
              x: scrap.entranceOffsetX,
              y: scrap.entranceOffsetY,
            };
            animateState = restState;
            transition = {
              bounce: SPRING_BOUNCE,
              delay: index * stagger,
              duration: SPRING_DURATION,
              type: "spring",
            };
          } else if (!shouldReduceMotion && animate === "jitter") {
            initial = restState;
            animateState = {
              rotate: [
                scrap.rotation - scrap.jitterRotation,
                scrap.rotation + scrap.jitterRotation,
              ],
            };
            transition = {
              delay: index * stagger,
              duration: scrap.jitterDuration,
              ease: JITTER_EASE,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "mirror",
            };
          }

          return (
            <motion.span
              animate={animateState}
              className={cn(
                "inline-block select-none whitespace-pre",
                !scrap.isWhitespace &&
                  "rounded-sm px-1 py-0.5 shadow-sm ring-1 ring-black/10"
              )}
              initial={initial}
              key={index}
              style={{
                backgroundColor: scrap.backgroundColor,
                color: scrap.isWhitespace ? undefined : SCRAP_TEXT_COLOR,
                fontFamily: scrap.fontFamily,
                fontSize: `${scrap.fontScale}em`,
                skewX: scrap.skew,
                transformOrigin: "50% 50%",
              }}
              transition={transition}
            >
              {scrap.char}
            </motion.span>
          );
  };

  // Group characters into words so lines only wrap at spaces, never mid-word
  const groups = [];
  scraps.forEach((scrap, index) => {
    const last = groups[groups.length - 1];
    if (scrap.isWhitespace) groups.push({ space: true, items: [{ scrap, index }] });
    else if (last && !last.space) last.items.push({ scrap, index });
    else groups.push({ space: false, items: [{ scrap, index }] });
  });

  return (
    <div className={cn("relative inline-block", className)}>
      <span className="sr-only">{text}</span>
      <div
        aria-hidden="true"
        className="flex flex-wrap items-baseline leading-none"
      >
        {groups.map((group) =>
          group.space ? (
            renderScrap(group.items[0])
          ) : (
            <span key={`w-${group.items[0].index}`} className="inline-flex flex-nowrap items-baseline">
              {group.items.map(renderScrap)}
            </span>
          )
        )}
      </div>
    </div>
  );
};

export default RansomNote;
