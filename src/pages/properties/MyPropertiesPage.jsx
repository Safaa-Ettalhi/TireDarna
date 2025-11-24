import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { searchProperties, deleteProperty } from "../../services/propertyService";
import { useAuth } from "../../context/AuthContext";
import { Alert } from "../../components/ui/Alert";
import { getMySubscription } from "../../services/subscriptionService";

const STATUS_LABELS = {
  draft: "Brouillon",
  pending_moderation: "En attente",
  published: "Publié",
  rejected: "Rejeté",
  archived: "Archivé",
};

const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600",
  pending_moderation: "bg-amber-100 text-amber-700",
  published: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
  archived: "bg-slate-200 text-slate-600",
};

function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] ?? status;
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}

export default function MyPropertiesPage() {
  const { token } = useAuth();
  const [error, setError] = useState("");

  const query = useQuery({
    queryKey: ["my-properties", token],
    queryFn: () =>
      searchProperties(token, {
        includeOwn: true,
        status: "all",
        sort: "createdAt",
        order: "desc",
        limit: 100,
      }),
    enabled: Boolean(token),
  });

  const subscriptionQuery = useQuery({
    queryKey: ["mySubscription", token],
    queryFn: () => getMySubscription(token),
    enabled: Boolean(token),
  });

  const activeCountQuery = useQuery({
    queryKey: ["my-properties-active-count", token],
    queryFn: () =>
      searchProperties(token, {
        includeOwn: true,
        status: "active",
        limit: 1,
      }),
    select: (data) => data?.total ?? 0,
    enabled: Boolean(token),
  });

  const deleteMutation = useMutation({
    mutationFn: (propertyId) => deleteProperty(token, propertyId),
    onSuccess: () => {
      query.refetch();
    },
  });

  if (!token) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Alert
          variant="error"
          title="Authentification requise"
          message="Connectez-vous pour consulter et gérer vos annonces."
        />
      </div>
    );
  }

  async function handleDelete(propertyId) {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) {
      return;
    }
    setError("");
    try {
      await deleteMutation.mutateAsync(propertyId);
    } catch (err) {
      setError(err.message || "Suppression impossible.");
    }
  }

  const properties = query.data?.properties ?? [];
  const subscription = subscriptionQuery.data?.subscription ?? null;

  const planMeta = useMemo(() => {
    const plan = typeof subscription?.plan === "string" ? subscription?.plan : subscription?.plan?.name;
    const planName = plan || "gratuit";
    const PLAN_LIMITS = {
      gratuit: 10,
      pro: 100,
      premium: Number.POSITIVE_INFINITY,
    };
    const limit = PLAN_LIMITS[planName] ?? PLAN_LIMITS.gratuit;
    const activeCount = activeCountQuery.data ?? 0;
    const remaining = Number.isFinite(limit) ? Math.max(limit - activeCount, 0) : null;
    return { planName, limit, activeCount, remaining };
  }, [activeCountQuery.data, subscription]);

  const limitReached = Number.isFinite(planMeta.limit) && planMeta.activeCount >= planMeta.limit;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Mes annonces</h1>
          <p className="text-sm text-slate-500">
            Retrouvez ici toutes vos annonces, quel que soit leur statut. Vous pouvez les modifier,
            les republier ou les supprimer.
          </p>
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Plan actuel&nbsp;: {planMeta.planName}</p>
            {Number.isFinite(planMeta.limit) ? (
              <p>
                Limite de <strong>{planMeta.limit}</strong> annonces actives simultanément.{" "}
                {planMeta.remaining === 0 ? (
                  <span className="text-red-600">Aucune place disponible.</span>
                ) : (
                  <span>
                    Il vous reste <strong>{planMeta.remaining}</strong> emplacement(s) pour publier.
                  </span>
                )}
              </p>
            ) : (
              <p>Annonces illimitées avec votre plan premium.</p>
            )}
          </div>
        </div>
        {limitReached ? (
          <div className="text-sm text-amber-600">
            Limite atteinte. Passez sur un plan supérieur dans l’espace Profil & Abonnement.
          </div>
        ) : (
          <Link
            to="/properties/new"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            + Nouvelle annonce
          </Link>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
        {error && (
          <div className="border-b border-red-100 px-6 py-4">
            <Alert variant="error" title="Erreur" message={error} />
          </div>
        )}
        {query.isLoading ? (
          <div className="px-6 py-8 text-sm text-slate-500">Chargement de vos annonces...</div>
        ) : properties.length === 0 ? (
          <div className="px-6 py-8 text-sm text-slate-500">
            Vous n’avez pas encore créé d’annonce. Lancez-vous en cliquant sur “Nouvelle annonce”.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Titre</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Prix</th>
                  <th className="px-6 py-3">Dernière mise à jour</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {properties.map((property) => (
                  <tr key={property._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3">
                      <div className="flex flex-col">
                        <Link
                          to={`/properties/${property._id}`}
                          className="font-semibold text-slate-900 hover:text-emerald-700"
                        >
                          {property.title}
                        </Link>
                        <span className="text-xs text-slate-500">{property.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={property.status} />
                    </td>
                    <td className="px-6 py-3 capitalize">
                      {property.transactionType === "sale" ? "Vente" : "Location"}
                    </td>
                    <td className="px-6 py-3">
                      {typeof property.price === "number"
                        ? `${property.price.toLocaleString("fr-FR")} dh`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {property.updatedAt
                        ? new Date(property.updatedAt).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2 text-xs">
                        <Link
                          to={`/properties/${property._id}/edit`}
                          className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
                        >
                          Modifier
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(property._id)}
                          disabled={deleteMutation.isLoading}
                          className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

