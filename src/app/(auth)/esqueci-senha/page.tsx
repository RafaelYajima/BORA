"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { Erro } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    });
    setCarregando(false);
    if (error) return setErro(error.message);
    setEnviado(true);
  }

  return (
    <div className="card animate-in p-7 shadow-xl shadow-primary/5 sm:p-9">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Recuperar senha</h1>
      <p className="mt-1 text-sm text-muted">Enviaremos um link para você criar uma nova senha.</p>

      {enviado ? (
        <div className="mt-7 rounded-xl border border-success/30 bg-success/10 p-5 text-sm text-ink">
          <p className="font-bold text-success">E-mail enviado!</p>
          <p className="mt-1 text-muted">Confira sua caixa de entrada e o spam. O link expira em 1 hora.</p>
          <Link href="/login" className="mt-4 inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            <ArrowLeft size={15} /> Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="mt-7 space-y-4">
          <div>
            <label className="label" htmlFor="email">E-mail da conta</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
              <input id="email" type="email" required className="input pl-11" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          {erro && <Erro mensagem={erro} />}
          <button type="submit" disabled={carregando} className="btn-primary w-full py-3">
            {carregando ? "Enviando..." : <><Send size={17} /> Enviar link</>}
          </button>
          <Link href="/login" className="mt-2 flex items-center justify-center gap-1 text-sm font-medium text-muted hover:text-primary">
            <ArrowLeft size={15} /> Voltar
          </Link>
        </form>
      )}
    </div>
  );
}
