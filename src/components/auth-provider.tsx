"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

type PerfilPatch = Partial<Pick<Profile, "nome" | "foto" | "tag">>;
type AuthValue = {
  userId: string;
  email: string;
  perfil: Profile;
  atualizarPerfil: (patch: PerfilPatch) => void;
};
const AuthContext = createContext<AuthValue | null>(null);

export function useAuth() {
  const valor = useContext(AuthContext);
  if (!valor) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return valor;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [valor, setValor] = useState<AuthValue | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      const { data: perfil } = await supabase
        .from("profiles")
        .select("id, nome, tag, foto, criado_em")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!perfil) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }
      if (!ativo) return;
      setValor({
        userId: data.user.id,
        email: data.user.email ?? "",
        perfil: perfil as Profile,
        atualizarPerfil: (patch) =>
          setValor((atual) => (atual ? { ...atual, perfil: { ...atual.perfil, ...patch } } : atual)),
      });
    })();
    return () => { ativo = false; };
  }, [router]);

  if (!valor) return <Spinner label="Carregando sua conta..." />;
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
