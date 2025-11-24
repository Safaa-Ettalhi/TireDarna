import { apiFetch } from "../lib/apiClient";

export function listBankOffers(token) {
  return apiFetch("/api/financing/offers", {
    method: "GET",
    // Le token est optionnel pour cette route (pas d'auth requise)
    ...(token ? { token } : {}),
  });
}

export function simulateLoan(token, payload) {
  return apiFetch("/api/financing/simulate", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function listSimulations(token) {
  return apiFetch("/api/financing/simulate/history", {
    method: "GET",
    token,
  });
}

export function suggestTirelirePlan(token, payload) {
  return apiFetch("/api/financing/simulate/tirelire", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function createTirelireGroup(token, payload) {
  return apiFetch("/api/financing/simulate/tirelire/create-group", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

// Fonction pour créer une offre bancaire (admin uniquement)
export function createBankOffer(token, payload) {
  return apiFetch("/api/financing/offers", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

