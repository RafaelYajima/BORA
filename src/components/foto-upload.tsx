"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function FotoUpload({
  usuarioId,
  nome,
  foto,
}: {
  usuarioId: string;
  nome: string;
  foto: string | null;
}) {
  const { atualizarPerfil } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [fotoAtual, setFotoAtual] = useState(foto);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) return setErro("Escolha um arquivo de imagem.");
    if (arquivo.size > 5 * 1024 * 1024) return setErro("A imagem deve ter no máximo 5 MB.");
    setErro("");
    setEnviando(true);
    const supabase = createClient();
    const extensao = arquivo.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "png";
    const caminho = `${usuarioId}/${Date.now()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage.from("avatars").upload(caminho, arquivo, {
      contentType: arquivo.type,
      upsert: true,
    });
    if (erroUpload) {
      setErro(erroUpload.message);
      setEnviando(false);
      return;
    }
    const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(caminho);
    const { error: erroPerfil } = await supabase
      .from("profiles")
      .update({ foto: publicUrl.publicUrl })
      .eq("id", usuarioId);
    setEnviando(false);
    if (erroPerfil) return setErro(erroPerfil.message);
    setFotoAtual(publicUrl.publicUrl);
    atualizarPerfil({ foto: publicUrl.publicUrl });
  }

  async function remover() {
    setEnviando(true);
    const { error } = await createClient().from("profiles").update({ foto: null }).eq("id", usuarioId);
    setEnviando(false);
    if (error) return setErro(error.message);
    setFotoAtual(null);
    atualizarPerfil({ foto: null });
  }

  return (
    <div className="flex flex-col items-center">
      <button onClick={() => input.current?.click()} disabled={enviando} className="group relative" aria-label="Trocar foto de perfil">
        <Avatar nome={nome} foto={fotoAtual} tamanho={112} className="border-4 border-surface shadow-lg" />
        <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-md ring-4 ring-surface">
          <Camera size={16} />
        </span>
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={enviar} />
      <button onClick={() => input.current?.click()} disabled={enviando} className="mt-3 text-sm font-semibold text-primary hover:underline">
        {enviando ? "Enviando..." : "Trocar foto"}
      </button>
      {fotoAtual && (
        <button onClick={remover} disabled={enviando} className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-danger">
          <Trash2 size={12} /> Remover foto
        </button>
      )}
      {erro && <p className="mt-2 text-center text-xs text-danger">{erro}</p>}
    </div>
  );
}
