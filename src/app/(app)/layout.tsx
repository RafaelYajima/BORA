"use client";

import { AuthProvider, useAuth } from "@/components/auth-provider";
import { Shell } from "@/components/shell";

function AppShell({ children }: { children: React.ReactNode }) {
  const { perfil, email } = useAuth();
  return (
    <Shell usuario={{ nome: perfil.nome, tag: perfil.tag, foto: perfil.foto, email }}>
      {children}
    </Shell>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
