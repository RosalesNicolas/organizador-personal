import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router";
import {
  getFinalAttempt,
  getFinalGrade,
  isApprovedGrade,
} from "./assessmentUtils";
import {
  getAssessmentResults,
  saveAssessmentAttempt,
} from "./assessmentResultsRepository";
import { getCjccAssessmentById } from "./assessmentsRepository";
import { CjccAttemptEditor } from "./CjccAttemptEditor";
import { getCjccCourseById } from "./coursesRepository";
import { getCjccStudents } from "./studentsRepository";
import type {
  CjccAssessment,
  CjccAssessmentAttempt,
  CjccAttemptType,
  CjccCourse,
  CjccStudent,
  CjccStudentAssessmentResult,
} from "./types";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const attemptLabels: Record<
  CjccAttemptType,
  string
> = {
  evaluation: "Evaluación",
  recovery1: "Recuperatorio 1",
  recovery2: "Recuperatorio 2",
};

function getPreviouslyApprovedTopicIds(
  result: CjccStudentAssessmentResult | null,
  attemptType: CjccAttemptType,
) {
  if (!result || attemptType === "evaluation") {
    return [];
  }

  const approvedIds =
    result.attempts.evaluation
      ?.approvedTopicIds ?? [];

  if (attemptType === "recovery1") {
    return Array.from(new Set(approvedIds));
  }

  return Array.from(
    new Set([
      ...approvedIds,
      ...(result.attempts.recovery1
        ?.approvedTopicIds ?? []),
    ]),
  );
}

function getPreviousGrade(
  result: CjccStudentAssessmentResult | null,
  attemptType: CjccAttemptType,
) {
  if (!result || attemptType === "evaluation") {
    return "" as const;
  }

  const previousGrades =
    attemptType === "recovery1"
      ? [
          result.attempts.evaluation?.grade,
        ]
      : [
          result.attempts.evaluation?.grade,
          result.attempts.recovery1?.grade,
        ];

  const numericGrades = previousGrades
    .filter(
      (
        grade,
      ): grade is Exclude<
        NonNullable<typeof grade>,
        "" | "Ausente"
      > =>
        grade !== undefined &&
        grade !== "" &&
        grade !== "Ausente",
    )
    .map(Number);

  if (numericGrades.length === 0) {
    return "" as const;
  }

  return String(
    Math.max(...numericGrades),
  ) as
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "10";
}

function canAppearInAttempt(
  result: CjccStudentAssessmentResult | null,
  attemptType: CjccAttemptType,
) {
  if (attemptType === "evaluation") {
    return true;
  }

  const evaluationGrade =
    result?.attempts.evaluation?.grade ?? "";

  if (
    attemptType === "recovery1"
  ) {
    return !isApprovedGrade(
      evaluationGrade,
    );
  }

  const recovery1Grade =
    result?.attempts.recovery1?.grade ?? "";

  return (
    !isApprovedGrade(evaluationGrade) &&
    !isApprovedGrade(recovery1Grade)
  );
}

