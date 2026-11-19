"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Erro } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha !== confirmacao) return setErro("As senhas não coincidem.");
    if (senha.length < 6) return setErro("A senha precisa ter pelo menos 6 caracteres.");
    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <div className="card animate-in p-7 shadow-xl shadow-primary/5 sm:p-9">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Nova senha</h1>
      <p className="mt-1 text-sm text-muted">Escolha uma senha forte para sua conta.</p>
      <form onSubmit={salvar} className="mt-7 space-y-4">
        <div>
          <label className="label" htmlFor="senha">Nova senha</label>
          <div className="relative">
            <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input id="senha" type="password" required minLength={6} className="input pl-11" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="confirmacao">Confirmar nova senha</label>
          <div className="relative">
            <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input id="confirmacao" type="password" required className="input pl-11" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
          </div>
        </div>
        {erro && <Erro mensagem={erro} />}
        <button type="submit" disabled={carregando} className="btn-primary w-full py-3">
          {carregando ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
