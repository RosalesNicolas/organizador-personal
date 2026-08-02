import { BrowserRouter, Route, Routes } from "react-router";
import { CjccPage } from "./modules/cjcc/CjccPage";
import { GimnasioPage } from "./modules/gimnasio/GimnasioPage";
import { GymRoutinePage } from "./modules/gimnasio/GymRoutinePage";
import { GymWorkoutPage } from "./modules/gimnasio/GymWorkoutPage";
import { InicioPage } from "./modules/inicio/InicioPage";
import { PieroCoursePage } from "./modules/piero/PieroCoursePage";
import { PieroGradeColumnsPage } from "./modules/piero/PieroGradeColumnsPage";
import { PieroPage } from "./modules/piero/PieroPage";
import { UtnPage } from "./modules/utn/UtnPage";
import { UtnSubjectPage } from "./modules/utn/UtnSubjectPage";
import { ProtectedApp } from "./shared/components/ProtectedApp";
import { AppLayout } from "./shared/layouts/AppLayout";

function App() {
  return (
    <BrowserRouter>
      <ProtectedApp>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<InicioPage />} />
            <Route path="/cjcc" element={<CjccPage />} />
            <Route path="/piero" element={<PieroPage />} />
            <Route
              path="/piero/:courseId/columnas"
              element={<PieroGradeColumnsPage />}
            />

            <Route
              path="/piero/:courseId"
              element={<PieroCoursePage />}
            />

            <Route path="/utn" element={<UtnPage />} />
            <Route
              path="/utn/:subjectId"
              element={<UtnSubjectPage />}
            />

            <Route
              path="/gimnasio"
              element={<GimnasioPage />}
            />

            <Route
              path="/gimnasio/entrenamiento/:routineId"
              element={<GymWorkoutPage />}
            />

            <Route
              path="/gimnasio/:routineId"
              element={<GymRoutinePage />}
            />
          </Route>
        </Routes>
      </ProtectedApp>
    </BrowserRouter>
  );
}

export default App;


