// Question types, as the backend grades them (see QuestionType.java):
//   SINGLE_CHOICE    options, exactly 1 correct   → picked option is the correct one
//   MULTIPLE_CHOICE  options, 2+ correct          → picked set equals the correct set
//   TRUE_FALSE       "True"/"False", seeded by the server → like single choice
//   SHORT_ANSWER     no options, accepted answers → text match (case and extra spaces ignored)
export const QUESTION_TYPES = [
  { value: "SINGLE_CHOICE", label: "Single choice", hint: "One correct answer" },
  { value: "MULTIPLE_CHOICE", label: "Multiple choice", hint: "Two or more correct" },
  { value: "TRUE_FALSE", label: "True / False", hint: "Pick True or False" },
  { value: "SHORT_ANSWER", label: "Short answer", hint: "Student types it" },
]

// Questions saved before types existed come back without one — they are single choice
export const questionType = (q) => q?.type ?? "SINGLE_CHOICE"

export const typeLabel = (type) => QUESTION_TYPES.find((t) => t.value === type)?.label ?? "Single choice"

// Has the student given any answer to this question? (answer shape depends on the type)
export const isAnswered = (type, value) =>
  type === "MULTIPLE_CHOICE" ? Array.isArray(value) && value.length > 0
    : type === "SHORT_ANSWER" ? typeof value === "string" && value.trim() !== ""
      : value != null

// One entry of the submit payload, in the field the backend reads for this type
export const toSubmitAnswer = (q, value) => {
  const type = questionType(q)
  if (type === "MULTIPLE_CHOICE") return { questionId: q.id, selectedOptionIds: value ?? [] }
  if (type === "SHORT_ANSWER") return { questionId: q.id, textAnswer: value?.trim() || null }
  return { questionId: q.id, selectedOptionId: value ?? null }
}
