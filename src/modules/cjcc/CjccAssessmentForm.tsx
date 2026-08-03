import {
  useState,
  type FormEvent,
} from "react";
import type { PendingPriority } from "../../shared/pending/types";
import type {
  CjccAssessment,
  CjccAssessmentFormData,
  CjccAssessmentTopic,
} from "./types";

export type CjccAssessmentPendingOptions = {
  createPreparationTask: boolean;
  preparationDueDate: string;
  preparationPriority: PendingPriority;
  createCorrectionTask: boolean;
  correctionDueDate: string;
  correctionPriority: PendingPriority;
};

export type CjccAssessmentSubmission = {
  assessment: CjccAssessmentFormData;
  pendingOptions: CjccAssessmentPendingOptions;
};

type CjccAssessmentFormProps = {
  initialAssessment?: CjccAssessment;
  submitting: boolean;
  onSubmit: (
    submission: CjccAssessmentSubmission,
  ) => Promise<void>;
  onCancel: () => void;
};

function createTopic(
  name: string,
  order: number,
): CjccAssessmentTopic {
  return {
    id: crypto.randomUUID(),
    name,
    order,
  };
}

function getTodayValue() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function CjccAssessmentForm({
  initialAssessment,
  submitting,
  onSubmit,
  onCancel,
}: CjccAssessmentFormProps) {
  const todayValue = getTodayValue();
  const creatingAssessment = !initialAssessment;

  const [name, setName] = useState(
    initialAssessment?.name ?? "",
  );

  const [assessmentDate, setAssessmentDate] =
    useState(
      initialAssessment?.assessmentDate ?? "",
    );

  const [topicsText, setTopicsText] = useState(
    initialAssessment?.topics
      .map((topic) => topic.name)
      .join("\n") ?? "",
  );

  const [recovery1Enabled, setRecovery1Enabled] =
    useState(
      initialAssessment?.recovery1Enabled ?? false,
    );

  const [recovery2Enabled, setRecovery2Enabled] =
    useState(
      initialAssessment?.recovery2Enabled ?? false,
    );

  const [
    createPreparationTask,
    setCreatePreparationTask,
  ] = useState(false);

  const [
    preparationDueDate,
    setPreparationDueDate,
  ] = useState("");

  const [
    preparationPriority,
    setPreparationPriority,
  ] = useState<PendingPriority>("normal");

  const [
    createCorrectionTask,
    setCreateCorrectionTask,
  ] = useState(false);

  const [
    correctionDueDate,
    setCorrectionDueDate,
  ] = useState("");

  const [
    correctionPriority,
    setCorrectionPriority,
  ] = useState<PendingPriority>("normal");

  const [formError, setFormError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedName = name.trim();

    const topicNames = topicsText
      .split("\n")
      .map((topic) => topic.trim())
      .filter(Boolean);

    if (!normalizedName) {
      setFormError(
        "Ingresá el nombre de la evaluación.",
      );
      return;
    }

    if (!assessmentDate) {
      setFormError(
        "Ingresá la fecha de la evaluación.",
      );
      return;
    }

    if (
      creatingAssessment &&
      assessmentDate < todayValue
    ) {
      setFormError(
        "La fecha de la evaluación no puede ser anterior a hoy.",
      );
      return;
    }

    if (topicNames.length === 0) {
      setFormError(
        "Ingresá al menos un contenido.",
      );
      return;
    }

    if (
      createPreparationTask &&
      !preparationDueDate
    ) {
      setFormError(
        "Ingresá la fecha para preparar la evaluación.",
      );
      return;
    }

    if (
      createPreparationTask &&
      preparationDueDate < todayValue
    ) {
      setFormError(
        "La fecha de preparación no puede ser anterior a hoy.",
      );
      return;
    }

    if (
      createPreparationTask &&
      preparationDueDate > assessmentDate
    ) {
      setFormError(
        "La preparación debe vencer antes o el mismo día de la evaluación.",
      );
      return;
    }

    if (
      createCorrectionTask &&
      !correctionDueDate
    ) {
      setFormError(
        "Ingresá la fecha para corregir la evaluación.",
      );
      return;
    }

    if (
      createCorrectionTask &&
      correctionDueDate < assessmentDate
    ) {
      setFormError(
        "La fecha de corrección no puede ser anterior a la evaluación.",
      );
      return;
    }

    const existingTopicsByName = new Map(
      initialAssessment?.topics.map((topic) => [
        topic.name.toLocaleLowerCase("es"),
        topic,
      ]) ?? [],
    );

    const topics = topicNames.map(
      (topicName, index) => {
        const existingTopic =
          existingTopicsByName.get(
            topicName.toLocaleLowerCase("es"),
          );

        return (
          existingTopic ??
          createTopic(topicName, index)
        );
      },
    );

    setFormError("");

    await onSubmit({
      assessment: {
        name: normalizedName,
        assessmentDate,
        topics: topics.map((topic, index) => ({
          ...topic,
          order: index,
        })),
        recovery1Enabled,
        recovery2Enabled:
          recovery1Enabled &&
          recovery2Enabled,
      },
      pendingOptions: {
        createPreparationTask:
          creatingAssessment &&
          createPreparationTask,
        preparationDueDate,
        preparationPriority,
        createCorrectionTask:
          creatingAssessment &&
          createCorrectionTask,
        correctionDueDate,
        correctionPriority,
      },
    });
  }

  return (
    <form
      className="entity-form cjcc-assessment-form"
      onSubmit={handleSubmit}
    >
      <h3>
        {initialAssessment
          ? "Editar evaluación"
          : "Nueva evaluación"}
      </h3>

      <label>
        Nombre

        <input
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          placeholder="Ejemplo: Evaluación 1"
          disabled={submitting}
        />
      </label>

      <label>
        Fecha

        <input
          type="date"
          value={assessmentDate}
          min={
            creatingAssessment
              ? todayValue
              : undefined
          }
          onChange={(event) =>
            setAssessmentDate(
              event.target.value,
            )
          }
          disabled={submitting}
        />
      </label>

      <label>
        Contenidos

        <textarea
          value={topicsText}
          onChange={(event) =>
            setTopicsText(event.target.value)
          }
          rows={6}
          placeholder={
            "Un contenido por línea\nEjemplo:\nEcuaciones\nProporcionalidad\nPorcentajes"
          }
          disabled={submitting}
        />
      </label>

      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={recovery1Enabled}
          onChange={(event) => {
            setRecovery1Enabled(
              event.target.checked,
            );

            if (!event.target.checked) {
              setRecovery2Enabled(false);
            }
          }}
          disabled={submitting}
        />

        Habilitar recuperatorio 1
      </label>

      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={recovery2Enabled}
          onChange={(event) =>
            setRecovery2Enabled(
              event.target.checked,
            )
          }
          disabled={
            submitting || !recovery1Enabled
          }
        />

        Habilitar recuperatorio 2
      </label>

      {creatingAssessment && (
        <section className="cjcc-assessment-pending-options">
          <header>
            <small>Organización</small>

            <h4>Generar pendientes</h4>

            <p>
              Estas tareas aparecerán en Inicio y
              en la lista de pendientes de CJCC.
            </p>
          </header>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={createPreparationTask}
              onChange={(event) =>
                setCreatePreparationTask(
                  event.target.checked,
                )
              }
              disabled={submitting}
            />

            Crear tarea para preparar la evaluación
          </label>

          {createPreparationTask && (
            <div className="cjcc-pending-option-fields">
              <label>
                Fecha límite para preparar

                <input
                  type="date"
                  value={preparationDueDate}
                  min={todayValue}
                  max={assessmentDate || undefined}
                  onChange={(event) =>
                    setPreparationDueDate(
                      event.target.value,
                    )
                  }
                  disabled={submitting}
                />
              </label>

              <label>
                Prioridad

                <select
                  value={preparationPriority}
                  onChange={(event) =>
                    setPreparationPriority(
                      event.target
                        .value as PendingPriority,
                    )
                  }
                  disabled={submitting}
                >
                  <option value="normal">
                    Normal
                  </option>

                  <option value="high">
                    Alta
                  </option>
                </select>
              </label>
            </div>
          )}

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={createCorrectionTask}
              onChange={(event) =>
                setCreateCorrectionTask(
                  event.target.checked,
                )
              }
              disabled={submitting}
            />

            Crear tarea para corregir la evaluación
          </label>

          {createCorrectionTask && (
            <div className="cjcc-pending-option-fields">
              <label>
                Fecha límite para corregir

                <input
                  type="date"
                  value={correctionDueDate}
                  min={
                    assessmentDate || todayValue
                  }
                  onChange={(event) =>
                    setCorrectionDueDate(
                      event.target.value,
                    )
                  }
                  disabled={submitting}
                />
              </label>

              <label>
                Prioridad

                <select
                  value={correctionPriority}
                  onChange={(event) =>
                    setCorrectionPriority(
                      event.target
                        .value as PendingPriority,
                    )
                  }
                  disabled={submitting}
                >
                  <option value="normal">
                    Normal
                  </option>

                  <option value="high">
                    Alta
                  </option>
                </select>
              </label>
            </div>
          )}
        </section>
      )}

      {formError && (
        <p className="form-error">
          {formError}
        </p>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="primary-button primary-button--cjcc"
          disabled={submitting}
        >
          {submitting
            ? "Guardando..."
            : initialAssessment
              ? "Guardar cambios"
              : "Crear evaluación"}
        </button>
      </div>
    </form>
  );
}
