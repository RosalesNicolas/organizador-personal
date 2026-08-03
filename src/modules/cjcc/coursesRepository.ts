import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import type { CjccCourse } from "./types";

type InitialCourse = {
  id: string;
  name: string;
  subject: string;
  schedules: string[];
};

const initialCourses: InitialCourse[] = [
  {
    id: "1ro-a",
    name: "1ro A",
    subject: "Matemática",
    schedules: [
      "Lunes 11:35 a 13:45",
      "Viernes 09:20 a 10:40",
    ],
  },
  {
    id: "2do-a",
    name: "2do A",
    subject: "Matemática",
    schedules: [
      "Martes 09:20 a 11:35",
      "Viernes 07:45 a 09:05",
    ],
  },
  {
    id: "3ro-a",
    name: "3ro A",
    subject: "Matemática",
    schedules: [
      "Martes 07:45 a 09:05",
      "Jueves 07:45 a 09:05",
      "Viernes 10:55 a 11:35",
    ],
  },
  {
    id: "5to-a",
    name: "5to A",
    subject: "Matemática",
    schedules: [
      "Miércoles 07:45 a 09:05",
      "Viernes 12:55 a 14:15",
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
    "cjccCursos",
  );
}

function getCourseReference(courseId: string) {
  const user = requireAuthenticatedUser();

  return doc(
    db,
    "users",
    user.uid,
    "cjccCursos",
    courseId,
  );
}

export async function createInitialCjccCourses() {
  const user = requireAuthenticatedUser();
  const batch = writeBatch(db);

  initialCourses.forEach((course) => {
    const courseReference = doc(
      db,
      "users",
      user.uid,
      "cjccCursos",
      course.id,
    );

    batch.set(
      courseReference,
      {
        name: course.name,
        subject: course.subject,
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

export async function getCjccCourses(): Promise<
  CjccCourse[]
> {
  const snapshot = await getDocs(
    getCoursesCollection(),
  );

  const courses: CjccCourse[] =
    snapshot.docs.map((courseDocument) => ({
      id: courseDocument.id,
      ...courseDocument.data(),
    }) as CjccCourse);

  return courses
    .filter((course) => !course.archived)
    .sort((courseA, courseB) =>
      courseA.name.localeCompare(
        courseB.name,
        "es",
        { numeric: true },
      ),
    );
}

export async function getCjccCourseById(
  courseId: string,
): Promise<CjccCourse | null> {
  const snapshot = await getDoc(
    getCourseReference(courseId),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as CjccCourse;
}
