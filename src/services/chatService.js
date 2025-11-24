import { apiFetch } from "../lib/apiClient";
import { ENV } from "../config/env";

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

export function uploadChatAttachment(token, threadId, file) {
  const formData = new FormData();
  formData.append("file", file);

  return fetch(`${ENV.API_URL}/api/chat/threads/${threadId}/attachments`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  }).then(async (response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Impossible d'envoyer la pièce jointe");
    }
    return data;
  });
}

export function deleteChatThread(token, threadId) {
  return apiFetch(`/api/chat/threads/${threadId}`, {
    method: "DELETE",
    token,
  });
}

