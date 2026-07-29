import { useEffect, useRef, useState } from "react";
import {
  archiveNote,
  createNote,
  getNotes,
  permanentlyDeleteNote,
  restoreNote,
  toggleNoteCompleted,
  updateNote,
} from "./notesRepository";
import { NoteForm } from "./NoteForm";
import { NoteList } from "./NoteList";
import type {
  NoteFormData,
  UtnNote,
} from "./types";

type NotesSectionProps = {
  subjectId: string;
};

export function NotesSection({ subjectId }: NotesSectionProps) {
  const [notes, setNotes] = useState<UtnNote[]>([]);
  const [noteToEdit, setNoteToEdit] = useState<UtnNote | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const formContainerRef = useRef<HTMLDivElement | null>(null);

  async function reloadNotes() {
    setNotes(await getNotes(subjectId));
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
    setNoteToEdit(null);
    setShowForm(true);
    scrollToForm();
  }

  function handleEdit(note: UtnNote) {
    setNoteToEdit(note);
    setShowForm(true);
    scrollToForm();
  }

  function handleCancel() {
    setNoteToEdit(null);
    setShowForm(false);
  }

  useEffect(() => {
    let cancelled = false;

    getNotes(subjectId)
      .then((savedNotes) => {
        if (!cancelled) {
          setNotes(savedNotes);
        }
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError("No se pudieron cargar las notas.");
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

  async function handleSubmit(data: NoteFormData) {
    try {
      setSaving(true);
      setError("");

      if (noteToEdit) {
        await updateNote(subjectId, noteToEdit.id, data);
      } else {
        await createNote(subjectId, data);
      }

      await reloadNotes();
      setNoteToEdit(null);
      setShowForm(false);
    } catch (saveError) {
      console.error(saveError);
      setError("No se pudo guardar la nota.");
      throw saveError;
    } finally {
      setSaving(false);
    }
  }

  async function runAction(
    noteId: string,
    action: () => Promise<void>,
    errorMessage: string,
  ) {
    try {
      setWorkingId(noteId);
      setError("");

      await action();
      await reloadNotes();
    } catch (actionError) {
      console.error(actionError);
      setError(errorMessage);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDelete(noteId: string) {
    const confirmed = window.confirm(
      "¿Eliminar definitivamente este elemento? Esta acción no se puede deshacer.",
    );

    if (!confirmed) {
      return;
    }

    await runAction(
      noteId,
      () => permanentlyDeleteNote(subjectId, noteId),
      "No se pudo eliminar.",
    );
  }

  if (loading) {
    return <p className="status-message">Cargando notas...</p>;
  }

  return (
    <section className="notes-section">
      <button
        type="button"
        className="inline-add-button"
        onClick={handleAdd}
      >
        + Agregar nota
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
          Activas
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
          Archivadas
        </button>
      </div>

      <NoteList
        notes={notes}
        showArchived={showArchived}
        workingId={workingId}
        onEdit={handleEdit}
        onToggleCompleted={(noteId, completed) =>
          runAction(
            noteId,
            () =>
              toggleNoteCompleted(
                subjectId,
                noteId,
                completed,
              ),
            "No se pudo actualizar la tarea.",
          )
        }
        onArchive={(noteId) =>
          runAction(
            noteId,
            () => archiveNote(subjectId, noteId),
            "No se pudo archivar.",
          )
        }
        onRestore={(noteId) =>
          runAction(
            noteId,
            () => restoreNote(subjectId, noteId),
            "No se pudo restaurar.",
          )
        }
        onDelete={handleDelete}
      />

      {showForm && (
        <div
          ref={formContainerRef}
          className="item-form-container"
          key={noteToEdit?.id ?? "new-note-container"}
        >
          <NoteForm
            key={noteToEdit?.id ?? "new-note"}
            noteToEdit={noteToEdit}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
