import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import type {
  CjccAssessment,
  CjccAssessmentFormData,
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

function getAssessmentsCollection(
  courseId: string,
) {
  const user = requireAuthenticatedUser();

  return collection(
    db,
    "users",
    user.uid,
    "cjccCursos",
    courseId,
    "evaluaciones",
  );
}

function getAssessmentReference(
  courseId: string,
  assessmentId: string,
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
  );
}

export async function getCjccAssessments(
  courseId: string,
): Promise<CjccAssessment[]> {
  const snapshot = await getDocs(
    getAssessmentsCollection(courseId),
  );

  const assessments = snapshot.docs.map(
    (assessmentDocument) =>
      ({
        id: assessmentDocument.id,
        courseId,
        ...assessmentDocument.data(),
      }) as CjccAssessment,
  );

  return assessments
    .filter((assessment) => !assessment.archived)
    .sort((assessmentA, assessmentB) =>
      assessmentA.assessmentDate.localeCompare(
        assessmentB.assessmentDate,
      ),
    );
}

export async function getCjccAssessmentById(
  courseId: string,
  assessmentId: string,
): Promise<CjccAssessment | null> {
  const snapshot = await getDoc(
    getAssessmentReference(
      courseId,
      assessmentId,
    ),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    courseId,
    ...snapshot.data(),
  } as CjccAssessment;
}

export async function createCjccAssessment(
  courseId: string,
  formData: CjccAssessmentFormData,
) {
  await addDoc(
    getAssessmentsCollection(courseId),
    {
      courseId,
      name: formData.name,
      assessmentDate:
        formData.assessmentDate,
      topics: formData.topics,
      recovery1Enabled:
        formData.recovery1Enabled,
      recovery2Enabled:
        formData.recovery2Enabled,
      archived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );
}

export async function updateCjccAssessment(
  courseId: string,
  assessmentId: string,
  formData: CjccAssessmentFormData,
) {
  await updateDoc(
    getAssessmentReference(
      courseId,
      assessmentId,
    ),
    {
      name: formData.name,
      assessmentDate:
        formData.assessmentDate,
      topics: formData.topics,
      recovery1Enabled:
        formData.recovery1Enabled,
      recovery2Enabled:
        formData.recovery2Enabled,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function archiveCjccAssessment(
  courseId: string,
  assessmentId: string,
) {
  await updateDoc(
    getAssessmentReference(
      courseId,
      assessmentId,
    ),
    {
      archived: true,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function deleteCjccAssessment(
  courseId: string,
  assessmentId: string,
) {
  await deleteDoc(
    getAssessmentReference(
      courseId,
      assessmentId,
    ),
  );
}
