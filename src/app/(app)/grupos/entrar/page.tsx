import { EntrarGrupoForm } from "@/components/entrar-grupo-form";

export default async function EntrarGrupoPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  return <EntrarGrupoForm codigoInicial={codigo ?? ""} />;
}
