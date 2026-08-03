import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router";
import { getRoutines } from "../gimnasio/routinesRepository";
import type { GymRoutine } from "../gimnasio/types";
import { getPendingTasks } from "../../shared/pending/pendingRepository";
import type {
  PendingModule,
  PendingTask,
} from "../../shared/pending/types";

const moduleLabels: Record<
  PendingModule,
  string
> = {
  cjcc: "CJCC",
  piero: "Piero",
  utn: "UTN",
};

function formatDueDate(value: string) {
  if (!value) {
    return "Sin fecha";
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

  if (difference <= 7) {
    return `En ${difference} días`;
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
    },
  ).format(dueDate);
}

function getCompletedTimestamp(
  routine: GymRoutine,
) {
  if (!routine.lastCompletedAt) {
    return 0;
  }

  const value = routine.lastCompletedAt;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().getTime();
  }

  const timestamp = new Date(
    String(value),
  ).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}

function formatLastWorkout(
  routine: GymRoutine | null,
) {
  if (!routine?.lastCompletedAt) {
    return "";
  }

  const timestamp =
    getCompletedTimestamp(routine);

  if (!timestamp) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(timestamp));
}

export function InicioPage() {
  const [tasks, setTasks] = useState<
    PendingTask[]
  >([]);

  const [routines, setRoutines] = useState<
    GymRoutine[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getPendingTasks(),
      getRoutines(),
    ])
      .then(([savedTasks, savedRoutines]) => {
        if (cancelled) {
          return;
        }

        setTasks(savedTasks);
        setRoutines(savedRoutines);
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError(
            "No se pudo cargar el resumen de Inicio.",
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

  const nextTasks = useMemo(
    () =>
      tasks
        .filter((task) => !task.completed)
        .slice(0, 5),
    [tasks],
  );

  const activeCount = tasks.filter(
    (task) => !task.completed,
  ).length;

  const latestRoutine = useMemo(
    () =>
      routines
        .filter(
          (routine) =>
            getCompletedTimestamp(routine) > 0,
        )
        .sort(
          (routineA, routineB) =>
            getCompletedTimestamp(routineB) -
            getCompletedTimestamp(routineA),
        )[0] ?? null,
    [routines],
  );

  return (
    <section className="home-page">
      <header className="home-header">
        <p className="home-header__eyebrow">
          Organización personal
        </p>

        <h1>Inicio</h1>

        <p>
          Resumen de pendientes y actividad
          reciente.
        </p>
      </header>

      <section className="home-pending-section">
        <header>
          <div>
            <h2>Pendientes próximos</h2>

            <p>
              {activeCount === 1
                ? "1 tarea pendiente"
                : `${activeCount} tareas pendientes`}
            </p>
          </div>

          <Link
            className="home-pending-section__button"
            to="/pendientes"
          >
            Ver todos
          </Link>
        </header>

        {loading && (
          <p className="status-message">
            Cargando resumen...
          </p>
        )}

        {!loading &&
          nextTasks.length === 0 && (
            <p className="home-empty-message">
              No hay tareas pendientes.
            </p>
          )}

        <div className="home-pending-list">
          {nextTasks.map((task) => (
            <Link
              key={task.id}
              className={`home-pending-item home-pending-item--${task.module}`}
              to="/pendientes"
            >
              <div>
                <small>
                  {moduleLabels[task.module]}
                </small>

                <strong>{task.title}</strong>
              </div>

              <span>
                {formatDueDate(task.dueDate)}
              </span>
            </Link>
          ))}
        </div>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}
      </section>

      <section className="home-gym-summary">
        <div>
          <small>Gimnasio</small>

          <h2>Última rutina realizada</h2>

          <strong className="home-gym-summary__routine">
            {latestRoutine
              ? latestRoutine.name
              : "Todavía no hay rutinas realizadas"}
          </strong>

          {latestRoutine && (
            <time className="home-gym-summary__date">
              {formatLastWorkout(
                latestRoutine,
              )}
            </time>
          )}
        </div>

        <Link to="/gimnasio">
          Abrir gimnasio
        </Link>
      </section>
    </section>
  );
}
