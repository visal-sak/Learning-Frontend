import { DeployGlobe } from "@/components/ui/illustration-globe-vercel"
import { useTranslation } from "react-i18next"

// Brand green for the learning paths travelling across the globe
const ACCENT = "#22C55E"

// Education icons (24×24 filled paths) for the globe markers
const ICONS = {
  graduation: { d: "M12 3 1 9l11 6 9-4.91V17h2V9L12 3zm-7 9.18v4L12 20l7-3.82v-4L12 16l-7-3.82z", viewBox: "0 0 24 24" },
  book: { d: "M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 4h5v8l-2.5-1.5L6 12V4z", viewBox: "0 0 24 24" },
  play: { d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 14.5v-9l6 4.5-6 4.5z", viewBox: "0 0 24 24" },
  quiz: { d: "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z", viewBox: "0 0 24 24" },
  mentor: { d: "M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z", viewBox: "0 0 24 24" },
  certificate: { d: "M12 1a7 7 0 0 0-4 12.74V23l4-2 4 2v-9.26A7 7 0 0 0 12 1zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10z", viewBox: "0 0 24 24" },
}

// Paths across the globe (meridian, row) ending at each learning milestone
const NODES = [
  { id: "lessons", trajectory: [[3, 0], [3, 1], [3, 2], [3, 3]], icon: ICONS.play },
  { id: "courses", trajectory: [[-3, 0], [-3, 1], [-3, 2], [-3, 3], [-3, 4]], icon: ICONS.book },
  { id: "quizzes", trajectory: [[1, 0], [1, 1], [1, 2]], icon: ICONS.quiz },
  { id: "mentors", trajectory: [[-1, 0], [-1, 1], [-2, 1]], icon: ICONS.mentor },
  { id: "graduates", trajectory: [[0, 0], [0, 1], [0, 2], [0, 3], [-1, 3]], icon: ICONS.graduation },
  { id: "certificates", trajectory: [[2, 0], [2, 1]], icon: ICONS.certificate },
]

export default function CTA() {
  const { t } = useTranslation()
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-16 pb-8 text-center sm:px-6">
      {/* Learners around the world: paths travel to lessons, quizzes, mentors and certificates */}
      {/* overflow-hidden: the SVG draws the whole sphere (overflow: visible); only the top dome should show */}
      <div className="relative w-full max-w-[680px] overflow-hidden">
        <DeployGlobe nodes={NODES} accentColor={ACCENT} duration={4.5} label={t("site.home.cta.globeLabel")} />
        {/* soft fade into the page at the bottom of the globe */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </div>
    </section>
  )
}
