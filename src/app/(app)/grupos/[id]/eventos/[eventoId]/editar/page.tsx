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
      if (ativo) {
        setDados(vinculo?.is_admin || evento.criador_id === userId ? { grupo: grupo as Grupo, evento: evento as Evento } : null);
      }
    })();
    return () => { ativo = false; };
  }, [id, eventoId, userId, router]);

  if (dados === undefined) return <Spinner />;
  if (dados === null) {
    return <EmptyState titulo="Acesso negado 🚫" descricao="Só o criador do evento ou um administrador pode editá-lo." icone={<ShieldX size={28} />} />;
  }
  return <EventoForm grupo={dados.grupo} evento={dados.evento} />;
}
