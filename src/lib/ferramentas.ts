export interface Ferramenta {
  id: number;
  nome: string;
  status: boolean | null;
  last_update: string | null;
  last_user: number | null;
}

const SUPABASE_BASE_URL =
  "https://ogfkwgrholtagdqvpykj.supabase.co/rest/v1/Ferramentas";
// Chave anon pública (a mesma usada no ESP32) — somente leitura aqui.
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nZmt3Z3Job2x0YWdkcXZweWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjQ4NTMsImV4cCI6MjEwNDY0MDg1M30.gnq60ev67wgkLpwg1oVJH-HisMI8uJXNqxHKp8wQkW4";

export async function fetchFerramentas(): Promise<Ferramenta[]> {
  const res = await fetch(
    `${SUPABASE_BASE_URL}?select=id,nome,status,last_update,last_user&order=nome.asc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    },
  );
  if (!res.ok) {
    throw new Error(`Erro ao buscar ferramentas (HTTP ${res.status})`);
  }
  return res.json();
}

export interface Esp32Status {
  id: number;
  last_ping: string | null;
}

const SUPABASE_STATUS_URL =
  "https://ogfkwgrholtagdqvpykj.supabase.co/rest/v1/esp32_status";

export async function fetchEsp32Status(): Promise<Esp32Status | null> {
  const res = await fetch(
    `${SUPABASE_STATUS_URL}?select=id,last_ping&id=eq.1&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    },
  );
  if (!res.ok) {
    throw new Error(`Erro ao buscar status do ESP32 (HTTP ${res.status})`);
  }
  const data: Esp32Status[] = await res.json();
  return data.length > 0 ? data[0] : null;
}
