import { useOutletContext } from "react-router-dom"

// Tabs inside CourseEditorLayout read the loaded course + reload() from the outlet context
export const useCourse = () => useOutletContext()
