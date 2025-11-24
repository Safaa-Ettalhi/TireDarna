import { apiFetch } from "../lib/apiClient";

export function listPlans() {
  return apiFetch("/api/subscriptions/plans", {
    method: "GET",
  });
}

export function getMySubscription(token) {
  return apiFetch("/api/subscriptions/my-subscription", {
    method: "GET",
    token,
  });
}

export function subscribeToPlan(token, planId) {
  return apiFetch("/api/subscriptions/subscribe", {
    method: "POST",
    token,
    body: JSON.stringify({ planId }),
  });
}

export function cancelSubscription(token) {
  return apiFetch("/api/subscriptions/cancel", {
    method: "DELETE",
    token,
  });
}

export function createStripeSubscriptionSession(token, planId) {
  return apiFetch("/api/subscriptions/stripe-session", {
    method: "POST",
    token,
    body: JSON.stringify({ planId }),
  });
}

