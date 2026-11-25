"use client";

import { useState } from "react";
import { ChevronDown, Trophy } from "lucide-react";
import { Avatar } from "@/components/ui";
import type { MembroPontuado } from "@/lib/pontuacao";
import type { Profile } from "@/lib/types";

const MEDALHAS = ["🥇", "🥈", "🥉"];

export function RankingGrupo({
  ranking,
  perfis,
  usuarioId,
}: {
  ranking: MembroPontuado[];
  perfis: Record<string, Profile>;
  usuarioId: string;
}) {
  const [aberto, setAberto] = useState(false);
  const posicao = ranking.findIndex((item) => item.usuarioId === usuarioId) + 1;
  const visiveis = aberto ? ranking : ranking.slice(0, 3);
  const eu = ranking.find((item) => item.usuarioId === usuarioId);

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Ranking do grupo</h3>
        <Trophy size={17} className="text-primary" />
      </div>
      <p className="mb-3 text-xs text-muted">
        +10 por evento criado · +5 por presença confirmada · +3 se confirmou com 1 dia de antecedência · +2 por mensagem (até 10)
      </p>
      <ul className="space-y-3">
        {visiveis.map((item, indice) => {
          const perfil = perfis[item.usuarioId];
          const souEu = item.usuarioId === usuarioId;
          return (
            <li key={item.usuarioId} className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${souEu ? "bg-primary/10" : ""}`}>
              <span className="w-6 text-center text-base">{MEDALHAS[indice] ?? `#${indice + 1}`}</span>
              <Avatar nome={perfil?.nome ?? "?"} foto={perfil?.foto} tamanho={30} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{souEu ? "Você" : perfil?.nome ?? "Participante"}</p>
                {item.selos.length > 0 && (
                  <p className="truncate text-xs" title={item.selos.map((selo) => `${selo.nome}: ${selo.descricao}`).join(" · ")}>
                    {item.selos.map((selo) => selo.emoji).join(" ")}
                  </p>
                )}
              </div>
              <span className="font-display text-sm font-extrabold text-primary">{item.pontos} pts</span>
            </li>
          );
        })}
      </ul>

      {eu && posicao > 3 && !aberto && (
        <p className="mt-3 border-t border-line pt-3 text-xs font-semibold text-muted">
          Você está em {posicao}º lugar com {eu.pontos} pts.
        </p>
      )}
      {ranking.length > 3 && (
        <button
          type="button"
          onClick={() => setAberto((valor) => !valor)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          {aberto ? "Mostrar só o pódio" : `Ver todos (${ranking.length})`}
          <ChevronDown size={13} className={aberto ? "rotate-180" : ""} />
        </button>
      )}
      {eu?.selos.length ? (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Seus selos</p>
          <div className="flex flex-wrap gap-1.5">
            {eu.selos.map((selo) => (
              <span key={selo.id} title={selo.descricao} className="chip bg-soft text-ink">{selo.emoji} {selo.nome}</span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
