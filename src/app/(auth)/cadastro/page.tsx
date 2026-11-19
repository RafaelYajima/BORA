"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Erro } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha !== confirmacao) return setErro("As senhas não coincidem.");
    if (senha.length < 6) return setErro("A senha precisa ter pelo menos 6 caracteres.");

    setCarregando(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome: nome.trim() } },
    });

    if (error) {
      setErro(error.message.includes("already registered") ? "Já existe uma conta com este e-mail." : error.message);
      setCarregando(false);
      return;
    }
    // Com autoconfirm o Supabase já devolve a sessão. Se não devolver,
    // tentamos entrar com as mesmas credenciais para não mandar o usuário
    // de volta para a tela de login.
    let sessao = data.session;
    if (!sessao) {
      const login = await supabase.auth.signInWithPassword({ email, password: senha });
      if (!login.error) sessao = login.data.session;
    }
    if (!sessao) {
      setErro("Conta criada! Confirme seu e-mail, se necessário, e faça login para continuar.");
      setCarregando(false);
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <div className="card animate-in p-7 shadow-xl shadow-primary/5 sm:p-9">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Crie sua conta</h1>
      <p className="mt-1 text-sm text-muted">Leva menos de um minuto.</p>

      <form onSubmit={cadastrar} className="mt-7 space-y-4">
        <div>
          <label className="label" htmlFor="nome">Nome</label>
          <div className="relative">
            <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input id="nome" required maxLength={100} className="input pl-11" placeholder="Como quer ser chamado?" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input id="email" type="email" required autoComplete="email" className="input pl-11" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="senha">Senha</label>
          <div className="relative">
            <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input id="senha" type="password" required minLength={6} autoComplete="new-password" className="input pl-11" placeholder="Mínimo de 6 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="confirmacao">Confirmar senha</label>
          <div className="relative">
            <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input id="confirmacao" type="password" required autoComplete="new-password" className="input pl-11" placeholder="Repita a senha" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
          </div>
        </div>

        {erro && <Erro mensagem={erro} />}

        <button type="submit" disabled={carregando} className="btn-primary w-full py-3">
          {carregando ? "Criando conta..." : <>Criar conta <ArrowRight size={17} /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Já tem conta? <Link href="/login" className="font-bold text-primary hover:underline">Faça login</Link>
      </p>
    </div>
  );
}
