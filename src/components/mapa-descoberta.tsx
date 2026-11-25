"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";

export type PontoEvento = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
};

export function MapaDescoberta({
  pontos,
  selecionadoId,
  aoSelecionar,
}: {
  pontos: PontoEvento[];
  selecionadoId: string | null;
  aoSelecionar: (id: string) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const camada = useRef<L.LayerGroup | null>(null);
  const leaflet = useRef<typeof L | null>(null);
  const aoSelecionarRef = useRef(aoSelecionar);

  useEffect(() => { aoSelecionarRef.current = aoSelecionar; }, [aoSelecionar]);

  useEffect(() => {
    let ativo = true;
    import("leaflet").then((mod) => {
      if (!ativo || !holder.current || mapa.current) return;
      leaflet.current = mod;
      const map = mod.map(holder.current, { center: [-21.212, -50.44], zoom: 12 });
      mod.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      camada.current = mod.layerGroup().addTo(map);
      mapa.current = map;
      setTimeout(() => map.invalidateSize(), 120);
    });
    return () => {
      ativo = false;
      mapa.current?.remove();
      mapa.current = null;
      camada.current = null;
    };
  }, []);

  useEffect(() => {
    const mod = leaflet.current;
    const grupo = camada.current;
    const map = mapa.current;
    if (!mod || !grupo || !map) return;
    grupo.clearLayers();
    pontos.forEach((ponto) => {
      const marcador = mod.marker([ponto.latitude, ponto.longitude])
        .bindPopup(ponto.nome)
        .addTo(grupo);
      marcador.on("click", () => aoSelecionarRef.current(ponto.id));
    });
    if (pontos.length > 1) {
      map.fitBounds(pontos.map((p) => [p.latitude, p.longitude] as [number, number]), { padding: [40, 40], maxZoom: 14 });
    } else if (pontos.length === 1) {
      map.setView([pontos[0].latitude, pontos[0].longitude], 14);
    }
  }, [pontos]);

  useEffect(() => {
    const map = mapa.current;
    if (!map || !selecionadoId) return;
    const ponto = pontos.find((p) => p.id === selecionadoId);
    if (ponto) map.flyTo([ponto.latitude, ponto.longitude], Math.max(map.getZoom(), 14));
  }, [selecionadoId, pontos]);

  return <div ref={holder} className="h-[360px] w-full overflow-hidden rounded-2xl border border-line" />;
}
