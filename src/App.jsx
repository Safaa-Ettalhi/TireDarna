import 'remixicon/fonts/remixicon.css';
function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-semibold tracking-tight text-slate-900">
            Darna Platform
          </span>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              Socle technique
            </span>
            <span className="text-xs uppercase tracking-wide text-emerald-600">
              React + Vite + Tailwind CSS
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[260px,1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Structure actuelle
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
              <span>
                Vite + React configurés en mode ESM, Tailwind CSS 3 prêt à l’emploi.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
              <span>
                Styles globaux Tailwind via <code className="text-xs font-semibold text-slate-500">src/index.css</code>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
              <span>
                Composant <code className="text-xs font-semibold text-slate-500">App.jsx</code> prêt pour accueillir le routing et les layouts.
              </span>
            </li>
          </ul>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Front Darna — socle technique
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Cette base React fournit le point de départ pour construire l’interface complète de la plateforme Darna. Les prochaines étapes consisteront à ajouter :
          </p>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="font-semibold text-slate-500">1.</span>
              <span>Routing et state global (authentification, sockets, requêtes API).</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-slate-500">2.</span>
              <span>Composants UI (forms, cartes, navigation) et intégration Tailwind.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-slate-500">3.</span>
              <span>Pages métier : recherche annonces, chat, finance, Daret, admin.</span>
            </li>
          </ol>

          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <p>
               Le socle technique est prêt. Indique-moi quel module prioriser (auth, recherche annonces, etc.) et je poursuis la mise en place.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
