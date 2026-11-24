
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "@/components/layout/MainLayout";

import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import EvaluationPage from "@/features/property-evaluation/pages/EvaluationPage";

function App() {
    return (
        <BrowserRouter>
            <MainLayout>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/avaliar" element={<EvaluationPage />} />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    );
}

export default App;
