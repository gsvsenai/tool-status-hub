import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wrench, User, Clock, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { fetchFerramentas, type Ferramenta } from "@/lib/ferramentas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Kanban — Painel de Ferramentas" },
      {
        name: "description",
        content:
          "Painel em tempo real com o status das ferramentas: disponível ou em uso, último usuário e horário da alteração.",
      },
      { property: "og:title", content: "Smart Kanban — Painel de Ferramentas" },
      {
        property: "og:description",
        content:
          "Acompanhe em tempo real o status das ferramentas registradas pelo ESP32.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelFerramentas,
});

// Lê a data/hora exatamente como está gravada no banco, sem converter fuso.
function partesData(iso: string) {
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, ano, mes, dia, h, min, s] = m;
  return { ano, mes, dia, h, min, s };
}

function formatarHorario(iso: string | null): string {
  if (!iso) return "—";
  const p = partesData(iso);
  if (!p) return "—";
  return `${p.dia}/${p.mes}, ${p.h}:${p.min}:${p.s}`;
}

function tempoRelativo(iso: string | null): string {
  if (!iso) return "";
  const p = partesData(iso);
  if (!p) return "";
  const registro = new Date(
    Number(p.ano),
    Number(p.mes) - 1,
    Number(p.dia),
    Number(p.h),
    Number(p.min),
    Number(p.s),
  ).getTime();
  const diff = Date.now() - registro;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function StatusBadge({ disponivel }: { disponivel: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
        disponivel
          ? "bg-status-disponivel/15 text-status-disponivel"
          : "bg-status-em-uso/15 text-status-em-uso"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full animate-pulse-dot ${
          disponivel ? "bg-status-disponivel" : "bg-status-em-uso"
        }`}
      />
      {disponivel ? "Disponível" : "Em uso"}
    </span>
  );
}


function CardFerramenta({
  ferramenta,
  indice,
}: {
  ferramenta: Ferramenta;
  indice: number;
}) {
  const emUso = ferramenta.status === true;
  return (
    <div
      className="animate-card-in rounded-2xl border bg-card p-6 shadow-lg shadow-black/20 transition-colors hover:border-ring/50"
      style={{ animationDelay: `${indice * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
            <Wrench className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight">
              {ferramenta.nome}
            </h2>
            <span className="font-mono-data text-xs text-muted-foreground">
              ID {ferramenta.id}
            </span>
          </div>
        </div>
        <StatusBadge emUso={emUso} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Último usuário
            </p>
            <p className="font-mono-data text-sm">
              {ferramenta.last_user != null
                ? `Usuário #${ferramenta.last_user}`
                : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Alteração
            </p>
            <p className="font-mono-data text-sm">
              {formatarHorario(ferramenta.last_update)}
              {ferramenta.last_update && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({tempoRelativo(ferramenta.last_update)})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PainelFerramentas() {
  const { data, isLoading, isError, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["ferramentas"],
    queryFn: fetchFerramentas,
    refetchInterval: 3000,
  });

  const ferramentas = data ?? [];
  const emUso = ferramentas.filter((f) => f.status === true).length;

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Smart Kanban
              </h1>
              <p className="text-xs text-muted-foreground">
                Painel de ferramentas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {isError ? (
              <span className="flex items-center gap-2 text-destructive">
                <WifiOff className="h-4 w-4" /> Sem conexão com o banco
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isFetching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Wifi className="h-4 w-4 text-status-disponivel" />
                )}
                Atualizado às{" "}
                <span className="font-mono-data">
                  {dataUpdatedAt
                    ? new Intl.DateTimeFormat("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }).format(new Date(dataUpdatedAt))
                    : "—"}
                </span>
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold">Ferramentas</h2>
            <p className="text-sm text-muted-foreground">
              Atualização automática a cada 3 segundos
            </p>
          </div>
          {ferramentas.length > 0 && (
            <p className="font-mono-data text-sm text-muted-foreground">
              {emUso} em uso · {ferramentas.length - emUso} disponíveis
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Carregando ferramentas…
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
            <WifiOff className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 font-semibold">
              Não foi possível carregar as ferramentas
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Verificando novamente automaticamente…
            </p>
          </div>
        ) : ferramentas.length === 0 ? (
          <div className="rounded-2xl border p-8 text-center text-muted-foreground">
            Nenhuma ferramenta cadastrada na tabela ainda.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ferramentas.map((f, i) => (
              <CardFerramenta key={f.id} ferramenta={f} indice={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
