"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { EventoForm } from "@/components/evento-form";
import { EmptyState, Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Grupo } from "@/lib/types";

export default function NovoEventoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const [grupo, setGrupo] = useState<Grupo | null | undefined>(undefined);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const [{ data: grupoData }, { data: vinculo }] = await Promise.all([
        supabase.from("grupos").select("*").eq("id", id).maybeSingle(),
        supabase.from("grupo_membros").select("status").eq("grupo_id", id).eq("usuario_id", userId).maybeSingle(),
      ]);
      if (!grupoData) {
        router.replace("/grupos");
        return;
      }
      if (ativo) setGrupo(vinculo?.status === "ativo" ? (grupoData as Grupo) : null);
    })();
    return () => { ativo = false; };
  }, [id, userId, router]);

  if (grupo === undefined) return <Spinner />;
  if (grupo === null) {
    return <EmptyState titulo="Acesso negado 🚫" descricao="Você precisa ser membro do grupo para criar eventos." icone={<ShieldX size={28} />} />;
  }
  return <EventoForm grupo={grupo} />;
}
