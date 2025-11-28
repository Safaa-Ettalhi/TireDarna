import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { NotificationBell } from "../components/NotificationBell";

const navLinks = [
  { to: "/dashboard", label: "Tableau de bord" },
  { to: "/properties", label: "Catalogue" },
  { to: "/properties/manage", label: "Mes annonces" },
  { to: "/inbox", label: "Leads & Chat" },
  { to: "/financing", label: "Financement" },
  { to: "/profile", label: "Profil & abonnement" },
];

export function AppLayout() {
  const { user, logout } = useAuth();

  const links = (() => {
    if (user?.role === "admin") {
      return [
        { to: "/admin/dashboard", label: "Tableau de bord" },
        { to: "/admin/moderation", label: "Modération" },
        { to: "/admin/kyc", label: "Validation KYC" },
        { to: "/admin/plans", label: "Plans & tarifs" },
        { to: "/admin/users", label: "Utilisateurs" },
        { to: "/admin/support", label: "Support" },
        { to: "/profile", label: "Profil & abonnement" },
        { to: "/admin/banks", label: "Banques partenaires" },
        { to: "/admin/stats", label: "Statistiques" },
      ];
    }
    if (user?.role === "entreprise") {
      return [
        { to: "/dashboard", label: "Tableau de bord" },
        { to: "/properties", label: "Catalogue" },
        { to: "/properties/manage", label: "Mes annonces" },
        { to: "/inbox", label: "Leads & Chat" },
        { to: "/team", label: "Équipe & membres" },
        { to: "/financing", label: "Financement" },
        { to: "/profile", label: "Profil & abonnement" },
      ];
    }
    return navLinks;
  })();

  return (
    <div className="grid min-h-screen grid-cols-[260px,1fr] bg-slate-100">
      <aside className="flex flex-col gap-4 border-r border-slate-200 bg-white px-6 py-8">
        <Link
          to={user?.role === "admin" ? "/admin/dashboard" : "/dashboard"}
          className="text-xl font-semibold text-emerald-600"
        >
          Darna Platform
        </Link>
        <nav className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 transition ${
                  isActive ? "bg-emerald-100 text-emerald-700" : "hover:bg-slate-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <p className="font-semibold uppercase tracking-wide text-slate-400">Pages système</p>
          <div className="flex flex-col gap-1">
            <Link to="/legal/privacy" className="hover:text-slate-900">
              Politique de confidentialité
            </Link>
            <Link to="/legal/cookies" className="hover:text-slate-900">
              Préférences cookies
            </Link>
            <Link to="/maintenance" className="hover:text-slate-900">
              Statut maintenance
            </Link>
            <Link to="/500" className="hover:text-slate-900">
              Page incident
            </Link>
            <Link to="/support" className="hover:text-slate-900">
              Support & assistance
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex items-center justify-end border-b border-slate-200 bg-white px-8 py-4">
          <div className="flex items-center gap-4">
            {user && <NotificationBell />}
            {user ? (
              <Button variant="secondary" onClick={logout}>
                Se déconnecter
              </Button>
            ) : (
              <Link to="/login" className="text-sm font-semibold text-emerald-600">
                Se connecter
              </Link>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

