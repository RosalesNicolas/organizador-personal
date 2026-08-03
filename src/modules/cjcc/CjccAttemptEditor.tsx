import { useMemo, useState } from "react";
import {
  getApprovedTopicsPercentage,
  isApprovedGrade,
  isNumericGrade,
} from "./assessmentUtils";
import type {
  CjccAssessment,
  CjccAssessmentAttempt,
  CjccAttemptType,
  CjccGradeValue,
} from "./types";

type CjccAttemptEditorProps = {
  assessment: CjccAssessment;
  attemptType: CjccAttemptType;
  initialAttempt?: CjccAssessmentAttempt;
  previouslyApprovedTopicIds: string[];
  previousGrade: CjccGradeValue;
  saving: boolean;
  onSave: (
    attemptType: CjccAttemptType,
    attempt: CjccAssessmentAttempt,
  ) => Promise<void>;
};

const attemptLabels: Record<
  CjccAttemptType,
  string
> = {
  evaluation: "Evaluación",
  recovery1: "Recuperatorio 1",
  recovery2: "Recuperatorio 2",
};

const gradeOptions: CjccGradeValue[] = [
  "",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "Ausente",
];

export function CjccAttemptEditor({
  assessment,
  attemptType,
  initialAttempt,
  previouslyApprovedTopicIds,
  previousGrade,
  saving,
  onSave,
}: CjccAttemptEditorProps) {
  const availableTopics = useMemo(
    () =>
      assessment.topics.filter(
        (topic) =>
          !previouslyApprovedTopicIds.includes(
            topic.id,
          ),
      ),
    [
      assessment.topics,
      previouslyApprovedTopicIds,
    ],
  );

  const availableTopicIds = useMemo(
    () => availableTopics.map((topic) => topic.id),
    [availableTopics],
  );

  const [grade, setGrade] =
    useState<CjccGradeValue>(
      initialAttempt?.grade ?? "",
    );

  const [
    approvedTopicIds,
    setApprovedTopicIds,
  ] = useState<string[]>(
    initialAttempt?.approvedTopicIds.filter(
      (topicId) =>
        availableTopicIds.includes(topicId),
    ) ?? [],
  );

  const [observation, setObservation] =
    useState(
      initialAttempt?.observation ?? "",
    );

  const [formError, setFormError] =
    useState("");

  const allAvailableTopicsSelected =
    availableTopics.length > 0 &&
    availableTopics.every((topic) =>
      approvedTopicIds.includes(topic.id),
    );

  function toggleTopic(topicId: string) {
    setApprovedTopicIds((currentIds) =>
      currentIds.includes(topicId)
        ? currentIds.filter(
            (currentId) =>
              currentId !== topicId,
          )
        : [...currentIds, topicId],
    );
  }

  function toggleAllTopics() {
    if (allAvailableTopicsSelected) {
      setApprovedTopicIds([]);
      return;
    }

    setApprovedTopicIds(availableTopicIds);
  }

  async function handleSave() {
    if (
      isNumericGrade(previousGrade) &&
      isNumericGrade(grade) &&
      Number(grade) < Number(previousGrade)
    ) {
      setFormError(
        `La nota del recuperatorio no puede ser menor que la nota anterior (${previousGrade}).`,
      );
      return;
    }

    setFormError("");

    await onSave(attemptType, {
      grade,
      approvedTopicIds,
      observation: observation.trim(),
    });
  }

  const totalApprovedTopicIds = Array.from(
    new Set([
      ...previouslyApprovedTopicIds,
      ...approvedTopicIds,
    ]),
  );

  const percentage =
    getApprovedTopicsPercentage(
      {
        grade,
        approvedTopicIds:
          totalApprovedTopicIds,
        observation,
      },
      assessment.topics.length,
    );

  const selectableGradeOptions =
    attemptType === "evaluation" ||
    !isNumericGrade(previousGrade)
      ? gradeOptions
      : gradeOptions.filter(
          (option) =>
            option === "" ||
            option === "Ausente" ||
            (isNumericGrade(option) &&
              Number(option) >=
                Number(previousGrade)),
        );

  return (
    <section className="cjcc-attempt-editor">
      <header className="cjcc-attempt-editor__header">
        <div>
          <h4>{attemptLabels[attemptType]}</h4>

          <p>
            {totalApprovedTopicIds.length} de{" "}
            {assessment.topics.length} contenidos
            aprobados · {percentage}%
          </p>
        </div>

        <span
          className={
            isApprovedGrade(grade)
              ? "cjcc-attempt-status cjcc-attempt-status--approved"
              : "cjcc-attempt-status"
          }
        >
          {grade === ""
            ? "Sin nota"
            : isApprovedGrade(grade)
              ? "Aprobado"
              : grade === "Ausente"
                ? "Ausente"
                : "No aprobado"}
        </span>
      </header>

      <label>
        Nota

        <select
          value={grade}
          onChange={(event) => {
            setGrade(
              event.target
                .value as CjccGradeValue,
            );
            setFormError("");
          }}
          disabled={saving}
        >
          {selectableGradeOptions.map(
            (option) => (
              <option
                key={option || "empty"}
                value={option}
              >
                {option || "—"}
              </option>
            ),
          )}
        </select>
      </label>

      {attemptType !== "evaluation" &&
        isNumericGrade(previousGrade) && (
          <p className="cjcc-previous-grade">
            Nota anterior:{" "}
            <strong>{previousGrade}</strong>. Solo
            se permiten notas iguales o mayores.
          </p>
        )}

      {previouslyApprovedTopicIds.length >
        0 && (
        <section className="cjcc-previous-topics">
          <strong>
            Contenidos aprobados anteriormente
          </strong>

          <ul>
            {assessment.topics
              .filter((topic) =>
                previouslyApprovedTopicIds.includes(
                  topic.id,
                ),
              )
              .map((topic) => (
                <li key={topic.id}>
                  {topic.name}
                </li>
              ))}
          </ul>
        </section>
      )}

      {availableTopics.length > 0 ? (
        <fieldset className="cjcc-topic-checklist">
          <legend>
            Contenidos pendientes
          </legend>

          <label className="cjcc-topic-checklist__select-all">
            <input
              type="checkbox"
              checked={
                allAvailableTopicsSelected
              }
              onChange={toggleAllTopics}
              disabled={saving}
            />

            Seleccionar todos los pendientes
          </label>

          <div className="cjcc-topic-checklist__divider" />

          {availableTopics.map((topic) => (
            <label key={topic.id}>
              <input
                type="checkbox"
                checked={approvedTopicIds.includes(
                  topic.id,
                )}
                onChange={() =>
                  toggleTopic(topic.id)
                }
                disabled={saving}
              />

              {topic.name}
            </label>
          ))}
        </fieldset>
      ) : (
        <p className="cjcc-no-pending-topics">
          El estudiante ya tiene todos los
          contenidos aprobados.
        </p>
      )}

      <label>
        Observación de esta instancia

        <textarea
          value={observation}
          onChange={(event) =>
            setObservation(
              event.target.value,
            )
          }
          rows={3}
          placeholder="Opcional"
          disabled={saving}
        />
      </label>

      {formError && (
        <p className="form-error">
          {formError}
        </p>
      )}

      <button
        type="button"
        className="primary-button primary-button--cjcc"
        onClick={handleSave}
        disabled={saving}
      >
        {saving
          ? "Guardando..."
          : `Guardar ${attemptLabels[
              attemptType
            ].toLowerCase()}`}
      </button>
    </section>
  );
}
