"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { MapaPicker } from "@/components/mapa";
import { Erro, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Evento, Grupo } from "@/lib/types";

export function EventoForm({
  grupo,
  evento,
}: {
  grupo: Grupo;
  evento?: Evento;
}) {
  const router = useRouter();
  const [nome, setNome] = useState(evento?.nome ?? "");
  const [descricao, setDescricao] = useState(evento?.descricao ?? "");
  const [data, setData] = useState(evento?.data_evento ?? "");
  const [hora, setHora] = useState(evento?.hora_evento?.slice(0, 5) ?? "");
  const [local, setLocal] = useState(evento?.local_evento ?? "");
  const [latitude, setLatitude] = useState<number | null>(evento?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(evento?.longitude ?? null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    const dados = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      data_evento: data,
      hora_evento: hora.length === 5 ? `${hora}:00` : hora,
      local_evento: local.trim() || null,
      latitude,
      longitude,
    };
    const supabase = createClient();
    const { data: sessao } = await supabase.auth.getUser();
    if (!sessao.user) {
      setErro("Sua sessão expirou. Entre novamente.");
      setSalvando(false);
      return;
    }
    const resultado = evento
      ? await supabase.from("eventos").update(dados).eq("id", evento.id).select().single()
      : await supabase.from("eventos").insert({ ...dados, grupo_id: grupo.id, criador_id: sessao.user.id }).select().single();

    setSalvando(false);
    if (resultado.error || !resultado.data) {
      setErro(resultado.error?.message ?? "Não foi possível salvar o evento.");
      return;
    }
    router.push(`/grupos/${grupo.id}`);
  }

  return (
    <>
      <PageHeader
        titulo={evento ? "Editar evento" : "Novo evento"}
        subtitulo={`Grupo: ${grupo.nome}`}
        voltar={{ href: `/grupos/${grupo.id}`, label: `Voltar ao grupo` }}
      />
      <form onSubmit={salvar} className="card max-w-2xl space-y-5 p-6">
        <div>
          <label className="label" htmlFor="nome">Nome do evento *</label>
          <input id="nome" required maxLength={100} className="input" placeholder="Ex: Jantar de sexta, Reunião de pauta..." value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="descricao">Descrição</label>
          <textarea id="descricao" rows={3} className="input resize-none" placeholder="O que vai acontecer?" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="data">Data *</label>
            <input id="data" type="date" required className="input" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="hora">Horário *</label>
            <input id="hora" type="time" required className="input" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="local">Local / endereço</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
            <input id="local" className="input pl-11" placeholder="Ex: Rua das Flores, 121 — Aracatuba" value={local} onChange={(e) => setLocal(e.target.value)} />
          </div>
        </div>
        <div>
          <p className="label">Ponto no mapa (opcional)</p>
          <MapaPicker latitude={latitude} longitude={longitude} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
        </div>
        {erro && <Erro mensagem={erro} />}
        <div className="flex justify-end gap-2 border-t border-line pt-5">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? "Salvando..." : <>{evento ? "Salvar alterações" : "Criar evento"} <ArrowRight size={16} /></>}
          </button>
        </div>
      </form>
    </>
  );
}
