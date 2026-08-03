import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router";
import { StudentImport } from "../../shared/students/StudentImportPanel";
import type { StudentImportResult } from "../../shared/students/studentImport";
import { getCjccCourseById } from "./coursesRepository";
import { CjccStudentForm } from "./CjccStudentForm";
import {
  createCjccStudent,
  createCjccStudentsBulk,
  deleteCjccStudent,
  getCjccStudents,
  updateCjccStudent,
} from "./studentsRepository";
import type {
  CjccCourse,
  CjccStudent,
  CjccStudentFormData,
} from "./types";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function CjccCoursePage() {
  const { courseId } = useParams();

  const [course, setCourse] =
    useState<CjccCourse | null>(null);

  const [students, setStudents] = useState<
    CjccStudent[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [showStudentForm, setShowStudentForm] =
    useState(false);

  const [showStudentImport, setShowStudentImport] =
    useState(false);

  const [editingStudent, setEditingStudent] =
    useState<CjccStudent | null>(null);

  const [submittingStudent, setSubmittingStudent] =
    useState(false);

  const [importingStudents, setImportingStudents] =
    useState(false);

  const [deletingStudentId, setDeletingStudentId] =
    useState<string | null>(null);

  const [searchText, setSearchText] =
    useState("");

  const [error, setError] = useState("");

  async function loadStudents(
    validCourseId: string,
  ) {
    const savedStudents =
      await getCjccStudents(validCourseId);

    setStudents(savedStudents);
  }

  async function handleSubmitStudent(
    formData: CjccStudentFormData,
  ) {
    if (!courseId) {
      return;
    }

    try {
      setSubmittingStudent(true);
      setError("");

      if (editingStudent) {
        await updateCjccStudent(
          courseId,
          editingStudent.id,
          formData,
        );
      } else {
        await createCjccStudent(
          courseId,
          formData,
        );
      }

      setShowStudentForm(false);
      setEditingStudent(null);

      await loadStudents(courseId);
    } catch (saveError) {
      console.error(saveError);
      setError(
        "No se pudo guardar el estudiante.",
      );
    } finally {
      setSubmittingStudent(false);
    }
  }

  async function handleImportStudents(
    result: StudentImportResult,
  ) {
    if (!courseId) {
      return;
    }

    try {
      setImportingStudents(true);
      setError("");

      await createCjccStudentsBulk(
        courseId,
        result.validRows.map((student) => ({
          firstName: student.firstName,
          lastName: student.lastName,
          observation: student.observation,
        })),
      );

      setShowStudentImport(false);
      await loadStudents(courseId);
    } catch (importError) {
      console.error(importError);
      setError(
        "No se pudieron importar los estudiantes.",
      );
    } finally {
      setImportingStudents(false);
    }
  }

  function handleStartCreateStudent() {
    setShowStudentImport(false);
    setEditingStudent(null);
    setShowStudentForm(true);
  }

  function handleStartStudentImport() {
    setShowStudentForm(false);
    setEditingStudent(null);
    setShowStudentImport(true);
  }

  function handleStartEditStudent(
    student: CjccStudent,
  ) {
    setShowStudentImport(false);
    setEditingStudent(student);
    setShowStudentForm(true);
  }

  function handleCancelStudentForm() {
    setShowStudentForm(false);
    setEditingStudent(null);
  }

  async function handleDeleteStudent(
    student: CjccStudent,
  ) {
    if (!courseId) {
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar a ${student.lastName}, ${student.firstName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingStudentId(student.id);
      setError("");

      await deleteCjccStudent(
        courseId,
        student.id,
      );

      await loadStudents(courseId);
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        "No se pudo eliminar el estudiante.",
      );
    } finally {
      setDeletingStudentId(null);
    }
  }

  useEffect(() => {
    if (!courseId) {
      return;
    }

    let cancelled = false;

    Promise.all([
      getCjccCourseById(courseId),
      getCjccStudents(courseId),
    ])
      .then(([savedCourse, savedStudents]) => {
        if (cancelled) {
          return;
        }

        setCourse(savedCourse);
        setStudents(savedStudents);

        if (!savedCourse) {
          setError("No se encontró el curso.");
        }
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError(
            "No se pudo cargar el curso.",
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

  const filteredStudents = useMemo(() => {
    const normalizedSearch =
      normalizeText(searchText);

    if (!normalizedSearch) {
      return students;
    }

    return students.filter((student) => {
      const fullName = normalizeText(
        `${student.lastName} ${student.firstName}`,
      );

      return fullName.includes(
        normalizedSearch,
      );
    });
  }, [searchText, students]);

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
        Cargando curso...
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
      <Link
        className="back-link"
        to="/cjcc"
      >
        ← Volver a cursos
      </Link>

      <header className="module-header module-header--cjcc">
        <p className="module-header__eyebrow">
          Matemática
        </p>

        <h1>{course.name}</h1>

        <div className="course-detail-schedules">
          {course.schedules.map((schedule) => (
            <small key={schedule}>
              {schedule}
            </small>
          ))}
        </div>
      </header>

      <div className="section-toolbar">
        <div>
          <h2>Estudiantes</h2>

          <p>
            {students.length === 1
              ? "1 estudiante"
              : `${students.length} estudiantes`}
          </p>
        </div>

        <div className="cjcc-course-actions">
          {!showStudentForm && (
            <button
              type="button"
              className="primary-button primary-button--cjcc"
              onClick={handleStartCreateStudent}
            >
              Agregar estudiante
            </button>
          )}

          <button
            type="button"
            className="primary-button primary-button--cjcc"
            onClick={handleStartStudentImport}
          >
            Importar archivo
          </button>

          <Link
            className="primary-button primary-button--cjcc"
            to={`/cjcc/${courseId}/evaluaciones`}
          >
            Evaluaciones
          </Link>
        </div>
      </div>

      {showStudentImport && (
        <StudentImport
          importing={importingStudents}
          onConfirm={handleImportStudents}
          onCancel={() =>
            setShowStudentImport(false)
          }
        />
      )}

      {showStudentForm && (
        <CjccStudentForm
          key={
            editingStudent?.id ??
            "new-student"
          }
          initialStudent={
            editingStudent ?? undefined
          }
          submitting={submittingStudent}
          onSubmit={handleSubmitStudent}
          onCancel={handleCancelStudentForm}
        />
      )}

      {students.length > 0 && (
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
      )}

      {students.length === 0 &&
        !showStudentForm &&
        !showStudentImport && (
          <section className="empty-state">
            <h2>No hay estudiantes cargados</h2>

            <p>
              Podés agregarlos manualmente o
              importarlos desde Excel o CSV.
            </p>
          </section>
        )}

      {students.length > 0 &&
        filteredStudents.length === 0 && (
          <section className="empty-state">
            <h2>No hay coincidencias</h2>

            <p>
              Probá con otro nombre o apellido.
            </p>
          </section>
        )}

      {filteredStudents.length > 0 && (
        <section className="cjcc-student-list">
          {filteredStudents.map((student) => {
            const deleting =
              deletingStudentId === student.id;

            return (
              <article
                className="cjcc-student-card"
                key={student.id}
              >
                <div className="cjcc-student-card__content">
                  <h3>
                    {student.lastName},{" "}
                    {student.firstName}
                  </h3>

                  <p>
                    {student.observation ||
                      "Sin observaciones"}
                  </p>
                </div>

                <div className="cjcc-student-card__actions">
                  <Link
                    className="cjcc-student-card__status-link"
                    to={`/cjcc/${courseId}/estudiantes/${student.id}`}
                  >
                    Ver estado
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      handleStartEditStudent(
                        student,
                      )
                    }
                    disabled={deleting}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={() =>
                      handleDeleteStudent(student)
                    }
                    disabled={deleting}
                  >
                    {deleting
                      ? "Eliminando..."
                      : "Eliminar"}
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


