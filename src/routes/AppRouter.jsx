import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import { AppLayout } from "../layouts/AppLayout";
import { RequireAuth } from "./RequireAuth";
import { ForbiddenPage } from "../pages/system/ForbiddenPage";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "properties", element: <PlaceholderPage title="Annonces" /> },
          { path: "inbox", element: <PlaceholderPage title="Leads & Chat" /> },
          { path: "financing", element: <PlaceholderPage title="Financement" /> },
          {
            element: <RequireAuth allowedRoles={["entreprise"]} />,
            children: [
              { path: "team", element: <PlaceholderPage title="Gestion de l'équipe" /> },
            ],
          },
          {
            element: <RequireAuth allowedRoles={["admin"]} />,
            children: [
              { path: "admin/moderation", element: <PlaceholderPage title="Modération annonces" /> },
              { path: "admin/kyc", element: <PlaceholderPage title="Validation KYC" /> },
              { path: "admin/plans", element: <PlaceholderPage title="Plans & tarifs" /> },
              { path: "admin/stats", element: <PlaceholderPage title="Statistiques globales" /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { path: "/forbidden", element: <ForbiddenPage /> },
]);

function PlaceholderPage({ title }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
      {title} — module à implémenter prochainement.
    </div>
  );
}

export function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

