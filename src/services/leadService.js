import { apiFetch } from "../lib/apiClient";

export function createLead(token, propertyId, message = "") {
  return apiFetch(`/api/properties/${propertyId}/leads`, {
    method: "POST",
    token,
    body: JSON.stringify({ message }),
  });
}

export function getBuyerLeads(token) {
  return apiFetch("/api/leads/me/buyer", {
    method: "GET",
    token,
  });
}

export function getOwnerLeads(token) {
  return apiFetch("/api/leads/me/owner", {
    method: "GET",
    token,
  });
}

export function updateLeadStatus(token, leadId, status) {
  return apiFetch(`/api/leads/${leadId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status }),
  });
}

