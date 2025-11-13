import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { register } from "../../services/authService";
import { AuthLayout } from "../../layouts/AuthLayout";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  accountType: "particulier",
  companyName: "",
  companySiret: "",
  companyStreet: "",
  companyCity: "",
  companyPostalCode: "",
  companyCountry: "Maroc",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [localError, setLocalError] = useState("");

  const mutation = useMutation({
    mutationFn: register,
    onSuccess() {
      navigate("/login", { state: { registered: true } });
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");

    if (form.accountType === "entreprise") {
      if (!form.companyName.trim() || form.companyName.trim().length < 2) {
        setLocalError("Veuillez renseigner le nom de l'entreprise (au moins 2 caractères).");
        return;
      }
      if (form.companySiret.trim() && !/^\d{14}$/.test(form.companySiret.trim())) {
        setLocalError("Le SIRET doit contenir 14 chiffres (ou laissez vide).");
        return;
      }
      if (form.companyPostalCode.trim() && !/^\d{5}$/.test(form.companyPostalCode.trim())) {
        setLocalError("Le code postal doit contenir 5 chiffres (ou laissez vide).");
        return;
      }
    }

    let formattedPhone = form.phone.trim();

    if (formattedPhone.startsWith("0")) {
      formattedPhone = `+212${formattedPhone.slice(1)}`;
    }

    if (formattedPhone && !formattedPhone.startsWith("+")) {
      formattedPhone = `+${formattedPhone}`;
    }

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      accountType: form.accountType,
      phone: formattedPhone || undefined,
    };

    if (form.accountType === "entreprise") {
      const companyInfo = {};
      if (form.companyName.trim()) companyInfo.companyName = form.companyName.trim();
      if (form.companySiret.trim()) companyInfo.siret = form.companySiret.trim();

      const address = {};
      if (form.companyStreet.trim()) address.street = form.companyStreet.trim();
      if (form.companyCity.trim()) address.city = form.companyCity.trim();
      if (form.companyPostalCode.trim()) address.postalCode = form.companyPostalCode.trim();
      if (form.companyCountry.trim()) address.country = form.companyCountry.trim();

      if (Object.keys(address).length > 0) {
        companyInfo.address = address;
      }

      if (Object.keys(companyInfo).length > 0) {
        payload.companyInfo = companyInfo;
      }
    }

    mutation.mutate(payload);
  }

  return (
    <AuthLayout title="Créer un compte">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <TextField
            label="Prénom"
            name="firstName"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
          />
          <TextField
            label="Nom"
            name="lastName"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
          />
        </div>
        <TextField
          label="Adresse email"
          type="email"
          name="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <TextField
          label="Téléphone (optionnel)"
          name="phone"
          placeholder="+212612345678"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <p className="text-xs text-slate-400">
          Format international recommandé (ex : +212612345678). Les zéros initiaux seront convertis automatiquement.
        </p>
        <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
          <span>Type de compte</span>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            value={form.accountType}
            onChange={(e) => setForm({ ...form, accountType: e.target.value })}
            required
          >
            <option value="particulier">Particulier</option>
            <option value="entreprise">Entreprise</option>
          </select>
        </label>
        {form.accountType === "entreprise" && (
          <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Informations entreprise
            </p>
            <TextField
              label="Nom de l'entreprise"
              name="companyName"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required={form.accountType === "entreprise"}
            />
            <TextField
              label="SIRET"
              name="companySiret"
              placeholder="14 chiffres"
              value={form.companySiret}
              onChange={(e) => setForm({ ...form, companySiret: e.target.value })}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <TextField
                label="Rue"
                name="companyStreet"
                value={form.companyStreet}
                onChange={(e) => setForm({ ...form, companyStreet: e.target.value })}
              />
              <TextField
                label="Ville"
                name="companyCity"
                value={form.companyCity}
                onChange={(e) => setForm({ ...form, companyCity: e.target.value })}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextField
                label="Code postal"
                name="companyPostalCode"
                value={form.companyPostalCode}
                onChange={(e) => setForm({ ...form, companyPostalCode: e.target.value })}
              />
              <TextField
                label="Pays"
                name="companyCountry"
                value={form.companyCountry}
                onChange={(e) => setForm({ ...form, companyCountry: e.target.value })}
              />
            </div>
          </div>
        )}
        <TextField
          label="Mot de passe"
          type="password"
          name="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <Button type="submit" disabled={mutation.isLoading}>
          {mutation.isLoading ? "Création du compte..." : "Je m’inscris"}
        </Button>
      </form>

      {localError && <Alert variant="error" title="Informations manquantes" message={localError} />}
      {mutation.isError && (
        <Alert variant="error" title="Inscription impossible" message={mutation.error.message} />
      )}

      <div className="text-center text-xs text-slate-500">
        <p>
          Déjà inscrit ?{" "}
          <Link to="/login" className="text-emerald-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

