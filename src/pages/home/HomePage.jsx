import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { PlanBadge } from "../../components/badges/PlanBadge";
import { searchProperties } from "../../services/propertyService";

const FALLBACK_PROJECTS = [
  {
    title: "Résidence Azur",
    location: "Casablanca • Anfa",
    price: "2.4 M MAD",
    ribbon: "Premium",
    bullet: ["Vue sur mer", "3 chambres", "Rooftop"],
  },
  {
    title: "Jardins de Marrakech",
    location: "Marrakech • Palmeraie",
    price: "1.8 M MAD",
    ribbon: "Nouveau",
    bullet: ["Villa contemporaine", "Piscine privée", "Jardin paysager"],
  },
  {
    title: "Urban Loft",
    location: "Rabat • Agdal",
    price: "980 K MAD",
    ribbon: "Investisseur",
    bullet: ["Rendement 8%", "Design moderne", "Prêt bancaire disponible"],
  },
];

const BENEFITS = [
  {
    icon: "ri-layout-4-line",
    title: "Diffusion intelligente",
    desc: "Publiez une fois, diffusez partout et profitez d’un réseau national qualifié.",
  },
  {
    icon: "ri-customer-service-2-line",
    title: "Gestion des leads",
    desc: "Chat en temps réel, relances automatiques et scoring des prospects.",
  },
  {
    icon: "ri-hand-coin-line",
    title: "Financement intégré",
    desc: "Prêts bancaires, co-investissement et parcours Tirelire.",
  },
];

const PLAN_SHOWCASE = [
  {
    key: "gratuit",
    title: "Plan Découverte",
    desc: "Idéal pour se lancer",
    items: ["10 annonces actives", "Statistiques essentielles", "Support e-mail"],
  },
  {
    key: "pro",
    title: "Plan Pro",
    desc: "Pour les agences ambitieuses",
    items: ["30 annonces + boosts", "Workflow leads avancé", "Support prioritaire"],
  },
  {
    key: "premium",
    title: "Plan Signature",
    desc: "Expérience VIP grands comptes",
    items: ["Annonces illimitées", "Branding dédié", "Account manager"],
  },
];

