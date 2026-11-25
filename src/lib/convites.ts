"use client";

import { formatarData, formatarHora } from "@/lib/format";
import type { Evento } from "@/lib/types";

function normalizarOrigem(origem: string) {
  return origem.replace(/\/$/, "");
}

export function linkConvite(origem: string, codigo: string) {
  return `${normalizarOrigem(origem)}/grupos/entrar?codigo=${encodeURIComponent(codigo.trim().toUpperCase())}`;
}

export function textoConviteGrupo(nomeGrupo: string, codigo: string, origem: string) {
  return `Oi! Estou no grupo ${nomeGrupo} no BORA 2.0. Vem comigo!\n\nUse o código ${codigo} ou abra:\n${linkConvite(origem, codigo)}`;
}

export function textoConviteEvento(
  evento: Evento,
  nomeGrupo: string,
  codigo: string,
  origem: string,
) {
  const quando = `${formatarData(evento.data_evento)} às ${formatarHora(evento.hora_evento)}`;
  const onde = evento.local_evento || "Local a confirmar";
  const convite = codigo
    ? `Vem comigo no grupo ${nomeGrupo}: código ${codigo}\n${linkConvite(origem, codigo)}`
    : `Veja o evento no BORA 2.0: ${normalizarOrigem(origem)}`;

  return `🎉 ${evento.nome}\n📅 ${quando}\n📍 ${onde}\n\n${convite}`;
}

export function linkWhatsapp(texto: string) {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

export async function compartilharOuCopiar(
  texto: string,
  titulo: string,
): Promise<"compartilhado" | "copiado" | "erro"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: titulo, text: texto });
      return "compartilhado";
    } catch (falha) {
      // O usuário cancelou o compartilhamento nativo: tenta copiar.
      if (falha instanceof DOMException && falha.name === "AbortError") return "erro";
    }
  }
  try {
    await navigator.clipboard.writeText(texto);
    return "copiado";
  } catch {
    return "erro";
  }
}
