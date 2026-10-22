import { get, post } from "./http"

export const certificateService = {
  // CertificateResponse { serialNo, studentName, courseId, courseTitle, instructorName, quizScore, issuedAt }
  // Public — no account needed to verify a serial
  verify: (serial) => get(`/certificates/${encodeURIComponent(serial)}`),
  mine: () => get("/my/certificates"),
  // Issues (or returns) the certificate for a finished course; 409 with a reason when not eligible yet
  claim: (courseId) => post(`/my/certificates/${courseId}`),
  // Staff: { summary, courses[], certificates[], awaiting[] } — admin sees all courses, instructor their own
  tracking: () => get("/manage/certificates"),
}
