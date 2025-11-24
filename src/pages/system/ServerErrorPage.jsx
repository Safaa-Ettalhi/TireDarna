import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export default function ServerErrorPage() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6 text-center text-slate-100">
      <div className="max-w-xl rounded-3xl border border-slate-700 bg-slate-800/70 p-10 shadow-2xl backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Erreur 500</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Un problème est survenu</h1>
        <p className="mt-4 text-slate-300">
          Nos serveurs rencontrent des difficultés temporaires. Nous travaillons activement pour
          rétablir le service dans les plus brefs délais.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="secondary">
            <Link to="/">Retour au tableau de bord</Link>
          </Button>
          <Button asChild>
            <Link to="/support">Contacter l’assistance</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

