const ACTIVE_ROUTINE_KEY = "gym-active-routine-id";

export function getActiveRoutineId() {
  return localStorage.getItem(ACTIVE_ROUTINE_KEY);
}

export function setActiveRoutineId(routineId: string) {
  localStorage.setItem(ACTIVE_ROUTINE_KEY, routineId);
}

export function clearActiveRoutineId() {
  localStorage.removeItem(ACTIVE_ROUTINE_KEY);
}

export function isRoutineActive(routineId: string) {
  return getActiveRoutineId() === routineId;
}
