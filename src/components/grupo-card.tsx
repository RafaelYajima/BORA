import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import type { Grupo } from "@/lib/types";

export function GrupoCard({ grupo, totalMembros, admin = false }: { grupo: Grupo; totalMembros?: number; admin?: boolean }) {
  return (
    <Link href={`/grupos/${grupo.id}`} className="card group animate-in block p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan-400 font-display text-lg font-bold text-white">
          {grupo.nome.charAt(0).toUpperCase()}
        </div>
        <ArrowUpRight size={18} className="text-muted transition group-hover:text-primary" />
      </div>
      <h3 className="font-display mt-4 truncate text-lg font-bold text-ink">{grupo.nome}</h3>
      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted">{grupo.descricao || "Um espaço para combinar seus eventos."}</p>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1"><Users size={13} /> {totalMembros ?? "—"} membro{(totalMembros ?? 0) === 1 ? "" : "s"}</span>
        <span className="font-mono font-bold tracking-wider text-primary">{grupo.codigo}</span>
      </div>
      {admin && <span className="mt-3 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">Administrador</span>}
    </Link>
  );
}
