import { apiFetch } from "../lib/apiClient";
import { ENV } from "../config/env";

export function searchProperties(token, params = {}) {
  const cleanParams = {};
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== "" && value !== null && value !== undefined) {
      if (Array.isArray(value) && value.length > 0) {
        cleanParams[key] = value.join(",");
      } else if (!Array.isArray(value)) {
        cleanParams[key] = value;
      }
    }
  });
  const query = new URLSearchParams(cleanParams).toString();
  return apiFetch(`/api/properties/search?${query}`, {
    method: "GET",
    token,
  });
}

export function createProperty(token, payload) {
  return apiFetch("/api/properties", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateProperty(token, propertyId, payload) {
  return apiFetch(`/api/properties/${propertyId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteProperty(token, propertyId) {
  return apiFetch(`/api/properties/${propertyId}`, {
    method: "DELETE",
    token,
  });
}

export function removePropertyMedia(token, propertyId, mediaId) {
  return apiFetch(`/api/properties/${propertyId}/media/${mediaId}`, {
    method: "DELETE",
    token,
  });
}

export function getProperty(token, propertyId) {
  return apiFetch(`/api/properties/${propertyId}`, {
    method: "GET",
    token,
  });
}

export function uploadPropertyMedia(token, propertyId, files) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  return fetch(`${ENV.API_URL}/api/properties/${propertyId}/media`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  }).then(async (response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Erreur lors de l'envoi des médias");
    }
    return data;
  });
}

