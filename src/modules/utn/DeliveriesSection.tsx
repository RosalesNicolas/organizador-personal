import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  archiveDelivery,
  changeDeliveryStatus,
  createDelivery,
  getDeliveries,
  permanentlyDeleteDelivery,
  restoreDelivery,
  updateDelivery,
} from "./deliveriesRepository";
import { DeliveryForm } from "./DeliveryForm";
import { DeliveryList } from "./DeliveryList";
import type {
  DeliveryFormData,
  DeliveryStatus,
  UtnDelivery,
} from "./types";

type DeliveriesSectionProps = {
  subjectId: string;
};

export type DeliveriesSectionHandle = {
  openCreateForm: () => void;
};

export const DeliveriesSection = forwardRef<
  DeliveriesSectionHandle,
  DeliveriesSectionProps
>(function DeliveriesSection(
  { subjectId },
  reference,
) {
  const [deliveries, setDeliveries] = useState<
    UtnDelivery[]
  >([]);

  const [deliveryToEdit, setDeliveryToEdit] =
    useState<UtnDelivery | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [showArchived, setShowArchived] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [workingId, setWorkingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  const formContainerRef =
    useRef<HTMLDivElement | null>(null);

  async function reloadDeliveries() {
    const savedDeliveries =
      await getDeliveries(subjectId);

    setDeliveries(savedDeliveries);
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
    setDeliveryToEdit(null);
    setShowForm(true);
    scrollToForm();
  }

  useImperativeHandle(
    reference,
    () => ({
      openCreateForm: handleAdd,
    }),
  );

  function handleEdit(delivery: UtnDelivery) {
    setDeliveryToEdit(delivery);
    setShowForm(true);
    scrollToForm();
  }

  function handleCancelForm() {
    setDeliveryToEdit(null);
    setShowForm(false);
  }

  useEffect(() => {
    let cancelled = false;

    getDeliveries(subjectId)
      .then((savedDeliveries) => {
        if (!cancelled) {
          setDeliveries(savedDeliveries);
        }
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError(
            "No se pudieron cargar las entregas.",
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
  }, [subjectId]);

  async function handleSubmit(
    data: DeliveryFormData,
  ) {
    try {
      setSaving(true);
      setError("");

      if (deliveryToEdit) {
        await updateDelivery(
          subjectId,
          deliveryToEdit.id,
          data,
        );
      } else {
        await createDelivery(subjectId, data);
      }

      await reloadDeliveries();
      setDeliveryToEdit(null);
      setShowForm(false);
    } catch (saveError) {
      console.error(saveError);
      setError(
        "No se pudo guardar la entrega.",
      );
      throw saveError;
    } finally {
      setSaving(false);
    }
  }

  async function runAction(
    deliveryId: string,
    action: () => Promise<void>,
    errorMessage: string,
  ) {
    try {
      setWorkingId(deliveryId);
      setError("");

      await action();
      await reloadDeliveries();
    } catch (actionError) {
      console.error(actionError);
      setError(errorMessage);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleChangeStatus(
    deliveryId: string,
    status: DeliveryStatus,
  ) {
    await runAction(
      deliveryId,
      () =>
        changeDeliveryStatus(
          subjectId,
          deliveryId,
          status,
        ),
      "No se pudo cambiar el estado.",
    );
  }

  async function handleDelete(
    deliveryId: string,
  ) {
    const confirmed = window.confirm(
      "¿Eliminar definitivamente esta entrega? Esta acción no se puede deshacer.",
    );

    if (!confirmed) {
      return;
    }

    await runAction(
      deliveryId,
      () =>
        permanentlyDeleteDelivery(
          subjectId,
          deliveryId,
        ),
      "No se pudo eliminar la entrega.",
    );
  }

  if (loading) {
    return (
      <p className="status-message">
        Cargando entregas...
      </p>
    );
  }

  return (
    <section className="deliveries-section">
      <div className="archive-toggle">
        <button
          type="button"
          className={
            !showArchived
              ? "subject-tab subject-tab--active"
              : "subject-tab"
          }
          onClick={() =>
            setShowArchived(false)
          }
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
          onClick={() =>
            setShowArchived(true)
          }
        >
          Archivadas
        </button>
      </div>

      <DeliveryList
        deliveries={deliveries}
        showArchived={showArchived}
        workingId={workingId}
        onEdit={handleEdit}
        onChangeStatus={handleChangeStatus}
        onArchive={(deliveryId) =>
          runAction(
            deliveryId,
            () =>
              archiveDelivery(
                subjectId,
                deliveryId,
              ),
            "No se pudo archivar la entrega.",
          )
        }
        onRestore={(deliveryId) =>
          runAction(
            deliveryId,
            () =>
              restoreDelivery(
                subjectId,
                deliveryId,
              ),
            "No se pudo restaurar la entrega.",
          )
        }
        onDelete={handleDelete}
      />

      {showForm && (
        <div
          ref={formContainerRef}
          className="item-form-container"
          key={
            deliveryToEdit?.id ??
            "new-delivery-container"
          }
        >
          <DeliveryForm
            key={
              deliveryToEdit?.id ??
              "new-delivery"
            }
            deliveryToEdit={
              deliveryToEdit
            }
            saving={saving}
            onSubmit={handleSubmit}
            onCancelEdit={
              handleCancelForm
            }
          />
        </div>
      )}

      {error && (
        <p className="form-error">{error}</p>
      )}
    </section>
  );
});
