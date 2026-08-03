import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Link, useSearchParams } from "react-router";
import {
  createPendingTask,
  deletePendingTask,
  getPendingTasks,
  setPendingTaskCompleted,
  updatePendingTask,
} from "../../shared/pending/pendingRepository";
import type {
  PendingModule,
  PendingPriority,
  PendingTask,
  PendingTaskFormData,
} from "../../shared/pending/types";

const moduleLabels: Record<
  PendingModule,
  string
> = {
  cjcc: "CJCC",
  piero: "Piero",
  utn: "UTN",
};

const priorityLabels: Record<
  PendingPriority,
  string
> = {
  normal: "Prioridad normal",
  high: "Prioridad alta",
};

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

function formatDate(value: string) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(
    new Date(`${value}T12:00:00`),
  );
}

function getDateStatus(value: string) {
  if (!value) {
    return "";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(
    `${value}T00:00:00`,
  );

  const difference = Math.round(
    (dueDate.getTime() - today.getTime()) /
      86400000,
  );

  if (difference < 0) {
    return "Vencido";
  }

  if (difference === 0) {
    return "Hoy";
  }

  if (difference === 1) {
    return "Mañana";
  }

  return `En ${difference} días`;
}

export function PendingPage() {
  const todayValue = getTodayValue();
  const [searchParams, setSearchParams] =
    useSearchParams();

  const requestedModule =
    searchParams.get("modulo");

  const initialModuleFilter:
    | "all"
    | PendingModule =
    requestedModule === "cjcc" ||
    requestedModule === "piero" ||
    requestedModule === "utn"
      ? requestedModule
      : "all";

  const shouldCreateFromQuery =
    searchParams.get("nuevo") === "1";

  const initialTitle =
    searchParams.get("titulo") ?? "";

  const initialDescription =
    searchParams.get("descripcion") ?? "";

  const initialTaskModule: PendingModule =
    initialModuleFilter === "all"
      ? "cjcc"
      : initialModuleFilter;

  const [tasks, setTasks] = useState<
    PendingTask[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(shouldCreateFromQuery);

  const [editingTask, setEditingTask] =
    useState<PendingTask | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [actionTaskId, setActionTaskId] =
    useState<string | null>(null);

  const [activeFilter, setActiveFilter] =
    useState<
      "all" | PendingModule
    >(initialModuleFilter);

  const [showCompleted, setShowCompleted] =
    useState(false);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] =
    useState(initialDescription);
  const [dueDate, setDueDate] =
    useState("");

  const [module, setModule] =
    useState<PendingModule>(
      initialTaskModule,
    );

  const [priority, setPriority] =
    useState<PendingPriority>("normal");

  const [error, setError] = useState("");

  async function loadTasks() {
    const savedTasks =
      await getPendingTasks();

    setTasks(savedTasks);
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setDueDate("");
    setModule("cjcc");
    setPriority("normal");
    setEditingTask(null);
    setShowForm(false);
    setError("");

    setSearchParams(
      activeFilter === "all"
        ? {}
        : { modulo: activeFilter },
    );
  }

  function handleStartCreate() {
    setTitle("");
    setDescription("");
    setDueDate("");
    setModule(
      activeFilter === "all"
        ? "cjcc"
        : activeFilter,
    );
    setPriority("normal");
    setEditingTask(null);
    setShowForm(true);
    setError("");
  }

  function handleStartEdit(
    task: PendingTask,
  ) {
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate);
    setModule(task.module);
    setPriority(
      task.priority ?? "normal",
    );
    setEditingTask(task);
    setShowForm(true);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setError(
        "Ingresá el nombre del pendiente.",
      );
      return;
    }

    if (!dueDate) {
      setError(
        "Ingresá una fecha límite.",
      );
      return;
    }

    if (dueDate < todayValue) {
      setError(
        "La fecha límite no puede ser anterior a hoy.",
      );
      return;
    }

    const formData: PendingTaskFormData = {
      title: normalizedTitle,
      description: description.trim(),
      dueDate,
      module,
      priority,
    };

    try {
      setSubmitting(true);
      setError("");

      if (editingTask) {
        await updatePendingTask(
          editingTask.id,
          formData,
        );
      } else {
        await createPendingTask(formData);
      }

      resetForm();
      await loadTasks();
    } catch (saveError) {
      console.error(saveError);
      setError(
        "No se pudo guardar el pendiente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleCompleted(
    task: PendingTask,
  ) {
    try {
      setActionTaskId(task.id);
      setError("");

      await setPendingTaskCompleted(
        task.id,
        !task.completed,
      );

      await loadTasks();
    } catch (toggleError) {
      console.error(toggleError);
      setError(
        "No se pudo actualizar el pendiente.",
      );
    } finally {
      setActionTaskId(null);
    }
  }

  async function handleDelete(
    task: PendingTask,
  ) {
    const confirmed = window.confirm(
      `¿Eliminar "${task.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionTaskId(task.id);
      setError("");

      await deletePendingTask(task.id);
      await loadTasks();
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        "No se pudo eliminar el pendiente.",
      );
    } finally {
      setActionTaskId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    getPendingTasks()
      .then((savedTasks) => {
        if (!cancelled) {
          setTasks(savedTasks);
        }
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError(
            "No se pudieron cargar los pendientes.",
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
  }, []);

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesModule =
          activeFilter === "all" ||
          task.module === activeFilter;

        const matchesStatus =
          showCompleted
            ? task.completed
            : !task.completed;

        return (
          matchesModule &&
          matchesStatus
        );
      }),
    [
      tasks,
      activeFilter,
      showCompleted,
    ],
  );

  return (
    <section className="page pending-page">
      <Link
        className="back-link"
        to="/"
      >
        ← Volver a Inicio
      </Link>

      <header className="module-header pending-page__header">
        <p className="module-header__eyebrow">
          Organización
        </p>

        <h1>Pendientes</h1>

        <p>
          Tareas de CJCC, Piero y UTN.
        </p>
      </header>

      <div className="pending-toolbar">
        <div className="pending-filters">
          {(
            [
              ["all", "Todos"],
              ["cjcc", "CJCC"],
              ["piero", "Piero"],
              ["utn", "UTN"],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={
                activeFilter === value
                  ? "pending-filter pending-filter--active"
                  : "pending-filter"
              }
              onClick={() => {
                setActiveFilter(value);

                if (value === "all") {
                  setSearchParams({});
                } else {
                  setSearchParams({
                    modulo: value,
                  });
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {!showForm && (
          <button
            type="button"
            className="pending-add-button"
            onClick={handleStartCreate}
          >
            Agregar pendiente
          </button>
        )}
      </div>

      <button
        type="button"
        className="pending-status-toggle"
        onClick={() =>
          setShowCompleted(
            (current) => !current,
          )
        }
      >
        {showCompleted
          ? "Ver pendientes activos"
          : "Ver completados"}
      </button>

      {showForm && (
        <form
          className="pending-form"
          onSubmit={handleSubmit}
        >
          <header className="pending-form__header">
            <div>
              <small>
                {editingTask
                  ? "Modificar tarea"
                  : "Nueva tarea"}
              </small>

              <h2>
                {editingTask
                  ? "Editar pendiente"
                  : "Nuevo pendiente"}
              </h2>
            </div>
          </header>

          <div className="pending-form__grid">
            <label className="pending-form__field pending-form__field--wide">
              <span>Título</span>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Ejemplo: Corregir evaluación de Números"
                disabled={submitting}
              />
            </label>

            <label className="pending-form__field pending-form__field--wide">
              <span>Descripción</span>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="Opcional"
                disabled={submitting}
              />
            </label>

            <label className="pending-form__field">
              <span>Fecha límite</span>

              <input
                type="date"
                value={dueDate}
                min={todayValue}
                onChange={(event) =>
                  setDueDate(
                    event.target.value,
                  )
                }
                disabled={submitting}
                required
              />
            </label>

            <label className="pending-form__field">
              <span>Módulo</span>

              <select
                value={module}
                onChange={(event) =>
                  setModule(
                    event.target
                      .value as PendingModule,
                  )
                }
                disabled={submitting}
              >
                <option value="cjcc">
                  CJCC
                </option>

                <option value="piero">
                  Piero
                </option>

                <option value="utn">
                  UTN
                </option>
              </select>
            </label>

            <label className="pending-form__field">
              <span>Prioridad</span>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
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

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <div className="pending-form__actions">
            <button
              type="button"
              className="pending-form__cancel"
              onClick={resetForm}
              disabled={submitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="pending-form__save"
              disabled={submitting}
            >
              {submitting
                ? "Guardando..."
                : editingTask
                  ? "Guardar cambios"
                  : "Guardar pendiente"}
            </button>
          </div>
        </form>
      )}

      {loading && (
        <p className="status-message">
          Cargando pendientes...
        </p>
      )}

      {!loading &&
        visibleTasks.length === 0 &&
        !showForm && (
          <section className="empty-state pending-empty-state">
            <h2>
              {showCompleted
                ? "No hay tareas completadas"
                : "No hay pendientes"}
            </h2>

            <p>
              Las tareas que agregues aparecerán
              también en la pantalla de Inicio.
            </p>
          </section>
        )}

      <section className="pending-list">
        {visibleTasks.map((task) => {
          const actionInProgress =
            actionTaskId === task.id;

          const taskPriority =
            task.priority ?? "normal";

          return (
            <article
              className={`pending-card pending-card--${task.module}${
                taskPriority === "high"
                  ? " pending-card--high"
                  : ""
              }`}
              key={task.id}
            >
              <div className="pending-card__main">
                <div className="pending-card__badges">
                  <span
                    className={`pending-card__module pending-card__module--${task.module}`}
                  >
                    {moduleLabels[task.module]}
                  </span>

                  <span
                    className={`pending-card__priority pending-card__priority--${taskPriority}`}
                  >
                    {priorityLabels[taskPriority]}
                  </span>
                </div>

                <h2>{task.title}</h2>

                {task.description && (
                  <p>{task.description}</p>
                )}

                <div className="pending-card__date">
                  <strong>
                    {formatDate(task.dueDate)}
                  </strong>

                  {task.dueDate && (
                    <span>
                      {getDateStatus(
                        task.dueDate,
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="pending-card__actions">
                <button
                  type="button"
                  className="pending-action-button pending-action-button--complete"
                  onClick={() =>
                    handleToggleCompleted(task)
                  }
                  disabled={actionInProgress}
                >
                  {task.completed
                    ? "Reabrir"
                    : "Completar"}
                </button>

                <button
                  type="button"
                  className="pending-action-button pending-action-button--edit"
                  onClick={() =>
                    handleStartEdit(task)
                  }
                  disabled={actionInProgress}
                >
                  Editar
                </button>

                <button
                  type="button"
                  className="pending-action-button pending-action-button--delete"
                  onClick={() =>
                    handleDelete(task)
                  }
                  disabled={actionInProgress}
                >
                  {actionInProgress
                    ? "Procesando..."
                    : "Eliminar"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {error && !showForm && (
        <p className="form-error">{error}</p>
      )}
    </section>
  );
}











