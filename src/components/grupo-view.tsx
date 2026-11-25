"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarPlus, Check, Copy, Eye, EyeOff, MessageCircle, Pencil, RefreshCw, Share2, Shield, Trash2, UserMinus, UserPlus, Users } from "lucide-react";
import { ChatGrupo } from "@/components/chat";
import { ListaEventos } from "@/components/eventos-lista";
import { Avatar, Erro, PageHeader } from "@/components/ui";
import { gerarCodigoGrupo } from "@/lib/codigo";
import { compartilharOuCopiar, linkWhatsapp, textoConviteGrupo } from "@/lib/convites";
import { createClient } from "@/lib/supabase/client";
import type { EventoComGrupo, Grupo, MembroComPerfil, Mensagem, Profile } from "@/lib/types";

export function GrupoView({
  grupo,
  membroAtual,
  membros: membrosIniciais,
  eventos,
  mensagens,
  perfis: perfisIniciais,
  usuarioId,
}: {
  grupo: Grupo;
  membroAtual: { is_admin: boolean; status: string };
  membros: MembroComPerfil[];
  eventos: EventoComGrupo[];
  mensagens: Mensagem[];
  perfis: Record<string, Profile>;
  usuarioId: string;
}) {
  const router = useRouter();
  const admin = membroAtual.is_admin;
  const [codigo, setCodigo] = useState(grupo.codigo);
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [avisoConvite, setAvisoConvite] = useState("");
  const [erro, setErro] = useState("");
  const [membros, setMembros] = useState(membrosIniciais);
  const perfis = perfisIniciais;
  const [aba, setAba] = useState<"proximos" | "historico">("proximos");

  const hoje = new Date().toISOString().slice(0, 10);
  const proximos = eventos.filter((e) => e.data_evento >= hoje);
  const historico = eventos.filter((e) => e.data_evento < hoje);

  async function alterarMembro(membroId: string, patch: { is_admin?: boolean; status?: "ativo" | "banido" }) {
    const { error } = await createClient().from("grupo_membros").update(patch).eq("id", membroId);
    if (error) {
      setErro(error.message);
      return;
    }
    setMembros((lista) =>
      lista.map((m) => (m.id === membroId ? { ...m, ...patch } : m)),
    );
  }

  async function removerMembro(membroId: string, mensagem: string) {
    if (!window.confirm(mensagem)) return;
    const { error } = await createClient().from("grupo_membros").delete().eq("id", membroId);
    if (error) setErro(error.message);
    else {
      setMembros((lista) => lista.filter((m) => m.id !== membroId));
    }
  }

  async function excluirGrupo() {
    if (!window.confirm("Excluir o grupo e todos os eventos e mensagens dele? Essa ação não pode ser desfeita.")) return;
    const { error } = await createClient().from("grupos").delete().eq("id", grupo.id);
    if (error) return setErro(error.message);
    router.push("/dashboard");
  }

  async function sair() {
    if (!window.confirm("Deseja sair deste grupo?")) return;
    if (!membroId) return;
    const { error } = await createClient().from("grupo_membros").delete().eq("id", membroId);
    if (error) return setErro(error.message);
    router.push("/dashboard");
  }

  // O id do membro atual não vem no objeto mínimo; buscamos na lista carregada.
  const membroId = membros.find((m) => m.usuario_id === usuarioId)?.id;

  async function regenerarCodigo() {
    if (!window.confirm("Gerar um novo código? O código antigo deixará de funcionar.")) return;
    const novo = gerarCodigoGrupo();
    const { error } = await createClient().from("grupos").update({ codigo: novo }).eq("id", grupo.id);
    if (error) return setErro(error.message);
    setCodigo(novo);
  }

  async function copiarCodigo() {
    await navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function textoConvite() {
    const origem = typeof window === "undefined" ? "" : window.location.origin;
    return textoConviteGrupo(grupo.nome, codigo, origem);
  }

  async function compartilharConvite() {
    const resultado = await compartilharOuCopiar(textoConvite(), `Convite para ${grupo.nome}`);
    setAvisoConvite(
      resultado === "compartilhado"
        ? "Convite compartilhado!"
        : resultado === "copiado"
          ? "Link de convite copiado!"
          : "Não foi possível copiar. Tente o WhatsApp.",
    );
  }

  function convidarWhatsapp() {
    window.open(linkWhatsapp(textoConvite()), "_blank", "noopener,noreferrer");
  }

  const ativos = membros.filter((m) => m.status === "ativo");
  const banidos = membros.filter((m) => m.status === "banido");

  return (
    <>
      <PageHeader
        titulo={grupo.nome}
        subtitulo={grupo.descricao ?? "Grupo sem descrição"}
        voltar={{ href: "/grupos", label: "Meus grupos" }}
        acoes={
          <>
            <button onClick={() => setMostrarCodigo(!mostrarCodigo)} className="btn-secondary">
              {mostrarCodigo ? <EyeOff size={16} /> : <Eye size={16} />} Código
            </button>
            {admin && (
              <>
                <Link href={`/grupos/${grupo.id}/editar`} className="btn-secondary"><Pencil size={16} /> Editar</Link>
                <button onClick={excluirGrupo} className="btn-danger"><Trash2 size={16} /> Excluir</button>
              </>
            )}
            {!admin && <button onClick={sair} className="btn-danger">Sair do grupo</button>}
          </>
        }
      />

      {mostrarCodigo && (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Código para entrar</p>
            <p className="font-display text-2xl font-bold tracking-[0.3em] text-primary">{codigo}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={copiarCodigo} className="btn-secondary"><Copy size={15} /> {copiado ? "Copiado!" : "Copiar"}</button>
            <button onClick={compartilharConvite} className="btn-secondary"><Share2 size={15} /> Compartilhar</button>
            <button onClick={convidarWhatsapp} className="btn-secondary"><MessageCircle size={15} /> WhatsApp</button>
            {admin && <button onClick={regenerarCodigo} className="btn-secondary"><RefreshCw size={15} /> Novo código</button>}
          </div>
          {avisoConvite && <p className="mt-2 text-xs font-medium text-success">{avisoConvite}</p>}
        </div>
      )}

      {erro && <div className="mb-5"><Erro mensagem={erro} /></div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1 rounded-xl bg-soft p-1">
                <button onClick={() => setAba("proximos")} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${aba === "proximos" ? "bg-surface text-primary shadow-sm" : "text-muted"}`}>
                  Próximos <span className="ml-1 text-xs">({proximos.length})</span>
                </button>
                <button onClick={() => setAba("historico")} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${aba === "historico" ? "bg-surface text-primary shadow-sm" : "text-muted"}`}>
                  Histórico <span className="ml-1 text-xs">({historico.length})</span>
                </button>
              </div>
              <Link href={`/grupos/${grupo.id}/eventos/novo`} className="btn-primary"><CalendarPlus size={16} /> Novo evento</Link>
            </div>
            <ListaEventos
              key={`${aba}-${eventos.length}`}
              eventos={aba === "proximos" ? proximos : historico}
              usuarioId={usuarioId}
              podeGerenciar={admin}
              mensagemVazia={aba === "proximos" ? "Nenhum evento próximo. Que tal agendar um?" : "Nenhum evento antigo por aqui."}
            />
          </section>

          <ChatGrupo
            key={`chat-${grupo.id}-${mensagens.length}`}
            grupoId={grupo.id}
            usuarioId={usuarioId}
            perfis={perfis}
            mensagens={mensagens}
            podeEnviar={admin || !grupo.chat_restrito}
          />
        </div>

        <aside className="space-y-4">
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title">Participantes</h3>
              <span className="chip bg-primary/10 text-primary"><Users size={12} /> {ativos.length}</span>
            </div>
            <ul className="space-y-3">
              {ativos.map((membro) => {
                const perfil = membro.profiles ?? perfis[membro.usuario_id];
                const souEu = membro.usuario_id === usuarioId;
                return (
                  <li key={membro.id} className="flex items-center gap-3">
                    <Avatar nome={perfil?.nome ?? "?"} foto={perfil?.foto} tamanho={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{souEu ? "Você" : perfil?.nome ?? "Participante"} {membro.is_admin && <Shield size={12} className="inline text-primary" />}</p>
                      <p className="text-xs text-muted">{perfil?.tag ?? ""}{membro.is_admin ? " · Admin" : ""}</p>
                    </div>
                    {admin && !souEu && (
                      <div className="flex gap-0.5">
                        <button title={membro.is_admin ? "Remover admin" : "Tornar admin"} onClick={() => alterarMembro(membro.id, { is_admin: !membro.is_admin })} className="rounded-lg p-1.5 text-muted hover:bg-soft hover:text-primary">
                          <Shield size={15} />
                        </button>
                        <button title="Banir" onClick={() => alterarMembro(membro.id, { status: "banido", is_admin: false })} className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger">
                          <UserMinus size={15} />
                        </button>
                        <button title="Expulsar" onClick={() => removerMembro(membro.id, `Expulsar ${perfil?.nome ?? "este usuário"} do grupo?`)} className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {banidos.length > 0 && admin && (
              <div className="mt-5 border-t border-line pt-4">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-danger">Banidos</h4>
                <ul className="space-y-2">
                  {banidos.map((membro) => (
                    <li key={membro.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-muted">{membro.profiles?.nome ?? "Participante"}</span>
                      <button onClick={() => alterarMembro(membro.id, { status: "ativo" })} className="inline-flex items-center gap-1 text-xs font-semibold text-success hover:underline">
                        <UserPlus size={13} /> Desbanir
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <div className="card bg-gradient-to-br from-primary/10 to-cyan-400/10 p-5">
            <h3 className="font-display font-bold text-ink">Convidar amigos</h3>
            <p className="mt-1 text-sm text-muted">Compartilhe o código do grupo para que outras pessoas entrem.</p>
            <button onClick={() => setMostrarCodigo(true)} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              <Check size={15} /> Ver código de convite
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
