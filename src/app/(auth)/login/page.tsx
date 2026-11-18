"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { Erro } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      setErro(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
      setCarregando(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="card animate-in p-7 shadow-xl shadow-primary/5 sm:p-9">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Bem-vindo de volta 👋</h1>
      <p className="mt-1 text-sm text-muted">Entre para ver seus grupos e eventos.</p>

      <form onSubmit={entrar} className="mt-7 space-y-4">
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input id="email" type="email" required autoComplete="email" className="input pl-11" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-semibold text-ink" htmlFor="senha">Senha</label>
            <Link href="/esqueci-senha" className="text-xs font-semibold text-primary hover:underline">Esqueci minha senha</Link>
          </div>
          <div className="relative">
            <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input id="senha" type="password" required autoComplete="current-password" className="input pl-11" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
        </div>

        {erro && <Erro mensagem={erro} />}

        <button type="submit" disabled={carregando} className="btn-primary w-full py-3">
          {carregando ? "Entrando..." : <>Entrar <ArrowRight size={17} /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-bold text-primary hover:underline">Cadastre-se</Link>
      </p>
    </div>
  );
}
