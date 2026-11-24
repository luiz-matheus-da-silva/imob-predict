import { Routes, Route } from "react-router-dom";

import MainLayout from "@/components/layout/MainLayout";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import EvaluationPage from "@/features/property-evaluation/pages/EvaluationPage";
import { TrainingPage } from "@/features/model-training/pages/TrainingPage";
import HistoryPage from "@/features/model-training/pages/HistoryPage";
import PropertyRegistrationPage from "@/features/property-registration/pages/PropertyRegistrationPage";

function App() {
  return (
    <TooltipProvider delay={150}>
      <MainLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/avaliar" element={<EvaluationPage />} />
          <Route path="/imoveis" element={<PropertyRegistrationPage />} />
          <Route path="/treinamento" element={<TrainingPage />} />
          <Route path="/historico" element={<HistoryPage />} />
        </Routes>
      </MainLayout>
    </TooltipProvider>
  );
}

export default App;
