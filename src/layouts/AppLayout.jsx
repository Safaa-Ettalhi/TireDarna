import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";

const navLinks = [
  { to: "/dashboard", label: "Tableau de bord" },
  { to: "/properties", label: "Annonces" },
  { to: "/inbox", label: "Leads & Chat" },
  { to: "/financing", label: "Financement" },
];

export function AppLayout() {
  const { user, logout } = useAuth();

  const links = (() => {
    if (user?.role === "admin") {
      return [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/admin/moderation", label: "Modération" },
        { to: "/admin/kyc", label: "Validation KYC" },
        { to: "/admin/plans", label: "Plans & tarifs" },
        { to: "/admin/stats", label: "Statistiques" },
      ];
    }
    if (user?.role === "entreprise") {
      return [
        { to: "/dashboard", label: "Vue agence" },
        { to: "/properties", label: "Annonces" },
        { to: "/inbox", label: "Leads & Chat" },
        { to: "/team", label: "Équipe & membres" },
        { to: "/financing", label: "Financement" },
      ];
    }
    return navLinks;
  })();

  return (
    <div className="grid min-h-screen grid-cols-[260px,1fr] bg-slate-100">
      <aside className="flex flex-col gap-4 border-r border-slate-200 bg-white px-6 py-8">
        <Link to="/" className="text-xl font-semibold text-emerald-600">
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
      </aside>

      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              Bienvenue sur Darna
            </p>
            <p className="text-lg font-bold text-slate-900">
              {user ? user.firstName ?? user.email : "Visiteur"}
            </p>
          </div>
          {user ? (
            <Button variant="secondary" onClick={logout}>
              Se déconnecter
            </Button>
          ) : (
            <Link to="/login" className="text-sm font-semibold text-emerald-600">
              Se connecter
            </Link>
          )}
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

