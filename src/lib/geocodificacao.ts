"use client";

/**
 * Geocodificação com Nominatim/OpenStreetMap e CEPs com ViaCEP.
 * Nenhuma das duas APIs exige chave. O formulário usa debounce e cancela
 * buscas antigas para respeitar o limite de ~1 requisição por segundo.
 */

type NominatimItem = {
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: Record<string, string>;
};

type ViaCepResposta = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export type FiltrosEndereco = {
  estado?: string;
  cidade?: string;
  bairro?: string;
};

export type EnderecoDetalhes = {
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  pais: string;
  latitude: number | null;
  longitude: number | null;
  descricaoCompleta: string;
};

export type SugestaoLocal = {
  id: string;
  descricao: string;
  resumo: string;
  latitude: number;
  longitude: number;
  detalhes: EnderecoDetalhes;
};

export const ESTADOS_BRASIL = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"],
  ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
  ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
  ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
] as const;

export function resumoEndereco(descricao: string, partes = 3) {
  return descricao.split(",").slice(0, partes).map((p) => p.trim()).filter(Boolean).join(", ");
}

function extrairPartes(item: NominatimItem) {
  const a = item.address ?? {};
  return {
    rua: a.road ?? a.pedestrian ?? a.footway ?? item.name ?? item.display_name.split(",")[0]?.trim() ?? "",
    numero: a.house_number ?? "",
    bairro: a.neighbourhood ?? a.suburb ?? a.city_district ?? a.county ?? "",
    cidade: a.city ?? a.town ?? a.village ?? a.municipality ?? "",
    estado: a.state ?? a["ISO3166-2-lvl4"]?.split("-")[1] ?? "",
    cep: a.postcode ?? "",
    pais: a.country ?? "Brasil",
  };
}

function paraSugestao(item: NominatimItem): SugestaoLocal {
  const latitude = Number(item.lat);
  const longitude = Number(item.lon);
  const detalhes: EnderecoDetalhes = {
    ...extrairPartes(item),
    complemento: "",
    latitude,
    longitude,
    descricaoCompleta: item.display_name,
  };
  return {
    id: `${item.osm_type ?? "place"}-${item.osm_id ?? item.lat}-${item.lon}`,
    descricao: item.display_name,
    resumo: resumoEndereco(item.display_name),
    latitude,
    longitude,
    detalhes,
  };
}

/** Busca livre refinada por filtros opcionais (estado, cidade e bairro). */
export async function buscarSugestoes(
  termo: string,
  filtros: FiltrosEndereco = {},
  sinal?: AbortSignal,
): Promise<SugestaoLocal[]> {
  const partes = [
    termo.trim(),
    filtros.bairro?.trim(),
    filtros.cidade?.trim(),
    filtros.estado?.trim(),
  ].filter(Boolean) as string[];
  if (partes.length > 1) partes.push("Brasil");
  const q = partes.join(", ");
  if (q.length < 3) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "pt-BR");

  const resposta = await fetch(url, { signal: sinal, headers: { Accept: "application/json" } });
  if (!resposta.ok) throw new Error("Não foi possível buscar endereços agora.");
  const dados = (await resposta.json()) as NominatimItem[];
  return dados.map(paraSugestao);
}

/** Identifica o endereço de um ponto do mapa ou da localização do aparelho. */
export async function enderecoPorCoordenada(
  lat: number,
  lng: number,
  sinal?: AbortSignal,
): Promise<EnderecoDetalhes> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "pt-BR");

  const resposta = await fetch(url, { signal: sinal, headers: { Accept: "application/json" } });
  if (!resposta.ok) throw new Error("Não foi possível identificar este ponto no mapa.");
  const dado = (await resposta.json()) as NominatimItem;
  const partes = extrairPartes(dado);
  const descricao = dado.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  return {
    ...partes,
    rua: partes.rua || descricao.split(",")[0]?.trim() || "",
    complemento: "",
    latitude: lat,
    longitude: lng,
    descricaoCompleta: descricao,
  };
}

/** Atalho brasileiro: CEP → rua/bairro/cidade/UF, com coordenadas via Nominatim. */
export async function buscarPorCep(cep: string, sinal?: AbortSignal): Promise<EnderecoDetalhes> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) throw new Error("Digite um CEP com 8 dígitos.");

  const resposta = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    signal: sinal,
    headers: { Accept: "application/json" },
  });
  if (!resposta.ok) throw new Error("Não foi possível consultar o CEP agora.");
  const dado = (await resposta.json()) as ViaCepResposta;
  if (dado.erro || !dado.logradouro) throw new Error("CEP não encontrado.");

  const detalhes: EnderecoDetalhes = {
    rua: dado.logradouro,
    numero: "",
    complemento: dado.complemento ?? "",
    bairro: dado.bairro ?? "",
    cidade: dado.localidade ?? "",
    estado: dado.uf ?? "",
    cep: dado.cep ?? `${digits.slice(0, 5)}-${digits.slice(5)}`,
    pais: "Brasil",
    latitude: null,
    longitude: null,
    descricaoCompleta: "",
  };

  const termo = [detalhes.rua, detalhes.bairro, detalhes.cidade, detalhes.estado].filter(Boolean).join(", ");
  const encontrados = await buscarSugestoes(termo, {}, sinal);
  const melhor = encontrados[0];
  return {
    ...detalhes,
    latitude: melhor?.latitude ?? null,
    longitude: melhor?.longitude ?? null,
    descricaoCompleta: melhor?.descricao ?? [detalhes.rua, detalhes.bairro, `${detalhes.cidade}/${detalhes.estado}`, detalhes.cep].filter(Boolean).join(", "),
  };
}

/** Texto curto para o dia a dia: "Rua das Flores, 121". */
export function formatarCurto(detalhes: EnderecoDetalhes) {
  const rua = detalhes.rua || detalhes.descricaoCompleta.split(",")[0]?.trim() || "Endereço selecionado";
  return [rua, detalhes.numero].filter(Boolean).join(", ");
}

/** Endereço completo guardado no evento e exibido ao expandir os detalhes. */
export function formatarCompleto(detalhes: EnderecoDetalhes) {
  const curto = formatarCurto(detalhes);
  const partes = [
    detalhes.complemento,
    detalhes.bairro,
    [detalhes.cidade, detalhes.estado].filter(Boolean).join("/"),
    detalhes.cep,
  ].filter(Boolean);
  return partes.length ? `${curto} — ${partes.join(" — ")}` : curto;
}
