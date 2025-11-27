import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { getAdminOverview, getAdminLeads } from "../../services/adminService";

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-700",
  pending_moderation: "bg-amber-100 text-amber-700",
  published: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
  archived: "bg-slate-200 text-slate-600",
};

export default function AdminDashboardPage() {
  const { token } = useAuth();

  const overviewQuery = useQuery({
    queryKey: ["admin-overview", token],
    queryFn: () => getAdminOverview(token),
    enabled: !!token,
  });

  const leadsQuery = useQuery({
    queryKey: ["admin-leads", token],
    queryFn: () => getAdminLeads(token),
    enabled: !!token,
  });

  const metrics = overviewQuery.data?.metrics;
  const propertiesByStatus = useMemo(() => {
    if (!metrics?.propertiesByStatus) return [];
    return metrics.propertiesByStatus.map((item) => ({
      status: item._id || "inconnu",
      count: item.count,
    }));
  }, [metrics?.propertiesByStatus]);

  const plans = metrics?.plans ?? [];
  const recentLeads = leadsQuery.data?.leads?.slice(0, 5) ?? [];

  if (!token) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Cette section est réservée aux administrateurs. Veuillez vous connecter avec un compte admin.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-500">Console admin</p>
        <h1 className="text-3xl font-semibold text-slate-900">Vue d'ensemble</h1>
        <p className="text-sm text-slate-500">
          Suivez l’activité globale : publications, leads, abonnements et demandes de validation.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Utilisateurs", value: metrics?.usersCount ?? 0 },
          { label: "Leads totaux", value: metrics?.leadsCount ?? 0 },
          { label: "Abonnements actifs", value: metrics?.activeSubscriptions ?? 0 },
          {
            label: "Plans actifs",
            value: plans.length,
          },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Répartition des annonces</h2>
              <p className="text-sm text-slate-500">Suivi par statut et volumétrie</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/moderation">Modérer</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {propertiesByStatus.length === 0 && (
              <p className="text-sm text-slate-500">Aucune donnée de publication disponible pour le moment.</p>
            )}
            {propertiesByStatus.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <span
                  className={`inline-flex min-w-[120px] justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                    STATUS_COLORS[item.status] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.status.replace("_", " ")}
                </span>
                <div className="h-2 flex-1 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.min(100, (item.count / Math.max(1, metrics?.usersCount ?? 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Actions rapides</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            {[
              { label: "Modération des annonces", to: "/admin/moderation" },
              { label: "Validation KYC entreprises", to: "/admin/kyc" },
              { label: "Plans & tarification", to: "/admin/plans" },
              { label: "Statistiques avancées", to: "/admin/stats" },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-slate-600 transition hover:border-emerald-200 hover:bg-white"
              >
                {action.label}
                <span className="text-slate-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Plans actifs</h2>
              <p className="text-sm text-slate-500">Contrôle des quotas et priorités</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/plans">Configurer</Link>
            </Button>
          </div>
          <div className="mt-4 divide-y divide-slate-100 text-sm text-slate-600">
            {plans.map((plan) => (
              <div key={plan._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-slate-900">{plan.name}</p>
                  <p className="text-xs text-slate-500">
                    {plan.maxProperties === -1 ? "Annonces illimitées" : `${plan.maxProperties} annonces`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{plan.price.toLocaleString("fr-FR")} dh</p>
                  <p className="text-xs text-slate-500">{plan.duration === "monthly" ? "Mensuel" : "Annuel"}</p>
                </div>
              </div>
            ))}
            {plans.length === 0 && <p className="py-3 text-sm text-slate-500">Aucun plan actif.</p>}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Leads récents</h2>
              <p className="text-sm text-slate-500">Dernières manifestations d’intérêt</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/inbox">Voir tous</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {recentLeads.length === 0 && <p>Aucun lead récent.</p>}
            {recentLeads.map((lead) => (
              <div key={lead._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">{lead.property?.title ?? "Annonce"}</p>
                <p className="text-xs text-slate-500">
                  {lead.buyer?.firstName} {lead.buyer?.lastName} → {lead.owner?.firstName} {lead.owner?.lastName}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(lead.createdAt).toLocaleDateString("fr-FR")} • Statut : {lead.status}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

