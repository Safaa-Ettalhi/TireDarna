import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createTirelireGroup, suggestTirelirePlan } from "../../services/financingService";
import { useAuth } from "../../context/AuthContext";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export default function TirelirePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("propertyId");
  const propertyPrice = searchParams.get("price");

  const [form, setForm] = useState({
    name: "",
    amount: propertyPrice || "",
    frequency: "mensuel", 
    participants: "",
    description: "",
  });

  const suggestionMutation = useMutation({
    mutationFn: (payload) => suggestTirelirePlan(token, payload),
    onSuccess: (data) => {
      if (data?.suggestion?.suggestedAmount) {
        const suggested = data.suggestion;
        alert(
          `Suggestion: ${suggested.suggestedAmount?.toLocaleString("fr-FR")} dh par contribution, durée estimée: ${suggested.durationMonths || suggested.estimatedDuration} mois`
        );
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createTirelireGroup(token, payload),
    onSuccess: (data) => {
      alert(
        `Groupe "${form.name}" créé avec succès ! Vous pouvez maintenant le gérer depuis "Mes groupes".`
      );
      if (data?.group?.url) {
        window.open(data.group.url, "_blank");
      }
      navigate("/financing/tirelire/my-groups");
    },
    onError: (err) => {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Une erreur est survenue lors de la création du groupe.";
      
      console.error("Erreur création groupe Tirelire:", {
        error: err,
        message: errorMessage,
        response: err?.response?.data,
        status: err?.response?.status,
      });
      
      alert(`Erreur: ${errorMessage}\n\nVérifiez:\n- Que Tirelire est démarré\n- Que TIRELIRE_BASE_URL est configuré\n- Que votre token est valide`);
    },
  });

  function handleSuggest() {
    if (!form.amount || !form.participants) {
      alert("Veuillez renseigner le montant et le nombre de participants.");
      return;
    }

    suggestionMutation.mutate({
      amount: Number(form.amount),
      participants: Number(form.participants),
      durationMonths: form.frequency === "hebdomadaire" ? 12 : 24, 
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.name || !form.amount || !form.participants) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }


    createMutation.mutate({
      name: form.name,
      amount: Number(form.amount),
      frequency: form.frequency,
      participants: [], 
      description: form.description,
      propertyId: propertyId || undefined,
    });
  }

  const suggestion = suggestionMutation.data?.suggestion;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Créer un groupe d'épargne collective</h2>
        <p className="mt-1 text-sm text-slate-500">
          Organisez un groupe 9or3a (tontine) pour financer collectivement l'achat d'un bien
          immobilier.
        </p>
        {propertyId && (
          <p className="mt-2 text-xs text-emerald-600">
            Ce groupe sera associé à une annonce spécifique.
          </p>
        )}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Nom du groupe"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex: Groupe épargne Maison Casablanca"
          required
        />

        <TextField
          label="Montant total à collecter (dh)"
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />

        <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Fréquence de contribution</span>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
          >
            <option value="hebdomadaire">Hebdomadaire</option>
            <option value="mensuel">Mensuelle</option>
          </select>
        </label>

        <TextField
          label="Nombre de participants"
          type="number"
          min="2"
          max="20"
          value={form.participants}
          onChange={(e) => setForm({ ...form, participants: e.target.value })}
          required
        />

        <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Description (optionnel)</span>
          <textarea
            className="min-h-[100px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Décrivez l'objectif du groupe..."
          />
        </label>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSuggest}
            disabled={suggestionMutation.isLoading}
          >
            {suggestionMutation.isLoading ? "Calcul..." : "Suggérer un plan"}
          </Button>
          <Button type="submit" disabled={createMutation.isLoading}>
            {createMutation.isLoading ? "Création..." : "Créer le groupe"}
          </Button>
        </div>

        {suggestionMutation.data?.suggestion && (
          <Alert
            variant="success"
            title="Suggestion de plan"
            message={`Montant par contribution: ${suggestionMutation.data.suggestion.monthlyContribution?.toLocaleString("fr-FR") || suggestionMutation.data.suggestion.suggestedAmount?.toLocaleString("fr-FR")} dh | Durée estimée: ${suggestionMutation.data.suggestion.durationMonths || suggestionMutation.data.suggestion.estimatedDuration} mois`}
          />
        )}

        {createMutation.isError && (
          <Alert
            variant="error"
            title="Erreur de création"
            message={
              <div className="space-y-2">
                <p className="font-medium">{createMutation.error.message}</p>
                {createMutation.error.response?.data?.details && (
                  <div className="mt-2 rounded bg-red-100 p-2 text-xs">
                    <p className="font-semibold">Détails supplémentaires:</p>
                    <pre className="mt-1 overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(createMutation.error.response.data.details, null, 2)}
                    </pre>
                  </div>
                )}
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer font-medium text-red-800">
                    Détails techniques complets
                  </summary>
                  <pre className="mt-2 max-h-60 overflow-auto rounded bg-slate-100 p-2 text-xs">
                    {JSON.stringify(
                      {
                        message: createMutation.error.message,
                        status: createMutation.error.response?.status,
                        statusText: createMutation.error.response?.statusText,
                        data: createMutation.error.response?.data,
                      },
                      null,
                      2
                    )}
                  </pre>
                </details>
              </div>
            }
          />
        )}
      </form>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800 mb-2">Comment ça marche ?</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Créez un groupe avec vos proches ou partenaires</li>
          <li>Chaque participant contribue régulièrement selon la fréquence choisie</li>
          <li>Le montant collecté servira à financer l'achat du bien immobilier</li>
          <li>Vous serez redirigé vers Tirelire pour gérer les contributions et paiements</li>
        </ul>
      </div>
    </div>
  );
}

