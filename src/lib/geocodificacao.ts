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
  estado?: string;
  erro?: boolean;
};

export type FiltrosEndereco = {
  estado?: string;
  cidade?: string;
  bairro?: string;
};

export type EnderecoParaLocalizar = {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
};

export type LocalizacaoEncontrada = {
  latitude: number;
  longitude: number;
  descricao: string;
  aproximado: boolean;
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
  aproximado?: boolean;
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

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function nomeDoEstado(estado: string) {
  const sigla = estado.trim().toUpperCase();
  return ESTADOS_BRASIL.find(([uf]) => uf === sigla)?.[1] ?? estado.trim();
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

async function consultarNominatim(
  parametros: Record<string, string>,
  sinal?: AbortSignal,
): Promise<NominatimItem[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "pt-BR");
  Object.entries(parametros).forEach(([chave, valor]) => url.searchParams.set(chave, valor));

  const resposta = await fetch(url, { signal: sinal, headers: { Accept: "application/json" } });
  if (!resposta.ok) throw new Error("Não foi possível buscar endereços agora.");
  return (await resposta.json()) as NominatimItem[];
}

function corresponde(item: NominatimItem, cidade: string, estado: string) {
  const endereco = item.address ?? {};
  const cidades = [endereco.city, endereco.town, endereco.village, endereco.municipality]
    .filter(Boolean).map(normalizar);
  const cidadeEsperada = normalizar(cidade);
  const ufEsperada = normalizar(estado);
  const nomeEsperado = normalizar(nomeDoEstado(estado));
  const ufEncontrada = normalizar(
    endereco["ISO3166-2-lvl4"]?.split("-")[1] ?? endereco.state ?? "",
  );
  const estadoEncontrado = normalizar(endereco.state ?? "");
  const cidadeOk = !cidadeEsperada || cidades.some((nome) => nome.includes(cidadeEsperada) || cidadeEsperada.includes(nome));
  const estadoOk = !ufEsperada
    || ufEncontrada === ufEsperada
    || estadoEncontrado === ufEsperada
    || estadoEncontrado === nomeEsperado
    || estadoEncontrado.includes(nomeEsperado);
  return cidadeOk && estadoOk;
}

function esperar(ms: number, sinal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (sinal?.aborted) {
      reject(new DOMException("Busca cancelada", "AbortError"));
      return;
    }
    const cancelar = () => {
      clearTimeout(timer);
      reject(new DOMException("Busca cancelada", "AbortError"));
    };
    const timer = setTimeout(() => {
      sinal?.removeEventListener("abort", cancelar);
      resolve();
    }, ms);
    sinal?.addEventListener("abort", cancelar, { once: true });
  });
}

/**
 * Localiza um endereço mesmo quando a busca livre falha: tenta busca
 * estruturada (sem o bairro, que costuma diferir no OSM), depois busca livre
 * e, por fim, o centro da cidade. Nunca aceita um resultado de outra cidade/UF.
 */
export async function localizarEndereco(
  endereco: EnderecoParaLocalizar,
  sinal?: AbortSignal,
): Promise<LocalizacaoEncontrada | null> {
  const rua = endereco.rua?.trim() ?? "";
  const numero = endereco.numero?.trim() ?? "";
  const bairro = endereco.bairro?.trim() ?? "";
  const cidade = endereco.cidade?.trim() ?? "";
  const estado = endereco.estado?.trim() ?? "";
  const estadoNome = nomeDoEstado(estado);
  const cep = endereco.cep?.replace(/\D/g, "") ?? "";

  const tentativas: { parametros: Record<string, string>; aproximado: boolean }[] = [];
  if (rua) {
    if (cidade && estado) {
      tentativas.push({
        parametros: {
          street: [numero, rua].filter(Boolean).join(" "),
          city: cidade,
          state: estadoNome,
          country: "Brasil",
        },
        aproximado: false,
      });
      if (numero) {
        tentativas.push({
          parametros: { street: rua, city: cidade, state: estadoNome, country: "Brasil" },
          aproximado: true,
        });
      }
    }
    tentativas.push({
      parametros: { q: [rua, cidade, estado, "Brasil"].filter(Boolean).join(", ") },
      aproximado: false,
    });
    tentativas.push({
      parametros: { q: [rua, bairro, cidade, estado, "Brasil"].filter(Boolean).join(", ") },
      aproximado: false,
    });
  }
  if (cep) {
    tentativas.push({
      parametros: { q: [cep, cidade, estado, "Brasil"].filter(Boolean).join(", ") },
      aproximado: true,
    });
  }
  if (cidade && estado) {
    tentativas.push({
      parametros: { city: cidade, state: estadoNome, country: "Brasil" },
      aproximado: true,
    });
  }

  for (let indice = 0; indice < tentativas.length; indice += 1) {
    if (indice > 0) await esperar(1100, sinal);
    const { parametros, aproximado } = tentativas[indice];
    const itens = await consultarNominatim(parametros, sinal);
    const melhor = itens.find((item) => corresponde(item, cidade, estado));
    if (melhor) {
      return {
        latitude: Number(melhor.lat),
        longitude: Number(melhor.lon),
        descricao: melhor.display_name,
        aproximado,
      };
    }
  }
  return null;
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

  return (await consultarNominatim({ q }, sinal)).map(paraSugestao);
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

  const localizado = await localizarEndereco({
    rua: detalhes.rua,
    bairro: detalhes.bairro,
    cidade: detalhes.cidade,
    estado: dado.estado || detalhes.estado,
    cep: detalhes.cep,
  }, sinal);
  return {
    ...detalhes,
    latitude: localizado?.latitude ?? null,
    longitude: localizado?.longitude ?? null,
    descricaoCompleta: localizado?.descricao
      ?? [detalhes.rua, detalhes.bairro, `${detalhes.cidade}/${detalhes.estado}`, detalhes.cep].filter(Boolean).join(", "),
    aproximado: localizado?.aproximado,
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
