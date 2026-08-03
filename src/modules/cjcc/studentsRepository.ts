import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import type {
  CjccStudent,
  CjccStudentFormData,
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
    "cjccCursos",
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
    "cjccCursos",
    courseId,
    "estudiantes",
    studentId,
  );
}

function sortStudents(
  students: CjccStudent[],
): CjccStudent[] {
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

export async function getCjccStudents(
  courseId: string,
): Promise<CjccStudent[]> {
  const snapshot = await getDocs(
    getStudentsCollection(courseId),
  );

  const students = snapshot.docs.map(
    (studentDocument) =>
      ({
        id: studentDocument.id,
        courseId,
        ...studentDocument.data(),
      }) as CjccStudent,
  );

  return sortStudents(students);
}

export async function createCjccStudent(
  courseId: string,
  formData: CjccStudentFormData,
) {
  await addDoc(getStudentsCollection(courseId), {
    courseId,
    firstName: formData.firstName,
    lastName: formData.lastName,
    observation: formData.observation,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createCjccStudentsBulk(
  courseId: string,
  students: CjccStudentFormData[],
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
        "cjccCursos",
        courseId,
        "estudiantes",
      ),
    );

    batch.set(studentReference, {
      courseId,
      firstName: student.firstName,
      lastName: student.lastName,
      observation: student.observation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function updateCjccStudent(
  courseId: string,
  studentId: string,
  formData: CjccStudentFormData,
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

export async function deleteCjccStudent(
  courseId: string,
  studentId: string,
) {
  await deleteDoc(
    getStudentReference(courseId, studentId),
  );
}


export async function getCjccStudentById(
  courseId: string,
  studentId: string,
): Promise<CjccStudent | null> {
  const snapshot = await getDoc(
    getStudentReference(courseId, studentId),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    courseId,
    ...snapshot.data(),
  } as CjccStudent;
}
