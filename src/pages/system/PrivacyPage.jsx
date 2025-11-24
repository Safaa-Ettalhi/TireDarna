import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";

const STORAGE_KEY = "darna_cookie_preferences";

const defaultPrefs = {
  analytics: false,
  marketing: false,
};

export default function PrivacyPage() {
  const [preferences, setPreferences] = useState(defaultPrefs);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPreferences({ ...defaultPrefs, ...JSON.parse(raw) });
      }
    } catch {
      // ignore
    }
  }, []);

  function handleToggle(key) {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    setSaved(true);
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">
          RGPD & Cookies
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Votre vie privée, vos choix</h1>
        <p className="mt-3 text-slate-600">
          Nous utilisons des cookies pour assurer le bon fonctionnement de Darna, mesurer l’usage et
          améliorer nos services. Ajustez vos préférences à tout moment.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase text-slate-400">Essentiel</p>
          <p className="mt-2 text-slate-700">
            Nécessaires pour sécuriser vos sessions, garder vos favoris et mémoriser votre connexion.
          </p>
          <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Toujours actifs
          </span>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-slate-400">Mesure d’audience</p>
              <p className="mt-2 text-slate-700 text-sm">
                Pour comprendre quelles pages sont consultées et améliorer l’expérience.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={preferences.analytics}
                onChange={() => handleToggle("analytics")}
              />
              <div className="peer h-5 w-10 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"></div>
            </label>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-slate-400">Marketing</p>
              <p className="mt-2 text-slate-700 text-sm">
                Pour personnaliser les offres, mesurer l’impact de nos campagnes et vous proposer des contenus adaptés.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={preferences.marketing}
                onChange={() => handleToggle("marketing")}
              />
              <div className="peer h-5 w-10 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-emerald-500 peer-checked:after:translate-x-5"></div>
            </label>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-sm leading-relaxed text-slate-600">
        <h2 className="text-base font-semibold text-slate-900">Vos droits</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Accéder à vos données et demander leur portabilité</li>
          <li>Rectifier ou supprimer vos informations personnelles</li>
          <li>Retirer votre consentement à tout moment</li>
          <li>Nous écrire à privacy@darna.com pour toute question RGPD</li>
        </ul>
      </section>

      <div className="flex flex-wrap justify-between gap-3">
        <Button variant="secondary" onClick={() => setPreferences(defaultPrefs)}>
          Réinitialiser
        </Button>
        <div className="space-x-3">
          {saved && <span className="text-sm font-semibold text-emerald-600">Préférences enregistrées</span>}
          <Button onClick={handleSave}>Enregistrer mes choix</Button>
        </div>
      </div>
    </section>
  );
}

