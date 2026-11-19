-- BORA 2.0 — endurecimento das regras de acesso
-- 1) perfis só para o próprio usuário e companheiros de grupo
-- 2) grupos visíveis apenas para membros; busca por código via RPC
-- 3) mensagens só para membros ativos do grupo

drop policy if exists "perfis legíveis por usuários autenticados" on public.profiles;
create policy "perfis visíveis para o próprio usuário e companheiros de grupo" on public.profiles
  for select to authenticated using (
    id = auth.uid()
    or exists (
      select 1
      from public.grupo_membros eu
      join public.grupo_membros colega on colega.grupo_id = eu.grupo_id
      where eu.usuario_id = auth.uid()
        and eu.status = 'ativo'
        and colega.usuario_id = profiles.id
    )
  );

-- Busca segura pelo código: não expõe a tabela de grupos inteira.
create or replace function public.buscar_grupo_por_codigo(p_codigo text)
returns table (id uuid, nome text, descricao text, chat_restrito boolean)
language sql security definer stable set search_path = public as $$
  select g.id, g.nome, g.descricao, g.chat_restrito
  from public.grupos g
  where g.codigo = upper(trim(p_codigo));
$$;

revoke all on function public.buscar_grupo_por_codigo(text) from public;
grant execute on function public.buscar_grupo_por_codigo(text) to authenticated;

drop policy if exists "grupos legíveis por usuários autenticados" on public.grupos;
create policy "membros leem seus grupos" on public.grupos
  for select to authenticated using (public.is_grupo_membro(id));

drop policy if exists "membros leem mensagens do grupo" on public.mensagens;
create policy "membros ativos leem mensagens do grupo" on public.mensagens
  for select to authenticated using (public.is_grupo_membro(grupo_id));
