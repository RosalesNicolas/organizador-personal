import { useEffect, useState } from "react";
import {
  Link,
  useParams,
} from "react-router";
import {
  getFinalAttempt,
  getFinalGrade,
  isApprovedGrade,
} from "./assessmentUtils";
import { getAssessmentResults } from "./assessmentResultsRepository";
import { getCjccAssessments } from "./assessmentsRepository";
import { getCjccCourseById } from "./coursesRepository";
import { getCjccStudentById } from "./studentsRepository";
import type {
  CjccAssessment,
  CjccAttemptType,
  CjccCourse,
  CjccStudent,
  CjccStudentAssessmentResult,
} from "./types";

type AssessmentWithResult = {
  assessment: CjccAssessment;
  result: CjccStudentAssessmentResult | null;
};

const attemptLabels: Record<
  CjccAttemptType,
  string
> = {
  evaluation: "Evaluación",
  recovery1: "Recuperatorio 1",
  recovery2: "Recuperatorio 2",
};

const attemptOrder: CjccAttemptType[] = [
  "evaluation",
  "recovery1",
  "recovery2",
];

function getCumulativeApprovedTopicIds(
  result: CjccStudentAssessmentResult | null,
  attemptType: CjccAttemptType,
) {
  if (!result) {
    return [];
  }

  const evaluationIds =
    result.attempts.evaluation
      ?.approvedTopicIds ?? [];

  if (attemptType === "evaluation") {
    return Array.from(
      new Set(evaluationIds),
    );
  }

  const recovery1Ids =
    result.attempts.recovery1
      ?.approvedTopicIds ?? [];

  if (attemptType === "recovery1") {
    return Array.from(
      new Set([
        ...evaluationIds,
        ...recovery1Ids,
      ]),
    );
  }

  const recovery2Ids =
    result.attempts.recovery2
      ?.approvedTopicIds ?? [];

  return Array.from(
    new Set([
      ...evaluationIds,
      ...recovery1Ids,
      ...recovery2Ids,
    ]),
  );
}

