import type { UtnNote } from "./types";

type NoteListProps = {
  notes: UtnNote[];
  showArchived: boolean;
  workingId: string | null;
  onEdit: (note: UtnNote) => void;
  onToggleCompleted: (
    noteId: string,
    completed: boolean,
  ) => Promise<void>;
  onArchive: (noteId: string) => Promise<void>;
  onRestore: (noteId: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
};

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function NoteList({
  notes,
  showArchived,
  workingId,
  onEdit,
  onToggleCompleted,
  onArchive,
  onRestore,
  onDelete,
}: NoteListProps) {
  const visibleNotes = notes.filter(
    (note) => note.archived === showArchived,
  );

  if (visibleNotes.length === 0) {
    return (
      <section className="empty-state">
        <p>
          {showArchived
            ? "No hay notas archivadas."
            : "Todavía no hay notas o tareas."}
        </p>
      </section>
    );
  }

  return (
    <section className="note-list">
      {visibleNotes.map((note) => {
        const isWorking = workingId === note.id;

        return (
          <article
            className={
              note.completed
                ? "note-card note-card--completed"
                : "note-card"
            }
            key={note.id}
          >
            <div className="note-card__header">
              <div>
                <span className={`note-type note-type--${note.type}`}>
                  {note.type === "tarea" ? "Tarea" : "Nota"}
                </span>

                <h3>{note.title}</h3>
              </div>

              {note.dueDate && (
                <time dateTime={note.dueDate}>
                  {formatDate(note.dueDate)}
                </time>
              )}
            </div>

            <p className="note-card__content">{note.content}</p>

            {!note.archived && note.type === "tarea" && (
              <button
                type="button"
                className="task-toggle-button"
                disabled={isWorking}
                onClick={() =>
                  void onToggleCompleted(note.id, !note.completed)
                }
              >
                {note.completed
                  ? "✓ Completada — marcar pendiente"
                  : "Marcar como completada"}
              </button>
            )}

            <div className="delivery-card__actions">
              {!note.archived ? (
                <>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => onEdit(note)}
                    disabled={isWorking}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className="action-button"
                    onClick={() => void onArchive(note.id)}
                    disabled={isWorking}
                  >
                    Archivar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => void onRestore(note.id)}
                    disabled={isWorking}
                  >
                    Restaurar
                  </button>

                  <button
                    type="button"
                    className="action-button action-button--danger"
                    onClick={() => void onDelete(note.id)}
                    disabled={isWorking}
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
