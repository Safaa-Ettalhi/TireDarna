import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { listBankOffers, listSimulations } from "../../services/financingService";
import { useAuth } from "../../context/AuthContext";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";

export default function BanksPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("rate");
  const [filterPartner, setFilterPartner] = useState(false);

  const offersQuery = useQuery({
    queryKey: ["bankOffers"],
    queryFn: () => listBankOffers(token), 
   
    retry: 2,
  });

  const simulationsQuery = useQuery({
    queryKey: ["loanSimulations", token],
    queryFn: () => listSimulations(token),
    enabled: !!token,
  });


  const sortedOffers = useMemo(() => {

    if (offersQuery.data) {
      console.log(" Données reçues du backend:", offersQuery.data);
    }
    
    if (!offersQuery.data?.offers) {
      if (offersQuery.data && !offersQuery.data.offers) {
        console.log(" Réponse reçue mais pas d'offres:", offersQuery.data);
      }
      return [];
    }
    
    let filtered = [...offersQuery.data.offers];

    if (filterPartner) {
      filtered = filtered.filter((offer) => offer.partner === true);
    }
    

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rate":
          return (a.rate || 0) - (b.rate || 0);
        case "duration":
          return (b.durationYears || 0) - (a.durationYears || 0);
        case "maxAmount":
          return (b.maxAmount || 0) - (a.maxAmount || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [offersQuery.data?.offers, sortBy, filterPartner]);

  if (offersQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="flex h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600"></span>
          Chargement des offres bancaires…
        </div>
      </div>
    );
  }

  if (offersQuery.isError) {
    console.error("Erreur chargement offres bancaires:", offersQuery.error);
    return (
      <div className="space-y-6">
        <Alert
          variant="error"
          title="Impossible de charger les banques partenaires"
          message={
            offersQuery.error?.response?.status === 404
              ? "L'endpoint des offres bancaires n'est pas disponible. Vérifiez que le backend est démarré."
              : offersQuery.error?.message || "Une erreur est survenue lors du chargement des offres."
          }
        />
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="font-medium mb-2">Détails techniques :</p>
          <p>Status: {offersQuery.error?.response?.status || "N/A"}</p>
          <p>Message: {offersQuery.error?.message || "Erreur inconnue"}</p>
        </div>
      </div>
    );
  }

  const offers = sortedOffers;
  const simulations = simulationsQuery.data?.simulations || [];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Banques partenaires</h2>
            <p className="mt-2 text-sm text-slate-600">
              Comparez les offres de nos partenaires financiers et trouvez le crédit immobilier qui vous convient.
            </p>
          </div>
          <Button onClick={() => navigate("/financing/simulator")} variant="primary">
            <i className="ri-calculator-line mr-2" />
            Simuler un crédit
          </Button>
        </div>
      </section>

      {/* Filtres et tri */}
      {offers.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-sm font-medium text-slate-700">Trier par :</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("rate")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                sortBy === "rate"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <i className="ri-percent-line mr-1" />
              Taux
            </button>
            <button
              onClick={() => setSortBy("duration")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                sortBy === "duration"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <i className="ri-time-line mr-1" />
              Durée
            </button>
            <button
              onClick={() => setSortBy("maxAmount")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                sortBy === "maxAmount"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <i className="ri-money-dollar-circle-line mr-1" />
              Montant max
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={filterPartner}
                onChange={(e) => setFilterPartner(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Partenaires uniquement</span>
            </label>
          </div>
        </div>
      )}

      {/* Liste des offres */}
      {offers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <article
              key={offer._id || offer.name}
              className={`group rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                offer.partner
                  ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {offer.bankName || offer.name}
                    </h3>
                    {offer.partner && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        <i className="ri-verified-badge-line" />
                        Partenaire
                      </span>
                    )}
                  </div>
                  {offer.description && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{offer.description}</p>
                  )}
                </div>
              </div>

              {/* Informations principales */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Taux annuel</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {offer.rate?.toFixed(2) || "N/A"}%
                  </span>
                </div>

                {offer.durationYears && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Durée maximale</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {offer.durationYears} ans
                    </span>
                  </div>
                )}

                {offer.maxAmount && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Montant maximum</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {offer.maxAmount.toLocaleString("fr-FR")} dh
                    </span>
                  </div>
                )}

                {offer.fees !== undefined && offer.fees > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Frais de dossier</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {offer.fees.toLocaleString("fr-FR")} dh
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/financing/simulator", { state: { bankOfferId: offer._id } })}
                  className="w-full"
                >
                  <i className="ri-calculator-line mr-2" />
                  Simuler avec cette offre
                </Button>
                {offer.contactEmail && (
                  <a
                    href={`mailto:${offer.contactEmail}?subject=Demande d'information - ${offer.bankName || offer.name}`}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <i className="ri-mail-line" />
                    Contacter un conseiller
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <i className="ri-bank-line text-4xl text-slate-400 mb-3" />
          <p className="text-sm font-medium text-slate-600 mb-1">Aucune offre disponible</p>
          <p className="text-xs text-slate-500 mb-4">
            {filterPartner
              ? "Aucune offre partenaire pour le moment."
              : "Aucune offre bancaire renseignée pour le moment."}
          </p>
          {offersQuery.data && offersQuery.data.offers?.length === 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 max-w-md mx-auto">
              <p className="font-medium mb-1">💡 Note pour l'administrateur :</p>
              <p>
                Les offres bancaires doivent être créées via l'API admin. 
                Utilisez <code className="bg-amber-100 px-1 rounded">POST /api/financing/offers</code> pour ajouter des offres.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Historique des simulations */}
      {simulations.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Mes simulations</h3>
              <p className="mt-1 text-xs text-slate-500">
                Historique de vos simulations de crédit immobilier
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/financing/simulator")}
            >
              Nouvelle simulation
            </Button>
          </div>
          <div className="space-y-3">
            {simulations.slice(0, 5).map((sim) => (
              <div
                key={sim._id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">
                      {sim.property?.title || "Simulation sans bien"}
                    </p>
                    {sim.bankOffer && (
                      <span className="text-xs text-slate-500">
                        • {sim.bankOffer.bankName || sim.bankOffer.name}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span>
                      <span className="font-medium">Montant :</span>{" "}
                      {sim.amount?.toLocaleString("fr-FR")} dh
                    </span>
                    <span>
                      <span className="font-medium">Taux :</span> {sim.rate?.toFixed(2)}%
                    </span>
                    <span>
                      <span className="font-medium">Durée :</span> {sim.durationYears} ans
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {sim.monthlyPayment?.toLocaleString("fr-FR")} dh/mois
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/financing/simulator", { state: { simulationId: sim._id } })}
                >
                  Voir
                </Button>
              </div>
            ))}
            {simulations.length > 5 && (
              <p className="text-center text-xs text-slate-500">
                {simulations.length - 5} autre(s) simulation(s)
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

