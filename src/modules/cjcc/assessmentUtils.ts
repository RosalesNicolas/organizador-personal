import type {
  CjccAssessmentAttempt,
  CjccAttemptType,
  CjccGradeValue,
  CjccStudentAssessmentResult,
} from "./types";

const attemptOrder: CjccAttemptType[] = [
  "evaluation",
  "recovery1",
  "recovery2",
];

export function isNumericGrade(
  grade: CjccGradeValue,
): grade is Exclude<
  CjccGradeValue,
  "" | "Ausente"
> {
  return grade !== "" && grade !== "Ausente";
}

export function isApprovedGrade(
  grade: CjccGradeValue,
) {
  return (
    isNumericGrade(grade) &&
    Number(grade) >= 7
  );
}

export function getFinalAttempt(
  result: CjccStudentAssessmentResult | null,
): {
  type: CjccAttemptType;
  attempt: CjccAssessmentAttempt;
} | null {
  if (!result) {
    return null;
  }

  for (const attemptType of attemptOrder) {
    const attempt = result.attempts[attemptType];

    if (
      attempt &&
      isApprovedGrade(attempt.grade)
    ) {
      return {
        type: attemptType,
        attempt,
      };
    }
  }

  for (
    let index = attemptOrder.length - 1;
    index >= 0;
    index -= 1
  ) {
    const attemptType = attemptOrder[index];
    const attempt = result.attempts[attemptType];

    if (
      attempt &&
      attempt.grade !== ""
    ) {
      return {
        type: attemptType,
        attempt,
      };
    }
  }

  return null;
}

export function getFinalGrade(
  result: CjccStudentAssessmentResult | null,
): CjccGradeValue | "—" {
  return (
    getFinalAttempt(result)?.attempt.grade ?? "—"
  );
}

export function getApprovedTopicsPercentage(
  attempt: CjccAssessmentAttempt | undefined,
  totalTopics: number,
) {
  if (!attempt || totalTopics === 0) {
    return 0;
  }

  return Math.round(
    (attempt.approvedTopicIds.length /
      totalTopics) *
      100,
  );
}
