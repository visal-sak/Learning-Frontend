// Tag colours: level has a fixed meaning; categories get a stable tint from their name
export const LEVEL_TAG = {
  BEGINNER: "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  INTERMEDIATE: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  ADVANCED: "bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
}
export const CATEGORY_TAGS = [
  "bg-sky-500/12 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "bg-violet-500/12 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-indigo-500/12 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  "bg-teal-500/12 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  "bg-fuchsia-500/12 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
  "bg-cyan-500/12 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
]
export const categoryTag = (name = "") => CATEGORY_TAGS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % CATEGORY_TAGS.length]
