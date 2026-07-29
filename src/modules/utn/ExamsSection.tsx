import { useEffect, useRef, useState } from "react";
import {
  archiveExam,
  changeExamStatus,
  createExam,
  getExams,
  permanentlyDeleteExam,
  restoreExam,
  updateExam,
} from "./examsRepository";
import { ExamForm } from "./ExamForm";
import { ExamList } from "./ExamList";
import type {
  ExamFormData,
  ExamStatus,
  UtnExam,
} from "./types";

type ExamsSectionProps = {
  subjectId: string;
};

export function ExamsSection({ subjectId }: ExamsSectionProps) {
  const [exams, setExams] = useState<UtnExam[]>([]);
  const [examToEdit, setExamToEdit] = useState<UtnExam | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const formContainerRef = useRef<HTMLDivElement | null>(null);

  async function reloadExams() {
    const savedExams = await getExams(subjectId);
    setExams(savedExams);
  }

  function scrollToForm() {
    window.requestAnimationFrame(() => {
      formContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function handleAdd() {
    setExamToEdit(null);
    setShowForm(true);
    scrollToForm();
  }

  function handleEdit(exam: UtnExam) {
    setExamToEdit(exam);
    setShowForm(true);
    scrollToForm();
  }

  function handleCancelForm() {
    setExamToEdit(null);
    setShowForm(false);
  }

  useEffect(() => {
    let cancelled = false;

    getExams(subjectId)
      .then((savedExams) => {
        if (!cancelled) {
          setExams(savedExams);
        }
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError("No se pudieron cargar los parciales.");
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
  }, [subjectId]);

  async function handleSubmit(data: ExamFormData) {
    try {
      setSaving(true);
      setError("");

      if (examToEdit) {
        await updateExam(subjectId, examToEdit.id, data);
      } else {
        await createExam(subjectId, data);
      }

      await reloadExams();
      setExamToEdit(null);
      setShowForm(false);
    } catch (saveError) {
      console.error(saveError);
      setError("No se pudo guardar el parcial.");
      throw saveError;
    } finally {
      setSaving(false);
    }
  }

  async function runAction(
    examId: string,
    action: () => Promise<void>,
    errorMessage: string,
  ) {
    try {
      setWorkingId(examId);
      setError("");

      await action();
      await reloadExams();
    } catch (actionError) {
      console.error(actionError);
      setError(errorMessage);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleChangeStatus(
    examId: string,
    status: ExamStatus,
  ) {
    await runAction(
      examId,
      () => changeExamStatus(subjectId, examId, status),
      "No se pudo cambiar el estado.",
    );
  }

  async function handleDelete(examId: string) {
    const confirmed = window.confirm(
      "¿Eliminar definitivamente este parcial? Esta acción no se puede deshacer.",
    );

    if (!confirmed) {
      return;
    }

    await runAction(
      examId,
      () => permanentlyDeleteExam(subjectId, examId),
      "No se pudo eliminar el parcial.",
    );
  }

  if (loading) {
    return <p className="status-message">Cargando parciales...</p>;
  }

  return (
    <section className="exams-section">
      <button
        type="button"
        className="inline-add-button"
        onClick={handleAdd}
      >
        + Agregar parcial
      </button>

      <div className="archive-toggle">
        <button
          type="button"
          className={
            !showArchived
              ? "subject-tab subject-tab--active"
              : "subject-tab"
          }
          onClick={() => setShowArchived(false)}
        >
          Activos
        </button>

        <button
          type="button"
          className={
            showArchived
              ? "subject-tab subject-tab--active"
              : "subject-tab"
          }
          onClick={() => setShowArchived(true)}
        >
          Archivados
        </button>
      </div>

      <ExamList
        exams={exams}
        showArchived={showArchived}
        workingId={workingId}
        onEdit={handleEdit}
        onChangeStatus={handleChangeStatus}
        onArchive={(examId) =>
          runAction(
            examId,
            () => archiveExam(subjectId, examId),
            "No se pudo archivar el parcial.",
          )
        }
        onRestore={(examId) =>
          runAction(
            examId,
            () => restoreExam(subjectId, examId),
            "No se pudo restaurar el parcial.",
          )
        }
        onDelete={handleDelete}
      />

      {showForm && (
        <div
          ref={formContainerRef}
          className="item-form-container"
          key={examToEdit?.id ?? "new-exam-container"}
        >
          <ExamForm
            key={examToEdit?.id ?? "new-exam"}
            examToEdit={examToEdit}
            saving={saving}
            onSubmit={handleSubmit}
            onCancelEdit={handleCancelForm}
          />
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </section>
  );
}

