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
  ExamFormData,
  ExamStatus,
  UtnExam,
} from "./types";

function getCurrentUserId() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  return user.uid;
}

function getExamsCollection(subjectId: string) {
  return collection(
    db,
    "users",
    getCurrentUserId(),
    "utnMaterias",
    subjectId,
    "parciales",
  );
}

function getExamReference(subjectId: string, examId: string) {
  return doc(
    db,
    "users",
    getCurrentUserId(),
    "utnMaterias",
    subjectId,
    "parciales",
    examId,
  );
}

function parseTopics(topicsText: string) {
  return topicsText
    .split("\n")
    .map((topic) => topic.trim())
    .filter(Boolean);
}

export async function getExams(subjectId: string): Promise<UtnExam[]> {
  const examsQuery = query(
    getExamsCollection(subjectId),
    orderBy("examDate", "asc"),
  );

  const snapshot = await getDocs(examsQuery);

  return snapshot.docs.map((examDocument) => ({
    id: examDocument.id,
    subjectId,
    ...examDocument.data(),
  })) as UtnExam[];
}

export async function createExam(
  subjectId: string,
  data: ExamFormData,
) {
  await addDoc(getExamsCollection(subjectId), {
    subjectId,
    title: data.title.trim(),
    examDate: data.examDate,
    topics: parseTopics(data.topicsText),
    notes: data.notes.trim(),
    status: data.status,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateExam(
  subjectId: string,
  examId: string,
  data: ExamFormData,
) {
  await updateDoc(getExamReference(subjectId, examId), {
    title: data.title.trim(),
    examDate: data.examDate,
    topics: parseTopics(data.topicsText),
    notes: data.notes.trim(),
    status: data.status,
    updatedAt: serverTimestamp(),
  });
}

export async function changeExamStatus(
  subjectId: string,
  examId: string,
  status: ExamStatus,
) {
  await updateDoc(getExamReference(subjectId, examId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function archiveExam(
  subjectId: string,
  examId: string,
) {
  await updateDoc(getExamReference(subjectId, examId), {
    archived: true,
    updatedAt: serverTimestamp(),
  });
}

export async function restoreExam(
  subjectId: string,
  examId: string,
) {
  await updateDoc(getExamReference(subjectId, examId), {
    archived: false,
    updatedAt: serverTimestamp(),
  });
}

export async function permanentlyDeleteExam(
  subjectId: string,
  examId: string,
) {
  await deleteDoc(getExamReference(subjectId, examId));
}
