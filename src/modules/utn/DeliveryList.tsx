import type {
  DeliveryStatus,
  UtnDelivery,
} from "./types";

type DeliveryListProps = {
  deliveries: UtnDelivery[];
  showArchived: boolean;
  workingId: string | null;
  onEdit: (delivery: UtnDelivery) => void;
  onChangeStatus: (
    deliveryId: string,
    status: DeliveryStatus,
  ) => Promise<void>;
  onArchive: (deliveryId: string) => Promise<void>;
  onRestore: (deliveryId: string) => Promise<void>;
  onDelete: (deliveryId: string) => Promise<void>;
};

const statusLabels: Record<DeliveryStatus, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
  vencido: "Vencido",
};

function formatDate(dateValue: string) {
  if (!dateValue) {
    return "Sin fecha";
  }

  const [year, month, day] = dateValue.split("-");

  return `${day}/${month}/${year}`;
}

export function DeliveryList({
  deliveries,
  showArchived,
  workingId,
  onEdit,
  onChangeStatus,
  onArchive,
  onRestore,
  onDelete,
}: DeliveryListProps) {
  const visibleDeliveries = deliveries.filter(
    (delivery) => delivery.archived === showArchived,
  );

  if (visibleDeliveries.length === 0) {
    return (
      <section className="empty-state delivery-empty-state">
        <p>
          {showArchived
            ? "No hay entregas archivadas."
            : "Todavía no hay entregas activas."}
        </p>
      </section>
    );
  }

  return (
    <section className="delivery-list">
      {visibleDeliveries.map((delivery) => {
        const isWorking = workingId === delivery.id;

        return (
          <article className="delivery-card" key={delivery.id}>
            <div className="delivery-card__header">
              <div>
                <span
                  className={`delivery-status delivery-status--${delivery.status}`}
                >
                  {statusLabels[delivery.status]}
                </span>

                <h3>{delivery.title}</h3>
              </div>

              <time dateTime={delivery.dueDate}>
                {formatDate(delivery.dueDate)}
              </time>
            </div>

            {delivery.description && (
              <p className="delivery-card__description">
                {delivery.description}
              </p>
            )}

            {!delivery.archived && (
              <label className="delivery-status-select">
                <span>Estado</span>

                <select
                  value={delivery.status}
                  disabled={isWorking}
                  onChange={(event) =>
                    void onChangeStatus(
                      delivery.id,
                      event.target.value as DeliveryStatus,
                    )
                  }
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">
                    En progreso
                  </option>
                  <option value="completado">
                    Completado
                  </option>
                  <option value="vencido">Vencido</option>
                </select>
              </label>
            )}

            <div className="delivery-card__actions">
              {!delivery.archived && (
                <>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => onEdit(delivery)}
                    disabled={isWorking}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className="action-button"
                    onClick={() => void onArchive(delivery.id)}
                    disabled={isWorking}
                  >
                    Archivar
                  </button>
                </>
              )}

              {delivery.archived && (
                <>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => void onRestore(delivery.id)}
                    disabled={isWorking}
                  >
                    Restaurar
                  </button>

                  <button
                    type="button"
                    className="action-button action-button--danger"
                    onClick={() => void onDelete(delivery.id)}
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