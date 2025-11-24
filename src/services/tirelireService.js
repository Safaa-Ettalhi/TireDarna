let TIRELIRE_API_URL = import.meta.env.VITE_TIRELIRE_API_URL;

if (!TIRELIRE_API_URL || typeof TIRELIRE_API_URL !== 'string') {
  console.warn('VITE_TIRELIRE_API_URL non configuré, utilisation de la valeur par défaut');
  TIRELIRE_API_URL = "http://localhost:4000"; 
} else {
  TIRELIRE_API_URL = TIRELIRE_API_URL.trim();
  
  if (!TIRELIRE_API_URL.startsWith('http://') && !TIRELIRE_API_URL.startsWith('https://')) {
    console.error(' VITE_TIRELIRE_API_URL invalide (doit commencer par http:// ou https://):', TIRELIRE_API_URL);
    console.warn(' Utilisation de la valeur par défaut: http://localhost:4000');
    TIRELIRE_API_URL = "http://localhost:4000";
  }
}

console.log(' URL Tirelire configurée:', TIRELIRE_API_URL);

function getTirelireHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function getTirelireAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function getTirelireGroups(token) {
  return fetch(`${TIRELIRE_API_URL}/api/groups`, {
    method: "GET",
    headers: getTirelireHeaders(token),
    mode: 'cors', 
  }).catch((fetchError) => {
    
    console.error(' Erreur de connexion à Tirelire:', fetchError);
    throw new Error(
      `Impossible de se connecter à Tirelire. Vérifiez que:\n` +
      `- Le serveur Tirelire est démarré (cd tirelire && npm start)\n` +
      `- L'URL est correcte: ${TIRELIRE_API_URL}\n` +
      `- Le port ${TIRELIRE_API_URL.split(':').pop()} est accessible\n` +
      `- CORS est configuré dans Tirelire`
    );
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que:\n` +
        `- Tirelire est démarré sur ${TIRELIRE_API_URL}\n` +
        `- L'endpoint /api/groups existe\n` +
        `- VITE_TIRELIRE_API_URL est correctement configuré`
      );
    }
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function getAllAvailableTirelireGroups(token) {
  return fetch(`${TIRELIRE_API_URL}/api/groups/available`, {
    method: "GET",
    headers: getTirelireHeaders(token),
    mode: 'cors',
  }).catch((fetchError) => {
    console.error(' Erreur de connexion à Tirelire:', fetchError);
    throw new Error(
      `Impossible de se connecter à Tirelire. Vérifiez que:\n` +
      `- Le serveur Tirelire est démarré (cd tirelire && npm start)\n` +
      `- L'URL est correcte: ${TIRELIRE_API_URL}\n` +
      `- Le port ${TIRELIRE_API_URL.split(':').pop()} est accessible\n` +
      `- CORS est configuré dans Tirelire`
    );
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré et accessible.`
      );
    }
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function getTirelireGroupDetails(token, groupId) {
  return fetch(`${TIRELIRE_API_URL}/api/groups/${groupId}`, {
    method: "GET",
    headers: getTirelireHeaders(token),
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré et accessible.`
      );
    }
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function joinTirelireGroup(token, groupId) {
  return fetch(`${TIRELIRE_API_URL}/api/groups/${groupId}/join`, {
    method: "POST",
    headers: getTirelireHeaders(token),
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré.`
      );
    }
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function createTirelireContribution(token, payload) {
  return fetch(`${TIRELIRE_API_URL}/api/contributions`, {
    method: "POST",
    headers: getTirelireHeaders(token),
    body: JSON.stringify(payload),
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré.`
      );
    }
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function payTirelireContribution(token, payload) {
  return fetch(`${TIRELIRE_API_URL}/api/contributions/pay`, {
    method: "POST",
    headers: getTirelireHeaders(token),
    body: JSON.stringify(payload),
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré.`
      );
    }
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function getTirelireGroupContributions(token, groupId) {
  return fetch(`${TIRELIRE_API_URL}/api/contributions/group/${groupId}`, {
    method: "GET",
    headers: getTirelireHeaders(token),
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré.`
      );
    }
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function getTirelireGroupDistributions(token, groupId) {
  return fetch(`${TIRELIRE_API_URL}/api/contributions/group/${groupId}/distributions`, {
    method: "GET",
    headers: getTirelireHeaders(token),
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré.`
      );
    }
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function getTirelireGroupMessages(token, groupId) {
  return fetch(`${TIRELIRE_API_URL}/api/messages/${groupId}`, {
    method: "GET",
    headers: getTirelireHeaders(token),
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Réponse non-JSON lors du chargement des messages Tirelire:", text.substring(0, 200));
      throw new Error("Réponse invalide de Tirelire lors du chargement des messages.");
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function sendTirelireGroupMessage(token, { groupId, content, audioFile }) {
  const formData = new FormData();
  formData.append("groupId", groupId);
  if (audioFile) {
    formData.append("audio", audioFile);
  }
  if (content && content.trim()) {
    formData.append("content", content.trim());
  }

  return fetch(`${TIRELIRE_API_URL}/api/messages`, {
    method: "POST",
    headers: getTirelireAuthHeaders(token),
    mode: "cors",
    body: formData,
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Réponse non-JSON lors de l'envoi d'un message Tirelire:", text.substring(0, 200));
      throw new Error("Réponse invalide de Tirelire lors de l'envoi du message.");
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function buildTirelireAssetUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${TIRELIRE_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function getTirelireAudioBlobUrl(token, messageId) {
  if (!token || !messageId) return null;
  
  try {
    const url = `${TIRELIRE_API_URL}/api/messages/audio/${messageId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      mode: 'cors',
    });
    
    if (!response.ok) {
      console.error(`Erreur lors de la récupération de l'audio: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'audio:", error);
    return null;
  }
}

export { TIRELIRE_API_URL as TIRELIRE_BASE_URL };

export function cancelTirelireContribution(token, contributionId) {
  return fetch(`${TIRELIRE_API_URL}/api/contributions/${contributionId}/cancel`, {
    method: "POST",
    headers: getTirelireHeaders(token),
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré.`
      );
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function cancelTirelireContributionBySession(token, sessionId) {
  return fetch(`${TIRELIRE_API_URL}/api/contributions/session/${sessionId}/cancel`, {
    method: "POST",
    headers: getTirelireHeaders(token),
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré.`
      );
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function checkStripeSessionStatus(token, sessionId) {
  return fetch(`${TIRELIRE_API_URL}/api/contributions/stripe-session/${sessionId}`, {
    method: "GET",
    headers: getTirelireHeaders(token),
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré.`
      );
    }
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

// Fonctions pour les tickets
export function getTirelireGroupTickets(token, groupId) {
  return fetch(`${TIRELIRE_API_URL}/api/tickets/group/${groupId}`, {
    method: "GET",
    headers: getTirelireHeaders(token),
    mode: 'cors',
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré.`
      );
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function createTirelireTicket(token, { groupId, subject, description }) {
  return fetch(`${TIRELIRE_API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      ...getTirelireHeaders(token),
      "Content-Type": "application/json",
    },
    mode: 'cors',
    body: JSON.stringify({
      group: groupId,
      subject,
      description,
    }),
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("❌ Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré.`
      );
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

export function getTirelireTicket(token, ticketId) {
  return fetch(`${TIRELIRE_API_URL}/api/tickets/${ticketId}`, {
    method: "GET",
    headers: getTirelireHeaders(token),
    mode: 'cors',
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré.`
      );
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}

// Fonction pour envoyer un rappel de contribution
export function sendTirelireContributionReminder(token, groupId) {
  return fetch(`${TIRELIRE_API_URL}/api/contributions/group/${groupId}/reminder`, {
    method: "POST",
    headers: getTirelireHeaders(token),
    mode: 'cors',
  }).then(async (res) => {
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(" Réponse non-JSON de Tirelire:", text.substring(0, 200));
      throw new Error(
        `Le serveur Tirelire a retourné une réponse invalide. Vérifiez que Tirelire est démarré.`
      );
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
    }
    return data;
  });
}
