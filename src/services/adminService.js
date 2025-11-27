import { apiFetch } from "../lib/apiClient";

export function getAdminOverview(token) {
  return apiFetch("/api/admin/overview", {
    method: "GET",
    token,
  });
}

export function getPendingProperties(token) {
  return apiFetch("/api/admin/properties/pending", {
    method: "GET",
    token,
  });
}

export function updatePropertyStatus(token, propertyId, payload) {
  return apiFetch(`/api/admin/properties/${propertyId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function getAdminLeads(token) {
  return apiFetch("/api/admin/leads", {
    method: "GET",
    token,
  });
}

export function getKycRequests(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  const suffix = query ? `?${query}` : "";
  return apiFetch(`/api/admin/kyc/requests${suffix}`, {
    method: "GET",
    token,
  });
}

export function updateKycStatus(token, userId, payload) {
  return apiFetch(`/api/admin/kyc/${userId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function updatePlanSettings(token, planId, payload) {
  return apiFetch(`/api/admin/plans/${planId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function resetPlansToDefault(token) {
  return apiFetch("/api/subscriptions/init-plans", {
    method: "POST",
    token,
  });
}

