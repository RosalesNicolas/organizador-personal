import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import type {
  GymRoutine,
  RoutineFormData,
} from "./types";

function getCurrentUserId() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  return user.uid;
}

function getRoutinesCollection() {
  return collection(
    db,
    "users",
    getCurrentUserId(),
    "gymRutinas",
  );
}

function getRoutineReference(routineId: string) {
  return doc(
    db,
    "users",
    getCurrentUserId(),
    "gymRutinas",
    routineId,
  );
}

export async function getRoutines(): Promise<GymRoutine[]> {
  const routinesQuery = query(
    getRoutinesCollection(),
    orderBy("createdAt", "desc"),
  );

  const snapshot = await getDocs(routinesQuery);

  return snapshot.docs.map((routineDocument) => ({
    id: routineDocument.id,
    ...routineDocument.data(),
  })) as GymRoutine[];
}

export async function getRoutineById(
  routineId: string,
): Promise<GymRoutine | null> {
  const snapshot = await getDoc(getRoutineReference(routineId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as GymRoutine;
}

export async function createRoutine(data: RoutineFormData) {
  await addDoc(getRoutinesCollection(), {
    name: data.name.trim(),
    description: data.description.trim(),
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRoutine(
  routineId: string,
  data: RoutineFormData,
) {
  await updateDoc(getRoutineReference(routineId), {
    name: data.name.trim(),
    description: data.description.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function archiveRoutine(routineId: string) {
  await updateDoc(getRoutineReference(routineId), {
    archived: true,
    updatedAt: serverTimestamp(),
  });
}

export async function restoreRoutine(routineId: string) {
  await updateDoc(getRoutineReference(routineId), {
    archived: false,
    updatedAt: serverTimestamp(),
  });
}

export async function permanentlyDeleteRoutine(routineId: string) {
  await deleteDoc(getRoutineReference(routineId));
}

export async function markRoutineAsCompleted(
  routineId: string,
  durationSeconds: number,
) {
  await updateDoc(getRoutineReference(routineId), {
    lastCompletedAt: serverTimestamp(),
    lastWorkoutDurationSeconds: Math.max(
      0,
      Math.trunc(durationSeconds),
    ),
    updatedAt: serverTimestamp(),
  });
}

