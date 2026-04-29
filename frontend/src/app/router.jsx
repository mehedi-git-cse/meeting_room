import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAppSelector } from "./hooks";

const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const AppPage = lazy(() => import("../pages/AppPage"));

const Protected = ({ children }) => {
  const user = useAppSelector((s) => s.auth.user);
  return user ? children : <Navigate to="/login" replace />;
};

export const AppRouter = () => {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <Protected>
              <AppPage />
            </Protected>
          }
        />
      </Routes>
    </Suspense>
  );
};
