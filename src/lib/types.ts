export type Profile = {
  id: string;
  nome: string;
  tag: string;
  foto: string | null;
  criado_em: string;
};

export type Grupo = {
  id: string;
  nome: string;
  descricao: string | null;
  codigo: string;
  criador_id: string;
  chat_restrito: boolean;
  criado_em: string;
};

export type Membro = {
  id: string;
  grupo_id: string;
  usuario_id: string;
  is_admin: boolean;
  status: "ativo" | "banido";
  criado_em: string;
  profiles?: Profile;
};

export type Presenca = {
  id: string;
  evento_id: string;
  usuario_id: string;
  status: "vou" | "nao_vou";
  respondido_em: string;
};

export type Evento = {
  id: string;
  grupo_id: string;
  criador_id: string;
  nome: string;
  descricao: string | null;
  data_evento: string;
  hora_evento: string;
  local_evento: string | null;
  latitude: number | null;
  longitude: number | null;
  criado_em: string;
  presencas?: Presenca[];
};

export type Mensagem = {
  id: number;
  grupo_id: string;
  usuario_id: string;
  mensagem: string;
  criado_em: string;
  profiles?: Profile;
};

export type MembroComPerfil = Membro & { profiles: Profile };

export type EventoItem = {
  id: string;
  evento_id: string;
  usuario_id: string | null;
  nome: string;
  quantidade: string | null;
  criado_em: string;
  profiles?: Pick<Profile, "id" | "nome" | "tag" | "foto"> | null;
};

export type EnqueteOpcao = {
  id: string;
  enquete_id: string;
  data_hora: string;
  enquete_votos?: { id: string; usuario_id: string }[];
};

export type Enquete = {
  id: string;
  grupo_id: string;
  criador_id: string;
  titulo: string;
  descricao: string | null;
  encerrada: boolean;
  criado_em: string;
  enquete_opcoes?: EnqueteOpcao[];
};

export type EventoCheckin = {
  id: string;
  evento_id: string;
  usuario_id: string;
  criado_em: string;
  profiles?: Pick<Profile, "id" | "nome" | "tag" | "foto"> | null;
};

export type EventoComGrupo = Evento & {
  grupos?: Pick<Grupo, "id" | "nome" | "codigo">;
};