export function CjccAssessmentDetailPage() {
  const { courseId, assessmentId } =
    useParams();

  const [course, setCourse] =
    useState<CjccCourse | null>(null);

  const [assessment, setAssessment] =
    useState<CjccAssessment | null>(null);

  const [students, setStudents] = useState<
    CjccStudent[]
  >([]);

  const [results, setResults] = useState<
    CjccStudentAssessmentResult[]
  >([]);

  const [
    selectedAttemptType,
    setSelectedAttemptType,
  ] = useState<CjccAttemptType>(
    "evaluation",
  );

  const [selectedStudentId, setSelectedStudentId] =
    useState<string | null>(null);

  const [savingAttemptType, setSavingAttemptType] =
    useState<CjccAttemptType | null>(null);

  const [searchText, setSearchText] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadResults(
    validCourseId: string,
    validAssessmentId: string,
  ) {
    const savedResults =
      await getAssessmentResults(
        validCourseId,
        validAssessmentId,
      );

    setResults(savedResults);
  }

  function getStudentResult(
    studentId: string,
  ) {
    return (
      results.find(
        (result) =>
          result.studentId === studentId,
      ) ?? null
    );
  }

  async function handleSaveAttempt(
    studentId: string,
    attemptType: CjccAttemptType,
    attempt: CjccAssessmentAttempt,
  ) {
    if (!courseId || !assessmentId) {
      return;
    }

    try {
      setSavingAttemptType(attemptType);
      setError("");

      await saveAssessmentAttempt(
        courseId,
        assessmentId,
        studentId,
        attemptType,
        attempt,
      );

      await loadResults(
        courseId,
        assessmentId,
      );

      setSelectedStudentId(null);
    } catch (saveError) {
      console.error(saveError);
      setError(
        "No se pudo guardar la instancia.",
      );
    } finally {
      setSavingAttemptType(null);
    }
  }

  function handleChangeAttempt(
    attemptType: CjccAttemptType,
  ) {
    setSelectedAttemptType(attemptType);
    setSelectedStudentId(null);
  }

  useEffect(() => {
    if (!courseId || !assessmentId) {
      return;
    }

    let cancelled = false;

    Promise.all([
      getCjccCourseById(courseId),
      getCjccAssessmentById(
        courseId,
        assessmentId,
      ),
      getCjccStudents(courseId),
      getAssessmentResults(
        courseId,
        assessmentId,
      ),
    ])
      .then(
        ([
          savedCourse,
          savedAssessment,
          savedStudents,
          savedResults,
        ]) => {
          if (cancelled) {
            return;
          }

          setCourse(savedCourse);
          setAssessment(savedAssessment);
          setStudents(savedStudents);
          setResults(savedResults);

          if (!savedCourse || !savedAssessment) {
            setError(
              "No se encontró la evaluación.",
            );
          }
        },
      )
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError(
            "No se pudo cargar la evaluación.",
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
  }, [courseId, assessmentId]);

  const visibleStudents = useMemo(() => {
    const normalizedSearch =
      normalizeText(searchText);

    return students.filter((student) => {
      const result =
        results.find(
          (savedResult) =>
            savedResult.studentId === student.id,
        ) ?? null;

      const matchesAttempt =
        canAppearInAttempt(
          result,
          selectedAttemptType,
        );

      const matchesSearch =
        !normalizedSearch ||
        normalizeText(
          `${student.lastName} ${student.firstName}`,
        ).includes(normalizedSearch);

      return matchesAttempt && matchesSearch;
    });
  }, [
    students,
    results,
    searchText,
    selectedAttemptType,
  ]);

  if (!courseId || !assessmentId) {
    return (
      <section className="page page--cjcc">
        <p className="form-error">
          La evaluación no es válida.
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <p className="status-message">
        Cargando evaluación...
      </p>
    );
  }

  if (!course || !assessment) {
    return (
      <section className="page page--cjcc">
        <p className="form-error">
          {error ||
            "No se encontró la evaluación."}
        </p>

        <Link
          to={`/cjcc/${courseId}/evaluaciones`}
        >
          Volver a evaluaciones
        </Link>
      </section>
    );
  }

  return (
    <section className="page page--cjcc">
      <nav className="cjcc-page-navigation">
        <Link
          className="back-link"
          to={`/cjcc/${courseId}/evaluaciones`}
        >
          ← Volver a evaluaciones
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

        <h1>{assessment.name}</h1>

        <p>
          {assessment.topics.length} contenidos
        </p>
      </header>

      <nav className="cjcc-attempt-tabs">
        <button
          type="button"
          className={
            selectedAttemptType ===
            "evaluation"
              ? "cjcc-attempt-tab cjcc-attempt-tab--active"
              : "cjcc-attempt-tab"
          }
          onClick={() =>
            handleChangeAttempt("evaluation")
          }
        >
          Evaluación
        </button>

        {assessment.recovery1Enabled && (
          <button
            type="button"
            className={
              selectedAttemptType ===
              "recovery1"
                ? "cjcc-attempt-tab cjcc-attempt-tab--active"
                : "cjcc-attempt-tab"
            }
            onClick={() =>
              handleChangeAttempt("recovery1")
            }
          >
            Recuperatorio 1
          </button>
        )}

        {assessment.recovery2Enabled && (
          <button
            type="button"
            className={
              selectedAttemptType ===
              "recovery2"
                ? "cjcc-attempt-tab cjcc-attempt-tab--active"
                : "cjcc-attempt-tab"
            }
            onClick={() =>
              handleChangeAttempt("recovery2")
            }
          >
            Recuperatorio 2
          </button>
        )}
      </nav>

      <div className="cjcc-attempt-summary">
        <strong>
          {attemptLabels[selectedAttemptType]}
        </strong>

        <span>
          {visibleStudents.length === 1
            ? "1 estudiante pendiente"
            : `${visibleStudents.length} estudiantes pendientes`}
        </span>
      </div>

      <label className="student-search">
        Buscar estudiante

        <input
          type="search"
          value={searchText}
          onChange={(event) =>
            setSearchText(event.target.value)
          }
          placeholder="Apellido o nombre"
        />
      </label>

      {visibleStudents.length === 0 && (
        <section className="empty-state">
          <h2>
            No hay estudiantes pendientes
          </h2>

          <p>
            Todos los estudiantes aprobaron antes
            de esta instancia.
          </p>
        </section>
      )}

      <section className="cjcc-results-list">
        {visibleStudents.map((student) => {
          const result =
            getStudentResult(student.id);

          const finalGrade =
            getFinalGrade(result);

          const finalAttempt =
            getFinalAttempt(result);

          const isSelected =
            selectedStudentId === student.id;

          const currentAttempt =
            result?.attempts[
              selectedAttemptType
            ];

          const previouslyApprovedTopicIds =
            getPreviouslyApprovedTopicIds(
              result,
              selectedAttemptType,
            );

          const previousGrade =
            getPreviousGrade(
              result,
              selectedAttemptType,
            );

          return (
            <article
              className="cjcc-result-entry"
              key={student.id}
            >
              <button
                type="button"
                className={
                  isSelected
                    ? "cjcc-result-row cjcc-result-row--selected"
                    : "cjcc-result-row"
                }
                onClick={() =>
                  setSelectedStudentId(
                    isSelected
                      ? null
                      : student.id,
                  )
                }
              >
                <span>
                  <strong>
                    {student.lastName},{" "}
                    {student.firstName}
                  </strong>

                  <small>
                    {finalAttempt
                      ? `Nota actual: ${finalGrade}`
                      : "Sin nota cargada"}
                  </small>
                </span>

                <span
                  className={
                    currentAttempt?.grade !== undefined &&
                    currentAttempt.grade !== "" &&
                    currentAttempt.grade !== "Ausente" &&
                    Number(currentAttempt.grade) >= 7
                      ? "cjcc-final-grade cjcc-final-grade--approved"
                      : "cjcc-final-grade"
                  }
                >
                  {currentAttempt?.grade || "—"}
                </span>
              </button>

              {isSelected && (
                <section className="cjcc-student-result-detail">
                  <header>
                    <div>
                      <p>
                        {
                          attemptLabels[
                            selectedAttemptType
                          ]
                        }
                      </p>

                      <h2>
                        {student.lastName},{" "}
                        {student.firstName}
                      </h2>
                    </div>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        setSelectedStudentId(null)
                      }
                    >
                      Cerrar
                    </button>
                  </header>

                  <CjccAttemptEditor
                    key={`${selectedAttemptType}-${
                      currentAttempt?.updatedAt ??
                      "new"
                    }`}
                    assessment={assessment}
                    attemptType={
                      selectedAttemptType
                    }
                    initialAttempt={
                      currentAttempt
                    }
                    previouslyApprovedTopicIds={
                      previouslyApprovedTopicIds
                    }
                    previousGrade={
                      previousGrade
                    }
                    saving={
                      savingAttemptType ===
                      selectedAttemptType
                    }
                    onSave={(
                      attemptType,
                      attempt,
                    ) =>
                      handleSaveAttempt(
                        student.id,
                        attemptType,
                        attempt,
                      )
                    }
                  />
                </section>
              )}
            </article>
          );
        })}
      </section>

      {error && (
        <p className="form-error">{error}</p>
      )}
    </section>
  );
}






