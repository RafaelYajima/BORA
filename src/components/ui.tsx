/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { iniciais } from "@/lib/format";

export function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <Link href="/dashboard" className="font-display inline-flex items-baseline gap-1 text-2xl font-extrabold tracking-tighter text-primary">
      BORA<span className="text-ink">!</span>
      {!compacto && <span className="ml-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-normal text-primary">2.0</span>}
    </Link>
  );
}

export function Avatar({
  nome,
  foto,
  tamanho = 40,
  className = "",
}: {
  nome: string;
  foto?: string | null;
  tamanho?: number;
  className?: string;
}) {
  const style = { width: tamanho, height: tamanho };
  if (foto) {
    return (
      <img
        src={foto}
        alt={`Foto de ${nome}`}
        style={style}
        className={`shrink-0 rounded-full border-2 border-line object-cover ${className}`}
      />
    );
  }
  return (
    <span
      style={style}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-400 text-xs font-bold text-white ${className}`}
    >
      {iniciais(nome) || "?"}
    </span>
  );
}

export function PageHeader({
  titulo,
  subtitulo,
  acoes,
  voltar,
}: {
  titulo: string;
  subtitulo?: string;
  acoes?: React.ReactNode;
  voltar?: { href: string; label: string };
}) {
  return (
    <header className="mb-8 animate-in">
      {voltar && (
        <Link href={voltar.href} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-primary">
          ← {voltar.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">{titulo}</h1>
          {subtitulo && <p className="mt-1 text-sm text-muted">{subtitulo}</p>}
        </div>
        {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
      </div>
    </header>
  );
}

export function EmptyState({
  titulo,
  descricao,
  icone,
  acao,
}: {
  titulo: string;
  descricao?: string;
  icone?: React.ReactNode;
  acao?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      {icone && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary">{icone}</div>}
      <h3 className="font-display text-lg font-bold text-ink">{titulo}</h3>
      {descricao && <p className="mt-1 max-w-sm text-sm text-muted">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

export function Spinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {label}
    </div>
  );
}

export function Erro({ mensagem }: { mensagem: string }) {
  return (
    <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
      {mensagem}
    </p>
  );
}
