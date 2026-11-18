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

    const resultado = grupo
      ? await supabase.from("grupos").update(dados).eq("id", grupo.id).select().single()
      : await supabase.from("grupos").insert({ ...dados, codigo: gerarCodigoGrupo(), criador_id: sessao.user.id }).select().single();

    setSalvando(false);
    if (resultado.error || !resultado.data) {
      setErro(resultado.error?.message ?? "Não foi possível salvar o grupo.");
      return;
    }
    router.push(`/grupos/${resultado.data.id}`);
    router.refresh();
  }

  return (
    <>
      <PageHeader
        titulo={grupo ? "Editar grupo" : "Criar novo grupo"}
        subtitulo={grupo ? "Atualize as informações do grupo." : "Reúna as pessoas e comece a agendar."}
        voltar={{ href: grupo ? `/grupos/${grupo.id}` : "/grupos", label: "Voltar" }}
      />
      <form onSubmit={salvar} className="card max-w-2xl space-y-5 p-6">
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
            <span className="block text-sm font-semibold text-ink">Mural restrito aos membros</span>
            <span className="block text-xs text-muted">Só participantes do grupo poderão ler e enviar mensagens.</span>
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
    </>
  );
}
