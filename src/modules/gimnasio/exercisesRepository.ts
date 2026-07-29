import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import type {
  ExerciseFormData,
  GymExercise,
} from "./types";

function getCurrentUserId() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  return user.uid;
}

function getExercisesCollection(routineId: string) {
  return collection(
    db,
    "users",
    getCurrentUserId(),
    "gymRutinas",
    routineId,
    "ejercicios",
  );
}

function getExerciseReference(
  routineId: string,
  exerciseId: string,
) {
  return doc(
    db,
    "users",
    getCurrentUserId(),
    "gymRutinas",
    routineId,
    "ejercicios",
    exerciseId,
  );
}

export async function getExercises(
  routineId: string,
): Promise<GymExercise[]> {
  const exercisesQuery = query(
    getExercisesCollection(routineId),
    orderBy("order", "asc"),
  );

  const snapshot = await getDocs(exercisesQuery);

  return snapshot.docs.map((exerciseDocument) => ({
    id: exerciseDocument.id,
    routineId,
    ...exerciseDocument.data(),
  })) as GymExercise[];
}

export async function createExercise(
  routineId: string,
  data: ExerciseFormData,
  order: number,
) {
  await addDoc(getExercisesCollection(routineId), {
    routineId,
    name: data.name.trim(),
    sets: data.sets,
    reps: data.reps,
    weight: data.weight,
    restSeconds: data.restSeconds,
    order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateExercise(
  routineId: string,
  exerciseId: string,
  data: ExerciseFormData,
) {
  await updateDoc(
    getExerciseReference(routineId, exerciseId),
    {
      name: data.name.trim(),
      sets: data.sets,
      reps: data.reps,
      weight: data.weight,
      restSeconds: data.restSeconds,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function deleteExercise(
  routineId: string,
  exerciseId: string,
) {
  await deleteDoc(
    getExerciseReference(routineId, exerciseId),
  );
}
