import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") ?? "light");
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
  }, [isDark, theme]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: isDark
            ? { background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155" }
            : undefined
        }}
      />
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="fixed bottom-4 right-4 z-50 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {isDark ? "Light mode" : "Dark mode"}
      </button>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
