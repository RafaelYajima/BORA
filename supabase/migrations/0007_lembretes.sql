-- BORA 2.0 — lembretes push/e-mail e configuração Web Push

create table public.push_config (
  chave text primary key,
  valor text not null
);

-- Chave pública pode ser lida pelo app; a privada fica apenas como secret da Edge Function.
insert into public.push_config (chave, valor)
values ('vapid_public_key', 'BADv07_TY2-E9snREJF0laffhsRWz05tHIeIDRO76LI-uUj9JlfscZdlKy93B5RAdpTRM1OxHFuZ3qv3F5nrP_A')
on conflict (chave) do nothing;

create table public.push_subscriptions (
  endpoint text primary key,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);

create table public.evento_lembretes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  canal text not null check (canal in ('push', 'email')),
  criado_em timestamptz not null default now(),
  unique (evento_id, usuario_id, canal)
);

create table public.lembretes_enviados (
  lembrete_id uuid not null references public.evento_lembretes (id) on delete cascade,
  janela text not null check (janela in ('24h', '1h')),
  enviado_em timestamptz not null default now(),
  primary key (lembrete_id, janela)
);

create index push_subscriptions_usuario_idx on public.push_subscriptions (usuario_id);
create index evento_lembretes_evento_idx on public.evento_lembretes (evento_id);

alter table public.push_config enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.evento_lembretes enable row level security;
alter table public.lembretes_enviados enable row level security;

create policy "chave publica de push legível" on public.push_config
  for select to authenticated using (chave = 'vapid_public_key');

create policy "usuário lê suas inscrições push" on public.push_subscriptions
  for select to authenticated using (usuario_id = auth.uid());
create policy "usuário cria inscrição push" on public.push_subscriptions
  for insert to authenticated with check (usuario_id = auth.uid());
create policy "usuário atualiza inscrição push" on public.push_subscriptions
  for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "usuário remove inscrição push" on public.push_subscriptions
  for delete to authenticated using (usuario_id = auth.uid());

create policy "usuário lê seus lembretes" on public.evento_lembretes
  for select to authenticated using (
    usuario_id = auth.uid()
    or public.is_evento_grupo_admin(evento_id)
    or exists (select 1 from public.eventos e where e.id = evento_id and e.criador_id = auth.uid())
  );
create policy "membro cria lembrete para si" on public.evento_lembretes
  for insert to authenticated with check (
    usuario_id = auth.uid() and public.is_evento_grupo_membro(evento_id)
  );
create policy "usuário remove seu lembrete" on public.evento_lembretes
  for delete to authenticated using (usuario_id = auth.uid());

create policy "usuário lê envios dos seus lembretes" on public.lembretes_enviados
  for select to authenticated using (
    exists (select 1 from public.evento_lembretes l where l.id = lembrete_id and l.usuario_id = auth.uid())
  );

-- A Edge Function (service_role) consulta e marca os envios; o client não acessa estas RPCs.
create or replace function public.buscar_lembretes_pendentes()
returns table (
  lembrete_id uuid,
  evento_id uuid,
  evento_nome text,
  inicio timestamptz,
  local_evento text,
  usuario_id uuid,
  email text,
  canal text,
  janela text
)
language sql security definer stable set search_path = public as $$
  with janelas(janela, minuto) as (values ('24h', 1440), ('1h', 60))
  select l.id, e.id, e.nome, (e.data_evento + e.hora_evento), e.local_evento,
         l.usuario_id, u.email, l.canal, j.janela
  from public.evento_lembretes l
  join public.eventos e on e.id = l.evento_id
  join auth.users u on u.id = l.usuario_id
  cross join janelas j
  where ((
    j.janela = '24h'
      and (e.data_evento + e.hora_evento) between now() + interval '23 hours' and now() + interval '25 hours'
  ) or (
    j.janela = '1h'
      and (e.data_evento + e.hora_evento) between now() + interval '30 minutes' and now() + interval '70 minutes'
  ))
  and not exists (
    select 1 from public.lembretes_enviados le
    where le.lembrete_id = l.id and le.janela = j.janela
  );
$$;

create or replace function public.marcar_lembrete_enviado(p_lembrete uuid, p_janela text)
returns void language sql security definer set search_path = public as $$
  insert into public.lembretes_enviados (lembrete_id, janela)
  values (p_lembrete, p_janela)
  on conflict (lembrete_id, janela) do nothing;
$$;

revoke all on function public.buscar_lembretes_pendentes() from public;
revoke all on function public.marcar_lembrete_enviado(uuid, text) from public;
grant execute on function public.buscar_lembretes_pendentes() to service_role;
grant execute on function public.marcar_lembrete_enviado(uuid, text) to service_role;
