import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { getCookiePreferences, saveCookiePreferences } from "../../components/system/CookieConsentBanner.jsx";

const DEFAULT_PREFS = {
  necessary: true,
  analytics: false,
  marketing: false,
  updatedAt: null,
};

export default function CookiesPage() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [savedAt, setSavedAt] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = getCookiePreferences();
    if (stored) {
      setPrefs({ ...DEFAULT_PREFS, ...stored });
      setSavedAt(stored.updatedAt);
    }
  }, []);

  const handleToggle = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    const stored = saveCookiePreferences(prefs);
    setPrefs(stored);
    setSavedAt(stored.updatedAt);
    setSaved(true);
  };

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        <span aria-hidden="true">←</span> Retour au tableau de bord
      </Link>
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-500">RGPD & cookies</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Gérer mes préférences</h1>
        <p className="mt-2 text-sm text-slate-600">
          Les cookies essentiels restent activés pour garantir la sécurité et le fonctionnement de Darna. Vous pouvez
          choisir si nous pouvons mesurer l’audience ou personnaliser les contenus.
        </p>
        {savedAt && (
          <p className="mt-3 text-xs text-slate-500">Dernière mise à jour : {new Date(savedAt).toLocaleString()}</p>
        )}
      </header>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <CookieToggle
          label="Essentiels"
          description="Connexion, sécurité, sauvegarde des formulaires. Toujours actifs et indispensables."
          checked
          disabled
        />
        <CookieToggle
          label="Mesure d’audience"
          description="Nous aide à comprendre l’usage de Darna pour améliorer les performances."
          checked={prefs.analytics}
          onChange={() => handleToggle("analytics")}
        />
        <CookieToggle
          label="Personnalisation & marketing"
          description="Active les badges, recommandations personnalisées et communications ciblées."
          checked={prefs.marketing}
          onChange={() => handleToggle("marketing")}
        />

        {saved && (
          <p className="text-sm font-semibold text-emerald-600">
            Préférences enregistrées. Vous pouvez les modifier à tout moment.
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setPrefs(DEFAULT_PREFS)}>
            Réinitialiser
          </Button>
          <Button onClick={handleSave}>Enregistrer mes choix</Button>
        </div>
      </div>
    </section>
  );
}

function CookieToggle({ label, description, checked, onChange, disabled }) {
  return (
    <label className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </label>
  );
}

