import { useAuth } from "../../context/AuthContext";

const descriptions = {
  particulier:
    "Suivez ici vos annonces, vos leads et vos démarches de financement. Les widgets dédiés seront ajoutés au fur et à mesure.",
  entreprise:
    "Vue agence : performances des collaborateurs, leads partagés, KYC entreprise. Les indicateurs spécifiques arrivent bientôt.",
  admin:
    "Vue administrateur : modération, KYC global, gestion des plans et statistiques plateforme. Les outils seront intégrés progressivement.",
};

const cards = {
  particulier: [
    { label: "Annonces actives", hint: "Publiez et gérez vos biens dans l’onglet Annonces." },
    { label: "Leads en attente", hint: "Vos nouveaux contacts apparaîtront ici." },
    { label: "Groupes Tirelire", hint: "Retrouvez vos 9or3a dans le module Financement." },
    { label: "Notifications", hint: "Messages, modération, abonnements : tout s’affichera ici." },
  ],
  entreprise: [
    { label: "Biens agence", hint: "Vue consolidée de vos annonces multi-collaborateurs." },
    { label: "Leads journaliers", hint: "Suivi des demandes entrantes par canal." },
    { label: "Collaborateurs actifs", hint: "Ajoutez/retirez des membres depuis l’onglet Équipe." },
    { label: "Indicateurs agence", hint: "Tableaux de bord personnalisés à venir." },
  ],
  admin: [
    { label: "Annonces à modérer", hint: "Accédez à la modération via le menu Admin." },
    { label: "Dossiers KYC", hint: "Validez les entreprises et particuliers en attente." },
    { label: "Plans actifs", hint: "Gérez les offres et la tarification depuis Admin > Plans." },
    { label: "Statistiques globales", hint: "Visualisez les KPI de la plateforme prochainement." },
  ],
};

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? "particulier";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          {role === "admin"
            ? "Tableau de bord administrateur"
            : role === "entreprise"
            ? "Tableau de bord entreprise"
            : "Tableau de bord particulier"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{descriptions[role]}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards[role].map((card) => (
          <div key={card.label} className="space-y-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
            <p className="text-2xl font-semibold text-slate-900">—</p>
            <p className="text-xs text-slate-500">{card.hint}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
