// Edge Function sem dependências externas: usa apenas fetch/Web Crypto nativos do Deno.
// Chamada por pg_cron a cada hora. Secrets: CRON_SECRET, VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY, VAPID_SUBJECT. Opcional para e-mail: RESEND_API_KEY, EMAIL_FROM.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function bytesDeBase64Url(valor: string) {
  const base64 = valor.replace(/-/g, "+").replace(/_/g, "/");
  const preenchido = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binario = atob(preenchido);
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}

function base64Url(bytes: Uint8Array) {
  let texto = "";
  bytes.forEach((b) => { texto += String.fromCharCode(b); });
  return btoa(texto).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function paraDer(raw: Uint8Array) {
  const normalizar = (parte: Uint8Array) => {
    let inicio = 0;
    while (inicio < parte.length - 1 && parte[inicio] === 0) inicio++;
    let bytes = parte.slice(inicio);
    if (bytes[0] & 0x80) bytes = new Uint8Array([0, ...bytes]);
    return bytes;
  };
  const r = normalizar(raw.slice(0, 32));
  const s = normalizar(raw.slice(32));
  const tamanho = 2 + r.length + 2 + s.length;
  return new Uint8Array([0x30, tamanho, 0x02, r.length, ...r, 0x02, s.length, ...s]);
}

async function jwtVapid(endpoint: string) {
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const publicBytes = bytesDeBase64Url(publicKey);
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: base64Url(publicBytes.slice(1, 33)),
    y: base64Url(publicBytes.slice(33, 65)),
    d: privateKey,
  };
  const chave = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const cabecalho = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "ES256", typ: "JWT" })));
  const carga = base64Url(new TextEncoder().encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: Deno.env.get("VAPID_SUBJECT") ?? "mailto:contato@bora.app",
  })));
  const entrada = `${cabecalho}.${carga}`;
  const bruta = new Uint8Array(await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    chave,
    new TextEncoder().encode(entrada),
  ));
  return `${entrada}.${base64Url(paraDer(bruta))}`;
}

function escapar(texto: string) {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

  const segredo = Deno.env.get("CRON_SECRET");
  if (!segredo || req.headers.get("x-cron-secret") !== segredo) {
    return json({ erro: "Não autorizado" }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const chave = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const cabecalhosRest = {
    apikey: chave,
    Authorization: `Bearer ${chave}`,
    "Content-Type": "application/json",
  };

  try {
    const respostaPendentes = await fetch(`${url}/rest/v1/rpc/buscar_lembretes_pendentes`, {
      method: "POST",
      headers: cabecalhosRest,
      body: "{}",
    });
    if (!respostaPendentes.ok) {
      return json({ erro: `Falha ao consultar lembretes: ${await respostaPendentes.text()}` }, 500);
    }
    const pendentes = await respostaPendentes.json() as Array<{
      lembrete_id: string;
      evento_nome: string;
      local_evento: string | null;
      usuario_id: string;
      email: string;
      canal: "push" | "email";
      janela: "24h" | "1h";
    }>;

    let enviados = 0;
    let erros = 0;

    for (const item of pendentes) {
      const quando = item.janela === "24h" ? "em 24 horas" : "em 1 hora";
      const corpo = `Seu encontro ${item.evento_nome} começa ${quando}.${item.local_evento ? ` Local: ${item.local_evento}.` : ""}`;
      let sucesso = false;

      if (item.canal === "push") {
        const resposta = await fetch(
          `${url}/rest/v1/push_subscriptions?usuario_id=eq.${encodeURIComponent(item.usuario_id)}&select=endpoint,p256dh,auth`,
          { headers: cabecalhosRest },
        );
        const assinaturas = await resposta.json() as Array<{ endpoint: string }>;
        const publicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;

        for (const assinatura of assinaturas) {
          try {
            const autorizacao = await jwtVapid(assinatura.endpoint);
            const envio = await fetch(assinatura.endpoint, {
              method: "POST",
              headers: {
                Authorization: `vapid t=${autorizacao}, k=${publicKey}`,
                TTL: "86400",
                Urgency: "high",
              },
              body: null,
            });
            if (envio.ok || envio.status === 201) {
              sucesso = true;
              enviados++;
            } else {
              erros++;
              if (envio.status === 404 || envio.status === 410) {
                await fetch(
                  `${url}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(assinatura.endpoint)}`,
                  { method: "DELETE", headers: cabecalhosRest },
                );
              }
            }
          } catch {
            erros++;
          }
        }
      } else if (item.canal === "email") {
        const apiKey = Deno.env.get("RESEND_API_KEY");
        if (apiKey && item.email) {
          const resposta = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: Deno.env.get("EMAIL_FROM") ?? "BORA! <onboarding@resend.dev>",
              to: [item.email],
              subject: `Lembrete: ${item.evento_nome} começa ${quando}`,
              html: `<h2>${escapar(item.evento_nome)}</h2><p>${escapar(corpo)}</p>`,
            }),
          });
          if (resposta.ok) {
            sucesso = true;
            enviados++;
          } else {
            erros++;
          }
        }
      }

      if (sucesso) {
        await fetch(`${url}/rest/v1/rpc/marcar_lembrete_enviado`, {
          method: "POST",
          headers: cabecalhosRest,
          body: JSON.stringify({ p_lembrete: item.lembrete_id, p_janela: item.janela }),
        });
      }
    }

    return json({ processados: pendentes.length, enviados, erros });
  } catch (erro) {
    return json({ erro: String(erro) }, 500);
  }
});
