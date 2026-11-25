"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { EventoForm } from "@/components/evento-form";
import { EmptyState, Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Evento, Grupo } from "@/lib/types";

export default function EditarEventoPage() {
  const { id, eventoId } = useParams<{ id: string; eventoId: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const [dados, setDados] = useState<{ grupo: Grupo; evento: Evento } | null | undefined>(undefined);
  const [motivo, setMotivo] = useState<"acesso" | "encerrado" | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const [{ data: grupo }, { data: evento }, { data: vinculo }] = await Promise.all([
        supabase.from("grupos").select("*").eq("id", id).maybeSingle(),
        supabase.from("eventos").select("*").eq("id", eventoId).eq("grupo_id", id).maybeSingle(),
        supabase.from("grupo_membros").select("is_admin").eq("grupo_id", id).eq("usuario_id", userId).maybeSingle(),
      ]);
      if (!grupo || !evento) {
        router.replace(`/grupos/${id}`);
        return;
      }
      if (!ativo) return;
      if (evento.data_evento < new Date().toISOString().slice(0, 10)) {
        setMotivo("encerrado");
        setDados(null);
        return;
      }
      if (!(vinculo?.is_admin || evento.criador_id === userId)) {
        setMotivo("acesso");
        setDados(null);
        return;
      }
      setDados({ grupo: grupo as Grupo, evento: evento as Evento });
    })();
    return () => { ativo = false; };
  }, [id, eventoId, userId, router]);

  if (dados === undefined) return <Spinner />;
  if (dados === null) {
    return motivo === "encerrado" ? (
      <EmptyState
        titulo="Evento encerrado"
        descricao="Este evento já aconteceu e não pode mais ser editado."
        icone={<ShieldX size={28} />}
        acao={<button onClick={() => router.push(`/grupos/${id}`)} className="btn-primary">Voltar ao grupo</button>}
      />
    ) : (
      <EmptyState titulo="Acesso negado 🚫" descricao="Só o criador do evento ou um administrador pode editá-lo." icone={<ShieldX size={28} />} />
    );
  }
  return <EventoForm grupo={dados.grupo} evento={dados.evento} />;
}
