import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import type {
  PieroStudent,
  PieroStudentFormData,
} from "./types";

function requireAuthenticatedUser() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  return user;
}

function getStudentsCollection(courseId: string) {
  const user = requireAuthenticatedUser();

  return collection(
    db,
    "users",
    user.uid,
    "pieroCursos",
    courseId,
    "estudiantes",
  );
}

function getStudentReference(
  courseId: string,
  studentId: string,
) {
  const user = requireAuthenticatedUser();

  return doc(
    db,
    "users",
    user.uid,
    "pieroCursos",
    courseId,
    "estudiantes",
    studentId,
  );
}

function sortStudents(
  students: PieroStudent[],
): PieroStudent[] {
  return [...students].sort((studentA, studentB) => {
    const lastNameComparison =
      studentA.lastName.localeCompare(
        studentB.lastName,
        "es",
        { sensitivity: "base" },
      );

    if (lastNameComparison !== 0) {
      return lastNameComparison;
    }

    return studentA.firstName.localeCompare(
      studentB.firstName,
      "es",
      { sensitivity: "base" },
    );
  });
}

export async function getStudents(
  courseId: string,
): Promise<PieroStudent[]> {
  const snapshot = await getDocs(
    getStudentsCollection(courseId),
  );

  const students: PieroStudent[] =
    snapshot.docs.map((studentDocument) => ({
      id: studentDocument.id,
      courseId,
      ...studentDocument.data(),
    }) as PieroStudent);

  return sortStudents(students);
}

export async function createStudent(
  courseId: string,
  formData: PieroStudentFormData,
) {
  await addDoc(getStudentsCollection(courseId), {
    courseId,
    firstName: formData.firstName,
    lastName: formData.lastName,
    observation: formData.observation,
    grades: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createStudentsBulk(
  courseId: string,
  students: PieroStudentFormData[],
) {
  const user = requireAuthenticatedUser();

  if (students.length === 0) {
    return;
  }

  const batch = writeBatch(db);

  students.forEach((student) => {
    const studentReference = doc(
      collection(
        db,
        "users",
        user.uid,
        "pieroCursos",
        courseId,
        "estudiantes",
      ),
    );

    batch.set(studentReference, {
      courseId,
      firstName: student.firstName,
      lastName: student.lastName,
      observation: student.observation,
      grades: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function updateStudent(
  courseId: string,
  studentId: string,
  formData: PieroStudentFormData,
) {
  await updateDoc(
    getStudentReference(courseId, studentId),
    {
      firstName: formData.firstName,
      lastName: formData.lastName,
      observation: formData.observation,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function updateStudentGrade(
  courseId: string,
  studentId: string,
  columnId: string,
  value: string,
) {
  await updateDoc(
    getStudentReference(courseId, studentId),
    {
      [`grades.${columnId}`]: value,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function deleteStudent(
  courseId: string,
  studentId: string,
) {
  await deleteDoc(
    getStudentReference(courseId, studentId),
  );
}
