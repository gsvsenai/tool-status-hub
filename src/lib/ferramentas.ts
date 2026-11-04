const API_URL = "https://sk3000-api.onrender.com/api";
const TOKEN = "sk3000.api";

export async function buscarFerramentas() {
  try {
    const response = await fetch(`${API_URL}/ferramentas/status`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao comunicar com a API:", error);
    throw error;
  }
}
