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
  PieroCourse,
  PieroCourseFormData,
  PieroCourseModality,
} from "./types";

type InitialCourse = {
  id: string;
  name: string;
  subject: string;
  modality: PieroCourseModality;
  schedules: string[];
};

const initialCourses: InitialCourse[] = [
  {
    id: "mayo",
    name: "Mayo",
    subject: "Física",
    modality: "presencial",
    schedules: ["Viernes 18:30 a 20:30"],
  },
  {
    id: "agosto-virtual",
    name: "Agosto Virtual",
    subject: "Física",
    modality: "virtual",
    schedules: ["Martes 18:30 a 21:00"],
  },
  {
    id: "agosto-combinado",
    name: "Agosto Combinado",
    subject: "Física",
    modality: "combinado",
    schedules: [
      "Jueves 18:30 a 21:00",
      "Sábado 11:00 a 13:00",
    ],
  },
];

function requireAuthenticatedUser() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  return user;
}

function getCoursesCollection() {
  const user = requireAuthenticatedUser();

  return collection(
    db,
    "users",
    user.uid,
    "pieroCursos",
  );
}

function getCourseReference(courseId: string) {
  const user = requireAuthenticatedUser();

  return doc(
    db,
    "users",
    user.uid,
    "pieroCursos",
    courseId,
  );
}

async function getAllCourses(): Promise<PieroCourse[]> {
  const snapshot = await getDocs(
    getCoursesCollection(),
  );

  return snapshot.docs.map(
    (courseDocument) =>
      ({
        id: courseDocument.id,
        ...courseDocument.data(),
      }) as PieroCourse,
  );
}

function sortCourses(
  courses: PieroCourse[],
): PieroCourse[] {
  return [...courses].sort((courseA, courseB) =>
    courseA.name.localeCompare(
      courseB.name,
      "es",
      { sensitivity: "base" },
    ),
  );
}

export async function createInitialCourses() {
  const user = requireAuthenticatedUser();
  const batch = writeBatch(db);

  initialCourses.forEach((course) => {
    const courseRef = doc(
      db,
      "users",
      user.uid,
      "pieroCursos",
      course.id,
    );

    batch.set(
      courseRef,
      {
        name: course.name,
        subject: course.subject,
        modality: course.modality,
        schedules: course.schedules,
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  await batch.commit();
}

export async function createCourse(
  formData: PieroCourseFormData,
) {
  await addDoc(getCoursesCollection(), {
    name: formData.name,
    subject: formData.subject,
    modality: formData.modality,
    schedules: formData.schedules,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCourse(
  courseId: string,
  formData: PieroCourseFormData,
) {
  await updateDoc(
    getCourseReference(courseId),
    {
      name: formData.name,
      subject: formData.subject,
      modality: formData.modality,
      schedules: formData.schedules,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function archiveCourse(
  courseId: string,
) {
  await updateDoc(
    getCourseReference(courseId),
    {
      archived: true,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function restoreCourse(
  courseId: string,
) {
  await updateDoc(
    getCourseReference(courseId),
    {
      archived: false,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function deleteCourse(
  courseId: string,
) {
  await deleteDoc(getCourseReference(courseId));
}

export async function getCourses(): Promise<
  PieroCourse[]
> {
  const courses = await getAllCourses();

  return sortCourses(
    courses.filter((course) => !course.archived),
  );
}

export async function getArchivedCourses(): Promise<
  PieroCourse[]
> {
  const courses = await getAllCourses();

  return sortCourses(
    courses.filter((course) => course.archived),
  );
}

export async function getCourseById(
  courseId: string,
): Promise<PieroCourse | null> {
  const snapshot = await getDoc(
    getCourseReference(courseId),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as PieroCourse;
}
