-- BORA 2.0 — check-in no evento pelo QR do organizador

create table public.evento_checkin_tokens (
  evento_id uuid primary key references public.eventos (id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.evento_checkins (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  criado_em timestamptz not null default now(),
  unique (evento_id, usuario_id)
);

create index evento_checkins_evento_idx on public.evento_checkins (evento_id, criado_em desc);
create index evento_checkins_usuario_idx on public.evento_checkins (usuario_id);

-- Eventos já existentes ganham um token sem precisar ser recriados.
insert into public.evento_checkin_tokens (evento_id)
select id from public.eventos
on conflict (evento_id) do nothing;

create or replace function public.criar_token_checkin_evento()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.evento_checkin_tokens (evento_id) values (new.id)
  on conflict (evento_id) do nothing;
  return new;
end;
$$;

drop trigger if exists evento_cria_token_checkin on public.eventos;
create trigger evento_cria_token_checkin
  after insert on public.eventos
  for each row execute function public.criar_token_checkin_evento();

alter table public.evento_checkin_tokens enable row level security;
alter table public.evento_checkins enable row level security;

-- O token só é lido por quem pode exibir o QR (criador do evento ou admin do grupo).
create policy "organizador lê token de check-in" on public.evento_checkin_tokens
  for select to authenticated using (
    exists (
      select 1 from public.eventos e
      where e.id = evento_id
        and (e.criador_id = auth.uid() or public.is_grupo_admin(e.grupo_id))
    )
  );

create policy "membros leem check-ins do evento" on public.evento_checkins
  for select to authenticated using (
    public.is_evento_grupo_membro(evento_id) or usuario_id = auth.uid()
  );

-- RPCs security definer: o token nunca fica exposto em uma coluna de evento legível por todos.
create or replace function public.obter_token_checkin(p_evento uuid)
returns uuid language sql security definer stable set search_path = public as $$
  select t.token
  from public.evento_checkin_tokens t
  join public.eventos e on e.id = t.evento_id
  where t.evento_id = p_evento
    and (e.criador_id = auth.uid() or public.is_grupo_admin(e.grupo_id));
$$;

create or replace function public.rotacionar_token_checkin(p_evento uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_token uuid;
begin
  if not exists (
    select 1 from public.eventos e
    where e.id = p_evento
      and (e.criador_id = auth.uid() or public.is_grupo_admin(e.grupo_id))
  ) then
    raise exception 'Sem permissão para rotacionar o QR do evento.';
  end if;

  update public.evento_checkin_tokens
  set token = gen_random_uuid(), atualizado_em = now()
  where evento_id = p_evento
  returning token into v_token;

  if v_token is null then
    insert into public.evento_checkin_tokens (evento_id) values (p_evento)
    returning token into v_token;
  end if;

  return v_token;
end;
$$;

create or replace function public.registrar_checkin(p_evento uuid, p_token uuid)
returns table (sucesso boolean, mensagem text, evento_nome text, horario timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_evento public.eventos%rowtype;
  v_usuario uuid := auth.uid();
  v_horario timestamptz;
begin
  select * into v_evento from public.eventos where id = p_evento;
  if not found then
    return query select false, 'Evento não encontrado.', null::text, null::timestamptz;
    return;
  end if;

  if v_usuario is null then
    return query select false, 'Entre na sua conta para fazer check-in.', null::text, null::timestamptz;
    return;
  end if;

  if not exists (
    select 1 from public.evento_checkin_tokens t
    where t.evento_id = p_evento and t.token = p_token
  ) then
    return query select false, 'QR inválido ou expirado. Peça um novo QR ao organizador.', null::text, null::timestamptz;
    return;
  end if;

  if not public.is_grupo_membro(v_evento.grupo_id, v_usuario) then
    return query select false, 'Você precisa ser membro do grupo deste evento.', null::text, null::timestamptz;
    return;
  end if;

  select c.criado_em into v_horario
  from public.evento_checkins c
  where c.evento_id = p_evento and c.usuario_id = v_usuario;
  if found then
    return query select true, 'Você já havia feito check-in neste evento.', v_evento.nome, v_horario;
    return;
  end if;

  insert into public.evento_checkins (evento_id, usuario_id)
  values (p_evento, v_usuario)
  returning criado_em into v_horario;

  return query select true, 'Check-in registrado! Bora curtir o encontro!', v_evento.nome, v_horario;
end;
$$;

revoke all on function public.obter_token_checkin(uuid) from public;
revoke all on function public.rotacionar_token_checkin(uuid) from public;
revoke all on function public.registrar_checkin(uuid, uuid) from public;
grant execute on function public.obter_token_checkin(uuid) to authenticated;
grant execute on function public.rotacionar_token_checkin(uuid) to authenticated;
grant execute on function public.registrar_checkin(uuid, uuid) to authenticated;
