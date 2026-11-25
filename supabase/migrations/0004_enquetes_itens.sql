-- BORA 2.0 — enquetes de encontro e lista "quem traz o quê"

create table public.enquetes (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  criador_id uuid not null references public.profiles (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 120),
  descricao text,
  encerrada boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.enquete_opcoes (
  id uuid primary key default gen_random_uuid(),
  enquete_id uuid not null references public.enquetes (id) on delete cascade,
  data_hora timestamptz not null,
  criado_em timestamptz not null default now()
);

create table public.enquete_votos (
  id uuid primary key default gen_random_uuid(),
  enquete_id uuid not null references public.enquetes (id) on delete cascade,
  opcao_id uuid not null references public.enquete_opcoes (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  criado_em timestamptz not null default now(),
  unique (enquete_id, usuario_id)
);

create table public.evento_itens (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  usuario_id uuid references public.profiles (id) on delete set null,
  nome text not null check (char_length(nome) between 1 and 80),
  quantidade text,
  criado_em timestamptz not null default now()
);

create index enquetes_grupo_idx on public.enquetes (grupo_id, criado_em desc);
create index enquete_opcoes_enquete_idx on public.enquete_opcoes (enquete_id);
create index enquete_votos_enquete_idx on public.enquete_votos (enquete_id);
create index evento_itens_evento_idx on public.evento_itens (evento_id);

-- Helpers security definer evitam recursão nas policies RLS.
create or replace function public.is_enquete_grupo_membro(p_enquete uuid, p_usuario uuid default auth.uid())
returns boolean language sql security definer stable set search_path = public as $$
  select public.is_grupo_membro(e.grupo_id, p_usuario) from public.enquetes e where e.id = p_enquete;
$$;

create or replace function public.is_enquete_grupo_admin(p_enquete uuid, p_usuario uuid default auth.uid())
returns boolean language sql security definer stable set search_path = public as $$
  select public.is_grupo_admin(e.grupo_id, p_usuario) from public.enquetes e where e.id = p_enquete;
$$;

create or replace function public.is_evento_grupo_membro(p_evento uuid, p_usuario uuid default auth.uid())
returns boolean language sql security definer stable set search_path = public as $$
  select public.is_grupo_membro(ev.grupo_id, p_usuario) from public.eventos ev where ev.id = p_evento;
$$;

create or replace function public.is_evento_grupo_admin(p_evento uuid, p_usuario uuid default auth.uid())
returns boolean language sql security definer stable set search_path = public as $$
  select public.is_grupo_admin(ev.grupo_id, p_usuario) from public.eventos ev where ev.id = p_evento;
$$;

grant execute on function public.is_enquete_grupo_membro(uuid, uuid) to authenticated;
grant execute on function public.is_enquete_grupo_admin(uuid, uuid) to authenticated;
grant execute on function public.is_evento_grupo_membro(uuid, uuid) to authenticated;
grant execute on function public.is_evento_grupo_admin(uuid, uuid) to authenticated;

alter table public.enquetes enable row level security;
alter table public.enquete_opcoes enable row level security;
alter table public.enquete_votos enable row level security;
alter table public.evento_itens enable row level security;

create policy "membros leem enquetes do grupo" on public.enquetes
  for select to authenticated using (public.is_grupo_membro(grupo_id) or criador_id = auth.uid());
create policy "membro cria enquete" on public.enquetes
  for insert to authenticated with check (criador_id = auth.uid() and public.is_grupo_membro(grupo_id));
create policy "criador ou admin encerra enquete" on public.enquetes
  for update to authenticated using (criador_id = auth.uid() or public.is_grupo_admin(grupo_id))
  with check (criador_id = auth.uid() or public.is_grupo_admin(grupo_id));
create policy "criador ou admin exclui enquete" on public.enquetes
  for delete to authenticated using (criador_id = auth.uid() or public.is_grupo_admin(grupo_id));

create policy "membros leem opções da enquete" on public.enquete_opcoes
  for select to authenticated using (public.is_enquete_grupo_membro(enquete_id));
create policy "criador ou admin gerencia opções" on public.enquete_opcoes
  for insert to authenticated with check (
    public.is_enquete_grupo_admin(enquete_id)
    or exists (select 1 from public.enquetes e where e.id = enquete_id and e.criador_id = auth.uid())
  );
create policy "criador ou admin remove opções" on public.enquete_opcoes
  for delete to authenticated using (
    public.is_enquete_grupo_admin(enquete_id)
    or exists (select 1 from public.enquetes e where e.id = enquete_id and e.criador_id = auth.uid())
  );

create policy "membros leem votos da enquete" on public.enquete_votos
  for select to authenticated using (public.is_enquete_grupo_membro(enquete_id));
create policy "membro vota uma vez por enquete aberta" on public.enquete_votos
  for insert to authenticated with check (
    usuario_id = auth.uid()
    and public.is_enquete_grupo_membro(enquete_id)
    and not coalesce((select encerrada from public.enquetes where id = enquete_id), true)
    and exists (
      select 1 from public.enquete_opcoes o
      where o.id = opcao_id and o.enquete_id = enquete_id
    )
  );
create policy "membro troca seu voto em enquete aberta" on public.enquete_votos
  for update to authenticated
  using (usuario_id = auth.uid() and not coalesce((select encerrada from public.enquetes where id = enquete_id), true))
  with check (usuario_id = auth.uid());
create policy "membro remove seu voto" on public.enquete_votos
  for delete to authenticated using (usuario_id = auth.uid());

create policy "membros leem itens do evento" on public.evento_itens
  for select to authenticated using (public.is_evento_grupo_membro(evento_id));
create policy "membro sugere item" on public.evento_itens
  for insert to authenticated with check (
    (usuario_id is null or usuario_id = auth.uid())
    and public.is_evento_grupo_membro(evento_id)
  );
create policy "membro assume item livre ou edita o seu" on public.evento_itens
  for update to authenticated
  using (usuario_id is null or usuario_id = auth.uid())
  with check (usuario_id = auth.uid());
create policy "responsável ou admin remove item" on public.evento_itens
  for delete to authenticated using (
    usuario_id = auth.uid() or public.is_evento_grupo_admin(evento_id)
  );
