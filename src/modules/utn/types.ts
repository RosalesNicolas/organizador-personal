export type UtnSubjectCode =
  | "COM"
  | "DSI"
  | "ANU"
  | "BACKEND"
  | "SEMINARIO";

export type UtnSubject = {
  id: string;
  code: UtnSubjectCode;
  name: string;
  archived: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type DeliveryStatus =
  | "pendiente"
  | "en_progreso"
  | "completado"
  | "vencido";

export type UtnDelivery = {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
  status: DeliveryStatus;
  archived: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type DeliveryFormData = {
  title: string;
  description: string;
  dueDate: string;
  status: DeliveryStatus;
};

export type ExamStatus =
  | "proximo"
  | "rendido"
  | "aprobado"
  | "desaprobado"
  | "recuperatorio";

export type UtnExam = {
  id: string;
  subjectId: string;
  title: string;
  examDate: string;
  topics: string[];
  notes: string;
  status: ExamStatus;
  archived: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ExamFormData = {
  title: string;
  examDate: string;
  topicsText: string;
  notes: string;
  status: ExamStatus;
};

export type NoteType = "nota" | "tarea";

export type UtnNote = {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  type: NoteType;
  dueDate: string;
  completed: boolean;
  archived: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type NoteFormData = {
  title: string;
  content: string;
  type: NoteType;
  dueDate: string;
};
