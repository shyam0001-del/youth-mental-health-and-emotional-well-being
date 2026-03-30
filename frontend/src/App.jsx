import { Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import RegisterChoicePage from "./pages/RegisterChoicePage";
import LoginPage from "./pages/LoginPage";
import UserRegisterPage from "./pages/UserRegisterPage";
import NgoRegisterPage from "./pages/NgoRegisterPage";
import SpecialistRegisterPage from "./pages/SpecialistRegisterPage";
import StudentPage from "./pages/StudentPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import AdminRoute from "./components/AdminRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/register" element={<RegisterChoicePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/user" element={<UserRegisterPage />} />
      <Route path="/register/ngo" element={<NgoRegisterPage />} />
      <Route path="/register/specialist" element={<SpecialistRegisterPage />} />
      <Route path="/student" element={<StudentPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
    </Routes>
  );
}