import type { ExamStatus, UtnExam } from "./types";

type ExamListProps = {
  exams: UtnExam[];
  showArchived: boolean;
  workingId: string | null;
  onEdit: (exam: UtnExam) => void;
  onChangeStatus: (
    examId: string,
    status: ExamStatus,
  ) => Promise<void>;
  onArchive: (examId: string) => Promise<void>;
  onRestore: (examId: string) => Promise<void>;
  onDelete: (examId: string) => Promise<void>;
};

const statusLabels: Record<ExamStatus, string> = {
  proximo: "Próximo",
  rendido: "Rendido",
  aprobado: "Aprobado",
  desaprobado: "Desaprobado",
  recuperatorio: "Recuperatorio",
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function ExamList({
  exams,
  showArchived,
  workingId,
  onEdit,
  onChangeStatus,
  onArchive,
  onRestore,
  onDelete,
}: ExamListProps) {
  const visibleExams = exams.filter(
    (exam) => exam.archived === showArchived,
  );

  if (visibleExams.length === 0) {
    return (
      <section className="empty-state">
        <p>
          {showArchived
            ? "No hay parciales archivados."
            : "Todavía no hay parciales activos."}
        </p>
      </section>
    );
  }

  return (
    <section className="exam-list">
      {visibleExams.map((exam) => {
        const isWorking = workingId === exam.id;

        return (
          <article className="exam-card" key={exam.id}>
            <div className="exam-card__header">
              <div>
                <span className={`exam-status exam-status--${exam.status}`}>
                  {statusLabels[exam.status]}
                </span>
                <h3>{exam.title}</h3>
              </div>

              <time dateTime={exam.examDate}>
                {formatDate(exam.examDate)}
              </time>
            </div>

            <div className="exam-topics">
              <strong>Temas</strong>
              <ul>
                {exam.topics.map((topic, index) => (
                  <li key={`${exam.id}-${index}`}>{topic}</li>
                ))}
              </ul>
            </div>

            {exam.notes && <p className="exam-notes">{exam.notes}</p>}

            {!exam.archived && (
              <label className="delivery-status-select">
                <span>Estado</span>
                <select
                  value={exam.status}
                  disabled={isWorking}
                  onChange={(event) =>
                    void onChangeStatus(
                      exam.id,
                      event.target.value as ExamStatus,
                    )
                  }
                >
                  <option value="proximo">Próximo</option>
                  <option value="rendido">Rendido</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="desaprobado">Desaprobado</option>
                  <option value="recuperatorio">Recuperatorio</option>
                </select>
              </label>
            )}

            <div className="delivery-card__actions">
              {!exam.archived ? (
                <>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => onEdit(exam)}
                    disabled={isWorking}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className="action-button"
                    onClick={() => void onArchive(exam.id)}
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
                    onClick={() => void onRestore(exam.id)}
                    disabled={isWorking}
                  >
                    Restaurar
                  </button>

                  <button
                    type="button"
                    className="action-button action-button--danger"
                    onClick={() => void onDelete(exam.id)}
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
