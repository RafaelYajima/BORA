"use client";

import { useState } from "react";
import { CalendarPlus, MessageCircle, Share2 } from "lucide-react";
import { baixarIcs, gerarIcs } from "@/lib/calendario";
import { compartilharOuCopiar, linkWhatsapp, textoConviteEvento } from "@/lib/convites";
import type { Evento } from "@/lib/types";

function nomeArquivo(nome: string) {
  return `${nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "evento"}.ics`;
}

export function EventoAcoes({
  evento,
  grupo,
}: {
  evento: Evento;
  grupo?: { nome?: string; codigo?: string };
}) {
  const [aviso, setAviso] = useState("");

  function origem() {
    return typeof window === "undefined" ? "" : window.location.origin;
  }

  function texto() {
    return textoConviteEvento(
      evento,
      grupo?.nome || "nosso grupo",
      grupo?.codigo || "",
      origem(),
    );
  }

  function adicionarCalendario() {
    baixarIcs(gerarIcs(evento, origem()), nomeArquivo(evento.nome));
    setAviso("Evento salvo com lembretes 1 dia e 1 hora antes.");
  }

  async function compartilhar() {
    const resultado = await compartilharOuCopiar(texto(), evento.nome);
    setAviso(
      resultado === "compartilhado"
        ? "Convite compartilhado!"
        : resultado === "copiado"
          ? "Convite copiado. Cole no chat dos amigos!"
          : "Não foi possível copiar. Tente o WhatsApp.",
    );
  }

  function abrirWhatsapp() {
    window.open(linkWhatsapp(texto()), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" onClick={adicionarCalendario} className="btn-secondary px-3 py-1.5 text-xs">
        <CalendarPlus size={14} /> Calendário
      </button>
      <button type="button" onClick={compartilhar} className="btn-secondary px-3 py-1.5 text-xs">
        <Share2 size={14} /> Compartilhar
      </button>
      <button type="button" onClick={abrirWhatsapp} className="btn-secondary px-3 py-1.5 text-xs">
        <MessageCircle size={14} /> WhatsApp
      </button>
      {aviso && <span className="text-xs font-medium text-success">{aviso}</span>}
    </div>
  );
}
