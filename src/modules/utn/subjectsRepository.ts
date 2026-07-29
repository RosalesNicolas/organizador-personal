import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import type { UtnSubject, UtnSubjectCode } from "./types";

type InitialSubject = {
  id: string;
  code: UtnSubjectCode;
  name: string;
};

const initialSubjects: InitialSubject[] = [
  { id: "com", code: "COM", name: "Comunicaciones" },
  { id: "dsi", code: "DSI", name: "Diseño de Sistemas" },
  { id: "anu", code: "ANU", name: "Análisis Numérico" },
  { id: "backend", code: "BACKEND", name: "Backend" },
  { id: "seminario", code: "SEMINARIO", name: "Seminario" },
];

function getSubjectsCollection() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  return collection(db, "users", user.uid, "utnMaterias");
}

export async function createInitialSubjects() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  const batch = writeBatch(db);

  initialSubjects.forEach((subject) => {
    const subjectRef = doc(
      db,
      "users",
      user.uid,
      "utnMaterias",
      subject.id,
    );

    batch.set(
      subjectRef,
      {
        code: subject.code,
        name: subject.name,
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  await batch.commit();
}

export async function getSubjects(): Promise<UtnSubject[]> {
  const snapshot = await getDocs(getSubjectsCollection());

  return snapshot.docs
    .map((subjectDocument) => ({
      id: subjectDocument.id,
      ...subjectDocument.data(),
    })) as UtnSubject[];
}

export async function getSubjectById(
  subjectId: string,
): Promise<UtnSubject | null> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  const subjectRef = doc(
    db,
    "users",
    user.uid,
    "utnMaterias",
    subjectId,
  );

  const snapshot = await getDoc(subjectRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as UtnSubject;
}