import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { RealtimeProvider } from "../context/RealtimeContext";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import PropertiesPage from "../pages/properties/PropertiesPage";
import CreatePropertyPage from "../pages/properties/CreatePropertyPage";
import MyPropertiesPage from "../pages/properties/MyPropertiesPage";
import EditPropertyPage from "../pages/properties/EditPropertyPage";
import PropertyDetailsPage from "../pages/properties/PropertyDetailsPage";
import FinancingPage from "../pages/financing/FinancingPage";
import LoanSimulatorPage from "../pages/financing/LoanSimulatorPage";
import MyTirelireGroupsPage from "../pages/financing/MyTirelireGroupsPage";
import AllTirelireGroupsPage from "../pages/financing/AllTirelireGroupsPage";
import TirelireGroupDetailsPage from "../pages/financing/TirelireGroupDetailsPage";
import TirelirePage from "../pages/financing/TirelirePage";
import BanksPage from "../pages/financing/BanksPage";
import { AppLayout } from "../layouts/AppLayout";
import { RequireAuth } from "./RequireAuth";
import { ForbiddenPage } from "../pages/system/ForbiddenPage";
import NotFoundPage from "../pages/system/NotFoundPage";
import ServerErrorPage from "../pages/system/ServerErrorPage";
import MaintenancePage from "../pages/system/MaintenancePage";
import PrivacyPage from "../pages/system/PrivacyPage";
import CookiesPage from "../pages/system/CookiesPage";
import SupportPage from "../pages/system/SupportPage";
import MyTicketsPage from "../pages/system/MyTicketsPage";
import InboxPage from "../pages/inbox/InboxPage";
import BanksManagementPage from "../pages/admin/BanksManagementPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminModerationPage from "../pages/admin/AdminModerationPage";
import AdminPlansPage from "../pages/admin/AdminPlansPage";
import AdminKycPage from "../pages/admin/AdminKycPage";
import AdminStatsPage from "../pages/admin/AdminStatsPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminSupportPage from "../pages/admin/AdminSupportPage";
import ProfilePage from "../pages/profile/ProfilePage";
import TeamPage from "../pages/team/TeamPage";
import HomePage from "../pages/home/HomePage";
import PromotionsBadgesPage from "../pages/properties/PromotionsBadgesPage";
import CookieConsentBanner from "../components/system/CookieConsentBanner.jsx";
import { UserSessionBridge } from "../components/realtime/UserSessionBridge.jsx";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    element: <RequireAuth fallback={<HomePage />} />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "properties", element: <PropertiesPage /> },
          { path: "properties/new", element: <CreatePropertyPage /> },
          { path: "properties/manage", element: <MyPropertiesPage /> },
          { path: "properties/:id/edit", element: <EditPropertyPage /> },
          { path: "properties/:id", element: <PropertyDetailsPage /> },
          { path: "properties/promotions", element: <PromotionsBadgesPage /> },
          { path: "inbox", element: <InboxPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "support/my-tickets", element: <MyTicketsPage /> },
          {
            path: "financing",
            element: <FinancingPage />,
            children: [
              { index: true, element: <LoanSimulatorPage /> },
              { path: "simulator", element: <LoanSimulatorPage /> },
              { path: "tirelire", element: <TirelirePage /> },
              { path: "tirelire/available", element: <AllTirelireGroupsPage /> },
              { path: "tirelire/my-groups", element: <MyTirelireGroupsPage /> },
              { path: "tirelire/:id", element: <TirelireGroupDetailsPage /> },
              { path: "banks", element: <BanksPage /> },
            ],
          },
          {
            element: <RequireAuth allowedRoles={["entreprise"]} />,
            children: [
              { path: "team", element: <TeamPage /> },
            ],
          },
          {
            element: <RequireAuth allowedRoles={["admin"]} />,
            children: [
              { path: "admin/dashboard", element: <AdminDashboardPage /> },
              { path: "admin/moderation", element: <AdminModerationPage /> },
              { path: "admin/kyc", element: <AdminKycPage /> },
              { path: "admin/plans", element: <AdminPlansPage /> },
              { path: "admin/stats", element: <AdminStatsPage /> },
              { path: "admin/banks", element: <BanksManagementPage /> },
              { path: "admin/users", element: <AdminUsersPage /> },
              { path: "admin/support", element: <AdminSupportPage /> },
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
  { path: "/500", element: <ServerErrorPage /> },
  { path: "/maintenance", element: <MaintenancePage /> },
  { path: "/legal/privacy", element: <PrivacyPage /> },
  { path: "/legal/cookies", element: <CookiesPage /> },
  { path: "/support", element: <SupportPage /> },
  { path: "*", element: <NotFoundPage /> },
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
        <RealtimeProvider>
          <>
            <UserSessionBridge />
            <RouterProvider router={router} />
            <CookieConsentBanner />
          </>
        </RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

