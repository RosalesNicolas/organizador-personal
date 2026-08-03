import { BrowserRouter, Route, Routes } from "react-router";
import { CjccAssessmentDetailPage } from "./modules/cjcc/CjccAssessmentDetailPage";
import { CjccAssessmentsPage } from "./modules/cjcc/CjccAssessmentsPage";
import { CjccCoursePage } from "./modules/cjcc/CjccCoursePage";
import { CjccStudentDetailPage } from "./modules/cjcc/CjccStudentDetailPage";
import { CjccPage } from "./modules/cjcc/CjccPage";
import { GimnasioPage } from "./modules/gimnasio/GimnasioPage";
import { GymRoutinePage } from "./modules/gimnasio/GymRoutinePage";
import { GymWorkoutPage } from "./modules/gimnasio/GymWorkoutPage";
import { InicioPage } from "./modules/inicio/InicioPage";
import { PendingPage } from "./modules/pendientes/PendingPage";
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
            <Route
              path="/pendientes"
              element={<PendingPage />}
            />
            <Route path="/cjcc" element={<CjccPage />} />
            <Route
              path="/cjcc/:courseId/evaluaciones/:assessmentId"
              element={<CjccAssessmentDetailPage />}
            />

            <Route
              path="/cjcc/:courseId/evaluaciones"
              element={<CjccAssessmentsPage />}
            />

            <Route
              path="/cjcc/:courseId/estudiantes/:studentId"
              element={<CjccStudentDetailPage />}
            />

            <Route
              path="/cjcc/:courseId"
              element={<CjccCoursePage />}
            />
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







