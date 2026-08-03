import { useEffect, useState } from "react";
import {
  Link,
  useParams,
} from "react-router";
import {
  archiveCjccAssessment,
  createCjccAssessment,
  getCjccAssessments,
  updateCjccAssessment,
} from "./assessmentsRepository";
import { createPendingTask } from "../../shared/pending/pendingRepository";
import {
  CjccAssessmentForm,
  type CjccAssessmentSubmission,
} from "./CjccAssessmentForm";
import { getCjccCourseById } from "./coursesRepository";
import type {
  CjccAssessment,
  CjccCourse,
} from "./types";

function formatDate(date: string) {
  if (!date) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(
    new Date(`${date}T12:00:00`),
  );
}

export function CjccAssessmentsPage() {
  const { courseId } = useParams();

  const [course, setCourse] =
    useState<CjccCourse | null>(null);

  const [assessments, setAssessments] =
    useState<CjccAssessment[]>([]);

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [editingAssessment, setEditingAssessment] =
    useState<CjccAssessment | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [actionAssessmentId, setActionAssessmentId] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  async function loadAssessments(
    validCourseId: string,
  ) {
    const savedAssessments =
      await getCjccAssessments(validCourseId);

    setAssessments(savedAssessments);
  }

  async function handleSubmit(
    submission: CjccAssessmentSubmission,
  ) {
    if (!courseId || !course) {
      return;
    }

    const {
      assessment: formData,
      pendingOptions,
    } = submission;

    try {
      setSubmitting(true);
      setError("");

      if (editingAssessment) {
        await updateCjccAssessment(
          courseId,
          editingAssessment.id,
          formData,
        );
      } else {
        await createCjccAssessment(
          courseId,
          formData,
        );

        const pendingTasks = [];

        if (
          pendingOptions.createPreparationTask
        ) {
          pendingTasks.push(
            createPendingTask({
              title:
                `Preparar evaluación: ${formData.name}`,
              description:
                `${course.name} · Matemática`,
              dueDate:
                pendingOptions.preparationDueDate,
              module: "cjcc",
              priority:
                pendingOptions.preparationPriority,
            }),
          );
        }

        if (
          pendingOptions.createCorrectionTask
        ) {
          pendingTasks.push(
            createPendingTask({
              title:
                `Corregir evaluación: ${formData.name}`,
              description:
                `${course.name} · Matemática`,
              dueDate:
                pendingOptions.correctionDueDate,
              module: "cjcc",
              priority:
                pendingOptions.correctionPriority,
            }),
          );
        }

        await Promise.all(pendingTasks);
      }

      setShowForm(false);
      setEditingAssessment(null);

      await loadAssessments(courseId);
    } catch (saveError) {
      console.error(saveError);
      setError(
        "No se pudo guardar la evaluación o sus pendientes.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  function handleStartCreate() {
    setEditingAssessment(null);
    setShowForm(true);
  }

  function handleStartEdit(
    assessment: CjccAssessment,
  ) {
    setEditingAssessment(assessment);
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingAssessment(null);
  }

  async function handleArchive(
    assessment: CjccAssessment,
  ) {
    if (!courseId) {
      return;
    }

    const confirmed = window.confirm(
      `¿Archivar "${assessment.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionAssessmentId(assessment.id);
      setError("");

      await archiveCjccAssessment(
        courseId,
        assessment.id,
      );

      await loadAssessments(courseId);
    } catch (archiveError) {
      console.error(archiveError);
      setError(
        "No se pudo archivar la evaluación.",
      );
    } finally {
      setActionAssessmentId(null);
    }
  }

  useEffect(() => {
    if (!courseId) {
      return;
    }

    let cancelled = false;

    Promise.all([
      getCjccCourseById(courseId),
      getCjccAssessments(courseId),
    ])
      .then(([savedCourse, savedAssessments]) => {
        if (cancelled) {
          return;
        }

        setCourse(savedCourse);
        setAssessments(savedAssessments);

        if (!savedCourse) {
          setError(
            "No se encontró el curso.",
          );
        }
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError(
            "No se pudieron cargar las evaluaciones.",
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
  }, [courseId]);

  if (!courseId) {
    return (
      <section className="page page--cjcc">
        <p className="form-error">
          El curso no es válido.
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <p className="status-message">
        Cargando evaluaciones...
      </p>
    );
  }

  if (!course) {
    return (
      <section className="page page--cjcc">
        <p className="form-error">
          {error || "No se encontró el curso."}
        </p>

        <Link to="/cjcc">
          Volver a CJCC
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
          Evaluaciones
        </p>

        <h1>{course.name}</h1>

        <p>
          Evaluaciones, contenidos y recuperatorios.
        </p>
      </header>

      <div className="section-toolbar">
        <div>
          <h2>Evaluaciones</h2>

          <p>
            {assessments.length === 1
              ? "1 evaluación"
              : `${assessments.length} evaluaciones`}
          </p>
        </div>

        <div className="cjcc-assessment-toolbar-actions">
          <Link
            className="secondary-button cjcc-pending-link"
            to="/pendientes?modulo=cjcc"
          >
            Pendientes de CJCC
          </Link>

          {!showForm && (
            <button
              type="button"
              className="primary-button primary-button--cjcc"
              onClick={handleStartCreate}
            >
              Agregar evaluación
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <CjccAssessmentForm
          key={
            editingAssessment?.id ??
            "new-assessment"
          }
          initialAssessment={
            editingAssessment ?? undefined
          }
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
        />
      )}

      {assessments.length === 0 &&
        !showForm && (
          <section className="empty-state">
            <h2>No hay evaluaciones</h2>

            <p>
              Creá la primera evaluación y agregá
              los contenidos que se evaluarán.
            </p>
          </section>
        )}

      {assessments.length > 0 && (
        <section className="cjcc-assessment-list">
          {assessments.map((assessment) => {
            const actionInProgress =
              actionAssessmentId ===
              assessment.id;

            return (
              <article
                className="cjcc-assessment-card"
                key={assessment.id}
              >
                <Link
                  className="cjcc-assessment-card__main"
                  to={`/cjcc/${courseId}/evaluaciones/${assessment.id}`}
                >
                  <div>
                    <span className="cjcc-assessment-card__date">
                      {formatDate(
                        assessment.assessmentDate,
                      )}
                    </span>

                    <h3>{assessment.name}</h3>

                    <p>
                      {assessment.topics.length === 1
                        ? "1 contenido"
                        : `${assessment.topics.length} contenidos`}
                    </p>

                    <div className="cjcc-assessment-card__recoveries">
                      <span>
                        Recuperatorio 1:{" "}
                        {assessment.recovery1Enabled
                          ? "Sí"
                          : "No"}
                      </span>

                      <span>
                        Recuperatorio 2:{" "}
                        {assessment.recovery2Enabled
                          ? "Sí"
                          : "No"}
                      </span>
                    </div>
                  </div>

                  <span className="subject-card__status">
                    Activa
                  </span>
                </Link>

                <div className="cjcc-assessment-card__actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleStartEdit(assessment)
                    }
                    disabled={actionInProgress}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleArchive(assessment)
                    }
                    disabled={actionInProgress}
                  >
                    {actionInProgress
                      ? "Archivando..."
                      : "Archivar"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {error && (
        <p className="form-error">{error}</p>
      )}
    </section>
  );
}





