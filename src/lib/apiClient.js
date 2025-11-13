import { ENV } from "../config/env";

export async function apiFetch(path, options = {}) {
  const { token, ...rest } = options;

  const response = await fetch(`${ENV.API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers || {}),
    },
    ...rest,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = data?.message || response.statusText;
    throw new Error(message);
  }

  return data;
}

