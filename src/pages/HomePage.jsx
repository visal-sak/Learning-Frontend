import Hero from "@/components/sections/Hero"
import LearningJourney from "@/components/sections/LearningJourney"
import Courses from "@/components/sections/Courses"
import ContinueLearning from "@/components/sections/ContinueLearning"
import Testimonials from "@/components/sections/Testimonials"
import CTA from "@/components/sections/CTA"

export default function HomePage() {
  return (
    <>
      <Hero />
      <LearningJourney />
      <Courses />
      <ContinueLearning />
      <Testimonials />
      <CTA />
    </>
  )
}
