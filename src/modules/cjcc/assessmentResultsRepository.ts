import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import type {
  CjccAssessmentAttempt,
  CjccAttemptType,
  CjccStudentAssessmentResult,
} from "./types";

function requireAuthenticatedUser() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "No hay un usuario autenticado.",
    );
  }

  return user;
}

function getResultsCollection(
  courseId: string,
  assessmentId: string,
) {
  const user = requireAuthenticatedUser();

  return collection(
    db,
    "users",
    user.uid,
    "cjccCursos",
    courseId,
    "evaluaciones",
    assessmentId,
    "resultados",
  );
}

function getResultReference(
  courseId: string,
  assessmentId: string,
  studentId: string,
) {
  const user = requireAuthenticatedUser();

  return doc(
    db,
    "users",
    user.uid,
    "cjccCursos",
    courseId,
    "evaluaciones",
    assessmentId,
    "resultados",
    studentId,
  );
}

export async function getAssessmentResults(
  courseId: string,
  assessmentId: string,
): Promise<CjccStudentAssessmentResult[]> {
  const snapshot = await getDocs(
    getResultsCollection(
      courseId,
      assessmentId,
    ),
  );

  return snapshot.docs.map(
    (resultDocument) =>
      ({
        id: resultDocument.id,
        courseId,
        assessmentId,
        ...resultDocument.data(),
      }) as CjccStudentAssessmentResult,
  );
}

export async function saveAssessmentAttempt(
  courseId: string,
  assessmentId: string,
  studentId: string,
  attemptType: CjccAttemptType,
  attempt: CjccAssessmentAttempt,
) {
  const resultReference = getResultReference(
    courseId,
    assessmentId,
    studentId,
  );

  const currentSnapshot =
    await getDoc(resultReference);

  const currentResult =
    currentSnapshot.exists()
      ? (currentSnapshot.data() as CjccStudentAssessmentResult)
      : null;

  await setDoc(
    resultReference,
    {
      courseId,
      assessmentId,
      studentId,
      attempts: {
        ...(currentResult?.attempts ?? {}),
        [attemptType]: {
          grade: attempt.grade,
          approvedTopicIds:
            attempt.approvedTopicIds,
          observation: attempt.observation,
          updatedAt: serverTimestamp(),
        },
      },
      createdAt:
        currentResult?.createdAt ??
        serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
