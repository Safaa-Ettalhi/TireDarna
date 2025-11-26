import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { searchProperties, deleteProperty, updateProperty } from "../../services/propertyService";
import { useAuth } from "../../context/AuthContext";
import { Alert } from "../../components/ui/Alert";
import { getMySubscription } from "../../services/subscriptionService";

const STATUS_LABELS = {
  all: "Toutes",
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

const STATUS_FILTERS = ["all", "draft", "pending_moderation", "published", "rejected", "archived"];

const STATUS_GUIDE = [
  {
    key: "draft",
    title: "Brouillon",
    description: "Complétez les sections manquantes et soumettez pour modération.",
    cta: "Finaliser",
    accent: "bg-slate-900 text-white",
  },
  {
    key: "pending_moderation",
    title: "En attente",
    description: "Annonce en révision. Comptez 24h ouvrées avant publication.",
    cta: "Voir le détail",
    accent: "bg-amber-600 text-white",
  },
  {
    key: "rejected",
    title: "Rejetée",
    description: "Identifiez les corrections demandées et republiez la fiche.",
    cta: "Corriger",
    accent: "bg-red-600 text-white",
  },
];

function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] ?? status;
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}

const PLAN_BADGE_STYLES = {
  gratuit: "bg-slate-100 text-slate-600",
  pro: "bg-sky-100 text-sky-700",
  premium: "bg-purple-100 text-purple-700",
};

const PLAN_LABELS = {
  gratuit: "Plan Gratuit",
  pro: "Plan Pro",
  premium: "Plan Premium",
};

const normalizePlanKey = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    return value.toLowerCase();
  }
  if (typeof value === "object") {
    if (typeof value.name === "string") {
      return value.name.toLowerCase();
    }
    if (typeof value.slug === "string") {
      return value.slug.toLowerCase();
    }
  }
  return null;
};

const getPlanLabel = (key) => PLAN_LABELS[key] ?? `Plan ${key?.charAt(0).toUpperCase()}${key?.slice(1) ?? ""}`;

function PlanBadge({ planKey }) {
  if (!planKey) return null;
  const normalized = planKey.toLowerCase();
  const style = PLAN_BADGE_STYLES[normalized] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}>
      {getPlanLabel(normalized)}
    </span>
  );
}

function PriorityBadge({ priority }) {
  if (typeof priority !== "number") return null;
  let label = "Boost standard";
  let style = "bg-slate-100 text-slate-600";
  if (priority >= 120) {
    label = "Ultra boost";
    style = "bg-fuchsia-100 text-fuchsia-700";
  } else if (priority >= 90) {
    label = "Boost premium";
    style = "bg-emerald-100 text-emerald-700";
  } else if (priority >= 70) {
    label = "Boost pro";
    style = "bg-sky-100 text-sky-700";
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}>
      {label}
    </span>
  );
}

