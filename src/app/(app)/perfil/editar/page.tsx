"use client";

import { useAuth } from "@/components/auth-provider";
import { PerfilForm } from "@/components/perfil-form";

export default function EditarPerfilPage() {
  const { perfil, email } = useAuth();
  return <PerfilForm perfil={perfil} email={email} />;
}
