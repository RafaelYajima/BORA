"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin, X } from "lucide-react";
import type L from "leaflet";

type Coordenada = { latitude: number | null; longitude: number | null };

export function MapaPicker({
  latitude,
  longitude,
  onChange,
}: Coordenada & { onChange: (lat: number | null, lng: number | null) => void }) {
  const holder = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const marcador = useRef<L.Marker | null>(null);
  const leafletMod = useRef<typeof L | null>(null);
  const [posicao, setPosicao] = useState<Coordenada>({ latitude, longitude });

  useEffect(() => {
    let ativo = true;
    let leaflet: typeof L;

    import("leaflet").then((mod) => {
      if (!ativo || !holder.current || mapa.current) return;
      leaflet = mod;
      leafletMod.current = mod;
      const centro: [number, number] = latitude && longitude ? [latitude, longitude] : [-21.212, -50.44];
      const map = leaflet.map(holder.current, { center: centro, zoom: latitude ? 15 : 12 });
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const marker = latitude && longitude ? leaflet.marker(centro, { draggable: true }).addTo(map) : null;
      marker?.on("dragend", () => {
        const p = marker.getLatLng();
        setPosicao({ latitude: p.lat, longitude: p.lng });
        onChange(p.lat, p.lng);
      });
      map.on("click", (ev: L.LeafletMouseEvent) => {
        if (marker) {
          marker.setLatLng(ev.latlng);
        } else {
          marcador.current = leaflet.marker(ev.latlng, { draggable: true }).addTo(map);
          marcador.current.on("dragend", () => {
            const p = marcador.current!.getLatLng();
            setPosicao({ latitude: p.lat, longitude: p.lng });
            onChange(p.lat, p.lng);
          });
        }
        setPosicao({ latitude: ev.latlng.lat, longitude: ev.latlng.lng });
        onChange(ev.latlng.lat, ev.latlng.lng);
      });
      mapa.current = map;
      marcador.current = marker;
      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      ativo = false;
      mapa.current?.remove();
      mapa.current = null;
    };
    // A posição inicial é definida só na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const lat = coords.latitude;
      const lng = coords.longitude;
      setPosicao({ latitude: lat, longitude: lng });
      onChange(lat, lng);
      mapa.current?.flyTo([lat, lng], 16);
      if (marcador.current) marcador.current.setLatLng([lat, lng]);
      else if (mapa.current && leafletMod.current) {
        marcador.current = leafletMod.current.marker([lat, lng], { draggable: true }).addTo(mapa.current);
        marcador.current.on("dragend", () => {
          const p = marcador.current!.getLatLng();
          setPosicao({ latitude: p.lat, longitude: p.lng });
          onChange(p.lat, p.lng);
        });
      }
    });
  }

  return (
    <div className="space-y-2">
      <div ref={holder} className="h-56 w-full overflow-hidden rounded-xl border border-line" />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-muted">
          {posicao.latitude && posicao.longitude
            ? <><MapPin size={13} className="mr-1 inline" />{posicao.latitude.toFixed(5)}, {posicao.longitude.toFixed(5)}</>
            : "Clique no mapa para marcar o ponto do evento"}
        </span>
        <button type="button" onClick={usarMinhaLocalizacao} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
          <Crosshair size={14} /> Usar minha localização
        </button>
      </div>
      {(posicao.latitude || posicao.longitude) && (
        <button type="button" onClick={() => { setPosicao({ latitude: null, longitude: null }); onChange(null, null); marcador.current?.remove(); marcador.current = null; }} className="text-xs font-medium text-danger hover:underline">
          Remover ponto do mapa
        </button>
      )}
    </div>
  );
}

export function MapaModal({
  titulo,
  latitude,
  longitude,
  onFechar,
}: {
  titulo: string;
  latitude: number;
  longitude: number;
  onFechar: () => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);

  useEffect(() => {
    let ativo = true;
    import("leaflet").then((L) => {
      if (!ativo || !holder.current) return;
      const map = L.map(holder.current, { center: [latitude, longitude], zoom: 15 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      L.marker([latitude, longitude]).addTo(map).bindPopup(titulo).openPopup();
      mapa.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    });
    return () => {
      ativo = false;
      mapa.current?.remove();
      mapa.current = null;
    };
  }, [latitude, longitude, titulo]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="card w-full max-w-2xl overflow-hidden p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="font-display font-bold text-ink">📍 {titulo}</h3>
          <button onClick={onFechar} aria-label="Fechar mapa" className="rounded-lg p-1.5 text-muted hover:bg-soft hover:text-ink"><X size={19} /></button>
        </div>
        <div ref={holder} className="h-[60vh] w-full" />
      </div>
    </div>
  );
}