function formatDate(value: string) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function CjccStudentDetailPage() {
  const { courseId, studentId } = useParams();

  const [course, setCourse] =
    useState<CjccCourse | null>(null);

  const [student, setStudent] =
    useState<CjccStudent | null>(null);

  const [assessmentData, setAssessmentData] =
    useState<AssessmentWithResult[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId || !studentId) {
      return;
    }

    let cancelled = false;

    Promise.all([
      getCjccCourseById(courseId),
      getCjccStudentById(courseId, studentId),
      getCjccAssessments(courseId),
    ])
      .then(
        async ([
          savedCourse,
          savedStudent,
          savedAssessments,
        ]) => {
          const resultsByAssessment =
            await Promise.all(
              savedAssessments.map(
                async (assessment) => {
                  const results =
                    await getAssessmentResults(
                      courseId,
                      assessment.id,
                    );

                  return {
                    assessment,
                    result:
                      results.find(
                        (result) =>
                          result.studentId ===
                          studentId,
                      ) ?? null,
                  };
                },
              ),
            );

          if (cancelled) {
            return;
          }

          setCourse(savedCourse);
          setStudent(savedStudent);
          setAssessmentData(
            resultsByAssessment,
          );

          if (!savedCourse || !savedStudent) {
            setError(
              "No se encontró el estudiante.",
            );
          }
        },
      )
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError(
            "No se pudo cargar el estado del estudiante.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, studentId]);

  if (!courseId || !studentId) {
    return (
      <section className="page page--cjcc">
        <p className="form-error">
          El estudiante no es válido.
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <p className="status-message">
        Cargando estado del estudiante...
      </p>
    );
  }

  if (!course || !student) {
    return (
      <section className="page page--cjcc">
        <p className="form-error">
          {error ||
            "No se encontró el estudiante."}
        </p>

        <Link to={`/cjcc/${courseId}`}>
          Volver al curso
        </Link>
      </section>
    );
  }

  return (
    <section className="page page--cjcc">
      <nav className="cjcc-page-navigation">
        <Link
          className="back-link"
          to="/cjcc"
        >
          ← Volver a cursos
        </Link>

        <Link
          className="back-link cjcc-page-navigation__right"
          to={`/cjcc/${courseId}`}
        >
          Volver al curso →
        </Link>
      </nav>

      <header className="module-header module-header--cjcc">
        <p className="module-header__eyebrow">
          {course.name}
        </p>

        <h1>
          {student.lastName},{" "}
          {student.firstName}
        </h1>

        <p>
          {student.observation ||
            "Sin observaciones generales"}
        </p>
      </header>

      <div className="section-toolbar">
        <div>
          <h2>Estado académico</h2>

          <p>
            {assessmentData.length === 1
              ? "1 evaluación"
              : `${assessmentData.length} evaluaciones`}
          </p>
        </div>
      </div>

      {assessmentData.length === 0 && (
        <section className="empty-state">
          <h2>No hay evaluaciones</h2>

          <p>
            Todavía no se registraron evaluaciones
            para este curso.
          </p>
        </section>
      )}

      <section className="cjcc-student-status-list">
        {assessmentData.map(
          ({ assessment, result }) => {
            const finalGrade =
              getFinalGrade(result);

            const finalAttempt =
              getFinalAttempt(result);

            const approved =
              finalGrade !== "—" &&
              isApprovedGrade(finalGrade);

            return (
              <article
                className="cjcc-student-status-card"
                key={assessment.id}
              >
                <header>
                  <div>
                    <small>
                      {formatDate(
                        assessment.assessmentDate,
                      )}
                    </small>

                    <h3>{assessment.name}</h3>
                  </div>

                  <span
                    className={
                      approved
                        ? "cjcc-final-grade cjcc-final-grade--approved"
                        : "cjcc-final-grade"
                    }
                  >
                    {finalGrade}
                  </span>
                </header>

                <p className="cjcc-student-status-card__summary">
                  {finalAttempt
                    ? `Nota definida por: ${
                        attemptLabels[
                          finalAttempt.type
                        ]
                      }`
                    : "Sin instancias cargadas"}
                </p>

                <div className="cjcc-student-attempt-summary">
                  {attemptOrder.map(
                    (attemptType) => {
                      const attempt =
                        result?.attempts[
                          attemptType
                        ];

                      const enabled =
                        attemptType ===
                          "evaluation" ||
                        (attemptType ===
                          "recovery1" &&
                          assessment.recovery1Enabled) ||
                        (attemptType ===
                          "recovery2" &&
                          assessment.recovery2Enabled);

                      if (!enabled) {
                        return null;
                      }

                      const cumulativeApprovedTopicIds =
                        getCumulativeApprovedTopicIds(
                          result,
                          attemptType,
                        );

                      const percentage =
                        assessment.topics.length === 0
                          ? 0
                          : Math.round(
                              (
                                cumulativeApprovedTopicIds.length /
                                assessment.topics.length
                              ) * 100,
                            );

                      const pendingTopics =
                        assessment.topics.filter(
                          (topic) =>
                            !cumulativeApprovedTopicIds.includes(
                              topic.id,
                            ),
                        );

                      return (
                        <section
                          key={attemptType}
                          className="cjcc-student-attempt-item"
                        >
                          <div>
                            <strong>
                              {
                                attemptLabels[
                                  attemptType
                                ]
                              }
                            </strong>

                            <span>
                              Nota:{" "}
                              {attempt?.grade || "—"}
                            </span>
                          </div>

                          <p>
                            Contenidos aprobados acumulados:{" "}
                            {cumulativeApprovedTopicIds.length} de{" "}
                            {
                              assessment.topics
                                .length
                            }{" "}
                            ({percentage}%)
                          </p>

                          {pendingTopics.length >
                            0 && (
                            <div>
                              <small>
                                Pendientes:
                              </small>

                              <ul>
                                {pendingTopics.map(
                                  (topic) => (
                                    <li
                                      key={topic.id}
                                    >
                                      {topic.name}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}

                          {attempt?.observation && (
                            <p>
                              Observación:{" "}
                              {attempt.observation}
                            </p>
                          )}
                        </section>
                      );
                    },
                  )}
                </div>

                <Link
                  className="primary-button primary-button--cjcc"
                  to={`/cjcc/${courseId}/evaluaciones/${assessment.id}`}
                >
                  Abrir evaluación
                </Link>
              </article>
            );
          },
        )}
      </section>

      {error && (
        <p className="form-error">{error}</p>
      )}
    </section>
  );
}







