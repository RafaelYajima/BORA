"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { GrupoForm } from "@/components/grupo-form";
import { EmptyState, Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Grupo } from "@/lib/types";

export default function EditarGrupoPage() {
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
        supabase.from("grupo_membros").select("is_admin").eq("grupo_id", id).eq("usuario_id", userId).maybeSingle(),
      ]);
      if (!grupoData) {
        router.replace("/grupos");
        return;
      }
      if (ativo) setGrupo(vinculo?.is_admin ? (grupoData as Grupo) : null);
    })();
    return () => { ativo = false; };
  }, [id, userId, router]);

  if (grupo === undefined) return <Spinner />;
  if (grupo === null) {
    return <EmptyState titulo="Acesso negado 🚫" descricao="Somente administradores podem editar este grupo." icone={<ShieldX size={28} />} />;
  }
  return <GrupoForm grupo={grupo} />;
}
