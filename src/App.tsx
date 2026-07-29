import { BrowserRouter, Route, Routes } from "react-router";
import { CjccPage } from "./modules/cjcc/CjccPage";
import { GimnasioPage } from "./modules/gimnasio/GimnasioPage";
import { InicioPage } from "./modules/inicio/InicioPage";
import { PieroPage } from "./modules/piero/PieroPage";
import { UtnPage } from "./modules/utn/UtnPage";
import { ProtectedApp } from "./shared/components/ProtectedApp";
import { AppLayout } from "./shared/layouts/AppLayout";
import { UtnSubjectPage } from "./modules/utn/UtnSubjectPage";

function App() {
  return (
    <ProtectedApp>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<InicioPage />} />
            <Route path="/cjcc" element={<CjccPage />} />
            <Route path="/piero" element={<PieroPage />} />
            <Route path="/utn" element={<UtnPage />} />
            <Route path="/utn/:subjectId" element={<UtnSubjectPage />} />
            <Route path="/gimnasio" element={<GimnasioPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProtectedApp>
  );
}

export default App;