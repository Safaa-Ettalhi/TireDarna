import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import { PlanBadge, getPlanKey } from "../../components/badges/PlanBadge";
import { useAuth } from "../../context/AuthContext";
import { getMySubscription } from "../../services/subscriptionService";

const PLAN_DETAILS = {
  gratuit: {
    name: "Plan Découverte",
    badge: "gratuit",
    price: "Gratuit",
    description: "Parfait pour débuter et tester la plateforme",
    features: [
      "Jusqu'à 10 annonces actives simultanément",
      "Recherche et consultation illimitées",
      "Gestion des leads de base",
      "Support par email",
      "Statistiques essentielles (vues, leads)",
      "Badge visible sur vos annonces",
    ],
    benefits: [
      "Visibilité standard dans les résultats",
      "Priorité d'affichage de base",
      "Accès à toutes les fonctionnalités de base",
    ],
    limitations: [
      "Quota limité à 10 annonces actives",
      "Pas de boost de priorité",
      "Support standard uniquement",
    ],
    icon: "ri-gift-line",
    color: "slate",
  },
  pro: {
    name: "Plan Pro",
    badge: "pro",
    price: "29 MAD/mois",
    description: "Pour les professionnels qui veulent accélérer leurs ventes",
    features: [
      "Jusqu'à 30 annonces actives simultanément",
      "Boost de priorité automatique",
      "Gestion avancée des leads",
      "Support prioritaire",
      "Statistiques détaillées et analytics",
      "Badge Pro visible sur toutes vos annonces",
      "Relances automatiques des leads",
    ],
    benefits: [
      "Visibilité renforcée (priorité +2)",
      "Annonces mises en avant dans les résultats",
      "Accès aux outils de workflow avancés",
      "API et intégrations partenaires",
    ],
    limitations: [
      "Quota limité à 30 annonces actives",
      "Pas de branding personnalisé",
    ],
    icon: "ri-star-line",
    color: "sky",
  },
  premium: {
    name: "Plan Premium",
    badge: "premium",
    price: "99 MAD/mois",
    description: "L'offre complète pour les acteurs qui visent l'excellence",
    features: [
      "Annonces illimitées",
      "Boost de priorité maximum",
      "Gestion complète des leads avec CRM intégré",
      "Support dédié 7j/7",
      "Analytics avancés et rapports personnalisés",
      "Badge Premium avec étoile visible partout",
      "Branding dédié sur votre profil",
      "Account manager dédié",
      "Accès anticipé aux nouvelles fonctionnalités",
    ],
    benefits: [
      "Visibilité maximale (priorité +3)",
      "Annonces toujours en tête de liste",
      "Branding personnalisé sur votre profil",
      "Conseiller succès dédié",
      "API complète et webhooks",
      "Intégrations premium",
    ],
    limitations: [],
    icon: "ri-vip-crown-line",
    color: "purple",
  },
};

const BADGE_EXPLANATION = {
  title: "Comment fonctionnent les badges ?",
  description:
    "Les badges affichés sur vos annonces indiquent votre plan d'abonnement et confèrent des avantages de visibilité.",
  howItWorks: [
    {
      step: 1,
      title: "Badge visible partout",
      description:
        "Votre badge de plan apparaît sur toutes vos annonces, dans les résultats de recherche, et sur votre profil.",
    },
    {
      step: 2,
      title: "Impact sur la visibilité",
      description:
        "Plus votre plan est élevé, plus vos annonces apparaissent en haut des résultats de recherche.",
    },
    {
      step: 3,
      title: "Confiance des utilisateurs",
      description:
        "Les badges Premium et Pro inspirent confiance aux acheteurs et augmentent le taux de conversion.",
    },
  ],
};

const PRIORITY_EXPLANATION = {
  title: "Système de priorité",
  description:
    "Chaque plan confère un score de priorité qui influence l'ordre d'affichage dans les résultats de recherche.",
  priorityLevels: [
    {
      plan: "gratuit",
      score: "0-50",
      description: "Affichage standard, trié par date de création",
    },
    {
      plan: "pro",
      score: "70-90",
      description: "Boost automatique, annonces mises en avant",
    },
    {
      plan: "premium",
      score: "120+",
      description: "Priorité maximale, toujours en tête de liste",
    },
  ],
};

