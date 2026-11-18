const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Código curto e fácil de digitar paraentrar em um grupo. */
export function gerarCodigoGrupo(tamanho = 6) {
  const bytes = new Uint8Array(tamanho);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}
