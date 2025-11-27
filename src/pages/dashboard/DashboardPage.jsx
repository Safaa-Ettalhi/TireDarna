import { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { searchProperties, getPremiumPropertyStats } from "../../services/propertyService";
import { getOwnerLeads, getBuyerLeads } from "../../services/leadService";
import { getMySubscription } from "../../services/subscriptionService";
import { fetchProfile } from "../../services/authService";
import { Button } from "../../components/ui/Button";
import AdminDashboardPage from "../admin/AdminDashboardPage";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? "particulier";
  const isAdmin = role === "admin";
  const isEntreprise = role === "entreprise";

  const { data: propertiesData } = useQuery({
    queryKey: ["dashboardProperties", token],
    queryFn: () =>
      searchProperties(token, {
        includeOwn: true,
        status: "all",
        sort: "createdAt",
        order: "desc",
        limit: 60,
      }),
    enabled: !!token && !isAdmin,
  });

  const { data: ownerLeadsData } = useQuery({
    queryKey: ["dashboardOwnerLeads", token],
    queryFn: () => getOwnerLeads(token),
    enabled: !!token && !isAdmin,
  });

  const { data: buyerLeadsData } = useQuery({
    queryKey: ["dashboardBuyerLeads", token],
    queryFn: () => getBuyerLeads(token),
    enabled: !!token && !isAdmin,
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["dashboardSubscription", token],
    queryFn: () => getMySubscription(token),
    enabled: !!token && !isAdmin,
  });

  const { data: profileData } = useQuery({
    queryKey: ["dashboardProfile", token],
    queryFn: () => fetchProfile(token),
    enabled: !!token && isEntreprise,
  });

  const { data: premiumStatsData } = useQuery({
    queryKey: ["premiumPropertyStats", token],
    queryFn: () => getPremiumPropertyStats(token),
    enabled: !!token && !isAdmin,
  });

  const myProperties = propertiesData?.properties ?? [];
  const ownerLeads = ownerLeadsData?.leads ?? ownerLeadsData ?? [];
  const buyerLeads = buyerLeadsData?.leads ?? buyerLeadsData ?? [];
  const subscription = subscriptionData?.subscription ?? null;
  const planName =
    typeof subscription?.plan === "string"
      ? subscription?.plan
      : subscription?.plan?.name || "gratuit";
  const teamMembers = profileData?.user?.members || [];

  const premiumTotal = premiumStatsData?.totalPremium ?? 0;
  const myPremium = premiumStatsData?.myPremium ?? 0;

  const stats = useMemo(() => {
    const published = myProperties.filter((p) => p.status === "published").length;
    const highlighted = premiumTotal;
    const pendingLeads = ownerLeads.filter((lead) => lead.status === "pending" || !lead.status).length;

    const baseStats = [
      {
        label: "Annonces actives",
        value: published,
        hint: "Publiez et gérez vos biens",
        icon: "ri-store-2-line",
      },
      {
        label: "Leads reçus",
        value: ownerLeads.length,
        hint: `${pendingLeads} en attente de réponse`,
        icon: "ri-user-follow-line",
      },
      {
        label: "Leads envoyés",
        value: buyerLeads.length,
        hint: "Suivez vos demandes de visite",
        icon: "ri-chat-poll-line",
      },
      {
        label: "Annonces premium",
        value: highlighted,
        hint: myPremium ? `${myPremium} à vous` : "Publiées par des comptes premium",
        icon: "ri-vip-crown-line",
      },
    ];

    if (isEntreprise) {
      baseStats.push({
        label: "Membres d'équipe",
        value: teamMembers.length,
        hint: "Gérez votre équipe",
        icon: "ri-team-line",
      });
    }

    return baseStats;
  }, [myProperties, ownerLeads, buyerLeads, isEntreprise, teamMembers.length, premiumTotal, myPremium]);

  const tips = [
    {
      title: "Boostez la visibilité",
      description: "Activez une promotion ou un plan premium pour faire remonter vos annonces.",
      icon: "ri-rocket-line",
    },
    {
      title: "Raccourcissez vos délais",
      description: "Répondez rapidement aux leads pour améliorer votre taux de conversion.",
      icon: "ri-speed-up-line",
    },
  ];

  const quickActions = [
    {
      label: "Créer une annonce",
      description: "Publiez un nouveau bien en quelques étapes",
      action: () => navigate("/properties/new"),
      icon: "ri-home-3-line",
    },
    {
      label: "Voir mes leads",
      description: "Suivez vos contacts et répondez rapidement",
      action: () => navigate("/inbox"),
      icon: "ri-customer-service-2-line",
    },
    {
      label: "Financer un projet",
      description: "Simulez un crédit ou créez une Tirelire",
      action: () => navigate("/financing"),
      icon: "ri-bank-card-line",
    },
    {
      label: "Gérer mon abonnement",
      description: "Accédez à vos options de plan et facturation",
      action: () => navigate("/profile"),
      icon: "ri-vip-crown-line",
    },
  ];

  if (isEntreprise) {
    quickActions.push({
      label: "Gérer l'équipe",
      description: "Ajoutez ou retirez des membres de votre entreprise",
      action: () => navigate("/team"),
      icon: "ri-team-line",
    });
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">Connectez-vous pour accéder à votre tableau de bord.</p>
        <Button className="mt-4" onClick={() => navigate("/login")}>
          Se connecter
        </Button>
      </div>
    );
  }

  if (isAdmin) {
    return <AdminDashboardPage />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-300 via-emerald-500 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">Tableau de bord</p>
            <h2 className="mt-2 text-3xl font-bold">
              {isEntreprise && user.companyInfo?.companyName
                ? user.companyInfo.companyName
                : user.firstName
                ? `Bonjour ${user.firstName}`
                : "Bienvenue sur Darna"}
            </h2>
            <p className="mt-1 text-sm text-emerald-100">
              {isEntreprise
                ? "Gérez vos annonces, votre équipe et vos démarches de financement."
                : "Visualisez vos annonces, vos leads et vos démarches de financement en un clin d'œil."}
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 px-5 py-4 text-sm text-emerald-50 backdrop-blur">
            <p className="text-xs uppercase tracking-wide">Plan actif</p>
            <p className="text-lg font-semibold text-white">{planName}</p>
            <p className="text-xs text-emerald-100">
              Accédez à l’espace Profil pour gérer votre abonnement.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center gap-2 text-slate-500">
              <span className="rounded-full bg-emerald-50 p-2 text-emerald-500 shadow-inner">
                <i className={`${stat.icon} text-base`} />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wide">{stat.label}</p>
            </div>
            <p className="mt-3 text-4xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {tips.map((tip) => (
          <article
            key={tip.title}
            className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 shadow-sm"
          >
            <span className="rounded-full bg-white p-3 text-emerald-500 shadow-inner">
              <i className={`${tip.icon} text-xl`} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{tip.title}</p>
              <p className="text-xs text-slate-500">{tip.description}</p>
            </div>
          </article>
        ))}
      </section>

      {isEntreprise && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Équipe</h3>
              <p className="mt-1 text-sm text-slate-600">
                {teamMembers.length} {teamMembers.length === 1 ? "membre" : "membres"} dans votre équipe
              </p>
            </div>
            <Button onClick={() => navigate("/team")}>Gérer l'équipe</Button>
          </div>
          {user.companyInfo && (
            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Statut KYC
              </p>
              <p className="mt-1">
                {user.companyInfo.kycVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    <i className="ri-checkbox-circle-line" />
                    Vérifié
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                    <i className="ri-time-line" />
                    En attente de validation
                  </span>
                )}
              </p>
            </div>
          )}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {quickActions.map((action) => (
          <article
            key={action.label}
            className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="rounded-full bg-emerald-50 p-3 text-emerald-600 shadow-inner">
              <i className={`${action.icon} text-xl`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">{action.label}</p>
              <p className="text-xs text-slate-500">{action.description}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={action.action}>
              Ouvrir
            </Button>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Activité récente</h3>
          <Link
            to="/properties/manage"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
          >
            Voir toutes mes annonces →
          </Link>
        </div>
        {myProperties.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Vous n’avez pas encore publié d’annonce.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {myProperties.slice(0, 5).map((property) => (
              <div
                key={property._id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">{property.title}</p>
                  <p className="text-xs text-slate-500">
                    {property.status === "published" ? "Publiée" : property.status || "Brouillon"} •{" "}
                    {new Date(property.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/properties/${property._id}`)}>
                  Ouvrir
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
