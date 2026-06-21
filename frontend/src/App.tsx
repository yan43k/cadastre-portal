import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { AppShell } from "./components/AppShell";
import { Protected } from "./components/Protected";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import ConsultationPage from "./pages/ConsultationPage";
import TrackPage from "./pages/TrackPage";
import CalculatorPage from "./pages/CalculatorPage";
import NormativesPage from "./pages/NormativesPage";
import PartnersPage from "./pages/PartnersPage";
import VacanciesPage from "./pages/VacanciesPage";
import NewsPage from "./pages/NewsPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import PrivacyPage from "./pages/PrivacyPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CabinetPage from "./pages/CabinetPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/consultation" element={<ConsultationPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/normatives" element={<NormativesPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/vacancies" element={<VacanciesPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:slug" element={<NewsDetailPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/cabinet"
              element={
                <Protected>
                  <CabinetPage />
                </Protected>
              }
            />
            <Route
              path="/admin"
              element={
                <Protected admin>
                  <AdminPage />
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </HelmetProvider>
  );
}
