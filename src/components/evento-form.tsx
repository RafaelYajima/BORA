"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, MapPin } from "lucide-react";
import { MapaPicker } from "@/components/mapa";
import { Erro, PageHeader } from "@/components/ui";
import {
  buscarSugestoes,
  enderecoPorCoordenada,
  type SugestaoLocal,
} from "@/lib/geocodificacao";
import { createClient } from "@/lib/supabase/client";
import type { Evento, Grupo } from "@/lib/types";

export function EventoForm({
  grupo,
  evento,
}: {
  grupo: Grupo;
  evento?: Evento;
}) {
  const router = useRouter();
  const [nome, setNome] = useState(evento?.nome ?? "");
  const [descricao, setDescricao] = useState(evento?.descricao ?? "");
  const [data, setData] = useState(evento?.data_evento ?? "");
  const [hora, setHora] = useState(evento?.hora_evento?.slice(0, 5) ?? "");
  const [local, setLocal] = useState(evento?.local_evento ?? "");
  const [latitude, setLatitude] = useState<number | null>(evento?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(evento?.longitude ?? null);
  const [sugestoes, setSugestoes] = useState<SugestaoLocal[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [campoAtivo, setCampoAtivo] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  // Evita buscar novamente pelo endereço já carregado/escolhido.
  const ultimoTermo = useRef(local.trim());

  // Autocomplete com debounce: evita estourar o limite do Nominatim (~1 req/s).
  useEffect(() => {
    const termo = local.trim();
    if (termo === ultimoTermo.current) return;
    if (termo.length < 3) return;
    const controle = new AbortController();
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const encontrados = await buscarSugestoes(termo, controle.signal);
        if (!controle.signal.aborted) {
          ultimoTermo.current = termo;
          setSugestoes(encontrados);
        }
      } catch {
        if (!controle.signal.aborted) setSugestoes([]);
      } finally {
        if (!controle.signal.aborted) setBuscando(false);
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      controle.abort();
    };
  }, [local]);

  function mudarLocal(valor: string) {
    setLocal(valor);
    setSugestoes([]);
    setBuscando(false);
  }

  function selecionarSugestao(sugestao: SugestaoLocal) {
    ultimoTermo.current = sugestao.descricao;
    setLocal(sugestao.descricao);
    setLatitude(sugestao.latitude);
    setLongitude(sugestao.longitude);
    setSugestoes([]);
    setBuscando(false);
    setCampoAtivo(false);
  }

  async function aoMoverMapa(lat: number | null, lng: number | null) {
    setLatitude(lat);
    setLongitude(lng);
    if (lat == null || lng == null) return;
    try {
      const endereco = await enderecoPorCoordenada(lat, lng);
      ultimoTermo.current = endereco;
      setLocal(endereco);
      setSugestoes([]);
    } catch {
      // Mantém o texto digitado se a busca reversa falhar.
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    const dados = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      data_evento: data,
      hora_evento: hora.length === 5 ? `${hora}:00` : hora,
      local_evento: local.trim() || null,
      latitude,
      longitude,
    };
    const supabase = createClient();
    const { data: sessao } = await supabase.auth.getUser();
    if (!sessao.user) {
      setErro("Sua sessão expirou. Entre novamente.");
      setSalvando(false);
      return;
    }
    const resultado = evento
      ? await supabase.from("eventos").update(dados).eq("id", evento.id).select().single()
      : await supabase.from("eventos").insert({ ...dados, grupo_id: grupo.id, criador_id: sessao.user.id }).select().single();

    setSalvando(false);
    if (resultado.error || !resultado.data) {
      setErro(resultado.error?.message ?? "Não foi possível salvar o evento.");
      return;
    }
    router.push(`/grupos/${grupo.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        titulo={evento ? "Editar evento" : "Novo evento"}
        subtitulo={`Grupo: ${grupo.nome}`}
        voltar={{ href: `/grupos/${grupo.id}`, label: "Voltar ao grupo" }}
      />
      <form onSubmit={salvar} className="card space-y-5 p-6">
        <div>
          <label className="label" htmlFor="nome">Nome do evento *</label>
          <input id="nome" required maxLength={100} className="input" placeholder="Ex: Jantar de sexta, Reunião de pauta..." value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="descricao">Descrição</label>
          <textarea id="descricao" rows={3} className="input resize-none" placeholder="O que vai acontecer?" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="data">Data *</label>
            <input id="data" type="date" required className="input" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="hora">Horário *</label>
            <input id="hora" type="time" required className="input" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="local">Local / endereço</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            {buscando && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted" size={16} />}
            <input
              id="local"
              autoComplete="off"
              className="input pl-11"
              placeholder="Digite o começo da rua, bairro ou cidade..."
              value={local}
              onFocus={() => setCampoAtivo(true)}
              onBlur={() => setTimeout(() => setCampoAtivo(false), 150)}
              onChange={(e) => mudarLocal(e.target.value)}
            />
            {campoAtivo && (sugestoes.length > 0 || buscando) && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
                {buscando && <p className="px-4 py-3 text-xs text-muted">Buscando endereços...</p>}
                {sugestoes.map((sugestao) => (
                  <button
                    key={sugestao.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selecionarSugestao(sugestao)}
                    className="flex w-full items-start gap-2 border-b border-line px-4 py-2.5 text-left text-sm text-ink transition last:border-0 hover:bg-soft"
                  >
                    <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
                    <span>{sugestao.resumo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Digite pelo menos 3 letras para ver sugestões. Você também pode clicar no mapa ou usar sua localização — o endereço é preenchido automaticamente. Dados: © OpenStreetMap contributors.
          </p>
          {latitude != null && longitude != null && (
            <p className="mt-1 text-xs font-semibold text-success">
              ✓ Ponto marcado no mapa. Confira se ele corresponde ao endereço acima.
            </p>
          )}
        </div>

        <div>
          <p className="label">Ponto no mapa (opcional)</p>
          <MapaPicker latitude={latitude} longitude={longitude} onChange={aoMoverMapa} />
        </div>
        {erro && <Erro mensagem={erro} />}
        <div className="flex justify-end gap-2 border-t border-line pt-5">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? "Salvando..." : <>{evento ? "Salvar alterações" : "Criar evento"} <ArrowRight size={16} /></>}
          </button>
        </div>
      </form>
    </div>
  );
}
