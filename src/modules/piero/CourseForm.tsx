import { useState } from "react";
import type {
  PieroCourse,
  PieroCourseFormData,
  PieroCourseModality,
} from "./types";

type CourseFormProps = {
  initialCourse?: PieroCourse;
  submitting: boolean;
  onSubmit: (
    formData: PieroCourseFormData,
  ) => Promise<void>;
  onCancel: () => void;
};

export function CourseForm({
  initialCourse,
  submitting,
  onSubmit,
  onCancel,
}: CourseFormProps) {
  const [name, setName] = useState(
    initialCourse?.name ?? "",
  );
  const [subject, setSubject] = useState(
    initialCourse?.subject ?? "Física",
  );
  const [modality, setModality] =
    useState<PieroCourseModality>(
      initialCourse?.modality ?? "presencial",
    );
  const [schedulesText, setSchedulesText] =
    useState(
      initialCourse?.schedules.join("\n") ?? "",
    );
  const [formError, setFormError] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedSubject = subject.trim();

    const schedules = schedulesText
      .split("\n")
      .map((schedule) => schedule.trim())
      .filter(Boolean);

    if (!normalizedName) {
      setFormError(
        "Ingresá el nombre del curso.",
      );
      return;
    }

    if (!normalizedSubject) {
      setFormError("Ingresá la materia.");
      return;
    }

    if (schedules.length === 0) {
      setFormError(
        "Ingresá al menos un horario.",
      );
      return;
    }

    setFormError("");

    await onSubmit({
      name: normalizedName,
      subject: normalizedSubject,
      modality,
      schedules,
    });
  }

  return (
    <form
      className="entity-form piero-course-form"
      onSubmit={handleSubmit}
    >
      <label>
        Nombre del curso

        <input
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          placeholder="Ejemplo: Septiembre"
          disabled={submitting}
        />
      </label>

      <label>
        Materia

        <input
          type="text"
          value={subject}
          onChange={(event) =>
            setSubject(event.target.value)
          }
          placeholder="Ejemplo: Física"
          disabled={submitting}
        />
      </label>

      <label>
        Modalidad

        <select
          value={modality}
          onChange={(event) =>
            setModality(
              event.target
                .value as PieroCourseModality,
            )
          }
          disabled={submitting}
        >
          <option value="presencial">
            Presencial
          </option>

          <option value="virtual">
            Virtual
          </option>

          <option value="combinado">
            Combinado
          </option>
        </select>
      </label>

      <label>
        Horarios

        <textarea
          value={schedulesText}
          onChange={(event) =>
            setSchedulesText(
              event.target.value,
            )
          }
          placeholder={
            "Un horario por línea\nEjemplo: Martes 18:30 a 21:00"
          }
          rows={4}
          disabled={submitting}
        />
      </label>

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
          className="primary-button primary-button--piero"
          disabled={submitting}
        >
          {submitting
            ? "Guardando..."
            : initialCourse
              ? "Guardar cambios"
              : "Crear curso"}
        </button>
      </div>
    </form>
  );
}

