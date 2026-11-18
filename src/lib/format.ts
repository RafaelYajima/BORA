const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "2026-05-15" -> "sexta, 15 de maio" */
export function formatarData(data: string, comDiaSemana = true) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const d = new Date(ano, mes - 1, dia);
  return `${comDiaSemana ? `${DIAS[d.getDay()]}, ` : ""}${dia} de ${MESES[mes - 1]} de ${ano}`;
}

/** "18:30:00" -> "18:30" */
export function formatarHora(hora: string) {
  return hora.slice(0, 5);
}

export function formatarDataHora(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Data de hoje no fuso local, no formato YYYY-MM-DD. */
export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function proximoEvento(data: string, hora: string) {
  return `${data}T${hora}`;
}

export function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
