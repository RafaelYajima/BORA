import { createClient } from "@/lib/supabase/client";

export function chavePublicaParaBytes(chave: string) {
  const preenchida = chave.replace(/-/g, "+").replace(/_/g, "/");
  const comPadding = preenchida.padEnd(Math.ceil(preenchida.length / 4) * 4, "=");
  const binario = atob(comPadding);
  return Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
}

export async function ativarPush(usuarioId: string) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Este navegador não suporta notificações push.");
  }
  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") {
    throw new Error("Permissão de notificação negada. Habilite nas configurações do navegador.");
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("push_config")
    .select("valor")
    .eq("chave", "vapid_public_key")
    .maybeSingle();
  if (error || !data?.valor) throw new Error(error?.message ?? "Chave de push indisponível.");

  const registro = await navigator.serviceWorker.register("/sw.js");
  let assinatura = await registro.pushManager.getSubscription();
  if (!assinatura) {
    assinatura = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: chavePublicaParaBytes(data.valor) as BufferSource,
    });
  }
  const chaves = assinatura.toJSON();
  const { error: erroSalvar } = await supabase.from("push_subscriptions").upsert(
    {
      usuario_id: usuarioId,
      endpoint: assinatura.endpoint,
      p256dh: chaves.keys?.p256dh ?? "",
      auth: chaves.keys?.auth ?? "",
    },
    { onConflict: "endpoint" },
  );
  if (erroSalvar) throw erroSalvar;
}
