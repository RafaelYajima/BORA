"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { CronogramaView } from "@/components/cronograma-view";
import { Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { EventoComGrupo, Grupo } from "@/lib/types";

export default function CronogramaPage() {
  const { userId } = useAuth();
  const [eventos, setEventos] = useState<EventoComGrupo[] | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const { data: vinculos } = await supabase
        .from("grupo_membros")
        .select("grupo_id")
        .eq("usuario_id", userId)
        .eq("status", "ativo");
      const ids = (vinculos ?? []).map((v) => v.grupo_id);
      const { data } = ids.length
        ? await supabase
            .from("eventos")
            .select("*, grupos(id, nome, codigo), presencas(*)")
            .in("grupo_id", ids)
            .order("data_evento")
            .order("hora_evento")
        : { data: [] };
      if (!ativo) return;
      setEventos(((data ?? []) as unknown as EventoComGrupo[]).filter((e) => e.grupos?.id && (e.grupos as Grupo).nome));
    })();
    return () => { ativo = false; };
  }, [userId]);

  if (!eventos) return <Spinner />;
  return <CronogramaView eventos={eventos} usuarioId={userId} />;
}
