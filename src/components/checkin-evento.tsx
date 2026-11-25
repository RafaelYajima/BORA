"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, QrCode, RotateCw, ScanLine, Users } from "lucide-react";
import { montarPayloadCheckin } from "@/lib/checkin";
import { formatarDataHora } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { EventoCheckin } from "@/lib/types";

export function CheckinEvento({
  eventoId,
  usuarioId,
  organizador,
}: {
  eventoId: string;
  usuarioId: string;
  organizador: boolean;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [checkins, setCheckins] = useState<EventoCheckin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    let ativo = true;
    const supabase = createClient();
    const consultas: PromiseLike<unknown>[] = [
      supabase
        .from("evento_checkins")
        .select("id, evento_id, usuario_id, criado_em, profiles(id, nome, tag, foto)")
        .eq("evento_id", eventoId)
        .order("criado_em")
        .then(({ data, error }) => {
          if (!ativo) return;
          if (error) setErro(error.message);
          else setCheckins((data ?? []) as unknown as EventoCheckin[]);
        }),
    ];
    if (organizador) {
      consultas.push(
        supabase.rpc("obter_token_checkin", { p_evento: eventoId }).then(({ data, error }) => {
          if (!ativo) return;
          if (error) setErro(error.message);
          else if (typeof data === "string") setToken(data);
        }),
      );
    }
    Promise.all(consultas).then(() => {
      if (ativo) setCarregando(false);
    });
    return () => { ativo = false; };
  }, [eventoId, organizador, usuarioId]);

  async function rotacionar() {
    setErro("");
    const { data, error } = await createClient().rpc("rotacionar_token_checkin", { p_evento: eventoId });
    if (error) {
      setErro(error.message);
      return;
    }
    if (typeof data === "string") setToken(data);
  }

  const meuCheckin = checkins.find((checkin) => checkin.usuario_id === usuarioId);

  if (carregando) return null;

  if (!organizador) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-xs">
        <span className="inline-flex items-center gap-1 text-muted"><Users size={14} /> {checkins.length} check-in{checkins.length === 1 ? "" : "s"}</span>
        {meuCheckin ? (
          <span className="inline-flex items-center gap-1 font-semibold text-success">
            <Check size={14} /> Você fez check-in às {formatarDataHora(meuCheckin.criado_em)}
          </span>
        ) : (
          <Link href={`/checkin?evento=${eventoId}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            <ScanLine size={14} /> Fazer check-in
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t border-line pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
          <QrCode size={15} className="text-primary" /> QR de check-in
        </span>
        <button type="button" onClick={rotacionar} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          <RotateCw size={12} /> Gerar novo QR
        </button>
      </div>
      {token ? (
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-soft/40 p-3">
          <div className="rounded-xl bg-white p-2">
            <QRCodeSVG value={montarPayloadCheckin(eventoId, token)} size={128} level="M" includeMargin={false} />
          </div>
          <div className="min-w-0 text-xs text-muted">
            <p className="font-semibold text-ink">Mostre este QR no encontro.</p>
            <p className="mt-1">Cada participante escaneia com o app e registra a presença. Gere um novo QR se o código vazar.</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-danger">Não foi possível gerar o QR. Verifique se você é o organizador do evento.</p>
      )}

      <div>
        <button type="button" onClick={() => setAberto((valor) => !valor)} className="text-xs font-semibold text-primary hover:underline" aria-expanded={aberto}>
          Check-ins registrados ({checkins.length})
        </button>
        {aberto && (
          <ul className="mt-2 space-y-1.5">
            {checkins.length === 0 && <li className="text-xs text-muted">Nenhum check-in ainda.</li>}
            {checkins.map((checkin) => (
              <li key={checkin.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-semibold text-ink">{checkin.profiles?.nome ?? "Participante"}</span>
                <span className="shrink-0 text-muted">
                  {formatarDataHora(checkin.criado_em)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {erro && <p className="text-xs text-danger">{erro}</p>}
    </div>
  );
}
