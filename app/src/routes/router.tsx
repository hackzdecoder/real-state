import { lazy } from "react";
import type { ReactElement } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const Dashboard = lazy(() => import("../pages/dashboard"));
const Login = lazy(() => import("../pages/login"));

function ProtectedRoute({ children }: { children: ReactElement }) {
    const token = localStorage.getItem("auth_token");
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

export default function Routing(): ReactElement {
    const token = localStorage.getItem("auth_token");

    return (
        <Routes>
            <Route
                path="/"
                element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
            />
            <Route
                path="/login"
                element={token ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}
