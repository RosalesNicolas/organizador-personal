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

const weekdayLabels = [
  "L",
  "M",
  "X",
  "J",
  "V",
  "S",
  "D",
];

function toDateKey(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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

function formatCalendarTitle(date: Date) {
  const value = new Intl.DateTimeFormat(
    "es-AR",
    {
      month: "long",
      year: "numeric",
    },
  ).format(date);

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function formatSelectedDate(value: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    },
  ).format(
    new Date(`${value}T12:00:00`),
  );
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
  const todayKey = toDateKey(new Date());

  const [tasks, setTasks] = useState<
    PendingTask[]
  >([]);

  const [routines, setRoutines] = useState<
    GymRoutine[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [calendarMonth, setCalendarMonth] =
    useState(
      () =>
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ),
    );

  const [selectedDate, setSelectedDate] =
    useState(todayKey);

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

  const activeTasks = useMemo(
    () =>
      tasks.filter(
        (task) => !task.completed,
      ),
    [tasks],
  );

  const nextTasks = useMemo(
    () => activeTasks.slice(0, 5),
    [activeTasks],
  );

  const tasksByDate = useMemo(() => {
    const groupedTasks = new Map<
      string,
      PendingTask[]
    >();

    activeTasks.forEach((task) => {
      if (!task.dueDate) {
        return;
      }

      const currentTasks =
        groupedTasks.get(task.dueDate) ?? [];

      groupedTasks.set(task.dueDate, [
        ...currentTasks,
        task,
      ]);
    });

    return groupedTasks;
  }, [activeTasks]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(
      year,
      month,
      1,
    );

    const daysInMonth = new Date(
      year,
      month + 1,
      0,
    ).getDate();

    const mondayBasedStart =
      (firstDay.getDay() + 6) % 7;

    return Array.from(
      { length: 42 },
      (_, index) => {
        const dayNumber =
          index - mondayBasedStart + 1;

        if (
          dayNumber < 1 ||
          dayNumber > daysInMonth
        ) {
          return null;
        }

        const date = new Date(
          year,
          month,
          dayNumber,
        );

        return {
          dayNumber,
          dateKey: toDateKey(date),
        };
      },
    );
  }, [calendarMonth]);

  const selectedTasks = useMemo(
    () =>
      [...(tasksByDate.get(selectedDate) ?? [])]
        .sort((taskA, taskB) => {
          if (
            taskA.priority !== taskB.priority
          ) {
            return taskA.priority === "high"
              ? -1
              : 1;
          }

          return taskA.title.localeCompare(
            taskB.title,
            "es",
            { sensitivity: "base" },
          );
        }),
    [selectedDate, tasksByDate],
  );

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

  function changeMonth(change: number) {
    setCalendarMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + change,
          1,
        ),
    );
  }

  function goToCurrentMonth() {
    const today = new Date();

    setCalendarMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    );

    setSelectedDate(todayKey);
  }

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
              {activeTasks.length === 1
                ? "1 tarea pendiente"
                : `${activeTasks.length} tareas pendientes`}
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
              to={`/pendientes?modulo=${task.module}`}
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
      </section>

      <section className="home-calendar">
        <header className="home-calendar__header">
          <div>
            <small>Agenda</small>
            <h2>Calendario de pendientes</h2>
          </div>

          <button
            type="button"
            onClick={goToCurrentMonth}
          >
            Hoy
          </button>
        </header>

        <div className="home-calendar__month-navigation">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => changeMonth(-1)}
          >
            ‹
          </button>

          <strong>
            {formatCalendarTitle(
              calendarMonth,
            )}
          </strong>

          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => changeMonth(1)}
          >
            ›
          </button>
        </div>

        <div className="home-calendar__weekdays">
          {weekdayLabels.map((weekday) => (
            <span key={weekday}>
              {weekday}
            </span>
          ))}
        </div>

        <div className="home-calendar__grid">
          {calendarDays.map(
            (calendarDay, index) => {
              if (!calendarDay) {
                return (
                  <span
                    className="home-calendar__empty-day"
                    key={`empty-${index}`}
                  />
                );
              }

              const dayTasks =
                tasksByDate.get(
                  calendarDay.dateKey,
                ) ?? [];

              const dayModules = Array.from(
                new Set(
                  dayTasks.map(
                    (task) => task.module,
                  ),
                ),
              );

              const hasHighPriority =
                dayTasks.some(
                  (task) =>
                    task.priority === "high",
                );

              const isToday =
                calendarDay.dateKey ===
                todayKey;

              const isSelected =
                calendarDay.dateKey ===
                selectedDate;

              return (
                <button
                  type="button"
                  key={calendarDay.dateKey}
                  className={[
                    "home-calendar__day",
                    isToday
                      ? "home-calendar__day--today"
                      : "",
                    isSelected
                      ? "home-calendar__day--selected"
                      : "",
                    hasHighPriority
                      ? "home-calendar__day--high"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() =>
                    setSelectedDate(
                      calendarDay.dateKey,
                    )
                  }
                >
                  <span>
                    {calendarDay.dayNumber}
                  </span>

                  {dayModules.length > 0 && (
                    <span className="home-calendar__dots">
                      {dayModules.map(
                        (module) => (
                          <i
                            key={module}
                            className={`home-calendar__dot home-calendar__dot--${module}`}
                          />
                        ),
                      )}
                    </span>
                  )}
                </button>
              );
            },
          )}
        </div>

        <div className="home-calendar__legend">
          <span>
            <i className="home-calendar__dot home-calendar__dot--cjcc" />
            CJCC
          </span>

          <span>
            <i className="home-calendar__dot home-calendar__dot--piero" />
            Piero
          </span>

          <span>
            <i className="home-calendar__dot home-calendar__dot--utn" />
            UTN
          </span>
        </div>

        <section className="home-calendar__selected">
          <header>
            <h3>
              {formatSelectedDate(selectedDate)}
            </h3>

            <span>
              {selectedTasks.length === 1
                ? "1 pendiente"
                : `${selectedTasks.length} pendientes`}
            </span>
          </header>

          {selectedTasks.length === 0 ? (
            <p>
              No hay pendientes para este día.
            </p>
          ) : (
            <div className="home-calendar__task-list">
              {selectedTasks.map((task) => (
                <Link
                  key={task.id}
                  className={`home-calendar__task home-calendar__task--${task.module}`}
                  to={`/pendientes?modulo=${task.module}`}
                >
                  <div>
                    <small>
                      {moduleLabels[task.module]}
                    </small>

                    <strong>
                      {task.title}
                    </strong>
                  </div>

                  {task.priority === "high" && (
                    <span>Alta</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

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
