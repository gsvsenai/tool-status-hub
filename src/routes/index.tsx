import { useEffect, useState } from "react";
import { buscarFerramentas } from "@/lib/ferramentas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";

export function Component() {
  const [ferramentas, setFerramentas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    try {
      const dados = await buscarFerramentas();
      setFerramentas(Array.isArray(dados) ? dados : dados.data || []);
    } catch (err: any) {
      setErro("Não foi possível carregar as ferramentas. Verificando conexão...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    const intervalo = setInterval(carregarDados, 10000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Smart Kanban</h1>
              <p className="text-sm text-slate-400">Painel de controle de ferramentas</p>
            </div>
          </div>
          <Button 
            onClick={carregarDados} 
            variant="outline" 
            className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Alerta de Erro */}
        {erro && (
          <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-6 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <h2 className="text-lg font-semibold text-red-200">Não foi possível carregar as ferramentas</h2>
            <p className="text-sm text-red-400">{erro}</p>
            <p className="text-xs text-slate-500 mt-2">Nota: Se a API do Render estiver iniciando após inatividade, aguarde alguns segundos e clique em Atualizar.</p>
          </div>
        )}

        {/* Listagem de Ferramentas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && ferramentas.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              Carregando estado das ferramentas...
            </div>
          ) : ferramentas.length > 0 ? (
            ferramentas.map((ferramenta) => (
              <Card key={ferramenta.id} className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">
                    {ferramenta.nome || `Ferramenta #${ferramenta.id}`}
                  </CardTitle>
                  {ferramenta.status ? (
                    <span className="flex items-center text-xs text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded-full border border-emerald-900">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Disponível
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-amber-400 bg-amber-950/50 px-2 py-1 rounded-full border border-amber-900">
                      <Wrench className="w-3 h-3 mr-1" /> Em Uso
                    </span>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Último usuário ID: {ferramenta.last_user || "Nenhum"}</p>
                    <p>Atualizado em: {ferramenta.last_update ? new Date(ferramenta.last_update).toLocaleTimeString() : "Recentemente"}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : !erro && !loading ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              Nenhuma ferramenta cadastrada no momento.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Component;
