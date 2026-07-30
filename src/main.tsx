import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { AuthProvider } from "./firebase/AuthContext";
import "./index.css";

registerSW({
  immediate: true,
  onRegisteredSW() {
    console.info("PWA registrada correctamente.");
  },
  onRegisterError(error) {
    console.error(
      "No se pudo registrar la PWA.",
      error,
    );
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
