export type WorkoutSetDetails = {
  reps: number;
  weight: number;
};

export type WorkoutExerciseProgress = {
  completedSets: boolean[];
  setDetails: WorkoutSetDetails[];
};

export type WorkoutSession = {
  routineId: string;
  startedAt: number;
  exerciseProgress: Record<string, WorkoutExerciseProgress>;
};

function getSessionKey(routineId: string) {
  return `gym-workout-session-${routineId}`;
}

export function getWorkoutSession(
  routineId: string,
): WorkoutSession | null {
  const savedSession = localStorage.getItem(
    getSessionKey(routineId),
  );

  if (!savedSession) {
    return null;
  }

  try {
    return JSON.parse(savedSession) as WorkoutSession;
  } catch {
    localStorage.removeItem(getSessionKey(routineId));
    return null;
  }
}

export function saveWorkoutSession(
  session: WorkoutSession,
) {
  localStorage.setItem(
    getSessionKey(session.routineId),
    JSON.stringify(session),
  );
}

export function clearWorkoutSession(routineId: string) {
  localStorage.removeItem(getSessionKey(routineId));
}
