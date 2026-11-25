"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Crosshair,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { MapaPicker } from "@/components/mapa";
import { Erro, PageHeader } from "@/components/ui";
import {
  ESTADOS_BRASIL,
  buscarPorCep,
  buscarSugestoes,
  enderecoPorCoordenada,
  localizarEndereco,
  formatarCompleto,
  formatarCurto,
  type EnderecoDetalhes,
  type LocalizacaoEncontrada,
  type SugestaoLocal,
} from "@/lib/geocodificacao";
import { hojeISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { Evento, Grupo } from "@/lib/types";

function chaveDe(termo: string, estado: string, cidade: string, bairro: string) {
  return [termo.trim(), estado, cidade.trim(), bairro.trim()].join("|");
}

function chaveLocalizacao(
  local: string,
  numero: string,
  bairro: string,
  cidade: string,
  estado: string,
) {
  return [local.trim(), numero.trim(), bairro.trim(), cidade.trim(), estado].join("|");
}

export function EventoForm({
  grupo,
  evento,
}: {
  grupo: Grupo;
  evento?: Evento;
}) {
  const router = useRouter();
  const [minData] = useState(() => hojeISO());
  const [nome, setNome] = useState(evento?.nome ?? "");
  const [descricao, setDescricao] = useState(evento?.descricao ?? "");
  const [data, setData] = useState(evento?.data_evento ?? "");
  const [hora, setHora] = useState(evento?.hora_evento?.slice(0, 5) ?? "");
  const [local, setLocal] = useState(evento?.local_evento ?? "");
  const [publico, setPublico] = useState(evento?.publico ?? false);
  const [latitude, setLatitude] = useState<number | null>(evento?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(evento?.longitude ?? null);
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [cep, setCep] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const [detalhes, setDetalhes] = useState<EnderecoDetalhes | null>(null);
  const [sugestoes, setSugestoes] = useState<SugestaoLocal[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [localizando, setLocalizando] = useState(false);
  const [campoAtivo, setCampoAtivo] = useState(false);
  const [avisoCep, setAvisoCep] = useState("");
  const [avisoLocalizacao, setAvisoLocalizacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  // Não repete a busca pelo valor inicial nem pelo endereço já escolhido.
  const ultimaChave = useRef(chaveDe(evento?.local_evento ?? "", "", "", ""));
  const ultimaLocalizacao = useRef("");

  // Autocomplete com debounce: os filtros refinam a busca e pedidos antigos são cancelados.
  useEffect(() => {
    const chave = chaveDe(local, estado, cidade, bairro);
    if (chave === ultimaChave.current) return;
    if (local.trim().length < 3 && !estado && !cidade.trim() && !bairro.trim()) return;
    const controle = new AbortController();
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const encontrados = await buscarSugestoes(
          local.trim(),
          { estado, cidade, bairro },
          controle.signal,
        );
        if (!controle.signal.aborted) {
          ultimaChave.current = chave;
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
  }, [local, estado, cidade, bairro]);

  const cepAtual = detalhes?.cep || cep;
  const chaveLocalizacaoAtual = chaveLocalizacao(local, numero, bairro, cidade, estado);

  // Com rua, número, cidade e UF preenchidos, o mapa acompanha automaticamente.
  useEffect(() => {
    if (chaveLocalizacaoAtual === ultimaLocalizacao.current) return;
    if (!local.trim() || !cidade.trim() || !estado || !numero.trim()) return;
    const controle = new AbortController();
    const timer = setTimeout(async () => {
      setLocalizando(true);
      try {
        const encontrado = await localizarEndereco({
          rua: local.trim().split(",")[0].trim(),
          numero,
          bairro,
          cidade,
          estado,
          cep: cepAtual,
        }, controle.signal);
        if (!controle.signal.aborted) {
          ultimaLocalizacao.current = chaveLocalizacaoAtual;
          if (encontrado) aplicarLocalizacao(encontrado, chaveLocalizacaoAtual);
          else setAvisoLocalizacao("Não encontrei esse endereço no mapa. Você pode marcar o ponto manualmente.");
        }
      } catch {
        if (!controle.signal.aborted) setAvisoLocalizacao("Não foi possível localizar o endereço no mapa agora.");
      } finally {
        if (!controle.signal.aborted) setLocalizando(false);
      }
    }, 800);
    return () => {
      clearTimeout(timer);
      controle.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveLocalizacaoAtual, local, numero, bairro, cidade, estado, cepAtual]);

  function mudarLocal(valor: string) {
    setLocal(valor);
    setDetalhes(null);
    setNumero("");
    setComplemento("");
    setLatitude(null);
    setLongitude(null);
    ultimaLocalizacao.current = "";
    setAvisoLocalizacao("");
    setSugestoes([]);
    setBuscando(false);
  }

  function mudarNumero(valor: string) {
    setNumero(valor);
    ultimaLocalizacao.current = "";
    setAvisoLocalizacao("");
    setDetalhes((atual) => (atual ? { ...atual, numero: valor } : atual));
  }

  function mudarComplemento(valor: string) {
    setComplemento(valor);
    setDetalhes((atual) => (atual ? { ...atual, complemento: valor } : atual));
  }

  function aplicarEndereco(endereco: EnderecoDetalhes) {
    const completo = {
      ...endereco,
      numero: numero || endereco.numero,
      complemento: complemento || endereco.complemento,
    };
    ultimaChave.current = chaveDe(formatarCurto(completo), estado, cidade, bairro);
    ultimaLocalizacao.current = chaveLocalizacao(
      formatarCurto(completo),
      completo.numero,
      bairro,
      cidade,
      estado,
    );
    setLocal(formatarCurto(completo));
    setDetalhes(completo);
    setNumero(completo.numero);
    setComplemento(completo.complemento);
    setLatitude(completo.latitude);
    setLongitude(completo.longitude);
    setSugestoes([]);
    setBuscando(false);
    setCampoAtivo(false);
    setDetalhesAbertos(false);
  }

  function aplicarLocalizacao(encontrado: LocalizacaoEncontrada, chave: string) {
    ultimaLocalizacao.current = chave;
    setLatitude(encontrado.latitude);
    setLongitude(encontrado.longitude);
    setDetalhes((atual) => ({
      rua: atual?.rua || local.trim().split(",")[0].trim(),
      numero: numero.trim(),
      complemento: atual?.complemento ?? complemento,
      bairro: atual?.bairro || bairro,
      cidade: atual?.cidade || cidade,
      estado: atual?.estado || estado,
      cep: atual?.cep ?? "",
      pais: "Brasil",
      latitude: encontrado.latitude,
      longitude: encontrado.longitude,
      descricaoCompleta: encontrado.descricao,
      aproximado: encontrado.aproximado,
    }));
    setAvisoLocalizacao(
      encontrado.aproximado
        ? "Mapa centralizado no ponto mais próximo. Confira o número e ajuste se precisar."
        : "",
    );
  }

  async function localizarNoMapa() {
    setLocalizando(true);
    setAvisoLocalizacao("");
    try {
      const encontrado = await localizarEndereco({
        rua: local.trim().split(",")[0].trim(),
        numero,
        bairro,
        cidade,
        estado,
        cep: cepAtual,
      });
      if (!encontrado) {
        setAvisoLocalizacao("Não encontrei esse endereço no mapa. Você pode marcar o ponto manualmente.");
        return;
      }
      aplicarLocalizacao(encontrado, chaveLocalizacaoAtual);
    } catch {
      setAvisoLocalizacao("Não foi possível localizar o endereço no mapa agora.");
    } finally {
      setLocalizando(false);
    }
  }

  function selecionarSugestao(sugestao: SugestaoLocal) {
    aplicarEndereco(sugestao.detalhes);
  }

  async function buscarCep() {
    setAvisoCep("");
    setBuscandoCep(true);
    try {
      const encontrado = await buscarPorCep(cep);
      aplicarEndereco(encontrado);
      setAvisoCep(
        encontrado.latitude == null
          ? "CEP encontrado, mas não consegui identificar o ponto no mapa. Clique no mapa ou use “Localizar no mapa”."
          : encontrado.aproximado
            ? "CEP encontrado. O mapa foi centralizado no ponto mais próximo; confira o número."
            : "",
      );
    } catch (falha) {
      setAvisoCep(falha instanceof Error ? falha.message : "Não foi possível consultar o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  }

  async function aoMoverMapa(lat: number | null, lng: number | null) {
    setLatitude(lat);
    setLongitude(lng);
    if (lat == null || lng == null) {
      ultimaLocalizacao.current = chaveLocalizacaoAtual;
      setDetalhes(null);
      return;
    }
    try {
      aplicarEndereco(await enderecoPorCoordenada(lat, lng));
    } catch {
      ultimaLocalizacao.current = chaveLocalizacaoAtual;
      // Mantém o texto digitado se a busca reversa falhar.
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const horaCompleta = hora.length === 5 ? `${hora}:00` : hora;
    const alterouDataHora = !evento
      || data !== evento.data_evento
      || horaCompleta !== evento.hora_evento;
    if (alterouDataHora) {
      const inicio = new Date(`${data}T${horaCompleta}`);
      if (
        !data || !horaCompleta
        || Number.isNaN(inicio.getTime())
        || inicio.getTime() <= Date.now()
      ) {
        setErro("Escolha uma data e um horário futuros para o evento.");
        return;
      }
    }
    setSalvando(true);
    const dados = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      data_evento: data,
      hora_evento: horaCompleta,
      local_evento: detalhes ? formatarCompleto(detalhes) : local.trim() || null,
      latitude,
      longitude,
      publico,
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

  const linkMapa = latitude != null && longitude != null
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : "";

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
            <input
              id="data"
              type="date"
              required
              min={minData}
              className="input"
              value={data}
              onChange={(e) => { setData(e.target.value); setErro(""); }}
            />
          </div>
          <div>
            <label className="label" htmlFor="hora">Horário *</label>
            <input
              id="hora"
              type="time"
              required
              className="input"
              value={hora}
              onChange={(e) => { setHora(e.target.value); setErro(""); }}
            />
          </div>
        </div>

        <p className="-mt-3 text-xs text-muted">
          Eventos só podem ser agendados para o futuro; datas anteriores a hoje não são aceitas.
        </p>

        <div>
          <button
            type="button"
            onClick={() => setFiltrosAbertos((aberto) => !aberto)}
            className="flex w-full items-center justify-between rounded-xl border border-line bg-soft/50 px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary/40"
            aria-expanded={filtrosAbertos}
          >
            <span className="inline-flex items-center gap-2"><SlidersHorizontal size={16} className="text-primary" /> Filtros e CEP (opcional)</span>
            <ChevronDown size={16} className={`transition ${filtrosAbertos ? "rotate-180" : ""}`} />
          </button>
          {filtrosAbertos && (
            <div className="mt-3 grid gap-3 rounded-xl border border-line bg-soft/30 p-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="estado">Estado (UF)</label>
                <select id="estado" className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
                  <option value="">Qualquer estado</option>
                  {ESTADOS_BRASIL.map(([sigla, nomeEstado]) => (
                    <option key={sigla} value={sigla}>{sigla} — {nomeEstado}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="cidade">Cidade</label>
                <input id="cidade" className="input" placeholder="Ex: Birigui" value={cidade} onChange={(e) => setCidade(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="bairro">Bairro</label>
                <input id="bairro" className="input" placeholder="Ex: Centro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="numero">Número</label>
                <input id="numero" className="input" placeholder="Ex: 121" value={numero} onChange={(e) => mudarNumero(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="complemento">Complemento / ponto de referência</label>
                <input id="complemento" className="input" placeholder="Ex: Ao lado da praça, portão verde" value={complemento} onChange={(e) => mudarComplemento(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="cep">Buscar por CEP</label>
                <div className="flex gap-2">
                  <input id="cep" inputMode="numeric" maxLength={9} className="input flex-1" placeholder="00000-000" value={cep} onChange={(e) => setCep(e.target.value)} />
                  <button type="button" onClick={buscarCep} disabled={buscandoCep} className="btn-secondary shrink-0">
                    {buscandoCep ? <Loader2 size={16} className="animate-spin" /> : <><Search size={15} className="mr-1 inline" /> Buscar</>}
                  </button>
                </div>
              </div>
              {avisoCep && <p className="text-xs text-muted sm:col-span-2">{avisoCep}</p>}
              <p className="text-xs text-muted sm:col-span-2">
                Preencha estado, cidade ou bairro para limitar as sugestões. O CEP preenche rua, bairro, cidade e UF automaticamente.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="label" htmlFor="local">Local / endereço</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            {buscando && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted" size={16} />}
            <input
              id="local"
              autoComplete="off"
              className={`input pl-11 ${detalhes ? "font-semibold text-primary" : ""}`}
              placeholder="Digite o começo da rua ou o nome do lugar..."
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
            Digite pelo menos 3 letras para ver sugestões. Dados: © OpenStreetMap contributors · ViaCEP.
          </p>

          {detalhes && (
            <div className="mt-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-ink">{formatarCurto(detalhes)}</p>
                  <p className="text-xs text-muted">
                    Endereço identificado — confira o ponto no mapa abaixo.
                    {detalhes.aproximado && " Ponto aproximado."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetalhesAbertos((aberto) => !aberto)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {detalhesAbertos ? "Ocultar detalhes" : "Ver detalhes"}
                </button>
              </div>
              {detalhesAbertos && (
                <div className="mt-3 grid gap-2 border-t border-primary/15 pt-3 text-xs text-ink sm:grid-cols-2">
                  <p><span className="text-muted">Rua:</span> {detalhes.rua || "—"}</p>
                  <p><span className="text-muted">Número:</span> {detalhes.numero || "—"}</p>
                  {detalhes.complemento && <p><span className="text-muted">Complemento:</span> {detalhes.complemento}</p>}
                  <p><span className="text-muted">Bairro:</span> {detalhes.bairro || "—"}</p>
                  <p><span className="text-muted">Cidade/UF:</span> {[detalhes.cidade, detalhes.estado].filter(Boolean).join("/") || "—"}</p>
                  <p><span className="text-muted">CEP:</span> {detalhes.cep || "—"}</p>
                  <p className="sm:col-span-2"><span className="text-muted">Descrição completa:</span> {detalhes.descricaoCompleta || formatarCompleto(detalhes)}</p>
                </div>
              )}
              {linkMapa && (
                <a href={linkMapa} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  Abrir no Google Maps <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}

          {latitude != null && longitude != null && (
            <p className="mt-2 text-xs font-semibold text-success">
              ✓ Ponto marcado no mapa. Confira se ele corresponde ao endereço acima.
            </p>
          )}
        </div>

        <div>
          <p className="label">Ponto no mapa (opcional)</p>
          <MapaPicker latitude={latitude} longitude={longitude} onChange={aoMoverMapa} />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={localizarNoMapa} disabled={localizando} className="btn-secondary text-xs">
              {localizando ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />} Localizar no mapa
            </button>
            {avisoLocalizacao && <span className="text-xs text-muted">{avisoLocalizacao}</span>}
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-soft p-4">
          <input type="checkbox" checked={publico} onChange={(e) => setPublico(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
          <span>
            <span className="block text-sm font-semibold text-ink">Mostrar este evento na descoberta</span>
            <span className="block text-xs text-muted">Só aparece para outras pessoas se o grupo também estiver marcado como público e o evento tiver um ponto no mapa.</span>
          </span>
        </label>
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
