import { Link } from "react-router-dom";
import { useMemo } from "react";

const tips = [
  "Vérifiez votre connexion internet",
  "Suivez-nous sur les réseaux pour connaître la date de reprise",
  "Contactez le support si vous avez une opération urgente",
];

export default function MaintenancePage() {
  const quote = useMemo(
    () => tips[Math.floor(Math.random() * tips.length)],
 
    []
  );

  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-50 px-6 text-center">
      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">Maintenance</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900">Nous revenons très vite</h1>
        <p className="mt-4 text-slate-600">
          Nous déployons une mise à jour importante pour améliorer votre expérience. Certains services
          peuvent être temporairement indisponibles.
        </p>
        <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-left text-emerald-800">
          <p className="text-sm font-semibold uppercase text-emerald-600">
            Astuce du moment
          </p>
          <p className="mt-2 text-sm">{quote}</p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
          <Link
            to="/"
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Retourner à l’accueil
          </Link>
          <Link
            to="/support"
            className="rounded-full border border-emerald-500 bg-emerald-500/10 px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Contacter le support
          </Link>
        </div>
      </div>
    </section>
  );
}

