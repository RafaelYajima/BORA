"use client";

import { useState } from "react";
import { ListaEventos } from "@/components/eventos-lista";
import { PageHeader } from "@/components/ui";
import type { EventoComGrupo } from "@/lib/types";

export function CronogramaView({ eventos, usuarioId }: { eventos: EventoComGrupo[]; usuarioId: string }) {
  const [aba, setAba] = useState<"proximos" | "historico">("proximos");
  const hoje = new Date().toISOString().slice(0, 10);
  const proximos = eventos.filter((e) => e.data_evento >= hoje);
  const historico = eventos.filter((e) => e.data_evento < hoje);

  return (
    <>
      <PageHeader titulo="Cronograma" subtitulo="Todos os eventos dos seus grupos, em ordem de data." />

      <div className="mb-6 inline-flex gap-1 rounded-xl bg-soft p-1">
        <button onClick={() => setAba("proximos")} className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${aba === "proximos" ? "bg-surface text-primary shadow-sm" : "text-muted"}`}>
          Próximos <span className="ml-1 text-xs">({proximos.length})</span>
        </button>
        <button onClick={() => setAba("historico")} className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${aba === "historico" ? "bg-surface text-primary shadow-sm" : "text-muted"}`}>
          Histórico <span className="ml-1 text-xs">({historico.length})</span>
        </button>
      </div>

      <ListaEventos
        eventos={aba === "proximos" ? proximos : historico}
        usuarioId={usuarioId}
        mostrarGrupo
        historico={aba === "historico"}
        mensagemVazia={aba === "proximos" ? "Nenhum evento próximo. Bora criar um!" : "Nenhum evento no histórico."}
      />
    </>
  );
}
