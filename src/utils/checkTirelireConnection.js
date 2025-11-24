const TIRELIRE_API_URL = import.meta.env.VITE_TIRELIRE_API_URL || "http://localhost:4000";

export async function checkTirelireConnection() {
  try {
    const response = await fetch(`${TIRELIRE_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "test" }),
    });
    
    const contentType = response.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
      return {
        connected: false,
        error: "Le serveur Tirelire retourne du HTML au lieu de JSON. Vérifiez qu'il est démarré.",
        url: TIRELIRE_API_URL,
      };
    }
    
    return {
      connected: true,
      url: TIRELIRE_API_URL,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      url: TIRELIRE_API_URL,
    };
  }
}

