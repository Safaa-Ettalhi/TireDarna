import { Link, Outlet, useLocation } from "react-router-dom";

const tabs = [
  { path: "/financing", label: "Simulateur", exact: false }, 
  { path: "/financing/tirelire", label: "Créer un groupe" },
  { path: "/financing/tirelire/available", label: "Groupes disponibles" },
  { path: "/financing/tirelire/my-groups", label: "Mes groupes" },
  { path: "/financing/banks", label: "Banques partenaires" },
];

export default function FinancingPage() {
  const location = useLocation();

  function isActive(path, exact = false) {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Financement immobilier</h1>
        <p className="mt-2 text-sm text-slate-500">
          Simulez votre crédit, explorez les offres bancaires ou créez un groupe d'épargne collective
          Tirelire pour financer votre projet.
        </p>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200">
          <nav className="flex gap-2 px-6">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`border-b-2 px-4 py-4 text-sm font-medium transition ${
                  isActive(tab.path, tab.exact)
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