export default function MyPropertiesPage() {
  const { token, user } = useAuth();
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

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

  const statusMutation = useMutation({
    mutationFn: ({ propertyId, status }) => updateProperty(token, propertyId, { status }),
    onSuccess: () => query.refetch(),
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

  async function handleStatusChange(propertyId, nextStatus) {
    setError("");
    try {
      await statusMutation.mutateAsync({ propertyId, status: nextStatus });
    } catch (err) {
      setError(err.message || "Impossible de mettre à jour le statut.");
    }
  }

  const properties = query.data?.properties ?? [];
  const subscription = subscriptionQuery.data?.subscription ?? null;

  const statusCounts = useMemo(() => {
    return properties.reduce(
      (acc, property) => {
        acc.all += 1;
        acc[property.status] = (acc[property.status] ?? 0) + 1;
        return acc;
      },
      {
        all: 0,
        draft: 0,
        pending_moderation: 0,
        published: 0,
        rejected: 0,
        archived: 0,
      }
    );
  }, [properties]);

  const currentUserId = user?.userId ?? user?._id ?? user?.id ?? user?._id?.toString?.();

  const planMeta = useMemo(() => {
    const planKey =
      normalizePlanKey(subscription?.plan) ??
      normalizePlanKey(user?.subscription?.plan) ??
      "gratuit";
    const PLAN_LIMITS = {
      gratuit: 10,
      pro: 100,
      premium: Number.POSITIVE_INFINITY,
    };
    const limit = PLAN_LIMITS[planKey] ?? PLAN_LIMITS.gratuit;
    const activeCount = activeCountQuery.data ?? 0;
    const remaining = Number.isFinite(limit) ? Math.max(limit - activeCount, 0) : null;
    return {
      planKey,
      planLabel: getPlanLabel(planKey),
      limit,
      activeCount,
      remaining,
    };
  }, [activeCountQuery.data, subscription]);

  const limitReached = Number.isFinite(planMeta.limit) && planMeta.activeCount >= planMeta.limit;

  const filteredProperties = useMemo(() => {
    if (statusFilter === "all") {
      return properties;
    }
    return properties.filter((property) => property.status === statusFilter);
  }, [properties, statusFilter]);

  const searchedProperties = useMemo(() => {
    if (!searchTerm.trim()) {
      return filteredProperties;
    }
    const needle = searchTerm.trim().toLowerCase();
    return filteredProperties.filter((property) => {
      return (
        property.title?.toLowerCase().includes(needle) ||
        property.address?.toLowerCase().includes(needle)
      );
    });
  }, [filteredProperties, searchTerm]);

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
            <p className="font-semibold text-slate-800">Plan actuel&nbsp;: {planMeta.planLabel}</p>
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-600" htmlFor="property-search">
            Recherche rapide
          </label>
          <input
            id="property-search"
            type="search"
            placeholder="Titre, adresse ou mot-clé"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <span className="text-xs text-slate-500">
            {searchedProperties.length} annonce(s) correspondent aux filtres
          </span>
        </div>

          <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((statusKey) => (
            <button
              key={statusKey}
              type="button"
              onClick={() => setStatusFilter(statusKey)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === statusKey
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {STATUS_LABELS[statusKey]}
              <span
                className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] ${
                  statusFilter === statusKey ? "bg-white text-emerald-600" : "bg-slate-100 text-slate-600"
                }`}
              >
                {statusCounts[statusKey]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {STATUS_GUIDE.map((guide) => (
            <div key={guide.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="mb-3 inline-flex rounded-lg px-3 py-1 text-xs font-semibold text-slate-500">
                {guide.title}
              </div>
              <p>{guide.description}</p>
              <button
                type="button"
                onClick={() => setStatusFilter(guide.key)}
                className={`mt-3 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition ${guide.accent}`}
              >
                {guide.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
        {error && (
          <div className="border-b border-red-100 px-6 py-4">
            <Alert variant="error" title="Erreur" message={error} />
          </div>
        )}
        {query.isLoading ? (
          <div className="px-6 py-8 text-sm text-slate-500">Chargement de vos annonces...</div>
        ) : searchedProperties.length === 0 ? (
          <div className="px-6 py-8 text-sm text-slate-500">
            {properties.length === 0
              ? "Vous n’avez pas encore créé d’annonce. Lancez-vous en cliquant sur “Nouvelle annonce”."
              : "Aucune annonce ne correspond aux filtres/recherche actuels."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Titre</th>
                  <th className="px-6 py-3">Détails</th>
                  <th className="px-6 py-3">Visibilité & badges</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Dernière mise à jour</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {searchedProperties.map((property) => (
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
                    <td className="px-6 py-3 capitalize">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-slate-500">
                          {property.transactionType === "sale"
                            ? "Vente"
                            : property.transactionType === "daily_rent"
                            ? "Location journalière"
                            : property.transactionType === "monthly_rent"
                            ? "Location mensuelle"
                            : "Location saisonnière"}
                        </span>
                        <span className="text-base font-semibold text-slate-900">
                          {typeof property.price === "number"
                            ? `${property.price.toLocaleString("fr-FR")} dh`
                            : property.pricePerDay
                            ? `${property.pricePerDay.toLocaleString("fr-FR")} dh/j`
                            : "Tarif non défini"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {property.surface} m² • {property.rooms} pièces
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-col gap-2">
                        {(() => {
                          const ownerPlanKey = normalizePlanKey(property.ownerId?.subscription?.plan);
                          const ownerIdValue =
                            (property.ownerId &&
                              typeof property.ownerId === "object" &&
                              (property.ownerId._id || property.ownerId.id || property.ownerId.toString?.())) ||
                            (typeof property.ownerId === "string" ? property.ownerId : null);
                          const isMine =
                            currentUserId &&
                            ownerIdValue &&
                            ownerIdValue.toString() === currentUserId.toString?.();
                          const finalPlanKey = ownerPlanKey ?? (isMine ? planMeta.planKey : null) ?? planMeta.planKey;
                          return <PlanBadge planKey={finalPlanKey} />;
                        })()}
                        <PriorityBadge priority={property.priorityScore} />
                        {property.boostExpiresAt && (
                          <span className="text-xs text-emerald-600">
                            Boost actif jusqu’au {new Date(property.boostExpiresAt).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={property.status} />
                      <p className="mt-1 text-xs text-slate-500">
                        {property.status === "draft" && "Complétez les infos puis soumettez pour validation."}
                        {property.status === "pending_moderation" && "Modération en cours, surveillez vos notifications."}
                        {property.status === "rejected" && "Annonce refusée : corrigez et republiez."}
                        {property.status === "archived" && "Annonce retirée. Réactivez-la pour la republier."}
                        {property.status === "published" && "Annonce visible dans le catalogue public."}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">

                      </div>
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

{property.status !== "archived" ? (
  <button
    type="button"
    onClick={() => handleStatusChange(property._id, "archived")}
    disabled={statusMutation.isLoading}
    className="rounded-lg border px-3 py-2 font-medium text-slate-600 transition-all hover:text-emerald-600 hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Archiver
  </button>
) : (
  <button
    type="button"
    onClick={() => handleStatusChange(property._id, "pending_moderation")}
    disabled={statusMutation.isLoading}
    className="rounded-lg border px-3 py-2 font-medium text-emerald-600 transition-all hover:text-emerald-800 hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Réactiver
  </button>
)}

<Link
  to={`/properties/${property._id}/edit`}
  className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-600 transition-all hover:text-emerald-600 hover:border-emerald-400"
>
  Modifier
</Link>

<button
  type="button"
  onClick={() => handleDelete(property._id)}
  disabled={deleteMutation.isLoading}
  className="rounded-lg border border-red-200 px-3 py-2 font-medium text-red-600 transition-all hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
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