export default function HomePage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [urlSearch] = useSearchParams();
  const [form, setForm] = useState({
    keyword: urlSearch.get("keyword") || "",
    city: urlSearch.get("location") || "",
    budget: urlSearch.get("maxPrice") || "",
    type: urlSearch.get("transactionType") || "",
  });

  const {
    data: featuredData,
    isLoading: isFeaturedLoading,
  } = useQuery({
    queryKey: ["home-featured", Boolean(token)],
    queryFn: async () => {
      try {
        return await searchProperties(token ?? undefined, {
          status: "published",
          limit: 6,
          sort: "priority",
        });
      } catch {
        return { properties: [], total: 0 };
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const trending = useMemo(() => {
    const properties = featuredData?.properties ?? [];
    if (!properties.length) return FALLBACK_PROJECTS;

    return properties.slice(0, 3).map((property) => ({
      id: property._id,
      title: property.title,
      location: property.address || property.city || "Maroc",
      price:
        typeof property.price === "number"
          ? `${property.price.toLocaleString("fr-FR")} MAD`
          : property.priceLabel || "Prix sur demande",
      ribbon:
        property.ownerId?.subscription?.plan?.name?.toLowerCase() === "premium"
          ? "Premium"
          : property.transactionType === "sale"
          ? "À vendre"
          : "À louer",
      bullet: [
        property.rooms ? `${property.rooms} pièces` : null,
        property.surface ? `${property.surface} m²` : null,
        property.transactionType === "sale" ? "Achat sécurisé" : "Location clé en main",
      ].filter(Boolean),
    }));
  }, [featuredData]);

  const stats = [
    {
      label: "Biens actifs",
      value: featuredData?.total ?? 320,
      hint: "Annonces vérifiées disponibles en ce moment",
    },
    {
      label: "Projets financés",
      value: "1 200+",
      hint: "Transactions accompagnées via Darna & Tirelire",
    },
    {
      label: "Satisfaction clients",
      value: "4.9/5",
      hint: "Indice obtenu sur nos accompagnements 2023",
    },
  ];

  function handleSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (form.keyword) params.set("keyword", form.keyword);
    if (form.city) params.set("location", form.city);
    if (form.type) params.set("transactionType", form.type);
    if (form.budget) params.set("maxPrice", form.budget);

    const searchPath = `/properties${params.toString() ? `?${params.toString()}` : ""}`;
    if (token) {
      navigate(searchPath);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(searchPath)}`);
    }
  }

  return (
    <div className="bg-slate-50 text-slate-900">
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-700 to-emerald-500 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-200">
              Darna x Tirelire
            </span>
            <h1 className="text-4xl font-semibold leading-tight">
              Trouvez, financez et pilotez vos projets immobiliers sur la même plateforme.
            </h1>
            <p className="text-base text-white/85">
              Marketplace premium, gestion de leads temps réel et parcours d’épargne collective.
              Nous connectons vendeurs, acheteurs et investisseurs partout au Maroc.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" /> 450+ professionnels actifs
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300" /> Support 7j/7
              </div>
            </div>
          </div>

          <div className="w-full max-w-md rounded-2xl bg-white/95 p-6 text-slate-900 shadow-2xl backdrop-blur">
            <p className="mb-4 text-sm font-semibold text-slate-500">Recherche express</p>
            <form className="space-y-3" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Quartier, référence, mot-clé…"
                value={form.keyword}
                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Ville ou région"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Budget max (MAD)"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">Type de transaction</option>
                <option value="sale">Achat</option>
                <option value="monthly_rent">Location longue durée</option>
                <option value="daily_rent">Location courte durée</option>
                <option value="seasonal_rent">Saisonnier</option>
              </select>
              <Button type="submit" className="w-full">
                Lancer la recherche
              </Button>
            </form>
            <p className="mt-3 text-xs text-slate-500">
              Déjà membre ?{" "}
              <Link to={token ? "/dashboard" : "/login"} className="font-semibold text-emerald-600">
                Accédez à vos favoris
              </Link>
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16">
        <section className="grid gap-4 rounded-3xl bg-white p-8 shadow-lg md:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <article key={benefit.title} className="rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <i className={`${benefit.icon} text-xl`} />
                </span>
                <h3 className="text-lg font-semibold">{benefit.title}</h3>
              </div>
              <p className="mt-3 text-sm text-slate-500">{benefit.desc}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">À la une</p>
              <h2 className="mt-1 text-3xl font-semibold text-slate-900">Biens prêts à visiter</h2>
              <p className="mt-2 text-sm text-slate-500">
                Chaque jour, nos équipes qualifient les meilleures annonces. Voici les plus consultées.
              </p>
            </div>
            <Button variant="ghost" onClick={() => navigate(token ? "/properties" : "/login")}>
              Parcourir toutes les annonces →
            </Button>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {isFeaturedLoading
              ? Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`skeleton-${idx}`} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
                ))
              : trending.map((project) => (
                  <article
                    key={project.id || project.title}
                    className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>{project.location}</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
                        {project.ribbon}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">{project.title}</h3>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{project.price}</p>
                    <ul className="mt-4 space-y-1 text-sm text-slate-600">
                      {project.bullet.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    {project.id && (
                      <Button
                        variant="ghost"
                        className="mt-4 w-full"
                        onClick={() =>
                          navigate(
                            token
                              ? `/properties/${project.id}`
                              : `/login?redirect=${encodeURIComponent(`/properties/${project.id}`)}`
                          )
                        }
                      >
                        Voir le détail
                      </Button>
                    )}
                  </article>
                ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
              <p className="mt-2 text-4xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.hint}</p>
            </div>
          ))}
        </section>

        <section className="grid items-stretch gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Pour les pros</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Votre marque, nos technologies</h2>
            <p className="mt-3 text-sm text-slate-600">
              CRM leads, signature électronique, diffusion multi-portails, reporting personnalisé… Nous déployons vos
              campagnes de vente et vos parcours de financement collaboratif.
            </p>
            <div className="mt-6 grid gap-4 text-sm">
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="font-semibold text-slate-800">40% de temps gagné</p>
                <p className="text-slate-500">Automatisation des relances et agenda partagé.</p>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="font-semibold text-slate-800">SEO & social ads intégrés</p>
                <p className="text-slate-500">Boostez vos exclusivités sans outils additionnels.</p>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="font-semibold text-slate-800">API & interopérabilité</p>
                <p className="text-slate-500">Synchronisez vos CRM et back-offices en temps réel.</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => navigate("/register")}>Créer mon compte</Button>
              <Button variant="ghost" onClick={() => navigate("/support")}>
                Parler à un expert
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Offres</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">Des plans taillés pour vos ambitions</h3>
            <div className="mt-6 space-y-5">
              {PLAN_SHOWCASE.map((plan) => (
                <article key={plan.key} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-slate-400">{plan.desc}</p>
                      <h4 className="text-xl font-semibold text-slate-900">{plan.title}</h4>
                    </div>
                    <PlanBadge plan={plan.key} />
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-5 w-full"
                    variant={plan.key === "premium" ? "default" : "ghost"}
                    onClick={() => navigate(token ? "/profile" : "/register")}
                  >
                    Découvrir ce plan
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Ils témoignent</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                Des promoteurs, agences et groupes Tirelire nous font confiance
              </h3>
              <p className="mt-3 text-sm text-slate-500">
                97% des utilisateurs recommandent Darna pour accélérer la commercialisation et sécuriser les financements.
              </p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/support")}>
              Parler à un conseiller
            </Button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "“Nous avons écoulé nos lots premium 30% plus rapidement grâce aux boosts.”",
              "“La gestion des leads et la signature numérique ont transformé notre quotidien.”",
              "“La Tirelire a rassuré nos investisseurs et fluidifié le financement collectif.”",
            ].map((quote, index) => (
              <blockquote key={quote} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 text-sm text-slate-600">
                <p className="mb-3 text-emerald-600 text-3xl leading-none">“</p>
                {quote}
                <p className="mt-3 text-xs font-semibold text-slate-500">Client #{index + 1}</p>
              </blockquote>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

