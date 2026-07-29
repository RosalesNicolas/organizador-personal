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
  NoteFormData,
  UtnNote,
} from "./types";

function getCurrentUserId() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  return user.uid;
}

function getNotesCollection(subjectId: string) {
  return collection(
    db,
    "users",
    getCurrentUserId(),
    "utnMaterias",
    subjectId,
    "notas",
  );
}

function getNoteReference(subjectId: string, noteId: string) {
  return doc(
    db,
    "users",
    getCurrentUserId(),
    "utnMaterias",
    subjectId,
    "notas",
    noteId,
  );
}

export async function getNotes(
  subjectId: string,
): Promise<UtnNote[]> {
  const notesQuery = query(
    getNotesCollection(subjectId),
    orderBy("createdAt", "desc"),
  );

  const snapshot = await getDocs(notesQuery);

  return snapshot.docs.map((noteDocument) => ({
    id: noteDocument.id,
    subjectId,
    ...noteDocument.data(),
  })) as UtnNote[];
}

export async function createNote(
  subjectId: string,
  data: NoteFormData,
) {
  await addDoc(getNotesCollection(subjectId), {
    subjectId,
    title: data.title.trim(),
    content: data.content.trim(),
    type: data.type,
    dueDate: data.dueDate,
    completed: false,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateNote(
  subjectId: string,
  noteId: string,
  data: NoteFormData,
) {
  await updateDoc(getNoteReference(subjectId, noteId), {
    title: data.title.trim(),
    content: data.content.trim(),
    type: data.type,
    dueDate: data.dueDate,
    updatedAt: serverTimestamp(),
  });
}

export async function toggleNoteCompleted(
  subjectId: string,
  noteId: string,
  completed: boolean,
) {
  await updateDoc(getNoteReference(subjectId, noteId), {
    completed,
    updatedAt: serverTimestamp(),
  });
}

export async function archiveNote(
  subjectId: string,
  noteId: string,
) {
  await updateDoc(getNoteReference(subjectId, noteId), {
    archived: true,
    updatedAt: serverTimestamp(),
  });
}

export async function restoreNote(
  subjectId: string,
  noteId: string,
) {
  await updateDoc(getNoteReference(subjectId, noteId), {
    archived: false,
    updatedAt: serverTimestamp(),
  });
}

export async function permanentlyDeleteNote(
  subjectId: string,
  noteId: string,
) {
  await deleteDoc(getNoteReference(subjectId, noteId));
}
