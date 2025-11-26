import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPlans,
  getMySubscription,
  subscribeToPlan,
  cancelSubscription,
  createStripeSubscriptionSession,
} from "../../services/subscriptionService";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { TextField } from "../../components/ui/TextField";
import { PlanBadge, getPlanKey, getPlanLabel } from "../../components/badges/PlanBadge";
import { Link } from "react-router-dom";
import { updateProfile, updateCompanyInfo } from "../../services/profileService";

const planFeatures = {
  gratuit: ["1 annonce active", "Visibilité standard", "Support email"],
  pro: [
    "10 annonces actives",
    "Mise en avant dans les listes",
    "Support prioritaire",
    "Statistiques annonces",
  ],
  premium: [
    "100 annonces actives",
    "Badge premium + priorisation",
    "Support dédié",
    "Statistiques avancées",
    "Accès API leads",
  ],
};

const COMPARISON_MATRIX = [
  {
    feature: "Quota d’annonces actives",
    description: "Nombre d’annonces visibles simultanément.",
    values: { gratuit: "1", pro: "10", premium: "Illimité" },
  },
  {
    feature: "Visibilité & badges",
    description: "Priorité dans les résultats, badge Pro/Premium et boost auto.",
    values: { gratuit: "Standard", pro: "Boost Pro + badge", premium: "Ultra boost + badge Premium" },
  },
  {
    feature: "Gestion médias",
    description: "Limite de médias et qualité autorisée.",
    values: { gratuit: "10 photos HD", pro: "20 photos + vidéos", premium: "Illimité + vidéos 4K" },
  },
  {
    feature: "Statistiques & rapports",
    description: "Accès aux performances (vues, conversions, comparatifs).",
    values: { gratuit: "Vue basique", pro: "Rapports hebdo", premium: "Rapports temps réel + export" },
  },
  {
    feature: "Support & accompagnement",
    description: "Niveau d’assistance Darna & SLA.",
    values: { gratuit: "Email (48h)", pro: "Chat prioritaire (24h)", premium: "Account manager (4h)" },
  },
  {
    feature: "Tirelire & financement",
    description: "Accès aux parcours collaboratifs / offres bancaires premium.",
    values: { gratuit: "Découverte", pro: "Organisation de groupes", premium: "Groupes premium + scoring" },
  },
];

