import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./config";

export async function testFirestoreConnection() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No hay un usuario autenticado.");
  }

  const testRef = doc(db, "users", user.uid, "configuracion", "prueba");

  await setDoc(testRef, {
    mensaje: "Firestore conectado correctamente",
    creadoEn: serverTimestamp(),
  });

  const snapshot = await getDoc(testRef);

  if (!snapshot.exists()) {
    throw new Error("El documento no pudo leerse.");
  }

  return snapshot.data();
}