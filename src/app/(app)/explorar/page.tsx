"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Compass, Crosshair, MapPin, Users } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { EnderecoResumo } from "@/components/endereco-resumo";
import { MapaDescoberta, type PontoEvento } from "@/components/mapa-descoberta";
import { EmptyState, Erro, PageHeader, Spinner } from "@/components/ui";
import { distanciaKm } from "@/lib/geo";
import { formatarData, formatarHora, hojeISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

type EventoDescoberta = {
  id: string;
  grupo_id: string;
  nome: string;
  descricao: string | null;
  data_evento: string;
  hora_evento: string;
  local_evento: string | null;
  latitude: number;
  longitude: number;
  grupos: { id: string; nome: string } | null;
  distancia: number | null;
};

const RAIO_TODOS = 0;

export default function ExplorarPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [eventos, setEventos] = useState<EventoDescoberta[]>([]);
  const [meusGrupos, setMeusGrupos] = useState<Set<string>>(new Set());
  const [posicao, setPosicao] = useState<{ lat: number; lng: number } | null>(null);
  const [raio, setRaio] = useState(RAIO_TODOS);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState("");

  useEffect(() => {
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const [{ data: eventosData, error: erroEventos }, { data: membrosData }] = await Promise.all([
        supabase
          .from("eventos")
          .select("id, grupo_id, nome, descricao, data_evento, hora_evento, local_evento, latitude, longitude, grupos(id, nome)")
          .eq("publico", true)
          .gte("data_evento", hojeISO())
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .order("data_evento")
          .order("hora_evento")
          .limit(100),
        supabase.from("grupo_membros").select("grupo_id").eq("usuario_id", userId).eq("status", "ativo"),
      ]);
      if (!ativo) return;
      if (erroEventos) setErro(erroEventos.message);
      setEventos((eventosData ?? []).map((evento) => {
        const gruposBrutos = evento.grupos as unknown as { id: string; nome: string }[] | null;
        return {
          ...(evento as unknown as Omit<EventoDescoberta, "grupos" | "distancia">),
          grupos: Array.isArray(gruposBrutos) ? gruposBrutos[0] ?? null : gruposBrutos,
          distancia: null,
        } as EventoDescoberta;
      }));
      setMeusGrupos(new Set((membrosData ?? []).map((m) => m.grupo_id)));
      setCarregando(false);
    })();
    return () => { ativo = false; };
  }, [userId]);

  function usarLocalizacao() {
    setErro("");
    if (!navigator.geolocation) {
      setErro("Este navegador não oferece localização automática.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nova = { lat: coords.latitude, lng: coords.longitude };
        setPosicao(nova);
        setEventos((lista) => lista.map((evento) => ({
          ...evento,
          distancia: distanciaKm(nova.lat, nova.lng, evento.latitude, evento.longitude),
        })));
      },
      () => setErro("Não conseguimos obter sua localização. Você ainda pode explorar o mapa."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  async function entrar(evento: EventoDescoberta) {
    if (meusGrupos.has(evento.grupo_id)) {
      router.push(`/grupos/${evento.grupo_id}`);
      return;
    }
    setErro("");
    setEntrando(evento.grupo_id);
    const { error } = await createClient().rpc("entrar_grupo_publico", { p_grupo: evento.grupo_id });
    setEntrando("");
    if (error) {
      setErro(error.message);
      return;
    }
    setMeusGrupos((atual) => new Set(atual).add(evento.grupo_id));
    router.push(`/grupos/${evento.grupo_id}`);
  }

  const visiveis = useMemo(
    () => eventos
      .filter((evento) => raio === RAIO_TODOS || (evento.distancia != null && evento.distancia <= raio))
      .sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0) || a.data_evento.localeCompare(b.data_evento)),
    [eventos, raio],
  );
  const pontos = useMemo<PontoEvento[]>(
    () => visiveis.map((evento) => ({
      id: evento.id,
      nome: evento.nome,
      latitude: evento.latitude,
      longitude: evento.longitude,
    })),
    [visiveis],
  );

  return (
    <div>
      <PageHeader
        titulo="Explorar encontros"
        subtitulo="Eventos públicos de grupos que aceitam novas pessoas. Só aparece o que o organizador decidiu compartilhar."
        acoes={
          <button type="button" onClick={usarLocalizacao} className="btn-secondary px-3 py-2 text-xs">
            <Crosshair size={14} /> Usar minha localização
          </button>
        }
      />

      {erro && <div className="mb-4"><Erro mensagem={erro} /></div>}
      {carregando ? <Spinner /> : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="card overflow-hidden p-2">
            {pontos.length ? (
              <MapaDescoberta pontos={pontos} selecionadoId={selecionado} aoSelecionar={setSelecionado} />
            ) : (
              <div className="flex h-[360px] items-center justify-center rounded-2xl bg-soft/40 text-sm text-muted">
                Nenhum evento com ponto no mapa para este filtro.
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 px-3 py-3">
              <span className="text-xs font-semibold text-muted">Distância:</span>
              {[
                { valor: RAIO_TODOS, texto: "Todos" },
                { valor: 10, texto: "Até 10 km" },
                { valor: 25, texto: "Até 25 km" },
                { valor: 50, texto: "Até 50 km" },
                { valor: 100, texto: "Até 100 km" },
              ].map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => setRaio(opcao.valor)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${raio === opcao.valor ? "bg-primary text-white" : "bg-soft text-muted hover:text-ink"}`}
                >
                  {opcao.texto}
                </button>
              ))}
              {posicao
                ? <span className="ml-auto text-[11px] text-muted">Distância calculada a partir de você.</span>
                : raio !== RAIO_TODOS
                  ? <span className="ml-auto text-[11px] text-warning">Use “Minha localização” para aplicar o filtro de distância.</span>
                  : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Compass size={17} className="text-primary" /> {visiveis.length} encontro{visiveis.length === 1 ? "" : "s"} próximo{visiveis.length === 1 ? "" : "s"}
            </div>
            {visiveis.length === 0 && (
              <EmptyState
                titulo="Nada por perto ainda"
                descricao="Marque seu grupo e seus eventos como públicos para divulgar os próximos encontros."
                icone={<MapPin size={24} />}
                acao={<Link href="/grupos/novo" className="btn-primary">Criar um grupo</Link>}
              />
            )}
            {visiveis.map((evento) => (
              <article
                key={evento.id}
                onClick={() => setSelecionado(evento.id)}
                className={`card cursor-pointer p-4 transition ${selecionado === evento.id ? "border-primary/60 ring-2 ring-primary/20" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-ink">{evento.nome}</h3>
                  {evento.distancia != null && (
                    <span className="chip shrink-0 bg-primary/10 text-primary">{evento.distancia.toFixed(1)} km</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted"><CalendarDays size={12} className="inline" /> {formatarData(evento.data_evento)} · {formatarHora(evento.hora_evento)}</p>
                {evento.grupos && <p className="mt-1 text-xs font-semibold text-muted"><Users size={12} className="inline" /> {evento.grupos.nome}</p>}
                {evento.local_evento && <div className="mt-2 text-xs text-muted"><EnderecoResumo texto={evento.local_evento} /></div>}
                {evento.descricao && <p className="mt-2 line-clamp-2 text-xs text-muted">{evento.descricao}</p>}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); entrar(evento); }}
                  disabled={entrando === evento.grupo_id}
                  className="btn-primary mt-3 px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {entrando === evento.grupo_id ? "Entrando..." : meusGrupos.has(evento.grupo_id) ? "Abrir grupo" : "Entrar no grupo"}
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
