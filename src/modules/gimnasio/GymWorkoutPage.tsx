import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
} from "react-router";
import {
  clearActiveRoutineId,
  getActiveRoutineId,
} from "./activeRoutineStorage";
import { getExercises } from "./exercisesRepository";
import {
  getRoutineById,
  markRoutineAsCompleted,
} from "./routinesRepository";
import type {
  GymExercise,
  GymRoutine,
} from "./types";
import {
  clearWorkoutSession,
  getWorkoutSession,
  saveWorkoutSession,
  type WorkoutSession,
  type WorkoutSetDetails,
} from "./workoutSessionStorage";

const MAX_WORKOUT_SECONDS = 4 * 60 * 60;
const DEFAULT_REST_SECONDS = 45;
const DEFAULT_BETWEEN_EXERCISES_REST_SECONDS = 2 * 60;
const MIN_REST_SECONDS = 5;
const MAX_REST_SECONDS = 10 * 60;

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor(
    (safeSeconds % 3600) / 60,
  );
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatRestTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    seconds,
  ).padStart(2, "0")}`;
}

function createInitialSession(
  routineId: string,
  exercises: GymExercise[],
): WorkoutSession {
  const savedSession = getWorkoutSession(routineId);

  const exerciseProgress = Object.fromEntries(
    exercises.map((exercise) => {
      const savedProgress =
        savedSession?.exerciseProgress[exercise.id];

      const completedSets = Array.from(
        { length: exercise.sets },
        (_, index) =>
          savedProgress?.completedSets[index] ?? false,
      );

      const setDetails = Array.from(
        { length: exercise.sets },
        (_, index) => ({
          reps:
            savedProgress?.setDetails?.[index]?.reps ??
            exercise.reps,
          weight:
            savedProgress?.setDetails?.[index]?.weight ??
            exercise.weight,
        }),
      );

      return [
        exercise.id,
        {
          completedSets,
          setDetails,
        },
      ];
    }),
  );

  return {
    routineId,
    startedAt: savedSession?.startedAt ?? Date.now(),
    exerciseProgress,
  };
}

export function GymWorkoutPage() {
  const { routineId } = useParams();
  const navigate = useNavigate();

  const [routine, setRoutine] =
    useState<GymRoutine | null>(null);
  const [exercises, setExercises] =
    useState<GymExercise[]>([]);
  const [session, setSession] =
    useState<WorkoutSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);
  const [loading, setLoading] =
    useState(Boolean(routineId));
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");

  const [restDuration, setRestDuration] = useState(
    DEFAULT_REST_SECONDS,
  );
  const [restRemaining, setRestRemaining] = useState(
    DEFAULT_REST_SECONDS,
  );
  const [restRunning, setRestRunning] = useState(false);

  const [
    betweenExercisesRestDuration,
    setBetweenExercisesRestDuration,
  ] = useState(
    DEFAULT_BETWEEN_EXERCISES_REST_SECONDS,
  );

  const sessionStartedAtRef =
    useRef<number | null>(null);

  const automaticFinishStarted = useRef(false);
  const restFinishedNotified = useRef(false);
  const audioContextRef =
    useRef<AudioContext | null>(null);

  const activeRoutineId = getActiveRoutineId();
  const isCurrentWorkout =
    Boolean(routineId) && activeRoutineId === routineId;

  const prepareAudio = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      if (audioContextRef.current.state === "suspended") {
        void audioContextRef.current.resume();
      }
    } catch (audioError) {
      console.debug(
        "El audio no está disponible.",
        audioError,
      );
    }
  }, []);

  const playRestFinishedCue = useCallback(() => {
try {
      const audioContext =
        audioContextRef.current ?? new AudioContext();

      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(660, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(
        0.025,
        now + 0.015,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.18,
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.2);
    } catch (audioError) {
      console.debug(
        "No se pudo reproducir el aviso.",
        audioError,
      );
    }
  }, []);

  useEffect(() => {
    if (!routineId || !isCurrentWorkout) {
      return;
    }

    let cancelled = false;

    Promise.all([
      getRoutineById(routineId),
      getExercises(routineId),
    ])
      .then(([savedRoutine, savedExercises]) => {
        if (cancelled) {
          return;
        }

        if (!savedRoutine) {
          setError("La rutina no existe.");
          return;
        }

        const initialSession = createInitialSession(
          routineId,
          savedExercises,
        );

        sessionStartedAtRef.current =
          initialSession.startedAt;

        setRoutine(savedRoutine);
        setExercises(savedExercises);
        setSession(initialSession);
        saveWorkoutSession(initialSession);

        const initialRestSeconds =
          savedExercises[0]?.restSeconds ??
          DEFAULT_REST_SECONDS;

        setRestDuration(initialRestSeconds);
        setRestRemaining(initialRestSeconds);
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError(
            "No se pudo cargar el entrenamiento.",
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
  }, [routineId, isCurrentWorkout]);

  const finishWorkout = useCallback(
    async (automatic = false) => {
      if (!routineId || finishing) {
        return;
      }

      try {
        setFinishing(true);

        const startedAt =
          sessionStartedAtRef.current;

        const durationSeconds = startedAt
          ? Math.min(
              MAX_WORKOUT_SECONDS,
              Math.max(
                0,
                Math.floor(
                  (Date.now() - startedAt) /
                    1000,
                ),
              ),
            )
          : 0;

        await markRoutineAsCompleted(
          routineId,
          durationSeconds,
        );

        clearWorkoutSession(routineId);
        clearActiveRoutineId();

        navigate("/gimnasio", {
          replace: true,
          state: {
            workoutFinishedAutomatically: automatic,
          },
        });
      } catch (finishError) {
        console.error(finishError);
        setError(
          "No se pudo finalizar el entrenamiento.",
        );
        setFinishing(false);
      }
    },
    [finishing, navigate, routineId],
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    const startedAt = session.startedAt;

    function updateElapsedTime() {
      const elapsed = Math.floor(
        (Date.now() - startedAt) / 1000,
      );

      setElapsedSeconds(
        Math.min(elapsed, MAX_WORKOUT_SECONDS),
      );

      if (
        elapsed >= MAX_WORKOUT_SECONDS &&
        !automaticFinishStarted.current
      ) {
        automaticFinishStarted.current = true;
        void finishWorkout(true);
      }
    }

    updateElapsedTime();

    const intervalId = window.setInterval(
      updateElapsedTime,
      1000,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [finishWorkout, session]);

  useEffect(() => {
    if (!restRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRestRemaining((currentRemaining) => {
        const nextRemaining = Math.max(
          0,
          currentRemaining - 1,
        );

        if (
          nextRemaining === 0 &&
          !restFinishedNotified.current
        ) {
          restFinishedNotified.current = true;
          setRestRunning(false);
          playRestFinishedCue();
        }

        return nextRemaining;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [playRestFinishedCue, restRunning]);

  const progress = useMemo(() => {
    const totalSets = exercises.reduce(
      (total, exercise) => total + exercise.sets,
      0,
    );

    const completedSets = exercises.reduce(
      (total, exercise) => {
        const exerciseProgress =
          session?.exerciseProgress[exercise.id];

        return (
          total +
          (exerciseProgress?.completedSets.filter(Boolean)
            .length ?? 0)
        );
      },
      0,
    );

    return {
      totalSets,
      completedSets,
      percentage:
        totalSets === 0
          ? 0
          : Math.round(
              (completedSets / totalSets) * 100,
            ),
    };
  }, [exercises, session]);

  function startRestTimer(seconds = restDuration) {
    const safeSeconds = Math.min(
      MAX_REST_SECONDS,
      Math.max(MIN_REST_SECONDS, seconds),
    );

    prepareAudio();
    restFinishedNotified.current = false;
    setRestDuration(safeSeconds);
    setRestRemaining(safeSeconds);
    setRestRunning(true);
  }

  function pauseRestTimer() {
    setRestRunning(false);
  }

  function resumeRestTimer() {
    if (restRemaining <= 0) {
      startRestTimer();
      return;
    }

    prepareAudio();
    restFinishedNotified.current = false;
    setRestRunning(true);
  }

  function resetRestTimer() {
    restFinishedNotified.current = false;
    setRestRemaining(restDuration);
    setRestRunning(false);
  }

  function skipRestTimer() {
    restFinishedNotified.current = false;
    setRestRemaining(0);
    setRestRunning(false);
  }

  function adjustRestTimer(change: number) {
    const newDuration = Math.min(
      MAX_REST_SECONDS,
      Math.max(
        MIN_REST_SECONDS,
        restDuration + change,
      ),
    );

    setRestDuration(newDuration);

    setRestRemaining((currentRemaining) => {
      if (!restRunning) {
        return newDuration;
      }

      return Math.min(
        MAX_REST_SECONDS,
        Math.max(0, currentRemaining + change),
      );
    });
  }

  function handleToggleSet(
    exerciseId: string,
    setIndex: number,
  ) {
    if (!session || finishing) {
      return;
    }

    prepareAudio();

    const exercise = exercises.find(
      (currentExercise) =>
        currentExercise.id === exerciseId,
    );

    const currentProgress =
      session.exerciseProgress[exerciseId];

    if (!exercise || !currentProgress) {
      return;
    }

    const completedSets = [
      ...currentProgress.completedSets,
    ];

    const nextCompletedValue =
      !completedSets[setIndex];

    completedSets[setIndex] =
      nextCompletedValue;

    const updatedSession: WorkoutSession = {
      ...session,
      exerciseProgress: {
        ...session.exerciseProgress,
        [exerciseId]: {
          ...currentProgress,
          completedSets,
        },
      },
    };

    setSession(updatedSession);
    saveWorkoutSession(updatedSession);

    if (!nextCompletedValue) {
      return;
    }

    const workoutCompleted =
      exercises.every((currentExercise) => {
        const exerciseProgress =
          updatedSession.exerciseProgress[
            currentExercise.id
          ];

        return (
          exerciseProgress?.completedSets.every(
            Boolean,
          ) ?? false
        );
      });

    if (workoutCompleted) {
      setRestRunning(false);
      setRestRemaining(0);

      window.alert(
        "Rutina completada. El entrenamiento se finalizará automáticamente.",
      );

      void finishWorkout(true);
      return;
    }

    const exerciseCompleted =
      completedSets.every(Boolean);

    const nextRestSeconds =
      exerciseCompleted
        ? betweenExercisesRestDuration
        : exercise.restSeconds;

    startRestTimer(nextRestSeconds);
  }
  function handleSetDetailsChange(
    exerciseId: string,
    setIndex: number,
    field: keyof WorkoutSetDetails,
    value: string,
  ) {
    if (!session || finishing) {
      return;
    }

    const currentProgress =
      session.exerciseProgress[exerciseId];

    if (!currentProgress) {
      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return;
    }

    const safeValue =
      field === "reps"
        ? Math.max(0, Math.trunc(numericValue))
        : Math.max(0, numericValue);

    const setDetails = currentProgress.setDetails.map(
      (details, currentIndex) =>
        currentIndex === setIndex
          ? {
              ...details,
              [field]: safeValue,
            }
          : details,
    );

    const updatedSession: WorkoutSession = {
      ...session,
      exerciseProgress: {
        ...session.exerciseProgress,
        [exerciseId]: {
          ...currentProgress,
          setDetails,
        },
      },
    };

    setSession(updatedSession);
    saveWorkoutSession(updatedSession);
  }

  function handleManualFinish() {
    const confirmed = window.confirm(
      "¿Finalizar el entrenamiento actual?",
    );

    if (confirmed) {
      void finishWorkout(false);
    }
  }

  if (!routineId || !isCurrentWorkout) {
    return <Navigate to="/gimnasio" replace />;
  }

  if (loading) {
    return (
      <p className="status-message">
        Cargando entrenamiento...
      </p>
    );
  }

  if (error || !routine || !session) {
    return (
      <section className="empty-state">
        <h1>No se pudo abrir el entrenamiento</h1>

        <p>
          {error ||
            "La rutina solicitada no existe."}
        </p>

        <Link className="text-link" to="/gimnasio">
          ← Volver a entrenamiento
        </Link>
      </section>
    );
  }

  return (
    <section className="workout-page">
      <div className="workout-page__navigation">
        <Link
          className="back-link back-link--gym"
          to="/gimnasio"
        >
          ← Volver a entrenamiento
        </Link>
      </div>

      <header className="workout-header">
        <div>
          <p className="workout-header__eyebrow">
            Entrenamiento activo
          </p>

          <h1>{routine.name}</h1>

          {routine.description && (
            <p>{routine.description}</p>
          )}
        </div>

        <div className="workout-stopwatch">
          <span>Tiempo</span>
          <strong>{formatTime(elapsedSeconds)}</strong>
        </div>
      </header>

      <section className="workout-rest-settings">
        <div>
          <small>Configuración</small>

          <strong>
            Descanso entre ejercicios
          </strong>

          <p>
            Se utiliza al completar la última
            serie de un ejercicio.
          </p>
        </div>

        <label>
          <input
            type="number"
            min={MIN_REST_SECONDS}
            max={MAX_REST_SECONDS}
            step="5"
            value={
              betweenExercisesRestDuration
            }
            disabled={finishing}
            onChange={(event) => {
              const numericValue = Number(
                event.target.value,
              );

              if (
                !Number.isFinite(numericValue)
              ) {
                return;
              }

              setBetweenExercisesRestDuration(
                Math.min(
                  MAX_REST_SECONDS,
                  Math.max(
                    MIN_REST_SECONDS,
                    Math.trunc(numericValue),
                  ),
                ),
              );
            }}
          />

          <span>segundos</span>
        </label>
      </section>

      <div className="workout-sticky-panel">
        <section className="rest-timer">
          <div className="rest-timer__main">
            <div>
              <span className="rest-timer__label">
                Descanso
              </span>

              <strong className="rest-timer__time">
                {formatRestTime(restRemaining)}
              </strong>
            </div>

            <div className="rest-timer__adjustment">
              <button
                type="button"
                onClick={() => adjustRestTimer(-5)}
                disabled={
                  finishing ||
                  restDuration <= MIN_REST_SECONDS
                }
              >
                −5 s
              </button>

              <span>{restDuration} s</span>

              <button
                type="button"
                onClick={() => adjustRestTimer(5)}
                disabled={
                  finishing ||
                  restDuration >= MAX_REST_SECONDS
                }
              >
                +5 s
              </button>
            </div>
          </div>

          <div className="rest-timer__controls">
            {restRunning ? (
              <button
                type="button"
                onClick={pauseRestTimer}
                disabled={finishing}
              >
                Pausar
              </button>
            ) : (
              <button
                type="button"
                onClick={resumeRestTimer}
                disabled={finishing}
              >
                {restRemaining === restDuration
                  ? "Iniciar"
                  : "Continuar"}
              </button>
            )}

            <button
              type="button"
              onClick={resetRestTimer}
              disabled={finishing}
            >
              Reiniciar
            </button>

            <button
              type="button"
              onClick={skipRestTimer}
              disabled={finishing}
            >
              Omitir
            </button>
          </div>
        </section>

        <section className="workout-progress">
          <div className="workout-progress__header">
            <span>Progreso total</span>

            <strong>
              {progress.completedSets} de{" "}
              {progress.totalSets} series
            </strong>
          </div>

          <div className="workout-progress__track">
            <div
              className="workout-progress__bar"
              style={{
                width: `${progress.percentage}%`,
              }}
            />
          </div>

          <span className="workout-progress__percentage">
            {progress.percentage}%
          </span>
        </section>
      </div>
{exercises.length === 0 ? (
        <section className="empty-state">
          <h2>Esta rutina no tiene ejercicios</h2>

          <p>
            Finalizá el entrenamiento y agregá
            ejercicios desde la configuración.
          </p>
        </section>
      ) : (
        <section className="workout-exercise-list">
          {exercises.map((exercise, index) => {
            const exerciseProgress =
              session.exerciseProgress[exercise.id];

            const completedSets =
              exerciseProgress?.completedSets ??
              Array.from(
                { length: exercise.sets },
                () => false,
              );

            const setDetails =
              exerciseProgress?.setDetails ??
              Array.from(
                { length: exercise.sets },
                () => ({
                  reps: exercise.reps,
                  weight: exercise.weight,
                }),
              );

            const completedCount =
              completedSets.filter(Boolean).length;

            const exerciseCompleted =
              completedCount === exercise.sets;

            return (
              <article
                className={
                  exerciseCompleted
                    ? "workout-exercise-card workout-exercise-card--completed"
                    : "workout-exercise-card"
                }
                key={exercise.id}
              >
                <div className="workout-exercise-card__header">
                  <span className="workout-exercise-card__order">
                    {index + 1}
                  </span>

                  <div>
                    <h2>{exercise.name}</h2>

                    <p>
                      {completedCount} de{" "}
                      {exercise.sets} series
                    </p>
                  </div>

                  {exerciseCompleted && (
                    <span className="workout-exercise-card__completed-label">
                      Completo
                    </span>
                  )}
                </div>

                <div className="workout-exercise-card__details">
                  <div>
                    <span>Series</span>
                    <strong>{exercise.sets}</strong>
                  </div>

                  <div>
                    <span>Peso inicial</span>
                    <strong>
                      {exercise.weight} kg
                    </strong>
                  </div>

                  <div>
                    <span>Descanso</span>
                    <strong>
                      {exercise.restSeconds} s
                    </strong>
                  </div>
                </div>

                <div className="workout-set-list">
                  {completedSets.map(
                    (completed, setIndex) => {
                      const details =
                        setDetails[setIndex] ?? {
                          reps: exercise.reps,
                          weight: exercise.weight,
                        };

                      return (
                        <div
                          className={
                            completed
                              ? "workout-set workout-set--completed"
                              : "workout-set"
                          }
                          key={`${exercise.id}-${setIndex}`}
                        >
                          <label className="workout-set__check">
                            <input
                              type="checkbox"
                              checked={completed}
                              disabled={finishing}
                              onChange={() =>
                                handleToggleSet(
                                  exercise.id,
                                  setIndex,
                                )
                              }
                            />

                            <span>
                              Serie {setIndex + 1}
                            </span>
                          </label>

                          <label className="workout-set__field">
                            <span>Rep.</span>

                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={details.reps}
                              disabled={finishing}
                              onChange={(event) =>
                                handleSetDetailsChange(
                                  exercise.id,
                                  setIndex,
                                  "reps",
                                  event.target.value,
                                )
                              }
                            />
                          </label>

                          <label className="workout-set__field">
                            <span>Kg</span>

                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={details.weight}
                              disabled={finishing}
                              onChange={(event) =>
                                handleSetDetailsChange(
                                  exercise.id,
                                  setIndex,
                                  "weight",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                        </div>
                      );
                    },
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      <button
        type="button"
        className="finish-workout-button"
        disabled={finishing}
        onClick={handleManualFinish}
      >
        {finishing
          ? "Finalizando..."
          : "Finalizar entrenamiento"}
      </button>
    </section>
  );
}

















