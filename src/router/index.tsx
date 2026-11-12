import { createBrowserRouter } from "react-router-dom";
import RouteFallback from "./RouteFallback";

export const router = createBrowserRouter([
  {
    path: "/",
    HydrateFallback: RouteFallback,
    lazy: async () => {
      const { default: WelcomePage } = await import("../pages/Welcome");
      return { Component: WelcomePage };
    },
  },
  {
    path: "/home/*",
    HydrateFallback: RouteFallback,
    lazy: async () => {
      const { default: DashboardPage } = await import("../pages/Dashboard");
      return { Component: DashboardPage };
    },
  },
]);
