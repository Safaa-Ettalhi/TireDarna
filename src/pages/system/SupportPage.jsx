import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";

const categories = [
  { id: "billing", label: "Facturation & abonnements" },
  { id: "properties", label: "Annonces & modération" },
  { id: "tirelire", label: "Tirelire & financement" },
  { id: "tech", label: "Problème technique" },
  { id: "other", label: "Autre" },
];

export default function SupportPage() {
  const [form, setForm] = useState({
    subject: "",
    category: "billing",
    message: "",
    email: "",
  });
  const [sent, setSent] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSent(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
   
    setSent(true);
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        <span aria-hidden="true">←</span> Retour au tableau de bord
      </Link>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">
          Assistance
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Nous sommes là pour vous aider</h1>
        <p className="mt-3 text-slate-600">
          Soumettez un ticket ou consultez nos ressources utiles pour résoudre vos problèmes.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Email de contact"
            name="email"
            type="email"
            placeholder="vous@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
          <TextField
            label="Sujet"
            name="subject"
            placeholder="Décrivez rapidement votre demande"
            value={form.subject}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Catégorie</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Conseil</p>
            <p className="mt-1">
              Plus vous partagez de détails (captures, URL, étapes), plus notre équipe peut répondre vite.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Message</label>
          <textarea
            name="message"
            rows={5}
            value={form.message}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Expliquez votre problème..."
            required
          />
        </div>

        {sent && (
          <p className="text-sm font-semibold text-emerald-600">
            Merci ! Votre demande a bien été envoyée. Nous revenons vers vous sous 24h ouvrées.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit">Envoyer la demande</Button>
        </div>
      </form>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-sm leading-relaxed text-slate-600">
        <h2 className="text-base font-semibold text-slate-900">Ressources utiles</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            <Link to="/legal/privacy" className="text-emerald-600 hover:text-emerald-800">
              Politique RGPD & cookies
            </Link>
          </li>
          <li>
            <Link to="/maintenance" className="text-emerald-600 hover:text-emerald-800">
              Statut de la plateforme
            </Link>
          </li>
          <li>
            <a href="mailto:support@darna.com" className="text-emerald-600 hover:text-emerald-800">
              support@darna.com
            </a>
          </li>
          <li>
            Hotline : <span className="font-semibold text-slate-900">+212 (0)5 22 00 00 00</span>
          </li>
        </ul>
      </section>
    </section>
  );
}

