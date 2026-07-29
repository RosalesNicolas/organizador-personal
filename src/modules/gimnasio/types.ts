export type GymRoutine = {
  id: string;
  name: string;
  description: string;
  archived: boolean;
  lastCompletedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type RoutineFormData = {
  name: string;
  description: string;
};

export type GymExercise = {
  id: string;
  routineId: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ExerciseFormData = {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
};

