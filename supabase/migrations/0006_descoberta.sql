-- BORA 2.0 — descoberta de eventos próximos com grupos/eventos públicos

alter table public.grupos add column if not exists publico boolean not null default false;
alter table public.eventos add column if not exists publico boolean not null default false;

create index if not exists eventos_publicos_idx
  on public.eventos (publico, data_evento)
  where latitude is not null and longitude is not null;

-- Grupos públicos podem ser lidos por qualquer usuário autenticado para a vitrine.
drop policy if exists "criador ou membro lê o grupo" on public.grupos;
create policy "criador, membro ou público lê o grupo" on public.grupos
  for select to authenticated using (
    criador_id = auth.uid() or public.is_grupo_membro(id) or publico
  );

-- Eventos privados só aparecem para o criador e membros; públicos exigem grupo público.
drop policy if exists "eventos legíveis por usuários autenticados" on public.eventos;
create policy "eventos legíveis conforme privacidade" on public.eventos
  for select to authenticated using (
    criador_id = auth.uid()
    or public.is_grupo_membro(grupo_id)
    or (
      publico
      and exists (select 1 from public.grupos g where g.id = grupo_id and g.publico)
    )
  );

-- Entrada direta em grupos marcados como públicos.
create or replace function public.entrar_grupo_publico(p_grupo uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_publico boolean;
  v_vinculo public.grupo_membros%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Entre na sua conta para participar do grupo.';
  end if;

  select publico into v_publico from public.grupos where id = p_grupo;
  if not coalesce(v_publico, false) then
    raise exception 'Este grupo não está aberto para entrada pública.';
  end if;

  select * into v_vinculo
  from public.grupo_membros
  where grupo_id = p_grupo and usuario_id = auth.uid();

  if found then
    if v_vinculo.status = 'banido' then
      raise exception 'Seu acesso a este grupo foi bloqueado.';
    end if;
    return true;
  end if;

  insert into public.grupo_membros (grupo_id, usuario_id, is_admin, status)
  values (p_grupo, auth.uid(), false, 'ativo');

  return true;
end;
$$;

revoke all on function public.entrar_grupo_publico(uuid) from public;
grant execute on function public.entrar_grupo_publico(uuid) to authenticated;
