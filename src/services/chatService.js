import { apiFetch } from "../lib/apiClient";

export function getChatThreads(token) {
  return apiFetch("/api/chat/threads", {
    method: "GET",
    token,
  });
}

export function getChatThread(token, threadId) {
  return apiFetch(`/api/chat/threads/${threadId}`, {
    method: "GET",
    token,
  });
}

export function getChatMessages(token, threadId, params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", params.limit);
  if (params.before) query.set("before", params.before);

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return apiFetch(`/api/chat/threads/${threadId}/messages${suffix}`, {
    method: "GET",
    token,
  });
}

export function sendChatMessage(token, threadId, message) {
  return apiFetch(`/api/chat/threads/${threadId}/messages`, {
    method: "POST",
    token,
    body: JSON.stringify({ message }),
  });
}

export function markChatMessageRead(token, messageId) {
  return apiFetch(`/api/chat/messages/${messageId}/read`, {
    method: "PATCH",
    token,
  });
}

