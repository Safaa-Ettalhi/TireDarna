import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listBankOffers, createBankOffer } from "../../services/financingService";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { TextField } from "../../components/ui/TextField";

export default function BanksManagementPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bankName: "",
    description: "",
    rate: "",
    durationYears: "",
    maxAmount: "",
    fees: "0",
    contactEmail: "",
    partner: false,
  });

  const offersQuery = useQuery({
    queryKey: ["bankOffers"],
    queryFn: () => listBankOffers(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createBankOffer(token, payload),
    onSuccess: () => {
      alert("Offre bancaire créée avec succès !");
      setShowForm(false);
      setForm({
        name: "",
        bankName: "",
        description: "",
        rate: "",
        durationYears: "",
        maxAmount: "",
        fees: "0",
        contactEmail: "",
        partner: false,
      });
      queryClient.invalidateQueries(["bankOffers"]);
    },
    onError: (error) => {
      alert(`Erreur lors de la création : ${error.message}`);
    },
  });

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    
    // Validation
    if (!form.name || !form.rate || !form.durationYears || !form.maxAmount) {
      alert("Veuillez remplir tous les champs obligatoires (nom, taux, durée, montant max).");
      return;
    }

    const payload = {
      name: form.name,
      bankName: form.bankName || form.name,
      description: form.description || undefined,
      rate: Number(form.rate),
      durationYears: Number(form.durationYears),
      maxAmount: Number(form.maxAmount),
      fees: Number(form.fees) || 0,
      contactEmail: form.contactEmail || undefined,
      partner: form.partner,
    };

    createMutation.mutate(payload);
  }

  const offers = offersQuery.data?.offers || [];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestion des banques partenaires</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ajoutez et gérez les offres bancaires disponibles sur la plateforme.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "secondary" : "primary"}
        >
          {showForm ? "Annuler" : "+ Ajouter une banque"}
        </Button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Nouvelle offre bancaire</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nom de la banque *"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Ex: Banque Populaire"
            />
            <TextField
              label="Nom complet (optionnel)"
              name="bankName"
              value={form.bankName}
              onChange={handleChange}
              placeholder="Ex: Banque Populaire du Maroc"
            />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                rows={3}
                placeholder="Description de l'offre..."
              />
            </div>
            <TextField
              label="Taux annuel (%) *"
              name="rate"
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={form.rate}
              onChange={handleChange}
              required
              placeholder="Ex: 4.5"
            />
            <TextField
              label="Durée maximale (années) *"
              name="durationYears"
              type="number"
              min="1"
              max="30"
              value={form.durationYears}
              onChange={handleChange}
              required
              placeholder="Ex: 25"
            />
            <TextField
              label="Montant maximum (dh) *"
              name="maxAmount"
              type="number"
              min="0"
              value={form.maxAmount}
              onChange={handleChange}
              required
              placeholder="Ex: 2000000"
            />
            <TextField
              label="Frais de dossier (dh)"
              name="fees"
              type="number"
              min="0"
              value={form.fees}
              onChange={handleChange}
              placeholder="Ex: 5000"
            />
            <TextField
              label="Email de contact"
              name="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={handleChange}
              placeholder="contact@banque.ma"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="partner"
                name="partner"
                checked={form.partner}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="partner" className="text-sm font-medium text-slate-700">
                Marquer comme partenaire
              </label>
            </div>
          </div>

          {createMutation.isError && (
            <Alert
              variant="error"
              title="Erreur"
              message={createMutation.error.message}
              className="mt-4"
            />
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setForm({
                  name: "",
                  bankName: "",
                  description: "",
                  rate: "",
                  durationYears: "",
                  maxAmount: "",
                  fees: "0",
                  contactEmail: "",
                  partner: false,
                });
              }}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isLoading} variant="primary">
              {createMutation.isLoading ? "Création..." : "Créer l'offre"}
            </Button>
          </div>
        </form>
      )}

      {/* Liste des offres existantes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Offres bancaires ({offers.length})
        </h3>

        {offersQuery.isLoading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : offersQuery.isError ? (
          <Alert
            variant="error"
            title="Erreur"
            message={offersQuery.error.message}
          />
        ) : offers.length > 0 ? (
          <div className="space-y-3">
            {offers.map((offer) => (
              <div
                key={offer._id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900">
                      {offer.bankName || offer.name}
                    </h4>
                    {offer.partner && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        <i className="ri-verified-badge-line" />
                        Partenaire
                      </span>
                    )}
                  </div>
                  {offer.description && (
                    <p className="mt-1 text-xs text-slate-500">{offer.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span>
                      <span className="font-medium">Taux :</span> {offer.rate?.toFixed(2)}%
                    </span>
                    <span>
                      <span className="font-medium">Durée :</span> {offer.durationYears} ans
                    </span>
                    <span>
                      <span className="font-medium">Montant max :</span>{" "}
                      {offer.maxAmount?.toLocaleString("fr-FR")} dh
                    </span>
                    {offer.fees > 0 && (
                      <span>
                        <span className="font-medium">Frais :</span>{" "}
                        {offer.fees?.toLocaleString("fr-FR")} dh
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <i className="ri-bank-line text-4xl text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-600 mb-1">Aucune offre bancaire</p>
            <p className="text-xs text-slate-500">
              Cliquez sur "Ajouter une banque" pour créer votre première offre.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

