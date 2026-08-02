import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import type { PieroGradeColumn } from "./types";

function requireAuthenticatedUser() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  return user;
}

function getGradeColumnsCollection(
  courseId: string,
) {
  const user = requireAuthenticatedUser();

  return collection(
    db,
    "users",
    user.uid,
    "pieroCursos",
    courseId,
    "columnasCalificaciones",
  );
}

function getGradeColumnReference(
  courseId: string,
  columnId: string,
) {
  const user = requireAuthenticatedUser();

  return doc(
    db,
    "users",
    user.uid,
    "pieroCursos",
    courseId,
    "columnasCalificaciones",
    columnId,
  );
}

export async function getGradeColumns(
  courseId: string,
): Promise<PieroGradeColumn[]> {
  const snapshot = await getDocs(
    getGradeColumnsCollection(courseId),
  );

  const columns = snapshot.docs.map(
    (columnDocument) =>
      ({
        id: columnDocument.id,
        courseId,
        ...columnDocument.data(),
      }) as PieroGradeColumn,
  );

  return columns.sort(
    (columnA, columnB) =>
      columnA.order - columnB.order,
  );
}

export async function createGradeColumn(
  courseId: string,
  name: string,
  order: number,
) {
  await addDoc(
    getGradeColumnsCollection(courseId),
    {
      courseId,
      name,
      order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );
}

export async function renameGradeColumn(
  courseId: string,
  columnId: string,
  name: string,
) {
  await updateDoc(
    getGradeColumnReference(
      courseId,
      columnId,
    ),
    {
      name,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function deleteGradeColumn(
  courseId: string,
  columnId: string,
) {
  await deleteDoc(
    getGradeColumnReference(
      courseId,
      columnId,
    ),
  );
}
