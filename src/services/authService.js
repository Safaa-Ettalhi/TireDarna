import { apiFetch } from "../lib/apiClient";

export function login(payload) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function requestPasswordReset(payload) {
  return apiFetch("/api/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resetPassword({ token, newPassword }) {
  return apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token,
      newPassword,
      confirmPassword: newPassword,
    }),
  });
}

export function verifyEmail(token) {
  return apiFetch(`/api/auth/verify-email?token=${token}`, {
    method: "GET",
  });
}

export function fetchProfile(token) {
  return apiFetch("/api/auth/profile", {
    method: "GET",
    token,
  });
}

// Gestion des membres d'équipe (entreprises)
export function addTeamMember(token, { companyId, memberUserId, memberEmail }) {
  return apiFetch("/api/auth/add-member", {
    method: "POST",
    token,
    body: JSON.stringify({ companyId, memberUserId, memberEmail }),
  });
}

export function removeTeamMember(token, { companyId, memberUserId }) {
  return apiFetch("/api/auth/remove-member", {
    method: "POST",
    token,
    body: JSON.stringify({ companyId, memberUserId }),
  });
}

