import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { listPlans } from "../../services/subscriptionService";
import { resetPlansToDefault, updatePlanSettings } from "../../services/adminService";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export default function AdminPlansPage() {
  const { token } = useAuth();
  const [drafts, setDrafts] = useState({});

  const plansQuery = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => listPlans(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ planId, payload }) => updatePlanSettings(token, planId, payload),
    onSuccess: () => {
      plansQuery.refetch();
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetPlansToDefault(token),
    onSuccess: () => {
      plansQuery.refetch();
    },
  });

  const plans = useMemo(() => plansQuery.data?.plans ?? [], [plansQuery.data?.plans]);

  function getDraft(plan) {
    return drafts[plan._id] || {
      price: plan.price,
      duration: plan.duration,
      maxProperties: plan.maxProperties,
      priority: plan.priority,
      features: plan.features.join(", "),
    };
  }

  function updateDraft(plan, field, value) {
    setDrafts((prev) => ({
      ...prev,
      [plan._id]: {
        ...getDraft(plan),
        [field]: value,
      },
    }));
  }

  function handleSave(plan) {
    const draft = getDraft(plan);
    updateMutation.mutate({
      planId: plan._id,
      payload: {
        price: Number(draft.price),
        duration: draft.duration,
        maxProperties: Number(draft.maxProperties),
        priority: Number(draft.priority),
        features: draft.features,
      },
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Plans & tarifs</p>
        <h1 className="text-3xl font-semibold text-slate-900">Gestion des abonnements</h1>
        <p className="text-sm text-slate-500">
          Ajustez les tarifs, quotas et avantages visibles sur l’ensemble de la plateforme.
        </p>
      </header>

      {(updateMutation.isError || resetMutation.isError) && (
        <Alert
          variant="error"
          title="Impossible de mettre à jour"
          message={
            updateMutation.error?.message ??
            resetMutation.error?.message ??
            "Une erreur est survenue lors de l'opération."
          }
        />
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => resetMutation.mutate()}
          disabled={resetMutation.isLoading}
        >
          Restaurer les plans par défaut
        </Button>
        <Button variant="ghost" asChild>
          <a href="/properties/promotions" target="_blank" rel="noreferrer">
            Voir l’affichage marketing →
          </a>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const draft = getDraft(plan);
          return (
            <article key={plan._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="space-y-1">
                <p className="text-xs font-semibold uppercase text-slate-400">Plan</p>
                <h2 className="text-xl font-semibold text-slate-900">{plan.name}</h2>
                <p className="text-sm text-slate-500">{plan.description || "Plan disponible."}</p>
              </header>

              <div className="mt-4 space-y-3 text-sm">
                <label className="flex flex-col rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="text-xs font-semibold text-slate-500">Tarif (MAD)</span>
                  <input
                    type="number"
                    min="0"
                    value={draft.price}
                    onChange={(event) => updateDraft(plan, "price", event.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="flex flex-col rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="text-xs font-semibold text-slate-500">Durée</span>
                  <select
                    value={draft.duration}
                    onChange={(event) => updateDraft(plan, "duration", event.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="monthly">Mensuel</option>
                    <option value="yearly">Annuel</option>
                  </select>
                </label>

                <label className="flex flex-col rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="text-xs font-semibold text-slate-500">Quotas d'annonces</span>
                  <input
                    type="number"
                    value={draft.maxProperties}
                    onChange={(event) => updateDraft(plan, "maxProperties", event.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="flex flex-col rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="text-xs font-semibold text-slate-500">Priorité d'affichage</span>
                  <input
                    type="number"
                    value={draft.priority}
                    onChange={(event) => updateDraft(plan, "priority", event.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="flex flex-col rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="text-xs font-semibold text-slate-500">Fonctionnalités (séparées par des virgules)</span>
                  <textarea
                    value={draft.features}
                    onChange={(event) => updateDraft(plan, "features", event.target.value)}
                    className="h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => handleSave(plan)}
                  disabled={updateMutation.isLoading}
                >
                  Enregistrer
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {plans.length === 0 && !plansQuery.isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Aucun plan n'est disponible. Lancez l'initialisation des plans par défaut pour démarrer.
        </div>
      )}
    </div>
  );
}

