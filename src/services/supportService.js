import { apiFetch } from "../lib/apiClient";

export function submitSupportTicket(data, token) {
  return apiFetch("/api/support/tickets", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function getMyTickets(token) {
  return apiFetch("/api/support/tickets", {
    method: "GET",
    token,
  });
}

export function getAdminTickets(token, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`/api/support/admin/tickets${suffix}`, {
    method: "GET",
    token,
  });
}

export function updateSupportTicket(token, ticketId, payload) {
  return apiFetch(`/api/support/admin/tickets/${ticketId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

