export interface Ferramenta {
  id: number;
  nome: string;
  status: boolean | null;
  last_update: string | null;
  last_user: number | null;
}

export const SUPABASE_PROJECT_URL = "https://ogfkwgrholtagdqvpykj.supabase.co";
export const SUPABASE_BASE_URL = `${SUPABASE_PROJECT_URL}/rest/v1/Ferramentas`;

export const SUPABASE_KEY =
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
