"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Ticket } from "lucide-react";
import { Erro, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function EntrarGrupoForm({ codigoInicial = "" }: { codigoInicial?: string }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState(codigoInicial.trim().toUpperCase());
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const supabase = createClient();
    const { data: sessao } = await supabase.auth.getUser();
    if (!sessao.user) {
      setErro("Sua sessão expirou. Entre novamente.");
      setCarregando(false);
      return;
    }
    // RPC security definer: permite consultar um grupo pelo código exato
    // sem expor a tabela de grupos para usuários que ainda não são membros.
    const resposta = await supabase
      .rpc("buscar_grupo_por_codigo", { p_codigo: codigo.trim().toUpperCase() })
      .maybeSingle();
    const grupo = resposta.data as { id: string; nome: string } | null;

    if (!grupo) {
      setErro("Código não encontrado. Confira com quem te convidou.");
      setCarregando(false);
      return;
    }

    const { error } = await supabase.from("grupo_membros").insert({
      grupo_id: grupo.id,
      usuario_id: sessao.user.id,
      is_admin: false,
      status: "ativo",
    });
    setCarregando(false);
    if (error) {
      setErro(error.code === "23505" ? "Você já está neste grupo ou foi banido dele." : error.message);
      return;
    }
    router.push(`/grupos/${grupo.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader titulo="Entrar em um grupo" subtitulo="Digite o código compartilhado por um participante." voltar={{ href: "/grupos", label: "Meus grupos" }} />
      <form onSubmit={entrar} className="card max-w-md space-y-5 p-6">
        <div>
          <label className="label" htmlFor="codigo">Código do grupo</label>
          <div className="relative">
            <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input
              id="codigo"
              required
              maxLength={12}
              autoCapitalize="characters"
              className="input pl-11 font-mono text-lg uppercase tracking-[0.25em]"
              placeholder="ABC123"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            />
          </div>
        </div>
        {erro && <Erro mensagem={erro} />}
        <button type="submit" disabled={carregando} className="btn-primary w-full">
          {carregando ? "Entrando..." : <>Entrar no grupo <ArrowRight size={16} /></>}
        </button>
      </form>
    </div>
  );
}
