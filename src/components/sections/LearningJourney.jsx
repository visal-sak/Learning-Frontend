import { IoIosPlayCircle } from "react-icons/io"
import { MdQuiz, MdWorkspacePremium } from "react-icons/md"
import { HiAcademicCap } from "react-icons/hi"
import { CircuitBoard } from "@/components/ui/circuit-board"
import { useTranslation } from "react-i18next"

// One card per circuit connector, colours matching each trace (left sky · centre teal · right green)
// name/description come from site.home.journey.<key>
const JOURNEY = [
  {
    key: "learn",
    to: "/courses",
    icon: <IoIosPlayCircle className="size-[22px] text-sky-400" />,
    glowColor: "rgba(56, 189, 248, 0.18)",
  },
  {
    key: "practice",
    to: "/my-learning",
    icon: <MdQuiz className="size-[22px] text-teal-400" />,
    glowColor: "rgba(45, 212, 191, 0.18)",
  },
  {
    key: "certify",
    to: "/courses",
    icon: <MdWorkspacePremium className="size-[22px] text-green-500" />,
    glowColor: "rgba(34, 197, 94, 0.18)",
  },
]

// Lessons → quizzes → certificates, on the animated circuit board
export default function LearningJourney() {
  const { t } = useTranslation()
  const journey = JOURNEY.map(({ key, ...card }) => ({
    ...card,
    name: t(`site.home.journey.${key}.name`),
    description: t(`site.home.journey.${key}.description`),
  }))
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight">{t("site.home.journey.title")}</h2>
        <p className="mt-2 text-muted-foreground">{t("site.home.journey.subtitle")}</p>
      </div>
      <CircuitBoard label="Autumn" icon={<HiAcademicCap className="size-5 sm:size-6" />} cards={journey} />
    </section>
  )
}