export default function ProfilePage() {
  const { user, token, login } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const handledPaymentRef = useRef(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    accountType: user?.accountType || "particulier",
  });
  const [companyForm, setCompanyForm] = useState({
    companyName: user?.companyInfo?.companyName || "",
    siret: user?.companyInfo?.siret || "",
    street: user?.companyInfo?.address?.street || "",
    city: user?.companyInfo?.address?.city || "",
    postalCode: user?.companyInfo?.address?.postalCode || "",
    country: user?.companyInfo?.address?.country || "Maroc",
  });

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      accountType: user?.accountType || "particulier",
    });
    setCompanyForm({
      companyName: user?.companyInfo?.companyName || "",
      siret: user?.companyInfo?.siret || "",
      street: user?.companyInfo?.address?.street || "",
      city: user?.companyInfo?.address?.city || "",
      postalCode: user?.companyInfo?.address?.postalCode || "",
      country: user?.companyInfo?.address?.country || "Maroc",
    });
  }, [user]);

  const plansQuery = useQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: listPlans,
  });

  const subscriptionQuery = useQuery({
    queryKey: ["mySubscription", token],
    queryFn: () => getMySubscription(token),
    enabled: !!token,
  });

  const subscribeMutation = useMutation({
    mutationFn: (planId) => subscribeToPlan(token, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mySubscription", token] });
      setFeedback({
        type: "success",
        message: "Votre abonnement a été mis à jour avec succès.",
      });
      setSelectedPlan(null);
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: error.message || "Impossible de mettre à jour l'abonnement.",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelSubscription(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mySubscription", token] });
      setFeedback({
        type: "success",
        message: "Votre abonnement a été annulé.",
      });
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: error.message || "Impossible d'annuler l'abonnement.",
      });
    },
  });

  const stripeSessionMutation = useMutation({
    mutationFn: (planId) => createStripeSubscriptionSession(token, planId),
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setFeedback({
          type: "error",
          message: "Impossible de démarrer le paiement Stripe.",
        });
      }
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: error.message || "Erreur lors de la création de la session Stripe.",
      });
    },
  });

  const profileMutation = useMutation({
    mutationFn: (payload) => updateProfile(token, payload),
    onSuccess: (data) => {
      login({ user: data.user, token });
      setFeedback({ type: "success", message: "Profil mis à jour." });
      setIsEditingProfile(false);
    },
    onError: (error) => {
      setFeedback({ type: "error", message: error.message || "Mise à jour impossible." });
    },
  });

  const companyMutation = useMutation({
    mutationFn: (payload) => updateCompanyInfo(token, payload),
    onSuccess: (data) => {
      login({ user: data.user, token });
      setFeedback({ type: "success", message: "Infos entreprise mises à jour." });
      setIsEditingCompany(false);
    },
    onError: (error) => {
      setFeedback({ type: "error", message: error.message || "Mise à jour impossible." });
    },
  });

  const plans = plansQuery.data?.plans || [];
  const subscription = subscriptionQuery.data?.subscription || null;
  const currentPlanKey = getPlanKey(subscription?.plan || user?.subscription?.plan);

  const isLoading = plansQuery.isLoading || subscriptionQuery.isLoading;

  const paymentStatus = searchParams.get("payment");
  const paidPlan = searchParams.get("plan");

  const currentPlanDefinition = useMemo(
    () => plans.find((plan) => plan.name?.toLowerCase() === currentPlanKey),
    [plans, currentPlanKey]
  );

  const planDisplayName = getPlanLabel(currentPlanDefinition?.name?.toLowerCase() || currentPlanKey);
  const planQuotaLabel =
    currentPlanDefinition?.maxProperties != null
      ? currentPlanDefinition.maxProperties === -1
        ? "Illimité"
        : currentPlanDefinition.maxProperties
      : currentPlanKey === "premium"
      ? "Illimité"
      : currentPlanKey === "pro"
      ? 10
      : 1;

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "Non défini";

  const overviewCards = [
    {
      label: "Plan actuel",
      value: planDisplayName,
      badge: currentPlanDefinition?.price
        ? `${currentPlanDefinition.price.toLocaleString("fr-FR")} dh / ${
            currentPlanDefinition.duration === "monthly" ? "mois" : "an"
          }`
        : "Gratuit",
    },
    {
      label: "Expiration",
      value: subscription?.endDate ? formatDate(subscription.endDate) : "Automatique",
      helper: subscription?.endDate ? "Renouvellement planifié" : "Plan gratuit",
    },
  ];

  const planSequence = ["gratuit", "pro", "premium"];
  const currentPlanIndex = planSequence.indexOf(currentPlanKey);
  const nextPlanKey =
    currentPlanIndex >= 0 && currentPlanIndex < planSequence.length - 1
      ? planSequence[currentPlanIndex + 1]
      : null;
  const nextPlanDefinition = nextPlanKey
    ? plans.find((plan) => plan.name?.toLowerCase() === nextPlanKey)
    : null;
  const upgradeBullets = {
    pro: [
      "Boost visibilité x2 sur le catalogue",
      "Badge Pro sur toutes vos annonces",
      "Statistiques hebdomadaires détaillées",
    ],
    premium: [
      "Ultra boost permanent + badge Premium",
      "Account manager dédié & support 4h",
      "Rapports temps réel + accès API leads",
    ],
  };

  const handlePlanSelection = (plan) => {
    if (!plan) return;
    setSelectedPlan(plan._id);
    if (plan.price > 0) {
      stripeSessionMutation.mutate(plan._id);
    } else {
      subscribeMutation.mutate(plan._id);
    }
  };

  useEffect(() => {
    if (!paymentStatus) {
      handledPaymentRef.current = false;
      return;
    }

    if (handledPaymentRef.current) return;
    handledPaymentRef.current = true;

    if (paymentStatus === "success" && paidPlan) {
      setFeedback({
        type: "success",
        message: "Paiement confirmé. Activation du plan en cours...",
      });
      subscribeMutation.mutate(paidPlan, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["mySubscription", token] });
          setFeedback({
            type: "success",
            message: "Plan activé après paiement réussi.",
          });
        },
        onError: (error) => {
          setFeedback({
            type: "error",
            message: error.message || "Le paiement a été validé mais l'activation a échoué.",
          });
        },
      });
    } else if (paymentStatus === "cancel") {
      setFeedback({
        type: "info",
        message: "Paiement annulé. Votre abonnement actuel reste inchangé.",
      });
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("payment");
    nextParams.delete("session_id");
    nextParams.delete("plan");
    setSearchParams(nextParams, { replace: true });
  }, [paymentStatus, paidPlan, setSearchParams, subscribeMutation, queryClient]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-500 to-slate-700 p-6 text-white shadow-lg lg:flex lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Espace abonné</p>
          <h1 className="text-3xl font-bold leading-tight">Pilotez votre présence sur Darna</h1>
          <p className="text-sm text-white/80">
            Suivez votre abonnement, comparez les offres et optimisez vos publications immobilières.
          </p>
          <PlanBadge plan={currentPlanKey} variant="soft" className="border-white/20 bg-white/10 text-white" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:min-w-[360px]">
          {overviewCards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{card.label}</p>
              <p className="mt-1 text-lg font-bold">{card.value}</p>
              {card.badge && <p className="text-xs text-white/80">{card.badge}</p>}
              {card.helper && <p className="text-xs text-white/60">{card.helper}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
        <h2 className="text-lg font-semibold text-slate-900">Informations personnelles</h2>
            <p className="text-sm text-slate-500">Mettez à jour vos coordonnées et préférences.</p>
          </div>
          <Button variant="secondary" onClick={() => setIsEditingProfile((prev) => !prev)}>
            {isEditingProfile ? "Annuler" : "Modifier"}
          </Button>
        </div>

        {isEditingProfile ? (
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              profileMutation.mutate(profileForm);
            }}
          >
            <TextField
              label="Prénom"
              name="firstName"
              value={profileForm.firstName}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, firstName: event.target.value }))}
              required
            />
            <TextField
              label="Nom"
              name="lastName"
              value={profileForm.lastName}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, lastName: event.target.value }))}
              required
            />
            <TextField
              label="Téléphone"
              name="phone"
              value={profileForm.phone}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <label className="flex w-full flex-col gap-1 text-sm font-semibold text-slate-600">
              <span>Type de compte</span>
              <select
                name="accountType"
                className="rounded-lg border border-slate-200 px-3 py-2 shadow-sm outline-none"
                value={profileForm.accountType}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, accountType: event.target.value }))}
              >
                <option value="particulier">Particulier</option>
                <option value="entreprise">Entreprise</option>
              </select>
            </label>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setIsEditingProfile(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={profileMutation.isLoading}>
                {profileMutation.isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        ) : (
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-400">Nom complet</dt>
            <dd className="text-sm text-slate-900">
              {user?.firstName} {user?.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-400">Adresse email</dt>
            <dd className="text-sm text-slate-900">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-400">Type de compte</dt>
            <dd className="text-sm text-slate-900 capitalize">{user?.accountType || "particulier"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-400">Plan actuel</dt>
              <dd className="text-sm font-semibold text-emerald-600 uppercase">{planDisplayName}</dd>
          </div>
        </dl>
        )}
      </section>

      {nextPlanDefinition && (
        <section className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-6 shadow-inner">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <PlanBadge plan={nextPlanKey} variant="soft" className="border-emerald-100 bg-white" />
              <h3 className="text-xl font-semibold text-slate-900">
                Passez sur {getPlanLabel(nextPlanKey)} et décuplez votre visibilité
              </h3>
              <p className="text-sm text-slate-600">
                {nextPlanKey === "pro"
                  ? "Mettez vos annonces en avant avec le badge Pro, des boosts automatiques et des statistiques détaillées."
                  : "Profitez d’un ultra boost permanent, d’un account manager dédié et d’une analyse temps réel."}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {(upgradeBullets[nextPlanKey] || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-white/70 p-5 shadow">
              <p className="text-3xl font-bold text-slate-900">
                {nextPlanDefinition.price
                  ? `${nextPlanDefinition.price.toLocaleString("fr-FR")} dh`
                  : "Gratuit"}
                <span className="text-sm font-normal text-slate-500">
                  / {nextPlanDefinition.duration === "monthly" ? "mois" : "an"}
                </span>
              </p>
              <Button
                className="w-full"
                onClick={() => handlePlanSelection(nextPlanDefinition)}
                disabled={subscribeMutation.isLoading || stripeSessionMutation.isLoading}
              >
                {nextPlanKey === "pro" ? "Activer le plan Pro" : "Passer au Premium"}
              </Button>
              <Link
                to="/properties/promotions"
                className="text-center text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                En savoir plus sur les badges et promotions
              </Link>
              <p className="text-xs text-slate-500">
                Paiement sécurisé via Stripe. Résiliation possible à tout moment.
              </p>
            </div>
          </div>
        </section>
      )}

      {user?.accountType === "entreprise" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
          <h2 className="text-lg font-semibold text-slate-900">Informations entreprise</h2>
              <p className="text-sm text-slate-500">Renseignez vos coordonnées Société pour le compte entreprise.</p>
            </div>
            <Button variant="secondary" onClick={() => setIsEditingCompany((prev) => !prev)}>
              {isEditingCompany ? "Annuler" : "Modifier"}
            </Button>
          </div>
          {isEditingCompany ? (
            <form
              className="mt-4 grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                companyMutation.mutate(companyForm);
              }}
            >
              <TextField
                label="Nom de l'entreprise"
                name="companyName"
                value={companyForm.companyName}
                onChange={(event) => setCompanyForm((prev) => ({ ...prev, companyName: event.target.value }))}
                required
              />
              <TextField
                label="SIRET"
                name="siret"
                value={companyForm.siret}
                onChange={(event) => setCompanyForm((prev) => ({ ...prev, siret: event.target.value }))}
                required
              />
              <TextField
                label="Rue"
                name="street"
                value={companyForm.street}
                onChange={(event) => setCompanyForm((prev) => ({ ...prev, street: event.target.value }))}
              />
              <TextField
                label="Ville"
                name="city"
                value={companyForm.city}
                onChange={(event) => setCompanyForm((prev) => ({ ...prev, city: event.target.value }))}
              />
              <TextField
                label="Code postal"
                name="postalCode"
                value={companyForm.postalCode}
                onChange={(event) => setCompanyForm((prev) => ({ ...prev, postalCode: event.target.value }))}
              />
              <TextField
                label="Pays"
                name="country"
                value={companyForm.country}
                onChange={(event) => setCompanyForm((prev) => ({ ...prev, country: event.target.value }))}
              />
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setIsEditingCompany(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={companyMutation.isLoading}>
                  {companyMutation.isLoading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          ) : (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Nom de l'entreprise</dt>
                <dd className="text-sm text-slate-900">{user?.companyInfo?.companyName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">SIRET</dt>
                <dd className="text-sm text-slate-900">{user?.companyInfo?.siret || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-slate-400">Adresse</dt>
                <dd className="text-sm text-slate-900">
                  {[
                    companyForm.street,
                    companyForm.city,
                    companyForm.postalCode,
                    companyForm.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Statut KYC</dt>
              <dd className="mt-1">
                  {user?.companyInfo?.kycVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    <i className="ri-checkbox-circle-line" />
                    Vérifié
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                    <i className="ri-time-line" />
                    En attente
                  </span>
                )}
              </dd>
            </div>
          </dl>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Gestion de l’abonnement</h2>
            <p className="mt-1 text-sm text-slate-500">
              Comparez nos offres et sélectionnez le plan qui correspond à vos objectifs.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Les plans payants nécessitent une validation via Stripe avant l’activation.
            </p>
          </div>
          {subscription && (
            <Button
              variant="secondary"
              onClick={() => {
                if (window.confirm("Êtes-vous sûr de vouloir annuler votre abonnement ?")) {
                  cancelMutation.mutate();
                }
              }}
              disabled={cancelMutation.isLoading}
            >
              {cancelMutation.isLoading ? "Annulation..." : "Annuler mon abonnement"}
            </Button>
          )}
        </div>

        {feedback && (
          <Alert
            className="mt-4"
            variant={feedback.type === "success" ? "success" : feedback.type === "error" ? "error" : "info"}
            title={
              feedback.type === "success"
                ? "Succès"
                : feedback.type === "warning"
                ? "Information"
                : "Erreur"
            }
            message={feedback.message}
          />
        )}

        {plansQuery.isError && (
          <Alert
            className="mt-4"
            variant="error"
            title="Impossible de charger les plans"
            message={plansQuery.error.message}
          />
        )}

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-500">Chargement des plans...</p>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan._id}
                className={`rounded-2xl border p-5 shadow-sm ${
                  currentPlanKey === plan.name?.toLowerCase()
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 capitalize">{plan.name}</h3>
                  {currentPlanKey === plan.name?.toLowerCase() && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      <i className="ri-check-line" />
                      Plan actuel
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {Number(plan.price) > 0
                    ? `${Number(plan.price).toLocaleString("fr-FR")} dh`
                    : "Gratuit"}
                  <span className="text-sm font-normal text-slate-500">
                    {" "}
                    / {plan.duration === "monthly" ? "mois" : "an"}
                  </span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {(plan.features?.length ? plan.features : planFeatures[plan.name?.toLowerCase()] || []).map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <i className="ri-check-line text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={currentPlanKey === plan.name?.toLowerCase() ? "secondary" : "primary"}
                  className="mt-6 w-full"
                  onClick={() => handlePlanSelection(plan)}
                  disabled={
                    subscribeMutation.isLoading ||
                    stripeSessionMutation.isLoading ||
                    currentPlanKey === plan.name?.toLowerCase()
                  }
                >
                  {currentPlanKey === plan.name?.toLowerCase()
                    ? "Plan en cours"
                    : (subscribeMutation.isLoading || stripeSessionMutation.isLoading) && selectedPlan === plan._id
                    ? "Traitement..."
                    : plan.price > 0
                    ? "Payer et activer"
                    : "Activer ce plan"}
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>

      {!isLoading && plans.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-slate-900">Comparatif détaillé des avantages</h2>
            <p className="text-sm text-slate-500">
              Visualisez les bénéfices concrets de chaque plan pour choisir celui qui maximise votre visibilité.
            </p>
          </header>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm text-slate-700">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Avantage
                  </th>
                  {["gratuit", "pro", "premium"].map((planKey) => (
                    <th
                      key={planKey}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {planKey === "gratuit" ? "Gratuit" : planKey === "pro" ? "Plan Pro" : "Plan Premium"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_MATRIX.map((row) => (
                  <tr key={row.feature} className="border-t border-slate-100">
                    <td className="sticky left-0 bg-white px-4 py-4 align-top">
                      <p className="font-semibold text-slate-900">{row.feature}</p>
                      <p className="text-xs text-slate-500">{row.description}</p>
                    </td>
                    {["gratuit", "pro", "premium"].map((planKey) => (
                      <td key={planKey} className="px-4 py-4 align-top">
                        <div
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                            planKey === "premium"
                              ? "border-purple-200 bg-purple-50 text-purple-700"
                              : planKey === "pro"
                              ? "border-sky-200 bg-sky-50 text-sky-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {row.values[planKey]}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

