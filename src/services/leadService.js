import { apiFetch } from "../lib/apiClient";

export function createLead(token, propertyId, message = "") {
  return apiFetch(`/api/properties/${propertyId}/leads`, {
    method: "POST",
    token,
    body: JSON.stringify({ message }),
  });
}

