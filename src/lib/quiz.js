import i18n from "@/i18n"

// Question types, as the backend grades them (see QuestionType.java):
//   SINGLE_CHOICE    options, exactly 1 correct   → picked option is the correct one
//   MULTIPLE_CHOICE  options, 2+ correct          → picked set equals the correct set
//   TRUE_FALSE       "True"/"False", seeded by the server → like single choice
//   SHORT_ANSWER     no options, accepted answers → text match (case and extra spaces ignored)
export const QUESTION_TYPES = [
  { value: "SINGLE_CHOICE", get label() { return i18n.t("admin.questionTypes.SINGLE_CHOICE") }, get hint() { return i18n.t("admin.questionTypeHints.SINGLE_CHOICE") } },
  { value: "MULTIPLE_CHOICE", get label() { return i18n.t("admin.questionTypes.MULTIPLE_CHOICE") }, get hint() { return i18n.t("admin.questionTypeHints.MULTIPLE_CHOICE") } },
  { value: "TRUE_FALSE", get label() { return i18n.t("admin.questionTypes.TRUE_FALSE") }, get hint() { return i18n.t("admin.questionTypeHints.TRUE_FALSE") } },
  { value: "SHORT_ANSWER", get label() { return i18n.t("admin.questionTypes.SHORT_ANSWER") }, get hint() { return i18n.t("admin.questionTypeHints.SHORT_ANSWER") } },
]

// Questions saved before types existed come back without one — they are single choice
export const questionType = (q) => q?.type ?? "SINGLE_CHOICE"

export const typeLabel = (type) => QUESTION_TYPES.find((t) => t.value === type)?.label ?? i18n.t("admin.questionTypes.SINGLE_CHOICE")

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
