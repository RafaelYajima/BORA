-- BORA 2.0 — schema inicial
-- Perfis ligados ao auth.users do Supabase; grupos, eventos, presenças, mensagens e avatares.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 100),
  tag text not null,
  foto text,
  criado_em timestamptz not null default now()
);

create table public.grupos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 100),
  descricao text,
  codigo text not null unique check (char_length(codigo) between 4 and 12),
  criador_id uuid not null references public.profiles (id) on delete cascade,
  chat_restrito boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.grupo_membros (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  is_admin boolean not null default false,
  status text not null default 'ativo' check (status in ('ativo', 'banido')),
  criado_em timestamptz not null default now(),
  unique (grupo_id, usuario_id)
);

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  criador_id uuid not null references public.profiles (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 100),
  descricao text,
  data_evento date not null,
  hora_evento time not null,
  local_evento text,
  latitude double precision,
  longitude double precision,
  criado_em timestamptz not null default now()
);

create table public.presencas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('vou', 'nao_vou')),
  respondido_em timestamptz not null default now(),
  unique (evento_id, usuario_id)
);

create table public.mensagens (
  id bigint generated always as identity primary key,
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  mensagem text not null check (char_length(mensagem) between 1 and 1000),
  criado_em timestamptz not null default now()
);

create index eventos_grupo_data_idx on public.eventos (grupo_id, data_evento, hora_evento);
create index grupo_membros_usuario_idx on public.grupo_membros (usuario_id);
create index mensagens_grupo_criado_idx on public.mensagens (grupo_id, criado_em desc);
create index presencas_evento_idx on public.presencas (evento_id);

-- ---------------------------------------------------------------------------
-- Funções e triggers
-- ---------------------------------------------------------------------------

create or replace function public.gerar_tag()
returns text language sql volatile as $$
  select '#' || lpad(floor(random() * 10000)::int::text, 4, '0');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, tag)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    public.gerar_tag()
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Quem cria o grupo já entra como administrador.
create or replace function public.handle_new_group()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.grupo_membros (grupo_id, usuario_id, is_admin, status)
  values (new.id, new.criador_id, true, 'ativo');
  return new;
end;
$$;

create trigger on_grupo_created
  after insert on public.grupos
  for each row execute function public.handle_new_group();

-- security definer evita recursão das policies RLS sobre grupo_membros.
create or replace function public.is_grupo_membro(p_grupo uuid, p_usuario uuid default auth.uid())
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.grupo_membros m
    where m.grupo_id = p_grupo and m.usuario_id = p_usuario and m.status = 'ativo'
  );
$$;

create or replace function public.is_grupo_admin(p_grupo uuid, p_usuario uuid default auth.uid())
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.grupo_membros m
    where m.grupo_id = p_grupo and m.usuario_id = p_usuario
      and m.status = 'ativo' and m.is_admin
  );
$$;

grant execute on function public.is_grupo_membro(uuid, uuid) to authenticated;
grant execute on function public.is_grupo_admin(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.grupos enable row level security;
alter table public.grupo_membros enable row level security;
alter table public.eventos enable row level security;
alter table public.presencas enable row level security;
alter table public.mensagens enable row level security;

create policy "perfis legíveis por usuários autenticados" on public.profiles
  for select to authenticated using (true);

create policy "usuário edita seu perfil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "grupos legíveis por usuários autenticados" on public.grupos
  for select to authenticated using (true);

create policy "usuário cria grupo como criador" on public.grupos
  for insert to authenticated with check (criador_id = auth.uid());

create policy "admin edita grupo" on public.grupos
  for update to authenticated using (public.is_grupo_admin(id)) with check (public.is_grupo_admin(id));

create policy "admin exclui grupo" on public.grupos
  for delete to authenticated using (public.is_grupo_admin(id));

create policy "membros legíveis por usuários autenticados" on public.grupo_membros
  for select to authenticated using (true);

create policy "entrar no grupo ou admin adicionar membro" on public.grupo_membros
  for insert to authenticated with check (
    (usuario_id = auth.uid() and status = 'ativo' and is_admin = false)
    or public.is_grupo_admin(grupo_id)
  );

create policy "admin gerencia membros" on public.grupo_membros
  for update to authenticated
  using (public.is_grupo_admin(grupo_id)) with check (public.is_grupo_admin(grupo_id));

create policy "sair do grupo ou admin remover membro" on public.grupo_membros
  for delete to authenticated using (
    usuario_id = auth.uid() or public.is_grupo_admin(grupo_id)
  );

create policy "eventos legíveis por usuários autenticados" on public.eventos
  for select to authenticated using (true);

create policy "membro ativo cria evento" on public.eventos
  for insert to authenticated with check (
    criador_id = auth.uid() and public.is_grupo_membro(grupo_id)
  );

create policy "criador ou admin edita evento" on public.eventos
  for update to authenticated using (
    criador_id = auth.uid() or public.is_grupo_admin(grupo_id)
  ) with check (
    criador_id = auth.uid() or public.is_grupo_admin(grupo_id)
  );

create policy "criador ou admin exclui evento" on public.eventos
  for delete to authenticated using (
    criador_id = auth.uid() or public.is_grupo_admin(grupo_id)
  );

create policy "presenças legíveis por usuários autenticados" on public.presencas
  for select to authenticated using (true);

create policy "usuário responde evento do seu grupo" on public.presencas
  for insert to authenticated with check (
    usuario_id = auth.uid() and public.is_grupo_membro(
      (select grupo_id from public.eventos where id = evento_id)
    )
  );

create policy "usuário altera sua presença" on public.presencas
  for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy "usuário remove sua presença" on public.presencas
  for delete to authenticated using (usuario_id = auth.uid());

create policy "membros leem mensagens do grupo" on public.mensagens
  for select to authenticated using (public.is_grupo_membro(grupo_id));

create policy "membros enviam mensagens" on public.mensagens
  for insert to authenticated with check (
    usuario_id = auth.uid() and public.is_grupo_membro(grupo_id)
  );

-- ---------------------------------------------------------------------------
-- Storage de avatares
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatares são públicos" on storage.objects
  for select to public using (bucket_id = 'avatars');

create policy "usuário envia seu avatar" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "usuário atualiza seu avatar" on storage.objects
  for update to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "usuário apaga seu avatar" on storage.objects
  for delete to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

--Chat em tempo real.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensagens'
  ) then
    alter publication supabase_realtime add table public.mensagens;
  end if;
end $$;
