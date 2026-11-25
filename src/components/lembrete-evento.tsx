"use client";

import { useEffect, useState } from "react";
import { Bell, Mail, Smartphone } from "lucide-react";
import { ativarPush } from "@/lib/push";
import { createClient } from "@/lib/supabase/client";

type Canal = "push" | "email";

export function LembreteEvento({ eventoId, usuarioId }: { eventoId: string; usuarioId: string }) {
  const [ativos, setAtivos] = useState<Set<Canal>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<Canal | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    createClient()
      .from("evento_lembretes")
      .select("canal")
      .eq("evento_id", eventoId)
      .eq("usuario_id", usuarioId)
      .then(({ data }) => {
        if (!ativo) return;
        setAtivos(new Set((data ?? []).map((linha) => linha.canal as Canal)));
        setCarregando(false);
      });
    return () => { ativo = false; };
  }, [eventoId, usuarioId]);

  async function alternar(canal: Canal) {
    const supabase = createClient();
    setErro("");
    if (ativos.has(canal)) {
      setSalvando(canal);
      const { error } = await supabase.from("evento_lembretes").delete()
        .eq("evento_id", eventoId).eq("usuario_id", usuarioId).eq("canal", canal);
      setSalvando(null);
      if (error) {
        setErro(error.message);
        return;
      }
      setAtivos((atual) => {
        const proximo = new Set(atual);
        proximo.delete(canal);
        return proximo;
      });
      return;
    }

    setSalvando(canal);
    try {
      if (canal === "push") await ativarPush(usuarioId);
      const { error } = await supabase.from("evento_lembretes").insert({
        evento_id: eventoId,
        usuario_id: usuarioId,
        canal,
      });
      if (error) throw error;
      setAtivos((atual) => new Set(atual).add(canal));
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível ativar o lembrete.");
    }
    setSalvando(null);
  }

  if (carregando) return null;

  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
          <Bell size={15} className="text-primary" /> Lembretes automáticos
        </span>
        <span className="text-[11px] text-muted">24h e 1h antes, além do convite no calendário.</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => alternar("push")}
          disabled={salvando !== null}
          className={`btn px-3 py-1.5 text-xs ${ativos.has("push") ? "bg-success text-white" : "border border-line text-muted hover:text-primary"}`}
        >
          <Smartphone size={13} /> {ativos.has("push") ? "Push ativo" : "Ativar push"}
        </button>
        <button
          type="button"
          onClick={() => alternar("email")}
          disabled={salvando !== null}
          className={`btn px-3 py-1.5 text-xs ${ativos.has("email") ? "bg-success text-white" : "border border-line text-muted hover:text-primary"}`}
        >
          <Mail size={13} /> {ativos.has("email") ? "E-mail ativo" : "Ativar e-mail"}
        </button>
      </div>
      {erro && <p className="mt-2 text-xs text-danger">{erro}</p>}
    </div>
  );
}
