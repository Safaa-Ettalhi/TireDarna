import { useEffect, useRef, useState } from "react";
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

export default function ProfilePage() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const handledPaymentRef = useRef(false);

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

  const plans = plansQuery.data?.plans || [];
  const subscription = subscriptionQuery.data?.subscription || null;
  const subscriptionPlanName =
    typeof subscription?.plan === "string" ? subscription?.plan : subscription?.plan?.name;
  const resolvedPlanName = subscriptionPlanName || "gratuit";
  const currentPlan = resolvedPlanName.toLowerCase();

  const isLoading = plansQuery.isLoading || subscriptionQuery.isLoading;

  const paymentStatus = searchParams.get("payment");
  const paidPlan = searchParams.get("plan");

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
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Mon profil & abonnement</h1>
        <p className="mt-2 text-sm text-slate-600">
          Gérez vos informations, suivez votre plan et choisissez l’offre qui correspond
          à vos besoins.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Informations personnelles</h2>
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
            <dd className="text-sm font-semibold text-emerald-600 uppercase">{resolvedPlanName}</dd>
          </div>
        </dl>
      </section>

      {user?.accountType === "entreprise" && user?.companyInfo && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Informations entreprise</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {user.companyInfo.companyName && (
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Nom de l'entreprise</dt>
                <dd className="text-sm text-slate-900">{user.companyInfo.companyName}</dd>
              </div>
            )}
            {user.companyInfo.siret && (
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">SIRET</dt>
                <dd className="text-sm text-slate-900">{user.companyInfo.siret}</dd>
              </div>
            )}
            {user.companyInfo.address && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-slate-400">Adresse</dt>
                <dd className="text-sm text-slate-900">
                  {[
                    user.companyInfo.address.street,
                    user.companyInfo.address.city,
                    user.companyInfo.address.postalCode,
                    user.companyInfo.address.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Statut KYC</dt>
              <dd className="mt-1">
                {user.companyInfo.kycVerified ? (
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
                  currentPlan === plan.name?.toLowerCase()
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 capitalize">{plan.name}</h3>
                  {currentPlan === plan.name?.toLowerCase() && (
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
                  variant={currentPlan === plan.name?.toLowerCase() ? "secondary" : "primary"}
                  className="mt-6 w-full"
                  onClick={() => {
                    setSelectedPlan(plan._id);
                    if (plan.price > 0) {
                      stripeSessionMutation.mutate(plan._id);
                    } else {
                      subscribeMutation.mutate(plan._id);
                    }
                  }}
                  disabled={
                    subscribeMutation.isLoading ||
                    stripeSessionMutation.isLoading ||
                    currentPlan === plan.name?.toLowerCase()
                  }
                >
                  {currentPlan === plan.name?.toLowerCase()
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
    </div>
  );
}

