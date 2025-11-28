import { Link } from "react-router-dom";

const lastUpdated = "28 novembre 2025";

const SUMMARY_CARDS = [
  { icon: "🛡️", label: "SLA réponse DPO", value: "-30 jours" },
  { icon: "📁", label: "Durée moyenne", value: "3 ans après clôture" },
  { icon: "🤝", label: "Prestataires audités", value: "Stripe · MinIO · Tirelire" },
];

const ACCORDION_SECTIONS = [
  {
    title: "Responsable & gouvernance",
    intro:
      "Darna est exploitée par [Nom de l’entreprise], immatriculée [Numéro SIRET], siège [Adresse]. Notre DPO vérifie chaque demande, journalisée et authentifiée.",
    bullets: [
      "Contact direct : privacy@darna.com",
      "Registre RGPD / DPIA tenus à jour",
      "Notification transparente en cas d’incident",
    ],
  },
  {
    title: "Données traitées",
    intro: "Collecte limitée au strict nécessaire pour l’expérience Darna/Tirelire.",
    bullets: [
      "Identité & profil : nom, email, rôle, informations société",
      "Usage : annonces, recherches, messages, tickets, statistiques agrégées",
      "Facturation & KYC : abonnements, justificatifs, paiements Stripe",
      "Technique : adresses IP, device, journaux de connexion",
    ],
  },
  {
    title: "Finalités & bases légales",
    bullets: [
      "Contrat : dashboard, leads, chat temps réel, Tirelire",
      "Obligations légales : anti-fraude, conservation comptable, KYC",
      "Intérêt légitime : sécurisation, prévention des abus, amélioration produit",
      "Consentement : newsletters, cookies analytics/marketing",
    ],
  },
  {
    title: "Durées & partage",
    bullets: [
      "Comptes & contenus : durée d’usage + 3 ans",
      "Factures et obligations fiscales : 10 ans",
      "Logs techniques : 12 mois",
      "Partage limité à nos prestataires (OVH/MinIO, Stripe, Tirelire) sous contrat RGPD",
      "Jamais de vente de données personnelles",
    ],
  },
];

const RIGHTS = [
  { title: "Accès / Portabilité", desc: "Recevez vos données dans un format structuré." },
  { title: "Rectification", desc: "Corrigez rapidement les informations erronées." },
  { title: "Effacement", desc: "Suppression lorsque la loi l’autorise." },
  { title: "Opposition / limitation", desc: "Suspendez les traitements non obligatoires." },
];

const SECURITY_POINTS = [
  "Chiffrement TLS en transit + AES-256 au repos",
  "2FA administrateurs, journaux immuables, alerting temps réel",
  "Sauvegardes chiffrées multi-sites, PRA testé",
  "Contrats RGPD (DPA) signés avec chaque prestataire",
];


export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        <span aria-hidden="true">←</span> Retour au tableau de bord
      </Link>
      <header className="overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/30 to-slate-50 p-8 shadow-xl shadow-emerald-100/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-500">Protection des données</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Politique de confidentialité</h1>
            <p className="text-xs text-slate-500">Mise à jour : {lastUpdated}</p>
          </div>
          <Link
            to="/legal/cookies"
            className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm backdrop-blur hover:bg-white"
          >
            Préférences cookies
          </Link>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-slate-600">
          Cette page résume nos engagements RGPD. Pour la gestion exclusive des cookies, consultez la page dédiée.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="mailto:privacy@darna.com"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Écrire au DPO
          </a>
          <Link
            to="/support"
            className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:border-emerald-300"
          >
            Ticket privacy
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {SUMMARY_CARDS.map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md">
            <div className="text-2xl">{card.icon}</div>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
            <p className="text-lg font-semibold text-slate-900">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        {ACCORDION_SECTIONS.map((section) => (
          <details
            key={section.title}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition open:border-emerald-200"
          >
            <summary className="flex cursor-pointer items-center justify-between text-left text-base font-semibold text-slate-900">
              {section.title}
              <span className="text-sm text-slate-400 group-open:text-emerald-600">
                {section.bullets ? `${section.bullets.length} points` : "Voir plus"}
              </span>
            </summary>
            {section.intro && <p className="mt-3 text-sm leading-relaxed text-slate-600">{section.intro}</p>}
            {section.bullets && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </details>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Vos droits RGPD</h2>
          <a href="mailto:privacy@darna.com" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            Faire une demande
          </a>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {RIGHTS.map((right) => (
            <article key={right.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{right.title}</p>
              <p className="mt-1 text-xs text-slate-600">{right.desc}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Réponse garantie sous 30 jours (prolongation possible en cas de dossier complexe).
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Sécurité & sous-traitants</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {SECURITY_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

    </section>
  );
}

