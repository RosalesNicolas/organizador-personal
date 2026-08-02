export type PieroCourseModality =
  | "presencial"
  | "virtual"
  | "combinado";

export type PieroCourse = {
  id: string;
  name: string;
  subject: string;
  modality: PieroCourseModality;
  schedules: string[];
  archived: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type PieroCourseFormData = {
  name: string;
  subject: string;
  modality: PieroCourseModality;
  schedules: string[];
};

export type PieroStudent = {
  id: string;
  courseId: string;
  firstName: string;
  lastName: string;
  observation: string;
  grades: Record<string, string>;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type PieroStudentFormData = {
  firstName: string;
  lastName: string;
  observation: string;
};

export type PieroGradeColumn = {
  id: string;
  courseId: string;
  name: string;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};
