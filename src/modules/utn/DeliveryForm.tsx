import { useState, type FormEvent } from "react";
import type {
  DeliveryFormData,
  DeliveryStatus,
  UtnDelivery,
} from "./types";

type DeliveryFormProps = {
  deliveryToEdit: UtnDelivery | null;
  saving: boolean;
  onSubmit: (data: DeliveryFormData) => Promise<void>;
  onCancelEdit: () => void;
};

function getInitialForm(
  deliveryToEdit: UtnDelivery | null,
): DeliveryFormData {
  if (!deliveryToEdit) {
    return {
      title: "",
      description: "",
      dueDate: "",
      status: "pendiente",
    };
  }

  return {
    title: deliveryToEdit.title,
    description: deliveryToEdit.description,
    dueDate: deliveryToEdit.dueDate,
    status: deliveryToEdit.status,
  };
}

export function DeliveryForm({
  deliveryToEdit,
  saving,
  onSubmit,
  onCancelEdit,
}: DeliveryFormProps) {
  const [formData, setFormData] = useState<DeliveryFormData>(() =>
    getInitialForm(deliveryToEdit),
  );
  const [validationError, setValidationError] = useState("");

  function updateField(
    field: keyof DeliveryFormData,
    value: string,
  ) {
    setFormData((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.title.trim()) {
      setValidationError("El título es obligatorio.");
      return;
    }

    if (!formData.dueDate) {
      setValidationError("La fecha límite es obligatoria.");
      return;
    }

    setValidationError("");
    await onSubmit(formData);
  }

  function handleCancel() {
    setValidationError("");
    onCancelEdit();
  }

  return (
    <form className="delivery-form" onSubmit={handleSubmit}>
      <h3>
        {deliveryToEdit ? "Editar entrega" : "Nueva entrega"}
      </h3>

      <label className="form-field">
        <span>Título</span>
        <input
          type="text"
          value={formData.title}
          onChange={(event) =>
            updateField("title", event.target.value)
          }
          placeholder="Ej.: Trabajo práctico 1"
        />
      </label>

      <label className="form-field">
        <span>Descripción</span>
        <textarea
          value={formData.description}
          onChange={(event) =>
            updateField("description", event.target.value)
          }
          placeholder="Indicaciones, tareas pendientes o enlace..."
          rows={4}
        />
      </label>

      <label className="form-field">
        <span>Fecha límite</span>
        <input
          type="date"
          value={formData.dueDate}
          onChange={(event) =>
            updateField("dueDate", event.target.value)
          }
        />
      </label>

      <label className="form-field">
        <span>Estado</span>
        <select
          value={formData.status}
          onChange={(event) =>
            updateField(
              "status",
              event.target.value as DeliveryStatus,
            )
          }
        >
          <option value="pendiente">Pendiente</option>
          <option value="en_progreso">En progreso</option>
          <option value="completado">Completado</option>
          <option value="vencido">Vencido</option>
        </select>
      </label>

      {validationError && (
        <p className="form-error">{validationError}</p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="primary-button primary-button--utn"
          disabled={saving}
        >
          {saving
            ? "Guardando..."
            : deliveryToEdit
              ? "Guardar cambios"
              : "Crear entrega"}
        </button>

        {deliveryToEdit && (
          <button
            type="button"
            className="secondary-button"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}