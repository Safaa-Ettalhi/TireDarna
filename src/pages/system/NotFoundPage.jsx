import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export default function NotFoundPage() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-500">Erreur 404</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900">Page introuvable</h1>
        <p className="mt-4 text-slate-600">
          La page que vous cherchez n’existe pas ou a été déplacée. Vérifiez l’adresse ou revenez à
          l’accueil.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">Retour à l’accueil</Link>
          </Button>
          <Link
            to="/support"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Contacter le support
          </Link>
        </div>
      </div>
    </section>
  );
}

