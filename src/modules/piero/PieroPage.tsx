import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CourseForm } from "./CourseForm";
import {
  archiveCourse,
  createCourse,
  createInitialCourses,
  deleteCourse,
  getArchivedCourses,
  getCourses,
  restoreCourse,
  updateCourse,
} from "./coursesRepository";
import type {
  PieroCourse,
  PieroCourseFormData,
} from "./types";

type CourseView = "active" | "archived";

function formatModality(
  modality: PieroCourse["modality"],
) {
  const labels: Record<
    PieroCourse["modality"],
    string
  > = {
    presencial: "Presencial",
    virtual: "Virtual",
    combinado: "Combinado",
  };

  return labels[modality];
}

export function PieroPage() {
  const [courses, setCourses] = useState<
    PieroCourse[]
  >([]);
  const [archivedCourses, setArchivedCourses] =
    useState<PieroCourse[]>([]);
  const [currentView, setCurrentView] =
    useState<CourseView>("active");
  const [loading, setLoading] = useState(true);
  const [creatingInitial, setCreatingInitial] =
    useState(false);
  const [showForm, setShowForm] =
    useState(false);
  const [editingCourse, setEditingCourse] =
    useState<PieroCourse | null>(null);
  const [submitting, setSubmitting] =
    useState(false);
  const [actionCourseId, setActionCourseId] =
    useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadAllCourses() {
    const [
      savedCourses,
      savedArchivedCourses,
    ] = await Promise.all([
      getCourses(),
      getArchivedCourses(),
    ]);

    setCourses(savedCourses);
    setArchivedCourses(savedArchivedCourses);
  }

  async function reloadAfterAction() {
    try {
      setError("");
      await loadAllCourses();
    } catch (loadError) {
      console.error(loadError);
      setError(
        "No se pudieron cargar los cursos.",
      );
    }
  }

  async function handleCreateInitialCourses() {
    try {
      setCreatingInitial(true);
      setError("");

      await createInitialCourses();
      await loadAllCourses();
    } catch (createError) {
      console.error(createError);
      setError(
        "No se pudieron crear los cursos iniciales.",
      );
    } finally {
      setCreatingInitial(false);
    }
  }

  async function handleSubmitCourse(
    formData: PieroCourseFormData,
  ) {
    try {
      setSubmitting(true);
      setError("");

      if (editingCourse) {
        await updateCourse(
          editingCourse.id,
          formData,
        );
      } else {
        await createCourse(formData);
      }

      setShowForm(false);
      setEditingCourse(null);
      await loadAllCourses();
    } catch (saveError) {
      console.error(saveError);
      setError(
        "No se pudo guardar el curso.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartCreate() {
    setEditingCourse(null);
    setShowForm(true);
  }

  function handleStartEdit(
    course: PieroCourse,
  ) {
    setEditingCourse(course);
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingCourse(null);
  }

  async function handleArchiveCourse(
    course: PieroCourse,
  ) {
    const confirmed = window.confirm(
      `¿Archivar el curso "${course.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionCourseId(course.id);
      setError("");

      await archiveCourse(course.id);
      await reloadAfterAction();
    } catch (archiveError) {
      console.error(archiveError);
      setError(
        "No se pudo archivar el curso.",
      );
    } finally {
      setActionCourseId(null);
    }
  }

  async function handleRestoreCourse(
    course: PieroCourse,
  ) {
    try {
      setActionCourseId(course.id);
      setError("");

      await restoreCourse(course.id);
      await reloadAfterAction();
    } catch (restoreError) {
      console.error(restoreError);
      setError(
        "No se pudo restaurar el curso.",
      );
    } finally {
      setActionCourseId(null);
    }
  }

  async function handleDeleteCourse(
    course: PieroCourse,
  ) {
    const confirmed = window.confirm(
      `¿Eliminar definitivamente el curso "${course.name}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionCourseId(course.id);
      setError("");

      await deleteCourse(course.id);
      await reloadAfterAction();
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        "No se pudo eliminar el curso.",
      );
    } finally {
      setActionCourseId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getCourses(),
      getArchivedCourses(),
    ])
      .then(
        ([
          savedCourses,
          savedArchivedCourses,
        ]) => {
          if (!cancelled) {
            setCourses(savedCourses);
            setArchivedCourses(
              savedArchivedCourses,
            );
          }
        },
      )
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError(
            "No se pudieron cargar los cursos.",
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
  }, []);

  const visibleCourses =
    currentView === "active"
      ? courses
      : archivedCourses;

  return (
    <section className="page page--piero">
      <header className="module-header module-header--piero">
        <p className="module-header__eyebrow">
          Academia
        </p>

        <h1>Piero</h1>

        <p>
          Cursos, estudiantes, contenidos dictados,
          tareas y calificaciones.
        </p>
      </header>

      <div className="piero-module-actions">
        <Link
          className="primary-button primary-button--piero"
          to="/pendientes?modulo=piero"
        >
          Ver pendientes de Piero
        </Link>
      </div>

      {!loading && (
        <nav
          className="archive-tabs"
          aria-label="Estado de los cursos"
        >
          <button
            type="button"
            className={
              currentView === "active"
                ? "archive-tabs__button archive-tabs__button--active"
                : "archive-tabs__button"
            }
            onClick={() =>
              setCurrentView("active")
            }
          >
            Activos ({courses.length})
          </button>

          <button
            type="button"
            className={
              currentView === "archived"
                ? "archive-tabs__button archive-tabs__button--active"
                : "archive-tabs__button"
            }
            onClick={() => {
              setCurrentView("archived");
              setShowForm(false);
              setEditingCourse(null);
            }}
          >
            Archivados ({archivedCourses.length})
          </button>
        </nav>
      )}

      {!loading &&
        currentView === "active" &&
        courses.length > 0 && (
          <div className="section-toolbar">
            <div>
              <h2>Cursos</h2>
              <p>{courses.length} activos</p>
            </div>

            {!showForm && (
              <button
                type="button"
                className="primary-button primary-button--piero"
                onClick={handleStartCreate}
              >
                Agregar curso
              </button>
            )}
          </div>
        )}

      {showForm &&
        currentView === "active" && (
          <CourseForm
            key={
              editingCourse?.id ?? "new-course"
            }
            initialCourse={
              editingCourse ?? undefined
            }
            submitting={submitting}
            onSubmit={handleSubmitCourse}
            onCancel={handleCancelForm}
          />
        )}

      {loading && (
        <p className="status-message">
          Cargando cursos...
        </p>
      )}

      {!loading &&
        currentView === "active" &&
        courses.length === 0 && (
          <section className="empty-state">
            <h2>Todavía no hay cursos activos</h2>

            <p>
              Creá los cursos iniciales, agregá uno
              manualmente o restaurá uno archivado.
            </p>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleStartCreate}
              >
                Agregar manualmente
              </button>

              <button
                type="button"
                className="primary-button primary-button--piero"
                onClick={
                  handleCreateInitialCourses
                }
                disabled={creatingInitial}
              >
                {creatingInitial
                  ? "Creando..."
                  : "Crear cursos iniciales"}
              </button>
            </div>
          </section>
        )}

      {!loading &&
        currentView === "archived" &&
        archivedCourses.length === 0 && (
          <section className="empty-state">
            <h2>No hay cursos archivados</h2>

            <p>
              Los cursos que archives aparecerán
              en esta sección.
            </p>
          </section>
        )}

      {!loading &&
        visibleCourses.length > 0 && (
          <section className="subject-list">
            {visibleCourses.map((course) => {
              const actionInProgress =
                actionCourseId === course.id;

              return (
                <article
                  className="subject-card"
                  key={course.id}
                >
                  <Link
                    className="subject-card__main-link"
                    to={`/piero/${course.id}`}
                  >
                    <div>
                      <span className="subject-card__code">
                        {formatModality(
                          course.modality,
                        )}
                      </span>

                      <h2>{course.name}</h2>
                      <p>{course.subject}</p>

                      <div className="course-schedules">
                        {course.schedules.map(
                          (schedule) => (
                            <small key={schedule}>
                              {schedule}
                            </small>
                          ),
                        )}
                      </div>
                    </div>

                    <span className="subject-card__status">
                      {course.archived
                        ? "Archivado"
                        : "Activo"}
                    </span>
                  </Link>

                  {currentView === "active" ? (
                    <div className="card-actions">
                      <button
                        type="button"
                        onClick={() =>
                          handleStartEdit(course)
                        }
                        disabled={
                          actionInProgress
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleArchiveCourse(
                            course,
                          )
                        }
                        disabled={
                          actionInProgress
                        }
                      >
                        Archivar
                      </button>
                    </div>
                  ) : (
                    <div className="card-actions card-actions--archived">
                      <button
                        type="button"
                        onClick={() =>
                          handleRestoreCourse(
                            course,
                          )
                        }
                        disabled={
                          actionInProgress
                        }
                      >
                        {actionInProgress
                          ? "Restaurando..."
                          : "Restaurar"}
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() =>
                          handleDeleteCourse(
                            course,
                          )
                        }
                        disabled={
                          actionInProgress
                        }
                      >
                        Eliminar definitivamente
                      </button>
                    </div>
                  )}
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


