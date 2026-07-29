import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import type {
  DeliveryFormData,
  DeliveryStatus,
  UtnDelivery,
} from "./types";

function getCurrentUserId() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  return user.uid;
}

function getDeliveriesCollection(subjectId: string) {
  const userId = getCurrentUserId();

  return collection(
    db,
    "users",
    userId,
    "utnMaterias",
    subjectId,
    "entregas",
  );
}

function getDeliveryReference(subjectId: string, deliveryId: string) {
  const userId = getCurrentUserId();

  return doc(
    db,
    "users",
    userId,
    "utnMaterias",
    subjectId,
    "entregas",
    deliveryId,
  );
}

export async function getDeliveries(
  subjectId: string,
): Promise<UtnDelivery[]> {
  const deliveriesQuery = query(
    getDeliveriesCollection(subjectId),
    orderBy("dueDate", "asc"),
  );

  const snapshot = await getDocs(deliveriesQuery);

  return snapshot.docs.map((deliveryDocument) => ({
    id: deliveryDocument.id,
    subjectId,
    ...deliveryDocument.data(),
  })) as UtnDelivery[];
}

export async function createDelivery(
  subjectId: string,
  data: DeliveryFormData,
) {
  await addDoc(getDeliveriesCollection(subjectId), {
    subjectId,
    title: data.title.trim(),
    description: data.description.trim(),
    dueDate: data.dueDate,
    status: data.status,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDelivery(
  subjectId: string,
  deliveryId: string,
  data: DeliveryFormData,
) {
  await updateDoc(getDeliveryReference(subjectId, deliveryId), {
    title: data.title.trim(),
    description: data.description.trim(),
    dueDate: data.dueDate,
    status: data.status,
    updatedAt: serverTimestamp(),
  });
}

export async function changeDeliveryStatus(
  subjectId: string,
  deliveryId: string,
  status: DeliveryStatus,
) {
  await updateDoc(getDeliveryReference(subjectId, deliveryId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function archiveDelivery(
  subjectId: string,
  deliveryId: string,
) {
  await updateDoc(getDeliveryReference(subjectId, deliveryId), {
    archived: true,
    updatedAt: serverTimestamp(),
  });
}

export async function restoreDelivery(
  subjectId: string,
  deliveryId: string,
) {
  await updateDoc(getDeliveryReference(subjectId, deliveryId), {
    archived: false,
    updatedAt: serverTimestamp(),
  });
}

export async function permanentlyDeleteDelivery(
  subjectId: string,
  deliveryId: string,
) {
  await deleteDoc(getDeliveryReference(subjectId, deliveryId));
}