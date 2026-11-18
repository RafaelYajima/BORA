"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockKeyhole, UserRound } from "lucide-react";
import { Erro, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function PerfilForm({ perfil, email }: { perfil: Profile; email: string }) {
  const router = useRouter();
  const [nome, setNome] = useState(perfil.nome);
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    if (senha || confirmacao) {
      if (senha !== confirmacao) return setErro("As senhas não coincidem.");
      if (senha.length < 6) return setErro("A nova senha precisa ter pelo menos 6 caracteres.");
    }
    setSalvando(true);
    const supabase = createClient();
    const { error: erroPerfil } = await supabase.from("profiles").update({ nome: nome.trim() }).eq("id", perfil.id);
    if (erroPerfil) {
      setErro(erroPerfil.message);
      setSalvando(false);
      return;
    }
    if (senha) {
      const { error: erroSenha } = await supabase.auth.updateUser({ password: senha });
      if (erroSenha) {
        setErro(`Nome salvo, mas a senha falhou: ${erroSenha.message}`);
        setSalvando(false);
        return;
      }
    }
    setSalvando(false);
    setSucesso("Alterações salvas com sucesso!");
    setSenha("");
    setConfirmacao("");
    router.refresh();
  }

  return (
    <>
      <PageHeader titulo="Editar perfil" subtitulo="Atualize seu nome e, se quiser, sua senha." voltar={{ href: "/perfil", label: "Meu perfil" }} />
      <form onSubmit={salvar} className="card max-w-2xl space-y-5 p-6">
        <div>
          <label className="label" htmlFor="nome">Nome</label>
          <div className="relative">
            <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input id="nome" required maxLength={100} className="input pl-11" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">E-mail</label>
            <input className="input opacity-70" value={email} disabled readOnly />
          </div>
          <div>
            <label className="label">Tag</label>
            <input className="input opacity-70" value={perfil.tag} disabled readOnly />
          </div>
        </div>
        <div className="border-t border-line pt-5">
          <p className="mb-4 text-sm font-bold text-ink">Trocar senha <span className="font-normal text-muted">(opcional)</span></p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="senha">Nova senha</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
                <input id="senha" type="password" minLength={6} className="input pl-11" placeholder="Deixe em branco para manter" value={senha} onChange={(e) => setSenha(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="confirmacao">Confirmar senha</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
                <input id="confirmacao" type="password" className="input pl-11" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        {erro && <Erro mensagem={erro} />}
        {sucesso && <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">{sucesso}</p>}
        <div className="flex justify-end border-t border-line pt-5">
          <button type="submit" disabled={salvando} className="btn-primary">{salvando ? "Salvando..." : "Salvar alterações"}</button>
        </div>
      </form>
    </>
  );
}
