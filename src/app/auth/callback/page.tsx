"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const destino = params.get("next");
      const proximo = destino?.startsWith("/") && !destino.startsWith("//") ? destino : "/dashboard";
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const tipo = params.get("type");
      const supabase = createClient();

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      } else if (tokenHash && tipo) {
        await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: tipo as "recovery" | "signup" | "email" | "magiclink",
        });
      }
      router.replace(proximo);
    })();
  }, [router]);

  return <Spinner label="Validando link..." />;
}