export default function PromotionsBadgesPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const { data: subscriptionData } = useQuery({
    queryKey: ["mySubscription", token],
    queryFn: () => getMySubscription(token),
    enabled: !!token,
  });

  const subscription = subscriptionData?.subscription || null;
  const currentPlanKey = getPlanKey(subscription?.plan || user?.subscription?.plan);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Promotions & Badges</h1>
          <p className="mt-2 text-sm text-slate-600">
            Découvrez comment les badges et promotions améliorent la visibilité de vos annonces
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/profile")}>
          Gérer mon abonnement
        </Button>
      </div>

      {/* Section Badges */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">{BADGE_EXPLANATION.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{BADGE_EXPLANATION.description}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {BADGE_EXPLANATION.howItWorks.map((item) => (
            <div key={item.step} className="rounded-xl border border-slate-100 bg-slate-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-semibold">
                  {item.step}
                </span>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              </div>
              <p className="text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section Plans Détaillés */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Détails des plans et badges</h2>
          <p className="mt-2 text-sm text-slate-600">
            Comparez les avantages de chaque plan et leurs badges associés
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {Object.entries(PLAN_DETAILS).map(([key, plan]) => {
            const isCurrentPlan = key === currentPlanKey;
            const colorClasses = {
              slate: "border-slate-200 bg-slate-50",
              sky: "border-sky-200 bg-sky-50",
              purple: "border-purple-200 bg-purple-50",
            };

            return (
              <div
                key={key}
                className={`relative rounded-2xl border-2 p-6 shadow-sm transition ${
                  isCurrentPlan
                    ? "border-emerald-400 ring-2 ring-emerald-100"
                    : colorClasses[plan.color] || "border-slate-200 bg-white"
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                    Plan actuel
                  </div>
                )}

                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl text-${plan.color}-600`}>
                      <i className={plan.icon} />
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                      <p className="text-sm font-semibold text-slate-500">{plan.price}</p>
                    </div>
                  </div>
                  <PlanBadge plan={plan.badge} variant="solid" />
                </div>

                <p className="mb-4 text-sm text-slate-600">{plan.description}</p>

                <div className="mb-4 space-y-3">
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-800">Fonctionnalités incluses</h4>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-0.5 text-emerald-500">
                            <i className="ri-check-line" />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.benefits.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-emerald-700">Avantages badge</h4>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {plan.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-0.5 text-emerald-500">
                              <i className="ri-star-line" />
                            </span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-slate-500">Limitations</h4>
                      <ul className="space-y-1.5 text-xs text-slate-500">
                        {plan.limitations.map((limitation, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-0.5 text-slate-400">
                              <i className="ri-information-line" />
                            </span>
                            <span>{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {!isCurrentPlan && (
                  <Button
                    className="w-full"
                    variant={key === "premium" ? "default" : "secondary"}
                    onClick={() => navigate("/profile")}
                  >
                    Passer à {plan.name}
                  </Button>
                )}
                {isCurrentPlan && (
                  <div className="rounded-lg bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-700">
                    Vous utilisez actuellement ce plan
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section Priorité */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">{PRIORITY_EXPLANATION.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{PRIORITY_EXPLANATION.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PRIORITY_EXPLANATION.priorityLevels.map((level) => (
            <div
              key={level.plan}
              className="rounded-xl border border-slate-100 bg-slate-50 p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <PlanBadge plan={level.plan} variant="solid" />
                <span className="text-xs font-semibold text-slate-500">Score: {level.score}</span>
              </div>
              <p className="text-sm text-slate-600">{level.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section CTA */}
      <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Prêt à booster vos annonces ?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Passez à un plan supérieur et augmentez votre visibilité dès aujourd'hui
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate("/profile")}>Voir les plans</Button>
          <Button variant="secondary" onClick={() => navigate("/properties/manage")}>
            Mes annonces
          </Button>
        </div>
      </section>
    </div>
  );
}

