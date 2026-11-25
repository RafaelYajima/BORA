"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

/** Mostra "rua, número" e deixa os detalhes completos em uma linha expansível. */
export function EnderecoResumo({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false);
  const [curto, ...resto] = texto.split(" — ");
  if (resto.length === 0) {
    return <span className="inline-flex items-center gap-1"><MapPin size={14} className="text-primary" /> {texto}</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <MapPin size={14} className="text-primary" /> {curto}
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        className="font-semibold text-primary hover:underline"
      >
        {aberto ? "Menos detalhes" : "Ver detalhes"}
      </button>
      {aberto && <span className="w-full text-muted">{resto.join(" — ")}</span>}
    </span>
  );
}
