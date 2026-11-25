"use client";

import { formatarData, formatarHora } from "@/lib/format";
import type { Evento } from "@/lib/types";

function pad(valor: number) {
  return String(valor).padStart(2, "0");
}

function escapar(texto: string) {
  return texto
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Quebra linhas longas como exige o formato iCalendar. */
function dobrarLinha(linha: string) {
  const partes: string[] = [];
  let atual = "";
  for (const caractere of linha) {
    if (atual.length >= 70) {
      partes.push(atual);
      atual = " ";
    }
    atual += caractere;
  }
  partes.push(atual);
  return partes.join("\r\n");
}

function horarioICS(data: string, hora: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const [horas, minutos] = hora.split(":").map(Number);
  const inicio = new Date(ano, mes - 1, dia, horas || 0, minutos || 0);
  const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
  const formatar = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  return { inicio: formatar(inicio), fim: formatar(fim) };
}

/** Gera um .ics com o evento e lembretes 1 dia e 1 hora antes. */
export function gerarIcs(evento: Evento, origem = "") {
  const { inicio, fim } = horarioICS(evento.data_evento, evento.hora_evento);
  const descricao = [
    evento.descricao || "",
    `Data: ${formatarData(evento.data_evento)} às ${formatarHora(evento.hora_evento)}`,
    "Organizado no BORA 2.0",
  ].filter(Boolean).join("\n");
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BORA 2.0//Eventos//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:BORA 2.0",
    "BEGIN:VEVENT",
    `UID:${evento.id}@bora`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${inicio}`,
    `DTEND:${fim}`,
    `SUMMARY:${escapar(evento.nome)}`,
    `DESCRIPTION:${escapar(descricao)}`,
    `LOCATION:${escapar(evento.local_evento || "Local a confirmar")}`,
  ];

  if (evento.latitude != null && evento.longitude != null) {
    linhas.push(`GEO:${evento.latitude.toFixed(6)};${evento.longitude.toFixed(6)}`);
  }
  if (origem) linhas.push(`URL:${escapar(origem)}`);

  linhas.push(
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapar(`${evento.nome} acontece amanhã`)}`,
    "TRIGGER:-P1D",
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapar(`${evento.nome} começa em 1 hora`)}`,
    "TRIGGER:-PT1H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  );

  return `${linhas.map(dobrarLinha).join("\r\n")}\r\n`;
}

export function baixarIcs(conteudo: string, nomeArquivo: string) {
  const blob = new Blob([conteudo], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
