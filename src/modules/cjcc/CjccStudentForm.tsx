import {
  useState,
  type FormEvent,
} from "react";
import type {
  CjccStudent,
  CjccStudentFormData,
} from "./types";

type CjccStudentFormProps = {
  initialStudent?: CjccStudent;
  submitting: boolean;
  onSubmit: (
    formData: CjccStudentFormData,
  ) => Promise<void>;
  onCancel: () => void;
};

export function CjccStudentForm({
  initialStudent,
  submitting,
  onSubmit,
  onCancel,
}: CjccStudentFormProps) {
  const [firstName, setFirstName] = useState(
    initialStudent?.firstName ?? "",
  );

  const [lastName, setLastName] = useState(
    initialStudent?.lastName ?? "",
  );

  const [observation, setObservation] = useState(
    initialStudent?.observation ?? "",
  );

  const [formError, setFormError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedObservation =
      observation.trim();

    if (!normalizedLastName) {
      setFormError(
        "Ingresá los apellidos del estudiante.",
      );
      return;
    }

    if (!normalizedFirstName) {
      setFormError(
        "Ingresá el nombre del estudiante.",
      );
      return;
    }

    setFormError("");

    await onSubmit({
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      observation: normalizedObservation,
    });
  }

  return (
    <form
      className="entity-form cjcc-student-form"
      onSubmit={handleSubmit}
    >
      <h3>
        {initialStudent
          ? "Editar estudiante"
          : "Agregar estudiante"}
      </h3>

      <label>
        Apellidos

        <input
          type="text"
          value={lastName}
          onChange={(event) =>
            setLastName(event.target.value)
          }
          disabled={submitting}
        />
      </label>

      <label>
        Nombre

        <input
          type="text"
          value={firstName}
          onChange={(event) =>
            setFirstName(event.target.value)
          }
          disabled={submitting}
        />
      </label>

      <label>
        Observación general

        <textarea
          value={observation}
          onChange={(event) =>
            setObservation(event.target.value)
          }
          rows={3}
          placeholder="Opcional"
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
          className="primary-button primary-button--cjcc"
          disabled={submitting}
        >
          {submitting
            ? "Guardando..."
            : initialStudent
              ? "Guardar cambios"
              : "Agregar estudiante"}
        </button>
      </div>
    </form>
  );
}
