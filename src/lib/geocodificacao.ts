"use client";

/**
 * Geocodificação com Nominatim (OpenStreetMap). Não precisa de chave de API.
 * Atenção à política de uso: no máximo ~1 requisição por segundo — o formulário
 * usa debounce e cancela buscas antigas para respeitar esse limite.
 */

type NominatimItem = {
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  addresstype?: string;
  name?: string;
};

export type SugestaoLocal = {
  id: string;
  descricao: string;
  resumo: string;
  latitude: number;
  longitude: number;
};

export function resumoEndereco(descricao: string, partes = 3) {
  return descricao.split(",").slice(0, partes).map((p) => p.trim()).filter(Boolean).join(", ");
}

function paraSugestao(item: NominatimItem): SugestaoLocal {
  return {
    id: `${item.osm_type ?? "place"}-${item.osm_id ?? item.lat}-${item.lon}`,
    descricao: item.display_name,
    resumo: resumoEndereco(item.display_name),
    latitude: Number(item.lat),
    longitude: Number(item.lon),
  };
}

export async function buscarSugestoes(termo: string, sinal?: AbortSignal): Promise<SugestaoLocal[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", termo);
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "pt-BR");

  const resposta = await fetch(url, { signal: sinal, headers: { Accept: "application/json" } });
  if (!resposta.ok) throw new Error("Não foi possível buscar endereços agora.");
  const dados = (await resposta.json()) as NominatimItem[];
  return dados.map(paraSugestao);
}

export async function enderecoPorCoordenada(lat: number, lng: number, sinal?: AbortSignal): Promise<string> {
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
  return dado.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
