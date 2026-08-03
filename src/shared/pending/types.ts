export type PendingModule =
  | "cjcc"
  | "piero"
  | "utn";

export type PendingPriority =
  | "normal"
  | "high";

export type PendingTask = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  module: PendingModule;
  completed: boolean;
  priority: PendingPriority;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type PendingTaskFormData = {
  title: string;
  description: string;
  dueDate: string;
  module: PendingModule;
  priority: PendingPriority;
};
