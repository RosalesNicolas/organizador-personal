import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import type {
  PendingTask,
  PendingTaskFormData,
} from "./types";

function requireAuthenticatedUser() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "No hay un usuario autenticado.",
    );
  }

  return user;
}

function getPendingCollection() {
  const user = requireAuthenticatedUser();

  return collection(
    db,
    "users",
    user.uid,
    "pendientes",
  );
}

function getPendingReference(taskId: string) {
  const user = requireAuthenticatedUser();

  return doc(
    db,
    "users",
    user.uid,
    "pendientes",
    taskId,
  );
}

function sortPendingTasks(
  tasks: PendingTask[],
) {
  return [...tasks].sort((taskA, taskB) => {
    if (taskA.completed !== taskB.completed) {
      return (
        Number(taskA.completed) -
        Number(taskB.completed)
      );
    }

    if (
      taskA.priority !== taskB.priority
    ) {
      return taskA.priority === "high"
        ? -1
        : 1;
    }

    if (taskA.dueDate && taskB.dueDate) {
      const dateComparison =
        taskA.dueDate.localeCompare(
          taskB.dueDate,
        );

      if (dateComparison !== 0) {
        return dateComparison;
      }
    }

    if (taskA.dueDate && !taskB.dueDate) {
      return -1;
    }

    if (!taskA.dueDate && taskB.dueDate) {
      return 1;
    }

    return taskA.title.localeCompare(
      taskB.title,
      "es",
      { sensitivity: "base" },
    );
  });
}

export async function getPendingTasks():
Promise<PendingTask[]> {
  const snapshot = await getDocs(
    getPendingCollection(),
  );

  const tasks = snapshot.docs.map(
    (taskDocument) =>
      ({
        id: taskDocument.id,
        ...taskDocument.data(),
      }) as PendingTask,
  );

  return sortPendingTasks(tasks);
}

export async function createPendingTask(
  formData: PendingTaskFormData,
) {
  await addDoc(getPendingCollection(), {
    title: formData.title,
    description: formData.description,
    dueDate: formData.dueDate,
    module: formData.module,
    priority: formData.priority,
    completed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updatePendingTask(
  taskId: string,
  formData: PendingTaskFormData,
) {
  await updateDoc(
    getPendingReference(taskId),
    {
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate,
      module: formData.module,
      priority: formData.priority,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function setPendingTaskCompleted(
  taskId: string,
  completed: boolean,
) {
  await updateDoc(
    getPendingReference(taskId),
    {
      completed,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function deletePendingTask(
  taskId: string,
) {
  await deleteDoc(
    getPendingReference(taskId),
  );
}
