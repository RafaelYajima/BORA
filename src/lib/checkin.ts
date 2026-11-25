export const PREFIXO_CHECKIN = "BORA-CHECKIN-1";

export function montarPayloadCheckin(eventoId: string, token: string) {
  return `${PREFIXO_CHECKIN}:${eventoId}:${token}`;
}

export function lerPayloadCheckin(valor: string | null | undefined) {
  if (!valor) return null;
  const texto = valor.trim();
  const partes = texto.split(":");
  if (partes.length !== 3 || partes[0] !== PREFIXO_CHECKIN) return null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(partes[1]) || !uuid.test(partes[2])) return null;
  return { eventoId: partes[1], token: partes[2] };
}
