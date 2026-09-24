import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wrench, User, Clock, RefreshCw, Wifi, WifiOff } from "lucide-react";
import {
  fetchFerramentas,
  SUPABASE_PROJECT_URL,
  SUPABASE_KEY,
  type Ferramenta,
} from "@/lib/ferramentas";

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
  const disponivel = ferramenta.status === true;
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
        <StatusBadge disponivel={disponivel} />
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

// Indicador do ESP32 atualizado via WebSocket
function IndicadorESP32({
  isOnline,
  lastPingTime,
}: {
  isOnline: boolean;
  lastPingTime: Date | null;
}) {
  return (
    <span
      className={`flex items-center gap-2 text-xs font-medium ${
        isOnline ? "text-status-disponivel" : "text-status-em-uso"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isOnline
            ? "bg-status-disponivel animate-pulse-dot"
            : "bg-status-em-uso"
        }`}
      />
      {isOnline ? "ESP32 conectado" : "ESP32 sem sinal"}
      <span className="font-normal text-muted-foreground">
        · {lastPingTime ? "realtime" : "aguardando..."}
      </span>
    </span>
  );
}

function PainelFerramentas() {
  const {
    data,
    isLoading,
    isError,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ["ferramentas"],
    queryFn: fetchFerramentas,
    refetchInterval: 3000,
  });

  // Estado local para o indicador em tempo real
  const [esp32Online, setEsp32Online] = useState(false);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Monta a URL de WebSocket nativa do Supabase
    const wsHost = SUPABASE_PROJECT_URL.replace(/^https?:\/\//, "");
    const wsUrl = `wss://${wsHost}/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      // Entra no canal 'esp32-status'
      const joinMsg = {
        topic: "realtime:esp32-status",
        event: "phx_join",
        payload: { config: { broadcast: { self: false } } },
        ref: "1",
      };
      socket.send(JSON.stringify(joinMsg));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Se for o ping em tempo real enviado pelo ESP32
        if (msg.event === "broadcast" && msg.payload?.event === "ping") {
          setEsp32Online(true);
          setLastPingTime(new Date());

          // Zera o timer: se ficar + de 1,5 segundo sem ping, considera offline
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setEsp32Online(false);
          }, 1500);
        }
      } catch (err) {
        console.error("Erro ao ler WebSocket do Realtime:", err);
      }
    };

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      socket.close();
    };
  }, []);

  const ferramentas = data ?? [];
  const disponiveis = ferramentas.filter((f) => f.status === true).length;

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
          <div className="flex flex-col items-end gap-1.5">
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
            <IndicadorESP32
              isOnline={esp32Online}
              lastPingTime={lastPingTime}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">Ferramentas</h2>
          <div className="flex items-center gap-4">
            {ferramentas.length > 0 && (
              <p className="font-mono-data text-sm text-muted-foreground">
                {ferramentas.length - disponiveis} em uso · {disponiveis}{" "}
                disponíveis
              </p>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-ring/50 hover:bg-secondary disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Atualizar
            </button>
          </div>
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
