export interface Usuario {
  id: number;
  nome: string;
}

export interface Ferramenta {
  id: number;
  nome: string;
  status: boolean | null;
  last_update: string | null;
  last_user: number | null;
  Usuarios?: Usuario | null;
}

const API_URL = "https://sk3000-api.onrender.com/api";
const TOKEN = "sk3000.api"; // Token configurado para a API

export async function fetchFerramentas(): Promise<Ferramenta[]> {
  const res = await fetch(`${API_URL}/ferramentas/status`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Erro ao buscar ferramentas (HTTP ${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : data.data || [];
}
