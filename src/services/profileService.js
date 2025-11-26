import { apiFetch } from "../lib/apiClient";

export function updateProfile(token, payload) {
  return apiFetch("/api/profile", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateCompanyInfo(token, payload) {
  return apiFetch("/api/profile/company", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

