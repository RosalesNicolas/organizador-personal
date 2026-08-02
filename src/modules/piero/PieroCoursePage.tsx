import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router";
import { getCourseById } from "./coursesRepository";
import { getGradeColumns } from "./gradeColumnsRepository";
import { StudentImport } from "../../shared/students/StudentImportPanel";
import type { StudentImportResult } from "../../shared/students/studentImport";
import { StudentForm } from "./StudentForm";
import {
  createStudent,
  createStudentsBulk,
  deleteStudent,
  getStudents,
  updateStudent,
  updateStudentGrade,
} from "./studentsRepository";
import type {
  PieroCourse,
  PieroGradeColumn,
  PieroStudent,
  PieroStudentFormData,
} from "./types";

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

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function PieroCoursePage() {
  const { courseId } = useParams();

  const [course, setCourse] =
    useState<PieroCourse | null>(null);

  const [students, setStudents] = useState<
    PieroStudent[]
  >([]);

  const [gradeColumns, setGradeColumns] =
    useState<PieroGradeColumn[]>([]);

  const [loading, setLoading] = useState(true);

  const [showStudentImport, setShowStudentImport] =
    useState(false);

  const [importingStudents, setImportingStudents] =
    useState(false);
  const [showStudentForm, setShowStudentForm] =
    useState(false);

  const [editingStudent, setEditingStudent] =
    useState<PieroStudent | null>(null);

  const [submittingStudent, setSubmittingStudent] =
    useState(false);

  const [deletingStudentId, setDeletingStudentId] =
    useState<string | null>(null);

  const [savingGradeKey, setSavingGradeKey] =
    useState<string | null>(null);

  const [searchText, setSearchText] =
    useState("");

  const [error, setError] = useState("");

  async function loadStudents(
    validCourseId: string,
  ) {
    const savedStudents =
      await getStudents(validCourseId);

    setStudents(savedStudents);
  }

  async function handleSubmitStudent(
    formData: PieroStudentFormData,
  ) {
    if (!courseId) {
      return;
    }

    try {
      setSubmittingStudent(true);
      setError("");

      if (editingStudent) {
        await updateStudent(
          courseId,
          editingStudent.id,
          formData,
        );
      } else {
        await createStudent(courseId, formData);
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

      await createStudentsBulk(
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

  function handleStartStudentImport() {
    setShowStudentForm(false);
    setEditingStudent(null);
    setShowStudentImport(true);
  }
  function handleStartCreateStudent() {
    setEditingStudent(null);
    setShowStudentForm(true);
  }

  function handleStartEditStudent(
    student: PieroStudent,
  ) {
    setEditingStudent(student);
    setShowStudentForm(true);
  }

  function handleCancelStudentForm() {
    setShowStudentForm(false);
    setEditingStudent(null);
  }

  async function handleDeleteStudent(
    student: PieroStudent,
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

      await deleteStudent(courseId, student.id);
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

  async function handleGradeChange(
    student: PieroStudent,
    column: PieroGradeColumn,
    value: string,
  ) {
    if (!courseId) {
      return;
    }

    const gradeKey =
      `${student.id}-${column.id}`;

    setStudents((currentStudents) =>
      currentStudents.map((currentStudent) =>
        currentStudent.id === student.id
          ? {
              ...currentStudent,
              grades: {
                ...currentStudent.grades,
                [column.id]: value,
              },
            }
          : currentStudent,
      ),
    );

    try {
      setSavingGradeKey(gradeKey);

      await updateStudentGrade(
        courseId,
        student.id,
        column.id,
        value,
      );
    } catch (saveError) {
      console.error(saveError);
      setError(
        "No se pudo guardar la calificación.",
      );

      await loadStudents(courseId);
    } finally {
      setSavingGradeKey(null);
    }
  }

  useEffect(() => {
    if (!courseId) {
      return;
    }

    let cancelled = false;

    Promise.all([
      getCourseById(courseId),
      getStudents(courseId),
      getGradeColumns(courseId),
    ])
      .then(
        ([
          savedCourse,
          savedStudents,
          savedColumns,
        ]) => {
          if (cancelled) {
            return;
          }

          setCourse(savedCourse);
          setStudents(savedStudents);
          setGradeColumns(savedColumns);

          if (!savedCourse) {
            setError(
              "No se encontró el curso.",
            );
          }
        },
      )
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
      <section className="page page--piero">
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
      <section className="page page--piero">
        <p className="form-error">
          {error || "No se encontró el curso."}
        </p>

        <Link to="/piero">
          Volver a Piero
        </Link>
      </section>
    );
  }

  return (
    <section className="page page--piero">
      <Link
        className="back-link"
        to="/piero"
      >
        ← Volver a cursos
      </Link>

      <header className="module-header module-header--piero">
        <p className="module-header__eyebrow">
          {formatModality(course.modality)}
        </p>

        <h1>{course.name}</h1>
        <p>{course.subject}</p>

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
          <h2>Estudiantes y notas</h2>

          <p>
            {students.length === 1
              ? "1 estudiante"
              : `${students.length} estudiantes`}
          </p>
        </div>

        <div className="piero-course-actions">
          {!showStudentForm && (
            <button
              type="button"
              className="primary-button primary-button--piero"
              onClick={handleStartCreateStudent}
            >
              Agregar estudiante
            </button>
          )}

          <button
            type="button"
            className="primary-button primary-button--piero"
            onClick={handleStartStudentImport}
          >
            Importar archivo
          </button>
          <Link
            className="primary-button primary-button--piero"
            to={`/piero/${courseId}/columnas`}
          >
            Administrar columnas
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
        <StudentForm
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
        !showStudentForm && (
          <section className="empty-state">
            <h2>No hay estudiantes cargados</h2>

            <p>
              Agregá estudiantes manualmente o
              administrá las columnas de notas.
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
        <div className="grades-table-wrapper">
          <table className="grades-table">
            <thead>
              <tr>
                <th>Apellidos</th>
                <th>Nombre</th>

                {gradeColumns.map((column) => (
                  <th key={column.id}>
                    {column.name}
                  </th>
                ))}

                <th>Observación</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((student) => {
                const deleting =
                  deletingStudentId ===
                  student.id;

                return (
                  <tr key={student.id}>
                    <td>{student.lastName}</td>
                    <td>{student.firstName}</td>

                    {gradeColumns.map(
                      (column) => {
                        const gradeKey =
                          `${student.id}-${column.id}`;

                        return (
                          <td key={column.id}>
                            <select
                              className="grade-input"
                              value={
                                student.grades?.[
                                  column.id
                                ] ?? ""
                              }
                              onChange={(event) =>
                                handleGradeChange(
                                  student,
                                  column,
                                  event.target.value,
                                )
                              }
                              aria-label={`${column.name} de ${student.lastName}, ${student.firstName}`}
                            >
                              <option value="">
                                —
                              </option>

                              {Array.from(
                                { length: 10 },
                                (_, index) =>
                                  index + 1,
                              ).map((grade) => (
                                <option
                                  key={grade}
                                  value={grade}
                                >
                                  {grade}
                                </option>
                              ))}

                              <option value="Ausente">
                                Ausente
                              </option>
                            </select>

                            {savingGradeKey ===
                              gradeKey && (
                              <small>
                                Guardando...
                              </small>
                            )}
                          </td>
                        );
                      },
                    )}

                    <td className="grades-table__observation">
                      {student.observation ||
                        "Sin observaciones"}
                    </td>

                    <td>
                      <div className="grades-table__actions">
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
                            handleDeleteStudent(
                              student,
                            )
                          }
                          disabled={deleting}
                        >
                          {deleting
                            ? "Eliminando..."
                            : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <p className="form-error">{error}</p>
      )}
    </section>
  );
}







