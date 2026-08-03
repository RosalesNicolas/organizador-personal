export type CjccCourse = {
  id: string;
  name: string;
  subject: string;
  schedules: string[];
  archived: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CjccStudent = {
  id: string;
  courseId: string;
  firstName: string;
  lastName: string;
  observation: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CjccStudentFormData = {
  firstName: string;
  lastName: string;
  observation: string;
};

export type CjccAssessmentTopic = {
  id: string;
  name: string;
  order: number;
};

export type CjccAssessment = {
  id: string;
  courseId: string;
  name: string;
  assessmentDate: string;
  topics: CjccAssessmentTopic[];
  recovery1Enabled: boolean;
  recovery2Enabled: boolean;
  archived: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CjccAssessmentFormData = {
  name: string;
  assessmentDate: string;
  topics: CjccAssessmentTopic[];
  recovery1Enabled: boolean;
  recovery2Enabled: boolean;
};

export type CjccAttemptType =
  | "evaluation"
  | "recovery1"
  | "recovery2";

export type CjccGradeValue =
  | ""
  | "Ausente"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10";

export type CjccAssessmentAttempt = {
  grade: CjccGradeValue;
  approvedTopicIds: string[];
  observation: string;
  updatedAt?: unknown;
};

export type CjccStudentAssessmentResult = {
  id: string;
  courseId: string;
  assessmentId: string;
  studentId: string;
  attempts: Partial<
    Record<CjccAttemptType, CjccAssessmentAttempt>
  >;
  createdAt?: unknown;
  updatedAt?: unknown;
};
