import { PlayCircle, ListChecks, Award, GraduationCap } from "lucide-react"
import { CircuitBoard } from "@/components/ui/circuit-board"

// One card per circuit connector, colours matching each trace (left sky · centre teal · right green)
const journey = [
  {
    name: "Learn",
    to: "/courses",
    icon: <PlayCircle className="size-5 text-sky-400" />,
    description: "Bite-sized video lessons from instructors who ship.",
    glowColor: "rgba(56, 189, 248, 0.18)",
  },
  {
    name: "Practice",
    to: "/my-learning",
    icon: <ListChecks className="size-5 text-teal-400" />,
    description: "Quizzes after every course to lock in what you learned.",
    glowColor: "rgba(45, 212, 191, 0.18)",
  },
  {
    name: "Certify",
    to: "/courses",
    icon: <Award className="size-5 text-green-500" />,
    description: "Finish the path and show the skills you’ve earned.",
    glowColor: "rgba(34, 197, 94, 0.18)",
  },
]

// Lessons → quizzes → certificates, on the animated circuit board
export default function LearningJourney() {
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight">How learning works</h2>
        <p className="mt-2 text-muted-foreground">Watch, practise and get certified — all in one place.</p>
      </div>
      <CircuitBoard label="Learnova" icon={<GraduationCap className="size-5 sm:size-6" />} cards={journey} />
    </section>
  )
}
