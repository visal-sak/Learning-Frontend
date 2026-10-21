import { SiReact, SiPython, SiFigma, SiJavascript, SiNodedotjs, SiTensorflow, SiDocker, SiTailwindcss } from "react-icons/si"

export const categories = [
  { name: "Web Development", count: 124, icon: SiReact, color: "text-sky-400" },
  { name: "Data Science", count: 86, icon: SiPython, color: "text-yellow-300" },
  { name: "UI/UX Design", count: 58, icon: SiFigma, color: "text-pink-400" },
  { name: "Machine Learning", count: 42, icon: SiTensorflow, color: "text-orange-400" },
  { name: "Backend", count: 73, icon: SiNodedotjs, color: "text-green-400" },
  { name: "DevOps", count: 37, icon: SiDocker, color: "text-blue-400" },
]

export const courses = [
  {
    id: 1, title: "React 19 from Zero to Production", instructor: "Sophea Chan", category: "development",
    level: "Beginner", lessons: 48, hours: 14, rating: 4.9, students: 12840, price: 49,
    icon: SiReact, gradient: "from-sky-500/30 to-indigo-500/10", iconColor: "text-sky-300", bestseller: true,
  },
  {
    id: 2, title: "Modern JavaScript Deep Dive", instructor: "Daniel Reyes", category: "development",
    level: "Intermediate", lessons: 62, hours: 18, rating: 4.8, students: 9321, price: 39,
    icon: SiJavascript, gradient: "from-yellow-400/30 to-amber-600/10", iconColor: "text-yellow-300",
  },
  {
    id: 3, title: "Python for Data Analysis", instructor: "Mei Lin", category: "data",
    level: "Beginner", lessons: 40, hours: 12, rating: 4.7, students: 15402, price: 0,
    icon: SiPython, gradient: "from-blue-500/30 to-yellow-400/10", iconColor: "text-blue-300",
  },
  {
    id: 4, title: "Practical Machine Learning", instructor: "Arjun Patel", category: "data",
    level: "Advanced", lessons: 55, hours: 21, rating: 4.9, students: 6210, price: 69,
    icon: SiTensorflow, gradient: "from-orange-500/30 to-red-500/10", iconColor: "text-orange-300", bestseller: true,
  },
  {
    id: 5, title: "UI Design Systems in Figma", instructor: "Lena Vogel", category: "design",
    level: "Intermediate", lessons: 32, hours: 9, rating: 4.8, students: 7034, price: 45,
    icon: SiFigma, gradient: "from-pink-500/30 to-purple-500/10", iconColor: "text-pink-300",
  },
  {
    id: 6, title: "Tailwind CSS: Beautiful Interfaces", instructor: "Sophea Chan", category: "design",
    level: "Beginner", lessons: 26, hours: 6, rating: 4.6, students: 5120, price: 0,
    icon: SiTailwindcss, gradient: "from-cyan-400/30 to-teal-500/10", iconColor: "text-cyan-300",
  },
]

export const inProgress = [
  { title: "React 19 from Zero to Production", next: "Lesson 22 · Server Actions", progress: 46, icon: SiReact, iconColor: "text-sky-300" },
  { title: "Python for Data Analysis", next: "Lesson 31 · Pandas GroupBy", progress: 78, icon: SiPython, iconColor: "text-blue-300" },
  { title: "Docker Essentials", next: "Lesson 5 · Multi-stage builds", progress: 15, icon: SiDocker, iconColor: "text-blue-400" },
]

export const testimonials = [
  { name: "Rithy Sok", role: "Frontend Developer", initials: "RS", quote: "I went from tutorials to shipping a real product in three months. The projects are what made it click." },
  { name: "Anna Kowalski", role: "Data Analyst", initials: "AK", quote: "Clear explanations, short lessons, and quizzes that actually test understanding. Perfect after work." },
  { name: "Marcus Lee", role: "Product Designer", initials: "ML", quote: "The design systems course changed how our whole team works in Figma. Worth every minute." },
]
