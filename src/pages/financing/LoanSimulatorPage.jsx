import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { simulateLoan, listSimulations, listBankOffers } from "../../services/financingService";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { TextField } from "../../components/ui/TextField";

export default function LoanSimulatorPage() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [form, setForm] = useState({
    propertyId: "",
    amount: "",
    downPayment: "",
    rate: "4",
    durationYears: "20",
    bankOfferId: "",
  });
  const [result, setResult] = useState(null);

  
  const bankOffersQuery = useQuery({
    queryKey: ["bankOffers"],
    queryFn: () => listBankOffers(token),
    retry: 2,
  });

  // Récupérer l'offre bancaire sélectionnée depuis la navigation
  useEffect(() => {
    const bankOfferId = location.state?.bankOfferId || searchParams.get("bankOfferId");
    const propertyId = searchParams.get("propertyId");
    const price = searchParams.get("price");
    
    if (bankOfferId && bankOffersQuery.data?.offers) {
      const selectedOffer = bankOffersQuery.data.offers.find((o) => o._id === bankOfferId);
      if (selectedOffer) {
        setForm((prev) => ({
          ...prev,
          bankOfferId: bankOfferId,
          rate: selectedOffer.rate?.toString() || prev.rate,
          durationYears: selectedOffer.durationYears?.toString() || prev.durationYears,
          amount: price || prev.amount,
          propertyId: propertyId || prev.propertyId,
        }));
      }
    } else {
      setForm((prev) => ({
        ...prev,
        propertyId: propertyId || prev.propertyId,
        amount: price || prev.amount,
      }));
    }
  }, [searchParams, location.state, bankOffersQuery.data]);

  const selectedOffer = useMemo(() => {
    if (!form.bankOfferId || !bankOffersQuery.data?.offers) return null;
    return bankOffersQuery.data.offers.find((o) => o._id === form.bankOfferId);
  }, [form.bankOfferId, bankOffersQuery.data]);

  const historyQuery = useQuery({
    queryKey: ["loanSimulations", token],
    queryFn: () => listSimulations(token),
    enabled: !!token,
  });

  const simulateMutation = useMutation({
    mutationFn: (payload) => simulateLoan(token, payload),
    onSuccess: (data) => {
      setResult(data?.simulation);
      historyQuery.refetch();
    },
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => {
      const newForm = { ...prev, [name]: value };
      
     
      if (name === "bankOfferId" && value && bankOffersQuery.data?.offers) {
        const offer = bankOffersQuery.data.offers.find((o) => o._id === value);
        if (offer) {
          newForm.rate = offer.rate?.toString() || newForm.rate;
          newForm.durationYears = offer.durationYears?.toString() || newForm.durationYears;
        }
      }
      
      return newForm;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.amount || !form.durationYears || !form.rate) {
      alert("Veuillez renseigner le montant, la durée et le taux.");
      return;
    }
    simulateMutation.mutate({
      propertyId: form.propertyId || undefined,
      amount: Number(form.amount),
      downPayment: Number(form.downPayment) || 0,
      rate: Number(form.rate),
      durationYears: Number(form.durationYears),
      bankOfferId: form.bankOfferId || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Simulateur de crédit immobilier</h2>
        <p className="mt-2 text-sm text-slate-600">
          Calculez vos mensualités en fonction du montant, du taux et de la durée souhaités.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Sélection d'une offre bancaire */}
          {bankOffersQuery.data?.offers?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Choisir une offre bancaire (optionnel)
              </label>
              <select
                name="bankOfferId"
                value={form.bankOfferId}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Aucune offre sélectionnée</option>
                {bankOffersQuery.data.offers.map((offer) => (
                  <option key={offer._id} value={offer._id}>
                    {offer.bankName || offer.name} - {offer.rate?.toFixed(2)}% sur {offer.durationYears} ans
                  </option>
                ))}
              </select>
              {selectedOffer && (
                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs">
                  <p className="font-semibold text-emerald-900">
                    {selectedOffer.bankName || selectedOffer.name}
                    {selectedOffer.partner && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                        Partenaire
                      </span>
                    )}
                  </p>
                  {selectedOffer.description && (
                    <p className="mt-1 text-emerald-700">{selectedOffer.description}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Montant du bien (dh)"
              name="amount"
              type="number"
              min="0"
              value={form.amount}
              onChange={handleChange}
              required
            />
            <TextField
              label="Apport personnel (dh)"
              name="downPayment"
              type="number"
              min="0"
              value={form.downPayment}
              onChange={handleChange}
            />
            <TextField
              label="Taux annuel (%)"
              name="rate"
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={form.rate}
              onChange={handleChange}
              required
              disabled={!!selectedOffer}
            />
            <TextField
              label="Durée (années)"
              name="durationYears"
              type="number"
              min="1"
              max="30"
              value={form.durationYears}
              onChange={handleChange}
              required
              disabled={!!selectedOffer}
            />
          </div>

          {form.amount && form.downPayment && Number(form.amount) > Number(form.downPayment) && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-700">
                Montant à financer :{" "}
                <span className="font-bold text-emerald-600">
                  {(Number(form.amount) - Number(form.downPayment)).toLocaleString("fr-FR")} dh
                </span>
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={simulateMutation.isLoading} variant="primary">
              <i className="ri-calculator-line mr-2" />
              {simulateMutation.isLoading ? "Calcul en cours..." : "Simuler le crédit"}
            </Button>
          </div>
        </form>

        {simulateMutation.isError && (
          <Alert
            variant="error"
            title="Erreur de simulation"
            message={simulateMutation.error.message}
            className="mt-4"
          />
        )}

        {result && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <i className="ri-checkbox-circle-line text-2xl text-emerald-600" />
              <h3 className="text-lg font-bold text-emerald-900">Résultat de la simulation</h3>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-100 bg-white p-4">
                <p className="text-xs font-medium text-slate-500 mb-1">Mensualité</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {result.monthlyPayment?.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  dh
                </p>
                <p className="text-xs text-slate-500 mt-1">par mois</p>
              </div>

              <div className="rounded-lg border border-slate-100 bg-white p-4">
                <p className="text-xs font-medium text-slate-500 mb-1">Montant total remboursé</p>
                <p className="text-xl font-bold text-slate-900">
                  {((result.monthlyPayment || 0) * (result.durationYears || 0) * 12).toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  dh
                </p>
                <p className="text-xs text-slate-500 mt-1">sur {result.durationYears} ans</p>
              </div>

              <div className="rounded-lg border border-slate-100 bg-white p-4">
                <p className="text-xs font-medium text-slate-500 mb-1">Intérêts totaux</p>
                <p className="text-xl font-bold text-slate-900">
                  {result.totalInterest?.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || "N/A"}{" "}
                  dh
                </p>
              </div>

              <div className="rounded-lg border border-slate-100 bg-white p-4">
                <p className="text-xs font-medium text-slate-500 mb-1">Taux d'intérêt</p>
                <p className="text-xl font-bold text-slate-900">{result.rate?.toFixed(2)}%</p>
                <p className="text-xs text-slate-500 mt-1">annuel</p>
              </div>
            </div>

            {result.bankOffer && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs">
                <p className="font-semibold text-emerald-900">
                  Offre sélectionnée : {result.bankOffer.bankName || result.bankOffer.name}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Historiques des simulations</h3>
        {historyQuery.isLoading && <p className="text-sm text-slate-500 mt-3">Chargement…</p>}
        {historyQuery.isError && (
          <Alert
            variant="error"
            title="Impossible de charger l'historique"
            message={historyQuery.error.message}
            className="mt-3"
          />
        )}
        {historyQuery.data?.simulations?.length ? (
          <div className="mt-4 space-y-3">
            {historyQuery.data.simulations.map((simulation) => (
              <div
                key={simulation._id}
                className="flex flex-wrap items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {simulation.amount?.toLocaleString("fr-FR")} dh sur {simulation.durationYears} an(s)
                  </p>
                  <p className="text-xs text-slate-500">
                    Taux {simulation.rate}% — Mensualité {simulation.monthlyPayment?.toLocaleString("fr-FR")} dh
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(simulation.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Aucune simulation enregistrée.</p>
        )}
      </section>
    </div>
  );
}

