export type Selo = {
  id: string;
  nome: string;
  descricao: string;
  emoji: string;
};

export type MembroPontuado = {
  usuarioId: string;
  pontos: number;
  eventosCriados: number;
  presencasConfirmadas: number;
  presencasAntecipadas: number;
  mensagens: number;
  selos: Selo[];
};

type MembroSimples = { usuario_id: string };
type EventoSimples = {
  id: string;
  criador_id: string;
  data_evento: string;
  hora_evento: string;
  presencas?: { usuario_id: string; status: string; respondido_em: string }[];
};
type MensagemSimples = { usuario_id: string };

const SELOS: Record<string, Selo> = {
  anfitriao: { id: "anfitriao", nome: "Anfitrião", descricao: "Criou um evento no grupo", emoji: "🎪" },
  organizador: { id: "organizador", nome: "Organizador", descricao: "Criou 3 eventos no grupo", emoji: "🗓️" },
  presente: { id: "presente", nome: "Presente", descricao: "Confirmou presença em um evento", emoji: "🙌" },
  pontual: { id: "pontual", nome: "Pontual", descricao: "Confirmou com pelo menos 1 dia de antecedência", emoji: "⏰" },
  vozAtiva: { id: "voz-ativa", nome: "Voz ativa", descricao: "Enviou 5 mensagens no mural", emoji: "💬" },
  lenda: { id: "lenda", nome: "Lenda do grupo", descricao: "Passou de 50 pontos", emoji: "🏆" },
};

/** Calcula pontos e selos apenas com dados que o grupo já carrega. */
export function calcularPontuacao(
  membros: MembroSimples[],
  eventos: EventoSimples[],
  mensagens: MensagemSimples[],
): MembroPontuado[] {
  const mapa = new Map<string, MembroPontuado>();
  membros.forEach((membro) => {
    mapa.set(membro.usuario_id, {
      usuarioId: membro.usuario_id,
      pontos: 0,
      eventosCriados: 0,
      presencasConfirmadas: 0,
      presencasAntecipadas: 0,
      mensagens: 0,
      selos: [],
    });
  });

  const obter = (usuarioId: string) => {
    if (!mapa.has(usuarioId)) {
      mapa.set(usuarioId, {
        usuarioId,
        pontos: 0,
        eventosCriados: 0,
        presencasConfirmadas: 0,
        presencasAntecipadas: 0,
        mensagens: 0,
        selos: [],
      });
    }
    return mapa.get(usuarioId)!;
  };

  eventos.forEach((evento) => {
    obter(evento.criador_id).eventosCriados += 1;
    const inicio = new Date(`${evento.data_evento}T${evento.hora_evento}`);
    (evento.presencas ?? []).forEach((presenca) => {
      if (presenca.status !== "vou") return;
      const registro = obter(presenca.usuario_id);
      registro.presencasConfirmadas += 1;
      const respondido = new Date(presenca.respondido_em);
      if (!Number.isNaN(inicio.getTime()) && !Number.isNaN(respondido.getTime())
        && inicio.getTime() - respondido.getTime() >= 24 * 60 * 60 * 1000) {
        registro.presencasAntecipadas += 1;
      }
    });
  });

  mensagens.forEach((mensagem) => {
    obter(mensagem.usuario_id).mensagens += 1;
  });

  return Array.from(mapa.values()).map((registro) => {
    const pontosMensagens = Math.min(registro.mensagens, 10) * 2;
    const pontos = registro.eventosCriados * 10
      + registro.presencasConfirmadas * 5
      + registro.presencasAntecipadas * 3
      + pontosMensagens;
    const selos: Selo[] = [];
    if (registro.eventosCriados >= 1) selos.push(SELOS.anfitriao);
    if (registro.eventosCriados >= 3) selos.push(SELOS.organizador);
    if (registro.presencasConfirmadas >= 1) selos.push(SELOS.presente);
    if (registro.presencasAntecipadas >= 1) selos.push(SELOS.pontual);
    if (registro.mensagens >= 5) selos.push(SELOS.vozAtiva);
    if (pontos >= 50) selos.push(SELOS.lenda);
    return { ...registro, pontos, selos };
  }).sort((a, b) => b.pontos - a.pontos || a.usuarioId.localeCompare(b.usuarioId));
}

/** Resumo usado no perfil, onde não carregamos os dados completos do grupo. */
export function selosGlobais(grupos: number, eventos: number, confirmadas: number, pontos: number) {
  const selos: Selo[] = [];
  if (grupos >= 1) selos.push({ id: "membro", nome: "Membro", descricao: "Entrou em um grupo", emoji: "🤝" });
  if (eventos >= 1) selos.push(SELOS.anfitriao);
  if (confirmadas >= 1) selos.push(SELOS.presente);
  if (pontos >= 50) selos.push(SELOS.lenda);
  return selos;
}
