"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Erro, PageHeader } from "@/components/ui";
import { gerarCodigoGrupo } from "@/lib/codigo";
import { createClient } from "@/lib/supabase/client";
import type { Grupo } from "@/lib/types";

export function GrupoForm({ grupo }: { grupo?: Grupo }) {
  const router = useRouter();
  const [nome, setNome] = useState(grupo?.nome ?? "");
  const [descricao, setDescricao] = useState(grupo?.descricao ?? "");
  const [restrito, setRestrito] = useState(grupo?.chat_restrito ?? false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    const supabase = createClient();
    const { data: sessao } = await supabase.auth.getUser();
    if (!sessao.user) {
      setErro("Sua sessão expirou. Entre novamente.");
      setSalvando(false);
      return;
    }
    const dados = { nome: nome.trim(), descricao: descricao.trim() || null, chat_restrito: restrito };

    if (grupo) {
      const { error } = await supabase.from("grupos").update(dados).eq("id", grupo.id);
      setSalvando(false);
      if (error) return setErro(error.message);
      router.push(`/grupos/${grupo.id}`);
      return;
    }

    // Geramos o id no cliente para não depender de RETURNING: o SELECT da
    // política RLS ainda não vê a associação de membro criada pelo trigger.
    const id = crypto.randomUUID();
    const { error } = await supabase.from("grupos").insert({
      id,
      ...dados,
      codigo: gerarCodigoGrupo(),
      criador_id: sessao.user.id,
    });
    setSalvando(false);
    if (error) return setErro(error.message);
    router.push(`/grupos/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        titulo={grupo ? "Editar grupo" : "Criar novo grupo"}
        subtitulo={grupo ? "Atualize as informações do grupo." : "Reúna as pessoas e comece a agendar."}
        voltar={{ href: grupo ? `/grupos/${grupo.id}` : "/grupos", label: "Voltar" }}
      />
      <form onSubmit={salvar} className="card space-y-5 p-6">
        <div>
          <label className="label" htmlFor="nome">Nome do grupo *</label>
          <input id="nome" required maxLength={100} className="input" placeholder="Ex: Time de futebol, Turma da faculdade..." value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="descricao">Descrição</label>
          <textarea id="descricao" rows={4} maxLength={500} className="input resize-none" placeholder="Fale sobre o objetivo do grupo..." value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-soft p-4">
          <input type="checkbox" checked={restrito} onChange={(e) => setRestrito(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
          <span>
            <span className="block text-sm font-semibold text-ink">Mural restrito a administradores</span>
            <span className="block text-xs text-muted">Só o dono e os administradores podem enviar mensagens. Todos os membros continuam podendo ler.</span>
          </span>
        </label>
        {erro && <Erro mensagem={erro} />}
        <div className="flex justify-end gap-2 border-t border-line pt-5">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? "Salvando..." : <>{grupo ? "Salvar alterações" : "Criar grupo"} <ArrowRight size={16} /></>}
          </button>
        </div>
      </form>
    </div>
  );
}
