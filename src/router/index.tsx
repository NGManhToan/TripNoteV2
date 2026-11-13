import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import RouteFallback from "./RouteFallback";

const DashboardPage = lazy(() => import("../pages/Dashboard"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/home" replace />,
  },
  {
    path: "/home/*",
    element: <Suspense fallback={<RouteFallback />}><DashboardPage /></Suspense>,
  },
]);
