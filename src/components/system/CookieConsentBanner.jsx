import { useEffect, useState } from "react";

const STORAGE_KEY = "darna_cookie_consent";

const DEFAULT_PREFS = {
  necessary: true,
  analytics: false,
  marketing: false,
  updatedAt: null,
};

export function getCookiePreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCookiePreferences(prefs) {
  const payload = { ...DEFAULT_PREFS, ...prefs, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getCookiePreferences();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    saveCookiePreferences({ analytics: true, marketing: true });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Nous respectons votre vie privée</p>
            <p className="mt-1 text-sm text-slate-600">
              Nous utilisons des cookies pour assurer le bon fonctionnement de la plateforme, mesurer l’audience et
              personnaliser votre expérience. Vous pouvez modifier vos préférences quand vous le souhaitez.
            </p>
            <a href="/legal/cookies" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
              En savoir plus / gérer mes préférences
            </a>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <button
              onClick={handleAccept}
              className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Tout accepter
            </button>
            <a
              href="/legal/cookies"
              onClick={() => setVisible(false)}
              className="w-full rounded-full border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:border-slate-400"
            >
              Personnaliser
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

