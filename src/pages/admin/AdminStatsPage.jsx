import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getAdminOverview, getAdminLeads } from "../../services/adminService";

export default function AdminStatsPage() {
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
  const leads = leadsQuery.data?.leads ?? [];

  const leadsByStatus = useMemo(() => {
    return leads.reduce((acc, lead) => {
      const key = lead.status || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [leads]);

  const conversionRate = useMemo(() => {
    const converted = leadsByStatus.converted ?? 0;
    return leads.length ? Math.round((converted / leads.length) * 100) : 0;
  }, [leads, leadsByStatus]);

  if (!token) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Connectez-vous avec un compte administrateur pour accéder aux statistiques avancées.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Statistiques</p>
        <h1 className="text-3xl font-semibold text-slate-900">Indicateurs clés</h1>
        <p className="text-sm text-slate-500">
          Vue détaillée de l’activité : leads, publications, abonnements et tendances.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total leads", value: leads.length },
          { label: "Conversions", value: `${leadsByStatus.converted ?? 0}` },
          { label: "Taux de conversion", value: `${conversionRate}%` },
          { label: "Annonces actives", value: metrics?.propertiesByStatus?.find((s) => s._id === "published")?.count ?? 0 },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Répartition des leads par statut</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(leadsByStatus).map(([status, count]) => (
            <div key={status} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase text-slate-400">{status}</p>
              <p className="text-2xl font-semibold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500">
                {leads.length ? `${Math.round((count / leads.length) * 100)}% des leads` : "—"}
              </p>
            </div>
          ))}
          {Object.keys(leadsByStatus).length === 0 && (
            <p className="text-sm text-slate-500">Aucune donnée de lead pour le moment.</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Plans & abonnements</h2>
          <p className="text-sm text-slate-500">
            Répartition des plans visibles dans la console. Ajustez-les depuis l’onglet dédié.
          </p>
          <div className="mt-4 space-y-3">
            {(metrics?.plans ?? []).map((plan) => (
              <div key={plan._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{plan.name}</p>
                    <p className="text-xs text-slate-500">
                      {plan.maxProperties === -1 ? "Illimité" : `${plan.maxProperties} annonces`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{plan.price.toLocaleString("fr-FR")} dh</p>
                    <p className="text-xs text-slate-500">{plan.duration === "monthly" ? "Mensuel" : "Annuel"}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">Priorité : {plan.priority}</p>
              </div>
            ))}
            {(metrics?.plans ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Aucun plan actif pour le moment.</p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Annonces par statut</h2>
          <div className="mt-4 space-y-3">
            {(metrics?.propertiesByStatus ?? []).map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">{item._id}</p>
                <p className="text-sm font-semibold text-slate-700">{item.count}</p>
              </div>
            ))}
            {(metrics?.propertiesByStatus ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Aucune annonce suivie pour l’instant.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

