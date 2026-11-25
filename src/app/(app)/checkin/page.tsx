"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ScanLine, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { lerPayloadCheckin } from "@/lib/checkin";
import { formatarDataHora } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

type RetornoCheckin = {
  sucesso: boolean;
  mensagem: string;
  evento_nome: string | null;
  horario: string | null;
};

type Aviso = { tipo: "ok" | "erro"; texto: string; evento?: string | null };

export default function CheckinPage() {
  const [codigo, setCodigo] = useState("");
  const [eventoEsperado] = useState(() =>
    typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("evento") ?? "",
  );
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [processando, setProcessando] = useState(false);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const autoRef = useRef(false);
  const registrarRef = useRef<(valor: string) => Promise<boolean>>(async () => false);

  const registrar = useCallback(async (valor: string) => {
    setProcessando(true);
    setAviso(null);
    const payload = lerPayloadCheckin(valor);
    if (!payload) {
      setAviso({ tipo: "erro", texto: "Código inválido. Escaneie o QR exibido pelo organizador." });
      setProcessando(false);
      return false;
    }
    if (eventoEsperado && payload.eventoId !== eventoEsperado) {
      setAviso({ tipo: "erro", texto: "Este QR é de outro evento. Peça ao organizador para mostrar o QR correto." });
      setProcessando(false);
      return false;
    }

    const { data, error } = await createClient().rpc("registrar_checkin", {
      p_evento: payload.eventoId,
      p_token: payload.token,
    });
    const linha = (Array.isArray(data) ? data?.[0] : data) as RetornoCheckin | undefined;
    if (error || !linha) {
      setAviso({ tipo: "erro", texto: error?.message ?? "Não foi possível registrar o check-in." });
      setProcessando(false);
      return false;
    }
    setAviso({
      tipo: linha.sucesso ? "ok" : "erro",
      texto: linha.mensagem,
      evento: linha.evento_nome,
    });
    if (linha.sucesso && linha.horario) {
      setAviso((atual) => atual && ({
        ...atual,
        texto: `${atual.texto} Registrado às ${formatarDataHora(linha.horario!)}.`,
      }));
    }
    setProcessando(false);
    return linha.sucesso;
  }, [eventoEsperado]);

  useEffect(() => {
    registrarRef.current = registrar;
  }, [registrar]);

  function pararCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setCameraAtiva(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codigoParam = params.get("c");
    if (codigoParam && !autoRef.current) {
      autoRef.current = true;
      void registrarRef.current(codigoParam);
    }
  }, []);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  async function iniciarCamera() {
    const Detector = (window as unknown as { BarcodeDetector?: new (opcoes: { formats: string[] }) => {
      detect: (fonte: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
    } }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setAviso({ tipo: "erro", texto: "A leitura automática de QR não está disponível neste navegador. Digite o código manualmente." });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraAtiva(true);
      setAviso(null);
      const detector = new Detector({ formats: ["qr_code"] });
      let ultimo = "";
      const ver = async () => {
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          try {
            const encontrados = await detector.detect(video);
            const valor = encontrados[0]?.rawValue;
            if (valor && valor !== ultimo) {
              ultimo = valor;
              const ok = await registrarRef.current(valor);
              if (ok) {
                pararCamera();
                return;
              }
            }
          } catch {
            // Tenta novamente no próximo quadro.
          }
        }
        frameRef.current = requestAnimationFrame(ver);
      };
      frameRef.current = requestAnimationFrame(ver);
    } catch {
      setAviso({ tipo: "erro", texto: "Não foi possível acessar a câmera. Verifique a permissão ou digite o código manualmente." });
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader
        titulo="Check-in no evento"
        subtitulo="Aponte a câmera para o QR que o organizador estiver mostrando."
        voltar={{ href: "/dashboard", label: "Voltar ao painel" }}
      />

      <div className="card space-y-5 p-5 sm:p-6">
        <div className="rounded-2xl border border-line bg-soft/30 p-4">
          <video ref={videoRef} muted playsInline className={cameraAtiva ? "aspect-video w-full rounded-xl bg-black" : "hidden"} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <ScanLine size={18} className="text-primary" /> Ler QR com a câmera
            </div>
            {cameraAtiva ? (
              <button type="button" onClick={pararCamera} className="btn-secondary px-3 py-1.5 text-xs">Desligar câmera</button>
            ) : (
              <button type="button" onClick={iniciarCamera} className="btn-secondary px-3 py-1.5 text-xs">
                <Camera size={14} /> Abrir câmera
              </button>
            )}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void registrar(codigo);
          }}
          className="space-y-2"
        >
          <label className="label" htmlFor="codigo-checkin">Ou digite o código do QR</label>
          <input
            id="codigo-checkin"
            className="input font-mono text-xs"
            placeholder="BORA-CHECKIN-1:..."
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
          <button type="submit" disabled={processando || !codigo.trim()} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
            {processando ? "Registrando..." : "Registrar check-in"}
          </button>
        </form>

        {aviso && (
          <div className={`flex items-start gap-2 rounded-xl p-3 text-sm ${aviso.tipo === "ok" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
            {aviso.tipo === "ok" ? <CheckCircle2 size={18} className="shrink-0" /> : <XCircle size={18} className="shrink-0" />}
            <div>
              <p className="font-semibold">{aviso.texto}</p>
              {aviso.evento && <p className="mt-0.5 text-xs opacity-80">{aviso.evento}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
